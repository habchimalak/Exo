/**
 * Persist — Persistance des collections en mémoire.
 *
 * - Si DATABASE_URL est défini  → les données sont stockées dans PostgreSQL
 *   (Supabase), table "app_collections" (une ligne par collection, en JSONB).
 * - Sinon                       → repli sur le fichier db/data.json (dev local).
 *
 * Les services gardent leurs tableaux en mémoire ; Persist les charge au
 * démarrage et les sauvegarde après chaque modification (debounce 500 ms).
 */

import { readFileSync, writeFileSync, existsSync, mkdirSync } from 'fs';
import { join } from 'path';
import pg from 'pg';

interface Entry {
  get: () => any;
  set: (v: any) => void;
}

const DB_DIR = join(process.cwd(), 'db');
const DB_FILE = join(DB_DIR, 'data.json');
// Lu à chaque appel (et non à l'import) : le fichier .env n'est chargé qu'après
const dbUrl = () => process.env.DATABASE_URL;

const registry = new Map<string, Entry>();
const lastSaved = new Map<string, string>(); // dernier JSON écrit, par collection
let saveTimer: ReturnType<typeof setTimeout> | null = null;
let saving: Promise<void> = Promise.resolve();
let pool: pg.Pool | null = null;
let loaded = false; // vrai seulement après un chargement réussi depuis PostgreSQL

function getPool(): pg.Pool {
  if (!pool) {
    pool = new pg.Pool({
      connectionString: dbUrl(),
      // Supabase exige TLS ; désactivable avec DATABASE_SSL=false (ex: Postgres local)
      ssl: process.env.DATABASE_SSL === 'false' ? false : { rejectUnauthorized: false },
      max: 3,
    });
    pool.on('error', (err) => console.error('Erreur pool PostgreSQL:', err.message));
  }
  return pool;
}

function scheduleSave() {
  if (saveTimer) clearTimeout(saveTimer);
  saveTimer = setTimeout(() => {
    saveTimer = null;
    void Persist.saveAll();
  }, 500);
}

async function loadFromPostgres() {
  const db = getPool();
  await db.query(`
    CREATE TABLE IF NOT EXISTS app_collections (
      key        text PRIMARY KEY,
      data       jsonb NOT NULL,
      updated_at timestamptz NOT NULL DEFAULT now()
    )`);
  const { rows } = await db.query('SELECT key, data FROM app_collections');
  const data: Record<string, any> = {};
  for (const r of rows) data[r.key] = r.data;
  for (const [key, { set }] of registry) {
    if (data[key] !== undefined) {
      set(data[key]);
      lastSaved.set(key, JSON.stringify(data[key]));
    }
  }
  loaded = true;
  console.log(`🐘 Données chargées depuis PostgreSQL (${rows.length} collections)`);
}

async function saveToPostgres() {
    // Ne jamais écrire (et donc écraser la base) tant que le chargement n'a pas réussi
  if (!loaded) return;
  const db = getPool();
  for (const [key, { get }] of registry) {
    const json = JSON.stringify(get());
    if (lastSaved.get(key) === json) continue; // rien n'a changé
    await db.query(
      `INSERT INTO app_collections (key, data, updated_at)
       VALUES ($1, $2::jsonb, now())
       ON CONFLICT (key) DO UPDATE SET data = EXCLUDED.data, updated_at = now()`,
      [key, json],
    );
    lastSaved.set(key, json);
  }
}

function loadFromFile() {
  if (!existsSync(DB_FILE)) return;
  const data = JSON.parse(readFileSync(DB_FILE, 'utf-8'));
  for (const [key, { set }] of registry) {
    if (data[key] !== undefined) set(data[key]);
  }
  console.log(`📦 Données chargées depuis ${DB_FILE} (${registry.size} collections)`);
}

function saveToFile() {
  if (!existsSync(DB_DIR)) mkdirSync(DB_DIR, { recursive: true });
  const data: Record<string, any> = {};
  for (const [key, { get }] of registry) data[key] = get();
  writeFileSync(DB_FILE, JSON.stringify(data, null, 2));
}

export const Persist = {
  /** Enregistre une collection — appeler dans le constructeur du service */
  register(key: string, get: () => any, set: (v: any) => void) {
    registry.set(key, { get, set });
  },

  /** Charge toutes les collections — appeler (avec await) au démarrage */
  async loadAll() {
    try {
      if (dbUrl()) await loadFromPostgres();
      else loadFromFile();
    } catch (err) {
      console.error('Erreur chargement données:', err);
      // Avec PostgreSQL, on préfère arrêter plutôt que démarrer vide et écraser la base
      if (dbUrl()) throw err;
    }
  },

  /** Sauvegarde immédiate (les sauvegardes sont mises en file, jamais en parallèle) */
  saveAll(): Promise<void> {
    if (registry.size === 0) return Promise.resolve();
    saving = saving.then(async () => {
      try {
        if (dbUrl()) await saveToPostgres();
        else saveToFile();
      } catch (err) {
        console.error('Erreur sauvegarde données:', err);
      }
    });
    return saving;
  },

  /** Sauvegarde avec debounce — appeler après chaque modification */
  save() {
    scheduleSave();
  },
};

// Filet de sécurité : sauvegarde toutes les 5 secondes (n'écrit que ce qui a changé en base)
setInterval(() => void Persist.saveAll(), 5_000).unref();

async function shutdown(code: number) {
  if (saveTimer) clearTimeout(saveTimer);
  await Persist.saveAll();
  if (pool) await pool.end().catch(() => undefined);
  process.exit(code);
}
process.on('SIGINT', () => void shutdown(0));
process.on('SIGTERM', () => void shutdown(0));
process.on('uncaughtException', (err) => {
  console.error('Erreur non gérée:', err);
  void shutdown(1);
});
// En dernier recours (pas d'await possible ici) : fichier uniquement
process.on('exit', () => {
  if (!dbUrl()) {
    try { saveToFile(); } catch { /* ignore */ }
  }
});
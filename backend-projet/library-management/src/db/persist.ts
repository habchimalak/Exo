/**
 * Persist — Persistance JSON simple pour le stockage en mémoire
 *
 * Sauvegarde automatiquement à chaque mutation (push/splice/Object.assign)
 * via un debounce de 500ms + sauvegarde immédiate à l'arrêt.
 */

import { readFileSync, writeFileSync, existsSync, mkdirSync } from 'fs';
import { join } from 'path';

interface Entry {
  get: () => any;
  set: (v: any) => void;
}

const DB_DIR = join(process.cwd(), 'db');
const DB_FILE = join(DB_DIR, 'data.json');

const registry = new Map<string, Entry>();
let saveTimer: ReturnType<typeof setTimeout> | null = null;

// Debounce : sauvegarde 500ms après la dernière modification
function scheduleSave() {
  if (saveTimer) clearTimeout(saveTimer);
  saveTimer = setTimeout(() => {
    saveTimer = null;
    Persist.saveAll();
  }, 500);
}

export const Persist = {
  /** Enregistre une collection — appeler dans le constructeur du service */
  register(key: string, get: () => any, set: (v: any) => void) {
    registry.set(key, { get, set });
  },

  /** Charge toutes les collections depuis le fichier JSON — appeler au démarrage */
  loadAll() {
    if (!existsSync(DB_FILE)) return;
    try {
      const data = JSON.parse(readFileSync(DB_FILE, 'utf-8'));
      for (const [key, { set }] of registry) {
        if (data[key] !== undefined) {
          set(data[key]);
        }
      }
      console.log(`📦 Données chargées depuis ${DB_FILE} (${registry.size} collections)`);
    } catch (err) {
      console.error('Erreur chargement données:', err);
    }
  },

  /** Sauvegarde immédiate de toutes les collections */
  saveAll() {
    if (registry.size === 0) return;
    try {
      if (!existsSync(DB_DIR)) mkdirSync(DB_DIR, { recursive: true });
      const data: Record<string, any> = {};
      for (const [key, { get }] of registry) {
        data[key] = get();
      }
      writeFileSync(DB_FILE, JSON.stringify(data, null, 2));
    } catch (err) {
      console.error('Erreur sauvegarde données:', err);
    }
  },

  /** Sauvegarde avec debounce — appeler après chaque modification */
  save() {
    scheduleSave();
  },
};

// Auto-save toutes les 5 secondes (filet de sécurité)
setInterval(() => Persist.saveAll(), 5_000);

// Sauvegarde immédiate à l'arrêt
process.on('SIGINT',  () => { if (saveTimer) clearTimeout(saveTimer); Persist.saveAll(); process.exit(0); });
process.on('SIGTERM', () => { if (saveTimer) clearTimeout(saveTimer); Persist.saveAll(); process.exit(0); });
process.on('exit',    () => { Persist.saveAll(); });
process.on('uncaughtException', (err) => { console.error('Erreur non gérée:', err); Persist.saveAll(); process.exit(1); });

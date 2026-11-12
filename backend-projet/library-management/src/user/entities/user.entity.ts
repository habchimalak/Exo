export class User {
  id: number;
  nom: string;
  prenom: string;
  email: string;
  motDePasseHash: string;
  role: string;
  actif?: boolean;
  avatar?: string | null;
  bio?: string;
  // Champs profil admin
  telephone?: string;
  poste?: string;
  departement?: string;
  etablissement?: string;
  // associations classes/sections envoyées par le frontend de Rami
  associations: Array<{ className: string; section: string }>;
  // ─── Paiement / Crédits ───────────────────────────────────────────────────
  credits: number;       // nombre de générations IA restantes
  plan: 'free' | 'pro' | 'premium'; // plan actuel
}

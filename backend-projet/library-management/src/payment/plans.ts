// ─── Plans de crédits disponibles ────────────────────────────────────────────
// Les prix sont en millimes tunisiens (1 TND = 1000 millimes)

export interface CreditPack {
  id: string;
  nom: string;
  credits: number;
  prix: number;        // en millimes (ex: 9000 = 9 TND)
  prixAffiche: string; // affichage frontend
  plan: 'free' | 'pro' | 'premium';
  populaire?: boolean;
}

export const CREDIT_PACKS: CreditPack[] = [
  {
    id: 'starter',
    nom: 'Starter',
    credits: 50,
    prix: 9000,         // 9 TND
    prixAffiche: '9 TND',
    plan: 'free',
  },
  {
    id: 'pro',
    nom: 'Pro',
    credits: 200,
    prix: 29000,        // 29 TND
    prixAffiche: '29 TND',
    plan: 'pro',
    populaire: true,
  },
  {
    id: 'premium',
    nom: 'Premium',
    credits: 500,
    prix: 59000,        // 59 TND
    prixAffiche: '59 TND',
    plan: 'premium',
  },
];

export function getPackById(id: string): CreditPack | undefined {
  return CREDIT_PACKS.find((p) => p.id === id);
}

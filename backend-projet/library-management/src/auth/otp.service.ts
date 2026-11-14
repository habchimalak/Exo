/**
 * OtpService — gestion des codes OTP à 6 chiffres en mémoire.
 * TTL : 10 minutes · Un seul code actif par email.
 * Max tentatives : 5 avant invalidation.
 */
import { Injectable, BadRequestException, Logger } from '@nestjs/common';
import { MailService } from '../mail/mail.service.js';

interface OtpEntry {
  code:      string;
  expiresAt: number;   // timestamp ms
  attempts:  number;
  verified:  boolean;
}

const TTL_MS      = 10 * 60 * 1000; // 10 minutes
const MAX_TRIES   = 5;
const CODE_LENGTH = 6;

@Injectable()
export class OtpService {
  private readonly store = new Map<string, OtpEntry>();
  private readonly logger = new Logger(OtpService.name);

  constructor(private readonly mailService: MailService) {
    // Nettoyage périodique toutes les 15 min
    setInterval(() => this.cleanup(), 15 * 60 * 1000);
  }

  // ── Génère et envoie un OTP ───────────────────────────────────────
  async sendOtp(email: string): Promise<void> {
    // Throttle : refuser si un OTP non-expiré a été envoyé il y a < 60 s
    const existing = this.store.get(email.toLowerCase());
    if (existing && !existing.verified) {
      const age = Date.now() - (existing.expiresAt - TTL_MS);
      if (age < 60_000) {
        throw new BadRequestException(
          'Un code a déjà été envoyé. Attendez 1 minute avant de réessayer.',
        );
      }
    }

    const code = this.generateCode();
    this.store.set(email.toLowerCase(), {
      code,
      expiresAt: Date.now() + TTL_MS,
      attempts: 0,
      verified: false,
    });

    await this.mailService.sendOtp(email, code);
    this.logger.log(`OTP généré pour ${email}`);
  }

  // ── Vérifie un code soumis par l'utilisateur ──────────────────────
  verifyOtp(email: string, code: string): void {
    const entry = this.store.get(email.toLowerCase());

    if (!entry) {
      throw new BadRequestException('Aucun code en attente pour cet email. Renvoyez un code.');
    }
    if (Date.now() > entry.expiresAt) {
      this.store.delete(email.toLowerCase());
      throw new BadRequestException('Le code a expiré. Veuillez en demander un nouveau.');
    }
    if (entry.verified) {
      throw new BadRequestException('Ce code a déjà été utilisé.');
    }

    entry.attempts++;
    if (entry.attempts > MAX_TRIES) {
      this.store.delete(email.toLowerCase());
      throw new BadRequestException('Trop de tentatives. Veuillez demander un nouveau code.');
    }

    if (entry.code !== code.trim()) {
      const remaining = MAX_TRIES - entry.attempts;
      throw new BadRequestException(
        `Code incorrect. ${remaining} tentative${remaining > 1 ? 's' : ''} restante${remaining > 1 ? 's' : ''}.`,
      );
    }

    // Code correct — marquer comme vérifié (ne pas supprimer tout de suite pour
    // permettre au register de confirmer la vérification)
    entry.verified = true;
  }

  // ── Vérifie si l'email a un OTP validé (utilisé avant register) ──
  isVerified(email: string): boolean {
    const entry = this.store.get(email.toLowerCase());
    return !!(entry && entry.verified && Date.now() <= entry.expiresAt);
  }

  // ── Consomme le token vérifié (appelé après register réussi) ──────
  consume(email: string): void {
    this.store.delete(email.toLowerCase());
  }

  // ── Nettoyage des entrées expirées ────────────────────────────────
  private cleanup() {
    const now = Date.now();
    for (const [key, val] of this.store) {
      if (now > val.expiresAt) this.store.delete(key);
    }
  }

  private generateCode(): string {
    return Math.floor(10 ** (CODE_LENGTH - 1) + Math.random() * 9 * 10 ** (CODE_LENGTH - 1))
      .toString()
      .padStart(CODE_LENGTH, '0');
  }
}

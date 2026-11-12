import {
  Injectable,
  BadRequestException,
  NotFoundException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { UserService } from '../user/user.service.js';
import { CREDIT_PACKS, getPackById } from './plans.js';
import * as crypto from 'crypto';

@Injectable()
export class PaymentService {
  private readonly frontendUrl: string;
  private readonly mockSecret: string;

  constructor(
    private readonly configService: ConfigService,
    private readonly userService: UserService,
  ) {
    this.frontendUrl = this.configService.get<string>('FRONTEND_URL', 'http://localhost');
    // Secret pour signer les tokens mock (utilise JWT_SECRET si disponible)
    this.mockSecret  = this.configService.get<string>('JWT_SECRET', 'exocraft-mock-secret');
  }

  // ─── Lister les packs disponibles ────────────────────────────────────────
  getPlans() {
    return CREDIT_PACKS;
  }

  // ─── Générer un token mock signé ─────────────────────────────────────────
  private signToken(payload: string): string {
    return crypto
      .createHmac('sha256', this.mockSecret)
      .update(payload)
      .digest('hex')
      .substring(0, 16);
  }

  // ─── Initier un paiement mock ─────────────────────────────────────────────
  // Retourne une URL vers la page checkout interne (pas d'API externe)
  initiate(packId: string, userId: number): { url: string; paymentRef: string } {
    const pack = getPackById(packId);
    if (!pack) throw new BadRequestException(`Pack "${packId}" introuvable`);

    const user = this.userService.findOne(userId);
    if (!user) throw new NotFoundException('Utilisateur introuvable');

    // Construire un paymentRef signé : userId:packId:timestamp:signature
    const payload   = `${userId}:${packId}:${Date.now()}`;
    const signature = this.signToken(payload);
    const paymentRef = `${payload}:${signature}`;
    // Encoder en base64 pour l'URL
    const token = Buffer.from(paymentRef).toString('base64url');

    const url = `${this.frontendUrl}/payment/checkout?token=${token}`;

    return { url, paymentRef: token };
  }

  // ─── Vérifier un token mock et créditer ──────────────────────────────────
  verify(token: string): {
    success: boolean;
    credits?: number;
    plan?: string;
    message: string;
  } {
    if (!token) throw new BadRequestException('Token manquant');

    let decoded: string;
    try {
      decoded = Buffer.from(token, 'base64url').toString('utf-8');
    } catch {
      throw new BadRequestException('Token invalide');
    }

    // Format attendu : userId:packId:timestamp:signature
    const parts = decoded.split(':');
    if (parts.length !== 4) {
      return { success: false, message: 'Token de paiement invalide' };
    }

    const [userIdStr, packId, timestamp, receivedSig] = parts;
    const userId = parseInt(userIdStr, 10);

    // Vérifier la signature
    const payload       = `${userIdStr}:${packId}:${timestamp}`;
    const expectedSig   = this.signToken(payload);
    if (receivedSig !== expectedSig) {
      return { success: false, message: 'Signature invalide' };
    }

    // Vérifier que le token n'est pas expiré (30 minutes)
    const age = Date.now() - parseInt(timestamp, 10);
    if (age > 30 * 60 * 1000) {
      return { success: false, message: 'Session de paiement expirée' };
    }

    const pack = getPackById(packId);
    if (!pack) return { success: false, message: 'Pack introuvable' };

    const user = this.userService.findOne(userId);
    if (!user) throw new NotFoundException('Utilisateur introuvable');

    // Créditer les crédits et mettre à jour le plan
    const newCredits = (user.credits ?? 0) + pack.credits;
    const newPlan    = pack.plan === 'free' ? (user.plan ?? 'free') : pack.plan;

    this.userService.update(userId, {
      credits: newCredits,
      plan:    newPlan,
    } as any);

    return {
      success: true,
      credits: newCredits,
      plan:    newPlan,
      message: `${pack.credits} crédits ajoutés avec succès !`,
    };
  }

  // ─── Solde de crédits de l'utilisateur ───────────────────────────────────
  getMyCredits(userId: number): { credits: number; plan: string } {
    const user = this.userService.findOne(userId);
    if (!user) throw new NotFoundException('Utilisateur introuvable');
    return {
      credits: user.credits ?? 0,
      plan:    user.plan    ?? 'free',
    };
  }

  // ─── Décrémenter 1 crédit (appelé avant chaque génération IA) ────────────
  consumeCredit(userId: number): void {
    const user = this.userService.findOne(userId);
    if (!user) throw new NotFoundException('Utilisateur introuvable');

    const current = user.credits ?? 0;
    if (current <= 0) {
      throw new BadRequestException(
        'Crédits insuffisants. Achetez un pack sur /pricing pour continuer.',
      );
    }

    this.userService.update(userId, { credits: current - 1 } as any);
  }
}

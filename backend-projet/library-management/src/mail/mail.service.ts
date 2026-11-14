import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as nodemailer from 'nodemailer';

@Injectable()
export class MailService {
  private readonly logger = new Logger(MailService.name);
  private transporter: nodemailer.Transporter;

  constructor(private readonly config: ConfigService) {
    const host = this.config.get<string>('MAIL_HOST', 'smtp.gmail.com');
    const port = this.config.get<number>('MAIL_PORT', 587);
    const user = this.config.get<string>('MAIL_USER', '');
    const pass = this.config.get<string>('MAIL_PASS', '');

    this.transporter = nodemailer.createTransport({
      host,
      port,
      secure: port === 465,
      auth: user && pass ? { user, pass } : undefined,
    } as nodemailer.TransportOptions);
  }

  async sendOtp(to: string, code: string): Promise<void> {
    const from = this.config.get<string>('MAIL_FROM', '"ExoCraft" <noreply@exocraft.tn>');

    const html = `
      <div style="font-family:'Segoe UI',Arial,sans-serif;max-width:480px;margin:auto;padding:32px;border-radius:16px;border:1px solid #e5e7eb;background:#fff;">
        <div style="text-align:center;margin-bottom:24px;">
          <h2 style="margin:0;font-size:22px;color:#2563EB;letter-spacing:-0.5px;">ExoCraft</h2>
          <p style="margin:4px 0 0;color:#6b7280;font-size:13px;">Plateforme pédagogique intelligente</p>
        </div>
        <h3 style="color:#111827;font-size:18px;margin:0 0 12px;">Vérification de votre adresse email</h3>
        <p style="color:#374151;font-size:14px;line-height:1.6;margin:0 0 24px;">
          Utilisez le code ci-dessous pour confirmer votre adresse email.
          Il est valable <strong>10 minutes</strong>.
        </p>
        <div style="text-align:center;background:#EFF6FF;border-radius:12px;padding:24px;margin-bottom:24px;">
          <span style="font-size:40px;font-weight:900;letter-spacing:12px;color:#2563EB;">${code}</span>
        </div>
        <p style="color:#9ca3af;font-size:12px;margin:0;text-align:center;">
          Si vous n'avez pas demandé ce code, ignorez cet email.
        </p>
      </div>
    `;

    try {
      await this.transporter.sendMail({
        from,
        to,
        subject: `${code} — Votre code de vérification ExoCraft`,
        html,
        text: `Votre code de vérification ExoCraft est : ${code}. Il est valable 10 minutes.`,
      });
      this.logger.log(`OTP envoyé à ${to}`);
    } catch (err) {
      this.logger.error(`Erreur envoi email à ${to}: ${(err as Error).message}`);
      throw err;
    }
  }
}

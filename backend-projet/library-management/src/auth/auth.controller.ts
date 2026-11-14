import {
  Controller,
  Post,
  Get,
  Patch,
  Body,
  HttpCode,
  HttpStatus,
  UnauthorizedException,
  UseGuards,
} from '@nestjs/common';
import * as bcrypt from 'bcrypt';
import { AuthService } from './auth.service.js';
import { OtpService } from './otp.service.js';
import { UserService } from '../user/user.service.js';
import { MatiereService } from '../matiere/matiere.service.js';
import { PromotionService } from '../promotion/promotion.service.js';
import { CreateUserDto } from '../user/dto/create-user.dto.js';
import { LoginDto } from './dto/login.dto.js';
import { SendOtpDto } from './dto/send-otp.dto.js';
import { VerifyOtpDto } from './dto/verify-otp.dto.js';
import { Public } from './decorators/public.decorator.js';
import { CurrentUser } from './decorators/current-user.decorator.js';
import { JwtAuthGuard } from './guards/jwt-auth.guard.js';

@Controller('auth')
export class AuthController {
  constructor(
    private readonly authService: AuthService,
    private readonly otpService: OtpService,
    private readonly userService: UserService,
    private readonly matiereService: MatiereService,
    private readonly promotionService: PromotionService,
  ) {}

  // ── POST /auth/send-otp — envoie un code OTP par email ──────────
  @Public()
  @Post('send-otp')
  @HttpCode(HttpStatus.OK)
  async sendOtp(@Body() dto: SendOtpDto) {
    // Vérifier que l'email n'est pas déjà utilisé
    const existing = this.userService.findByEmail(dto.email);
    if (existing) {
      throw new UnauthorizedException('Un compte existe déjà avec cette adresse email.');
    }
    await this.otpService.sendOtp(dto.email);
    return { message: `Un code de vérification a été envoyé à ${dto.email}.` };
  }

  // ── POST /auth/verify-otp — vérifie le code OTP ─────────────────
  @Public()
  @Post('verify-otp')
  @HttpCode(HttpStatus.OK)
  verifyOtp(@Body() dto: VerifyOtpDto) {
    this.otpService.verifyOtp(dto.email, dto.code);
    return { message: 'Email vérifié avec succès.' };
  }

  // ── POST /auth/register — inscription (email doit être vérifié) ──
  @Public()
  @Post('register')
  async register(@Body() createUserDto: CreateUserDto) {
    // Vérifier que l'OTP a été validé avant d'autoriser l'inscription
    const email = createUserDto.email;
    if (!this.otpService.isVerified(email)) {
      throw new UnauthorizedException(
        'Votre adresse email n\'a pas été vérifiée. Veuillez saisir le code reçu par email.',
      );
    }
    const result = await this.authService.register(createUserDto);
    // Consommer le token OTP après inscription réussie
    this.otpService.consume(email);
    return result;
  }

  // ── POST /auth/login ─────────────────────────────────────────────
  @Public()
  @Post('login')
  login(@Body() loginDto: LoginDto) {
    return this.authService.login(loginDto);
  }

  // ── GET /auth/me ─────────────────────────────────────────────────
  @UseGuards(JwtAuthGuard)
  @Get('me')
  getMe(@CurrentUser() currentUser: { sub: number; email: string; role: string }) {
    const user = this.userService.findOne(currentUser.sub);
    if (!user) throw new UnauthorizedException('Utilisateur introuvable');
    const { motDePasseHash: _pwd, ...safe } = user;
    return safe;
  }

  // ── GET /auth/me/matieres ────────────────────────────────────────
  @UseGuards(JwtAuthGuard)
  @Get('me/matieres')
  getMesMatieres(@CurrentUser() currentUser: { sub: number }) {
    const user = this.userService.findOne(currentUser.sub);
    if (!user) throw new UnauthorizedException('Utilisateur introuvable');

    const associations = user.associations ?? [];

    const CLASS_KEYWORDS = [
      'ingénieur', 'ingenieur', 'licence', 'master',
      'prépa', 'prepa', 'tronc commun', 'ième', 'ieme',
      '1ere', '2eme', '3eme', '4eme', '5eme', 'ère', 'ème',
    ];
    const isNiveauEtudes = (val: string) =>
      CLASS_KEYWORDS.some(k => val.toLowerCase().includes(k));

    const toutesLesMatieres = this.matiereService.findAll().map((m: any) => m.nom ?? m.name ?? String(m));
    const toutesLesPromos   = this.promotionService.findAll().map((p: any) => p.nom ?? p.name ?? String(p));

    const matieresDansAssoc: string[] = associations
      .map((a: any) => String(a.className ?? '').trim())
      .filter((v: string) => v && !isNiveauEtudes(v));

    const promosDansAssoc: string[] = associations
      .map((a: any) => String(a.section ?? '').trim())
      .filter((v: string) => v && v.toLowerCase() !== 'tronc commun');

    const matieres: string[] = [...new Set([
      ...matieresDansAssoc,
      ...(matieresDansAssoc.length === 0 ? toutesLesMatieres : []),
    ])];

    const promos: string[] = [...new Set([
      ...promosDansAssoc,
      ...(promosDansAssoc.length === 0 ? toutesLesPromos : []),
    ])];

    return { matieres, promos };
  }

  // ── PATCH /auth/password — changer son mot de passe ─────────────
  @UseGuards(JwtAuthGuard)
  @Patch('password')
  async changePassword(
    @CurrentUser() currentUser: { sub: number },
    @Body() body: { ancienMotDePasse: string; nouveauMotDePasse: string },
  ) {
    if (!body.ancienMotDePasse?.trim() || !body.nouveauMotDePasse?.trim()) {
      throw new UnauthorizedException('Les deux mots de passe sont obligatoires.');
    }
    if (body.nouveauMotDePasse.length < 6) {
      throw new UnauthorizedException('Le nouveau mot de passe doit contenir au moins 6 caractères.');
    }

    const user = this.userService.findOne(currentUser.sub);
    if (!user) throw new UnauthorizedException('Utilisateur introuvable');

    const isValid = await bcrypt.compare(body.ancienMotDePasse, user.motDePasseHash);
    if (!isValid) throw new UnauthorizedException('Ancien mot de passe incorrect');

    const hashed = await bcrypt.hash(body.nouveauMotDePasse, 10);
    this.userService.update(user.id, { motDePasseHash: hashed } as any);
    return { message: 'Mot de passe mis à jour avec succès.' };
  }
}

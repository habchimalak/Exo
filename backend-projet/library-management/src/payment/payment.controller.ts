import {
  Controller,
  Post,
  Get,
  Query,
  Body,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { PaymentService } from './payment.service.js';
import { CurrentUser } from '../auth/decorators/current-user.decorator.js';
import { Public } from '../auth/decorators/public.decorator.js';

@Controller('payment')
export class PaymentController {
  constructor(private readonly paymentService: PaymentService) {}

  // ─── GET /payment/plans — liste des packs (public) ───────────────────────
  @Public()
  @Get('plans')
  getPlans() {
    return this.paymentService.getPlans();
  }

  // ─── POST /payment/initiate — générer l'URL checkout mock ────────────────
  // Body: { packId: 'starter' | 'pro' | 'premium' }
  // Retourne: { url, paymentRef }
  @Post('initiate')
  @HttpCode(HttpStatus.OK)
  initiate(
    @Body('packId') packId: string,
    @CurrentUser() user: { sub: number; id: number },
  ) {
    return this.paymentService.initiate(packId, user.sub ?? user.id);
  }

  // ─── GET /payment/verify?token=xxx — vérifier et créditer ────────────────
  // Appelé par PaymentSuccess après confirmation sur la page checkout
  @Public()
  @Get('verify')
  verify(@Query('token') token: string) {
    return this.paymentService.verify(token);
  }

  // ─── GET /payment/my-credits — solde de l'utilisateur connecté ───────────
  @Get('my-credits')
  myCredits(@CurrentUser() user: { sub: number; id: number }) {
    return this.paymentService.getMyCredits(user.sub ?? user.id);
  }
}

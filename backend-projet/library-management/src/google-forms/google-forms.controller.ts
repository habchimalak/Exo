import {
  Controller,
  Get,
  Post,
  Query,
  Param,
  Res,
  HttpCode,
} from '@nestjs/common';
import type { Response } from 'express';
import { GoogleFormsService } from './google-forms.service.js';
import { Public } from '../auth/decorators/public.decorator.js';

@Controller('google-forms')
export class GoogleFormsController {
  constructor(private readonly googleFormsService: GoogleFormsService) {}

  /** GET /google-forms/auth — returns OAuth2 authorization URL */
  @Get('auth')
  getAuth(): { url: string } {
    return { url: this.googleFormsService.getAuthUrl() };
  }

  /** GET /google-forms/callback — échange le code OAuth (vrai endpoint) */
  @Public()
  @Get('callback')
  async handleCallbackForms(
    @Query('code') code: string,
    @Res() res: Response,
  ): Promise<void> {
    await this.googleFormsService.handleCallback(code);
    res.redirect(`${process.env.FRONTEND_URL}/quiz?googleConnected=true`);
  }

  /** GET /google-forms/status — returns connection status */
  @Get('status')
  getStatus(): { connected: boolean } {
    return this.googleFormsService.isConnected();
  }

  /** POST /google-forms/export/:quizId — export quiz to Google Forms */
  @Post('export/:quizId')
  @HttpCode(200)
  async exportQuiz(
    @Param('quizId') quizId: string,
  ): Promise<{ lien: string; formId: string }> {
    return this.googleFormsService.exportQuiz(+quizId);
  }

  /** POST /google-forms/sync/:quizId — synchronise student scores */
  @Post('sync/:quizId')
  @HttpCode(200)
  async syncNotes(@Param('quizId') quizId: string) {
    return this.googleFormsService.syncNotes(+quizId);
  }
}

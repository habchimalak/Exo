import { Controller, Get, Query, Res } from '@nestjs/common';
import type { Response } from 'express';
import { GoogleFormsService } from './google-forms.service.js';
import { Public } from '../auth/decorators/public.decorator.js';

/**
 * Ce contrôleur capture la redirect_uri configurée dans Google Cloud Console :
 * http://localhost:3000/api/auth/google/callback
 */
@Controller('auth/google')
export class GoogleAuthCallbackController {
  constructor(private readonly googleFormsService: GoogleFormsService) {}

  @Public()
  @Get('callback')
  async handleCallback(
    @Query('code') code: string,
    @Res() res: Response,
  ): Promise<void> {
    if (!code) {
      res.redirect(`${process.env.FRONTEND_URL}/quiz?googleError=no_code`);
      return;
    }
    try {
      await this.googleFormsService.handleCallback(code);
      res.redirect(`${process.env.FRONTEND_URL}/quiz?googleConnected=true`);
    } catch {
      res.redirect(`${process.env.FRONTEND_URL}/quiz?googleError=callback_failed`);
    }
  }
}

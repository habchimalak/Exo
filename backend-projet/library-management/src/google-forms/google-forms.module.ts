import { Module } from '@nestjs/common';
import { GoogleFormsService } from './google-forms.service.js';
import { GoogleFormsController } from './google-forms.controller.js';
import { GoogleAuthCallbackController } from './google-auth-callback.controller.js';
import { QuizModule } from '../quiz/quiz.module.js';

@Module({
  imports: [QuizModule],
  controllers: [GoogleFormsController, GoogleAuthCallbackController],
  providers: [GoogleFormsService],
})
export class GoogleFormsModule {}

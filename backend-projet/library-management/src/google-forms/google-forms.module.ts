import { Module } from '@nestjs/common';
import { GoogleFormsService } from './google-forms.service.js';
import { GoogleFormsController } from './google-forms.controller.js';
import { QuizModule } from '../quiz/quiz.module.js';

@Module({
  imports: [QuizModule],
  controllers: [GoogleFormsController],
  providers: [GoogleFormsService],
})
export class GoogleFormsModule {}

import { Module } from '@nestjs/common';
import { PaymentController } from './payment.controller.js';
import { PaymentService } from './payment.service.js';
import { UserModule } from '../user/user.module.js';

@Module({
  imports: [UserModule],
  controllers: [PaymentController],
  providers: [PaymentService],
  exports: [PaymentService],
})
export class PaymentModule {}

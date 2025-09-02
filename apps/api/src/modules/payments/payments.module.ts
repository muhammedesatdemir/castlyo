import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { UsersModule } from '../users/users.module';
import { PaymentsController } from './payments.controller';
import { PaymentsService } from './payments.service';
import { SubscriptionsService } from './subscriptions.service';

@Module({
  imports: [ConfigModule, UsersModule],
  controllers: [PaymentsController],
  providers: [PaymentsService, SubscriptionsService],
  exports: [PaymentsService, SubscriptionsService],
})
export class PaymentsModule {}

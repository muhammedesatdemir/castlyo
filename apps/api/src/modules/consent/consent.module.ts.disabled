import { Module } from '@nestjs/common';
import { ConsentService } from './consent.service';
import { ConsentController } from './consent.controller';
import { AuditService } from '../permissions/audit.service';

@Module({
  controllers: [ConsentController],
  providers: [ConsentService, AuditService],
  exports: [ConsentService],
})
export class ConsentModule {}

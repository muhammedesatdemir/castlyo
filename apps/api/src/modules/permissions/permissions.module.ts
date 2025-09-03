import { Module } from '@nestjs/common';
import { PermissionsService } from './permissions.service';
import { PermissionsController } from './permissions.controller';
import { AuditService } from './audit.service';

@Module({
  controllers: [PermissionsController],
  providers: [PermissionsService, AuditService],
  exports: [PermissionsService, AuditService],
})
export class PermissionsModule {}

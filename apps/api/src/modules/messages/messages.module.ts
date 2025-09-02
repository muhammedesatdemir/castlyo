import { Module } from '@nestjs/common';
import { UsersModule } from '../users/users.module';
import { JobsModule } from '../jobs/jobs.module';
import { MessagesController } from './messages.controller';
import { MessagesService } from './messages.service';
import { ContactPermissionsService } from './contact-permissions.service';

@Module({
  imports: [UsersModule, JobsModule],
  controllers: [MessagesController],
  providers: [MessagesService, ContactPermissionsService],
  exports: [MessagesService, ContactPermissionsService],
})
export class MessagesModule {}

import { Module } from '@nestjs/common';
import { UsersModule } from '../users/users.module';
import { ProfilesModule } from '../profiles/profiles.module';
import { JobsController } from './jobs.controller';
import { JobsService } from './jobs.service';
import { JobApplicationsController } from './applications.controller';
import { ApplicationsService } from './applications.service';

@Module({
  imports: [UsersModule, ProfilesModule],
  controllers: [JobsController, JobApplicationsController],
  providers: [JobsService, ApplicationsService],
  exports: [JobsService, ApplicationsService],
})
export class JobsModule {}

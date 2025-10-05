import { Controller, Get, Param, Req, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { ApplicationsService } from '@/modules/jobs/applications.service';

@UseGuards(JwtAuthGuard)
@Controller('jobs/:jobId/applications')
export class JobApplicationsController {
  constructor(private readonly svc: ApplicationsService) {}

  @Get()
  async list(
    @Param('jobId') jobId: string,
    @Req() req: any,
  ) {
    return this.svc.listForJobAsAgency(jobId, req.user.id);
  }

  @Get(':applicationId')
  async details(
    @Param('jobId') jobId: string,
    @Param('applicationId') applicationId: string,
    @Req() req: any,
  ) {
    return this.svc.detailsForJobAsAgency(jobId, applicationId, req.user.id);
  }
}



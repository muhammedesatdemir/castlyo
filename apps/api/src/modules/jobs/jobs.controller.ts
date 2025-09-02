import { 
  Controller, 
  Get, 
  Post, 
  Put, 
  Delete,
  Body, 
  Param, 
  Query,
  UseGuards, 
  Request,
  HttpCode,
  HttpStatus
} from '@nestjs/common';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { Public } from '../auth/decorators/public.decorator';
import { JobsService } from './jobs.service';
import { 
  CreateJobPostDto, 
  UpdateJobPostDto,
  CreateJobApplicationDto,
  UpdateJobApplicationDto
} from './dto/job.dto';

@Controller('jobs')
export class JobsController {
  constructor(private readonly jobsService: JobsService) {}

  // Public endpoints
  @Public()
  @Get()
  async getJobPosts(
    @Query('page') page: string = '1',
    @Query('limit') limit: string = '20',
    @Query('category') category?: string,
    @Query('talentType') talentType?: string,
    @Query('location') location?: string,
    @Query('budgetMin') budgetMin?: string,
    @Query('budgetMax') budgetMax?: string,
    @Query('ageMin') ageMin?: string,
    @Query('ageMax') ageMax?: string,
    @Query('gender') gender?: string,
    @Query('languages') languages?: string,
    @Query('skills') skills?: string,
    @Query('isUrgent') isUrgent?: string,
    @Query('isFeatured') isFeatured?: string,
    @Query('search') search?: string,
  ) {
    const filters = {
      category,
      talentType,
      location,
      budgetMin: budgetMin ? parseInt(budgetMin) : undefined,
      budgetMax: budgetMax ? parseInt(budgetMax) : undefined,
      ageMin: ageMin ? parseInt(ageMin) : undefined,
      ageMax: ageMax ? parseInt(ageMax) : undefined,
      gender,
      languages: languages ? languages.split(',') : undefined,
      skills: skills ? skills.split(',') : undefined,
      isUrgent: isUrgent === 'true',
      isFeatured: isFeatured === 'true',
      search,
    };

    return this.jobsService.getJobPosts(filters, parseInt(page), parseInt(limit));
  }

  @Public()
  @Get(':id')
  async getJobPost(@Param('id') id: string, @Request() req) {
    return this.jobsService.getJobPost(id, req.user?.id);
  }

  // Protected endpoints
  @UseGuards(JwtAuthGuard)
  @Post()
  @HttpCode(HttpStatus.CREATED)
  async createJobPost(
    @Request() req,
    @Body() jobData: CreateJobPostDto
  ) {
    return this.jobsService.createJobPost(req.user.id, jobData);
  }

  @UseGuards(JwtAuthGuard)
  @Put(':id/publish')
  async publishJobPost(@Param('id') id: string, @Request() req) {
    return this.jobsService.publishJobPost(id, req.user.id);
  }

  @UseGuards(JwtAuthGuard)
  @Put(':id')
  async updateJobPost(
    @Param('id') id: string,
    @Body() jobData: UpdateJobPostDto,
    @Request() req
  ) {
    return this.jobsService.updateJobPost(id, req.user.id, jobData);
  }

  @UseGuards(JwtAuthGuard)
  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  async deleteJobPost(@Param('id') id: string, @Request() req) {
    return this.jobsService.deleteJobPost(id, req.user.id);
  }

  // Job Applications
  @UseGuards(JwtAuthGuard)
  @Post('applications')
  @HttpCode(HttpStatus.CREATED)
  async createJobApplication(
    @Request() req,
    @Body() applicationData: CreateJobApplicationDto
  ) {
    return this.jobsService.createJobApplication(req.user.id, applicationData);
  }

  @UseGuards(JwtAuthGuard)
  @Get(':id/applications')
  async getJobApplications(
    @Param('id') id: string,
    @Request() req,
    @Query('page') page: string = '1',
    @Query('limit') limit: string = '20',
  ) {
    return this.jobsService.getJobApplications(id, req.user.id, parseInt(page), parseInt(limit));
  }

  @UseGuards(JwtAuthGuard)
  @Put('applications/:id')
  async updateJobApplication(
    @Param('id') id: string,
    @Body() updateData: UpdateJobApplicationDto,
    @Request() req
  ) {
    return this.jobsService.updateJobApplication(id, req.user.id, updateData);
  }

  @UseGuards(JwtAuthGuard)
  @Get('my/applications')
  async getMyApplications(
    @Request() req,
    @Query('page') page: string = '1',
    @Query('limit') limit: string = '20',
  ) {
    return this.jobsService.getMyApplications(req.user.id, parseInt(page), parseInt(limit));
  }

  @UseGuards(JwtAuthGuard)
  @Get('my/posts')
  async getMyJobPosts(
    @Request() req,
    @Query('page') page: string = '1',
    @Query('limit') limit: string = '20',
  ) {
    return this.jobsService.getMyJobPosts(req.user.id, parseInt(page), parseInt(limit));
  }
}

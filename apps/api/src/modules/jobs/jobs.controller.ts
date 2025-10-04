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
  HttpStatus,
  ValidationPipe,
  Logger
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiQuery, ApiResponse } from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { Public } from '../auth/decorators/public.decorator';
import { JobsService } from './jobs.service';
import { 
  CreateJobPostDto, 
  UpdateJobPostDto,
  CreateJobApplicationDto,
  UpdateJobApplicationDto
} from './dto/job.dto';
import { JobsQueryDto } from './dto/jobs-query.dto';

@ApiTags('jobs')
@Controller('jobs')
export class JobsController {
  private readonly logger = new Logger(JobsController.name);

  constructor(private readonly jobsService: JobsService) {}

  // Public endpoints
  @Public()
  @Get()
  @ApiOperation({ 
    summary: 'Get job posts with filtering',
    description: 'Retrieve job posts with optional filtering by search query, city, job type, and status. All date fields are returned in ISO 8601 format.'
  })
  @ApiQuery({ name: 'page', required: false, type: Number, description: 'Page number (default: 1)', example: 1 })
  @ApiQuery({ name: 'limit', required: false, type: Number, description: 'Items per page (default: 20, max: 50)', example: 20 })
  @ApiQuery({ name: 'q', required: false, type: String, description: 'Search query for title or description', example: 'Dizi' })
  @ApiQuery({ name: 'city', required: false, type: String, description: 'Filter by city (case-insensitive)', example: 'İzmir' })
  @ApiQuery({ 
    name: 'jobType', 
    required: false, 
    type: String, 
    description: 'Filter by job type', 
    enum: ['FULL_TIME', 'PART_TIME', 'CONTRACT', 'INTERN', 'FILM', 'TV', 'TV_SERIES', 'COMMERCIAL', 'THEATER', 'MUSIC_VIDEO', 'DOCUMENTARY', 'SHORT_FILM', 'OTHER'],
    example: 'FILM'
  })
  @ApiQuery({ 
    name: 'status', 
    required: false, 
    type: String, 
    description: 'Filter by job status', 
    enum: ['DRAFT', 'PUBLISHED', 'CLOSED', 'OPEN'],
    example: 'PUBLISHED'
  })
  @ApiResponse({ 
    status: 200, 
    description: 'Job posts retrieved successfully',
    schema: {
      type: 'object',
      properties: {
        data: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              id: { type: 'string' },
              title: { type: 'string' },
              description: { type: 'string' },
              jobType: { type: 'string' },
              city: { type: 'string' },
              status: { type: 'string' },
              expiresAt: { type: 'string', format: 'date-time' },
              publishedAt: { type: 'string', format: 'date-time' },
              createdAt: { type: 'string', format: 'date-time' },
              updatedAt: { type: 'string', format: 'date-time' }
            }
          }
        },
        meta: {
          type: 'object',
          properties: {
            page: { type: 'number' },
            limit: { type: 'number' },
            total: { type: 'number' }
          }
        }
      }
    }
  })
  async getJobPosts(
    @Query(new ValidationPipe({ transform: true, whitelist: true }))
    query: JobsQueryDto,
    @Request() req,
  ) {
    this.logger.debug(`GET /api/v1/jobs query=${JSON.stringify(query)}`);
    const result = await this.jobsService.getJobPosts(query, req.user?.id);
    this.logger.debug(`RESP /api/v1/jobs count=${result.data?.length ?? 0}`);
    return result;
  }

  @Public()
  @Get(':id')
  async getJobPost(@Param('id') id: string, @Request() req) {
    return this.jobsService.getJobByIdPublic(id, req.user?.id);
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

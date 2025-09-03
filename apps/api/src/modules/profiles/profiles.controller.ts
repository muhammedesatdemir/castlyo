import { 
  Controller, 
  Get, 
  Post, 
  Put, 
  Delete,
  Body, 
  Param, 
  UseGuards, 
  Request,
  HttpCode,
  HttpStatus
} from '@nestjs/common';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { Public } from '../auth/decorators/public.decorator';
import { ProfilesService } from './profiles.service';
import { 
  CreateTalentProfileDto, 
  UpdateTalentProfileDto,
  CreateAgencyProfileDto,
  UpdateAgencyProfileDto 
} from './dto/profile.dto';

@Controller('profiles')
@UseGuards(JwtAuthGuard)
export class ProfilesController {
  constructor(private readonly profilesService: ProfilesService) {}

  @Get('me')
  async getMyProfile(@Request() req) {
    return this.profilesService.getMyProfile(req.user.id);
  }

  @Post('talent')
  @HttpCode(HttpStatus.CREATED)
  async createTalentProfile(
    @Request() req,
    @Body() profileData: CreateTalentProfileDto
  ) {
    return this.profilesService.createTalentProfile(req.user.id, profileData);
  }

  @Post('agency')
  @HttpCode(HttpStatus.CREATED)
  async createAgencyProfile(
    @Request() req,
    @Body() profileData: CreateAgencyProfileDto
  ) {
    return this.profilesService.createAgencyProfile(req.user.id, profileData);
  }

  @Get('talent/:id')
  async getTalentProfile(@Param('id') id: string, @Request() req) {
    return this.profilesService.getTalentProfile(id, req.user?.id);
  }

  @Public()
  @Get('public/talent/:id')
  async getPublicTalentProfile(@Param('id') id: string, @Request() req) {
    return this.profilesService.getPublicTalentProfile(id, req.user?.id);
  }

  @Get('agency/:id')
  async getAgencyProfile(@Param('id') id: string, @Request() req) {
    return this.profilesService.getAgencyProfile(id, req.user?.id);
  }

  @Put('talent/:id')
  async updateTalentProfile(
    @Param('id') id: string,
    @Body() profileData: UpdateTalentProfileDto,
    @Request() req
  ) {
    return this.profilesService.updateTalentProfile(id, profileData, req.user.id);
  }

  @Put('agency/:id')
  async updateAgencyProfile(
    @Param('id') id: string,
    @Body() profileData: UpdateAgencyProfileDto,
    @Request() req
  ) {
    return this.profilesService.updateAgencyProfile(id, profileData, req.user.id);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  async deleteProfile(@Param('id') id: string, @Request() req) {
    return this.profilesService.deleteProfile(id, req.user.id);
  }

  @Get('export/me')
  async exportMyData(@Request() req) {
    return this.profilesService.exportUserData(req.user.id, req.user.id);
  }
}

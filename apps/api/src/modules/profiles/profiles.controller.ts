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
  HttpStatus,
  UnauthorizedException
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
    const userId = req.user?.userId || req.user?.id;
    if (!userId) throw new UnauthorizedException('Missing user id in token');
    return this.profilesService.getMyProfile(userId);
  }

  @Post('talent')
  @HttpCode(HttpStatus.CREATED)
  async createTalentProfile(
    @Request() req,
    @Body() profileData: CreateTalentProfileDto
  ) {
    return this.profilesService.createTalentProfile(req.user.userId, profileData);
  }

  @Post('agency')
  @HttpCode(HttpStatus.CREATED)
  async createAgencyProfile(
    @Request() req,
    @Body() profileData: CreateAgencyProfileDto
  ) {
    return this.profilesService.createAgencyProfile(req.user.userId, profileData);
  }

  @Get('talent/:id')
  async getTalentProfile(@Param('id') id: string, @Request() req) {
    return this.profilesService.getTalentProfile(id, req.user?.userId);
  }

  @Public()
  @Get('public/talent/:id')
  async getPublicTalentProfile(@Param('id') id: string, @Request() req) {
    return this.profilesService.getPublicTalentProfile(id, req.user?.userId);
  }

  @Get('agency/:id')
  async getAgencyProfile(@Param('id') id: string, @Request() req) {
    return this.profilesService.getAgencyProfile(id, req.user?.userId);
  }

  @Put('talent/me')
  async updateMyTalentProfile(
    @Body() profileData: UpdateTalentProfileDto,
    @Request() req
  ) {
    const userId = req.user?.userId || req.user?.id;
    if (!userId) throw new UnauthorizedException('Missing user id in token');
    return this.profilesService.updateTalentProfile(userId, profileData, userId);
  }

  @Put('talent/:id')
  async updateTalentProfile(
    @Param('id') id: string,
    @Body() profileData: UpdateTalentProfileDto,
    @Request() req
  ) {
    return this.profilesService.updateTalentProfile(id, profileData, req.user.userId);
  }

  @Put('agency/:id')
  async updateAgencyProfile(
    @Param('id') id: string,
    @Body() profileData: UpdateAgencyProfileDto,
    @Request() req
  ) {
    return this.profilesService.updateAgencyProfile(id, profileData, req.user.userId);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  async deleteProfile(@Param('id') id: string, @Request() req) {
    return this.profilesService.deleteProfile(id, req.user.userId);
  }

  @Get('export/me')
  async exportMyData(@Request() req) {
    return this.profilesService.exportUserData(req.user.userId, req.user.userId);
  }
}

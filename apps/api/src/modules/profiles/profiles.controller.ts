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
export class ProfilesController {
  constructor(private readonly profilesService: ProfilesService) {}

  @Get('me')
  @UseGuards(JwtAuthGuard)
  async getMyProfile(@Request() req) {
    // 1) Güvenlik: user var mı?
    const userId = req?.user?.id || req?.user?.userId;
    if (!userId) {
      // Nest zaten 401 döndürür ama yine de defensif olalım
      throw new UnauthorizedException('Missing user id in token');
    }

    // 2) Profil getir (bulunamazsa boş obje dönsün)
    const profile = await this.profilesService.getMyProfile(userId);
    if (!profile) {
      // 200 boş gövde - UI boş profille açacak
      return {};
    }

    // 3) CamelCase map (sadece camelCase kullan)
    return {
      id: profile.id,
      userId: profile.userId,
      firstName: profile.firstName ?? '',
      lastName: profile.lastName ?? '',
      displayName: profile.displayName ?? '',
      bio: profile.bio ?? '',
      headline: profile.headline ?? '',
      city: profile.city ?? '',
      country: profile.country ?? '',
      heightCm: profile.heightCm ?? null,
      weightKg: profile.weightKg ?? null,
      profileImage: profile.profileImage ?? null,
      specialties: profile.specialties ?? [],
      experience: profile.experience ?? '',
      createdAt: profile.createdAt,
      updatedAt: profile.updatedAt,
    };
  }

  @Post('talent')
  @UseGuards(JwtAuthGuard)
  @HttpCode(HttpStatus.CREATED)
  async createTalentProfile(
    @Request() req,
    @Body() profileData: CreateTalentProfileDto
  ) {
    return this.profilesService.createTalentProfile(req.user.userId, profileData);
  }

  @Post('agency')
  @UseGuards(JwtAuthGuard)
  @HttpCode(HttpStatus.CREATED)
  async createAgencyProfile(
    @Request() req,
    @Body() profileData: CreateAgencyProfileDto
  ) {
    return this.profilesService.createAgencyProfile(req.user.userId, profileData);
  }

  @Get('talent/:id')
  @UseGuards(JwtAuthGuard)
  async getTalentProfile(@Param('id') id: string, @Request() req) {
    return this.profilesService.getTalentProfile(id, req.user?.userId);
  }

  @Public()
  @Get('public/talent/:id')
  async getPublicTalentProfile(@Param('id') id: string, @Request() req) {
    return this.profilesService.getPublicTalentProfile(id, req.user?.userId);
  }

  @Public()
  @Get('public/talents')
  async getPublicTalents(
    @Query('page') page: string = '1',
    @Query('limit') limit: string = '12',
    @Query('skills') skills?: string
  ) {
    return this.profilesService.getPublicTalents(
      parseInt(page),
      parseInt(limit),
      skills ? skills.split(',') : undefined
    );
  }

  @Public()
  @Get('talents')
  async getTalents(
    @Query('page') page: string = '1',
    @Query('limit') limit: string = '12',
    @Query('skills') skills?: string
  ) {
    return this.profilesService.getPublicTalents(
      parseInt(page),
      parseInt(limit),
      skills ? skills.split(',') : undefined
    );
  }

  @Get('agency/:id')
  @UseGuards(JwtAuthGuard)
  async getAgencyProfile(@Param('id') id: string, @Request() req) {
    return this.profilesService.getAgencyProfile(id, req.user?.userId);
  }

  @Put('talent/me')
  @UseGuards(JwtAuthGuard)
  async updateMyTalentProfile(
    @Body() profileData: UpdateTalentProfileDto,
    @Request() req
  ) {
    const userId = req.user?.userId || req.user?.id;
    if (!userId) throw new UnauthorizedException('Missing user id in token');
    return this.profilesService.updateTalentProfile(userId, profileData, userId);
  }

  @Put('talent/:id')
  @UseGuards(JwtAuthGuard)
  async updateTalentProfile(
    @Param('id') id: string,
    @Body() profileData: UpdateTalentProfileDto,
    @Request() req
  ) {
    return this.profilesService.updateTalentProfile(id, profileData, req.user.userId);
  }

  @Put('agency/:id')
  @UseGuards(JwtAuthGuard)
  async updateAgencyProfile(
    @Param('id') id: string,
    @Body() profileData: UpdateAgencyProfileDto,
    @Request() req
  ) {
    return this.profilesService.updateAgencyProfile(id, profileData, req.user.userId);
  }

  @Delete(':id')
  @UseGuards(JwtAuthGuard)
  @HttpCode(HttpStatus.NO_CONTENT)
  async deleteProfile(@Param('id') id: string, @Request() req) {
    return this.profilesService.deleteProfile(id, req.user.userId);
  }

  @Get('export/me')
  @UseGuards(JwtAuthGuard)
  async exportMyData(@Request() req) {
    return this.profilesService.exportUserData(req.user.userId, req.user.userId);
  }
}

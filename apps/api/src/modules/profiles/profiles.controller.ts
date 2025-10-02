import { 
  Controller, 
  Get, 
  Post, 
  Put, 
  Patch,
  Delete,
  Body, 
  Param, 
  Query,
  UseGuards, 
  Request,
  Req,
  HttpCode,
  HttpStatus,
  UnauthorizedException,
  ParseUUIDPipe
} from '@nestjs/common';
import { Request as ExpressRequest } from 'express';
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

  // CRITICAL: "me" endpoints MUST come before parametrized routes
  @Get('talent/me')
  @UseGuards(JwtAuthGuard)
  async getMyTalentProfile(@Request() req) {
    const userId = req?.user?.id || req?.user?.userId;
    if (!userId) {
      throw new UnauthorizedException('Missing user id in token');
    }
    return this.profilesService.getTalentProfile(userId);
  }

  @Get('agency/me')
  @UseGuards(JwtAuthGuard)
  async getMyAgencyProfile(@Request() req) {
    const userId = req?.user?.id || req?.user?.userId;
    if (!userId) {
      throw new UnauthorizedException('Missing user id in token');
    }
    return this.profilesService.getAgencyProfile(userId);
  }

  @Get('talent/:id')
  @UseGuards(JwtAuthGuard)
  async getTalentProfile(@Param('id', new ParseUUIDPipe({ version: '4' })) id: string, @Request() req) {
    return this.profilesService.getTalentProfile(id, req.user?.userId);
  }

  @Public()
  @Get('public/talent/:id')
  async getPublicTalentProfile(@Param('id', new ParseUUIDPipe({ version: '4' })) id: string, @Request() req) {
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
  async getAgencyProfile(@Param('id', new ParseUUIDPipe({ version: '4' })) id: string, @Request() req) {
    return this.profilesService.getAgencyProfile(id, req.user?.userId);
  }

  @Put('talent/me')
  @UseGuards(JwtAuthGuard)
  async updateMyTalentProfile(
    @Body() profileData: UpdateTalentProfileDto,
    @Request() req
  ) {
    const jwtId = req.user?.id || req.user?.userId;
    if (!jwtId) throw new UnauthorizedException('Missing user id in token');
    console.log('[CTRL] PUT /profiles/talent/me jwtId=', jwtId, 'body.userId=', (profileData as any)?.userId);
    return this.profilesService.updateTalentProfile(jwtId, profileData);
  }

  @Patch('talent/me')
  @UseGuards(JwtAuthGuard)
  async patchMyTalentProfile(
    @Req() req: ExpressRequest,
    @Body() profileData: UpdateTalentProfileDto
  ) {
    const jwtId = (req as any).user?.id || (req as any).user?.userId;
    if (!jwtId) throw new UnauthorizedException('Missing user id in token');
    console.log('[CTRL] PATCH /profiles/talent/me jwtId=', jwtId, 'payload=', JSON.stringify(profileData, null, 2));
    console.log('[CTRL] PATCH /profiles/talent/me raw body=', JSON.stringify(req.body, null, 2));
    // Pass both DTO (camelCase) and raw body (snake_case) to service
    return this.profilesService.updateTalentProfile(jwtId, profileData, req.body);
  }

  @Put('agency/me')
  @UseGuards(JwtAuthGuard)
  async updateMyAgencyProfile(
    @Body() profileData: UpdateAgencyProfileDto,
    @Request() req
  ) {
    const userId = req.user?.id || req.user?.userId;
    if (!userId) throw new UnauthorizedException('Missing user id in token');
    return this.profilesService.updateAgencyProfile(userId, profileData);
  }

  @Put('talent/:id')
  @UseGuards(JwtAuthGuard)
  async updateTalentProfile(
    @Param('id', new ParseUUIDPipe({ version: '4' })) id: string,
    @Body() profileData: UpdateTalentProfileDto,
    @Request() req
  ) {
    return this.profilesService.updateTalentProfileById(id, profileData, req.user.userId);
  }

  @Put('agency/:id')
  @UseGuards(JwtAuthGuard)
  async updateAgencyProfile(
    @Param('id', new ParseUUIDPipe({ version: '4' })) id: string,
    @Body() profileData: UpdateAgencyProfileDto,
    @Request() req
  ) {
    return this.profilesService.updateAgencyProfileById(id, profileData, req.user.userId);
  }

  @Delete(':id')
  @UseGuards(JwtAuthGuard)
  @HttpCode(HttpStatus.NO_CONTENT)
  async deleteProfile(@Param('id', new ParseUUIDPipe({ version: '4' })) id: string, @Request() req) {
    return this.profilesService.deleteProfile(id, req.user.userId);
  }

  @Get('export/me')
  @UseGuards(JwtAuthGuard)
  async exportMyData(@Request() req) {
    return this.profilesService.exportUserData(req.user.userId, req.user.userId);
  }
}

import { Controller, Get, UseGuards, Request, Logger, Patch, Body, UnauthorizedException, Put } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { UsersService } from './users.service';
import { UpdateUserDto } from './dto/update-user.dto';

@Controller('users')
@UseGuards(JwtAuthGuard) // Tüm endpoint'ler için auth zorunlu
export class UsersController {
  private readonly logger = new Logger(UsersController.name);

  constructor(private usersService: UsersService) {}

  @Get('me')
  async getCurrentUser(@Request() req) {
    // Guard-rail: sub yoksa 401 at
    const userId = req.user?.sub ?? req.user?.userId ?? req.user?.id;
    this.logger.log(`[GET /users/me] req.user =`, req.user);
    
    if (!userId) {
      this.logger.error(`[GET /users/me] Invalid token payload - no user ID found`);
      throw new UnauthorizedException('Invalid token payload');
    }

    this.logger.log(`[GET /users/me] User: ${userId} | Email: ${req.user.email}`);
    
    try {
      const user = await this.usersService.getMe(userId);
      this.logger.log(`[GET /users/me] Success for user: ${userId}`);
      return user;
    } catch (error) {
      this.logger.error(`[GET /users/me] Error for user ${userId}:`, error.stack);
      throw error;
    }
  }

  @Get('profile')
  getProfile(@Request() req) {
    const userId = req.user?.sub ?? req.user?.userId ?? req.user?.id;
    this.logger.log(`[GET /users/profile] User: ${userId}`);
    return req.user;
  }

  @Put('me')
  async updateMe(@Request() req, @Body() body: UpdateUserDto) {
    const userId = req.user?.sub ?? req.user?.userId ?? req.user?.id;
    
    if (!userId) {
      throw new UnauthorizedException('Invalid token payload');
    }
    
    this.logger.log(`[PUT /users/me] User: ${userId}`);
    
    try {
      const result = await this.usersService.updateMe(userId, body);
      this.logger.log(`[PUT /users/me] Success for user: ${userId}`);
      
      return result;
    } catch (error) {
      this.logger.error(`[PUT /users/me] Error for user ${userId}:`, error.stack);
      throw error;
    }
  }

  @Patch('onboarding-complete')
  async completeOnboarding(@Request() req) {
    const userId = req.user?.sub ?? req.user?.userId ?? req.user?.id;
    
    if (!userId) {
      throw new UnauthorizedException('Invalid token payload');
    }
    
    this.logger.log(`[PATCH /users/onboarding-complete] User: ${userId}`);
    
    try {
      await this.usersService.completeOnboarding(userId);
      this.logger.log(`[PATCH /users/onboarding-complete] Success for user: ${userId}`);
      
      return { message: 'Onboarding completed successfully' };
    } catch (error) {
      this.logger.error(`[PATCH /users/onboarding-complete] Error for user ${userId}:`, error.stack);
      throw error;
    }
  }
}

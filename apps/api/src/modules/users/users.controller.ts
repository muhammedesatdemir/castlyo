import { Controller, Get, UseGuards, Request, Logger, Patch, Body } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { UsersService } from './users.service';

@Controller('users')
@UseGuards(JwtAuthGuard) // Tüm endpoint'ler için auth zorunlu
export class UsersController {
  private readonly logger = new Logger(UsersController.name);

  constructor(private usersService: UsersService) {}

  @Get('me')
  async getCurrentUser(@Request() req) {
    this.logger.log(`[GET /users/me] User: ${req.user.userId} | Email: ${req.user.email}`);
    
    try {
      const user = await this.usersService.findById(req.user.userId);
      if (!user) {
        this.logger.warn(`[GET /users/me] User not found: ${req.user.userId}`);
        return { error: 'User not found' };
      }

      const { passwordHash, ...userWithoutPassword } = user;
      this.logger.log(`[GET /users/me] Success for user: ${user.id}`);
      
      return {
        ...userWithoutPassword,
        onboardingCompleted: user.onboardingCompleted || false
      };
    } catch (error) {
      this.logger.error(`[GET /users/me] Error for user ${req.user.userId}:`, error.stack);
      throw error;
    }
  }

  @Get('profile')
  getProfile(@Request() req) {
    this.logger.log(`[GET /users/profile] User: ${req.user.userId}`);
    return req.user;
  }

  @Patch('onboarding-complete')
  async completeOnboarding(@Request() req) {
    this.logger.log(`[PATCH /users/onboarding-complete] User: ${req.user.userId}`);
    
    try {
      await this.usersService.completeOnboarding(req.user.userId);
      this.logger.log(`[PATCH /users/onboarding-complete] Success for user: ${req.user.userId}`);
      
      return { message: 'Onboarding completed successfully' };
    } catch (error) {
      this.logger.error(`[PATCH /users/onboarding-complete] Error for user ${req.user.userId}:`, error.stack);
      throw error;
    }
  }
}

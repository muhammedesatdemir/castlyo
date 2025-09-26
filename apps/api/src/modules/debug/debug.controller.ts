import { Controller, Get, Inject } from '@nestjs/common';
import { Public } from '../auth/decorators/public.decorator';
import { UsersService } from '../users/users.service';

@Controller('debug')
export class DebugController {
  constructor(
    @Inject('DRIZZLE') private readonly db: any,
    private usersService: UsersService
  ) {}

  @Public()
  @Get('db-test')
  async testDatabase() {
    try {
      const { users } = require('@castlyo/database');
      const result = await this.db.select({
        id: users.id,
        email: users.email,
        role: users.role
      }).from(users).limit(1);
      return { 
        success: true, 
        message: 'Database connection working',
        userCount: result.length,
        sample: result[0] || null
      };
    } catch (error) {
      return { 
        success: false, 
        message: 'Database connection failed', 
        error: error.message 
      };
    }
  }

  @Public()
  @Get('test-findbyemail')
  async testFindByEmail() {
    try {
      const user = await this.usersService.findByEmail('arzudemir@gmail.com');
      return {
        success: true,
        message: 'findByEmail test',
        user: user ? {
          id: user.id,
          email: user.email,
          status: user.status,
          emailVerified: user.emailVerified,
          hasPasswordHash: !!user.passwordHash
        } : null
      };
    } catch (error) {
      return {
        success: false,
        message: 'findByEmail test failed',
        error: error.message
      };
    }
  }
}

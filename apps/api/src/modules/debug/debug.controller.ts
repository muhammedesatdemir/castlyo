import { Controller, Get, Inject, Param } from '@nestjs/common';
import { Public } from '../auth/decorators/public.decorator';
import { UsersService } from '../users/users.service';
import { eq } from 'drizzle-orm';

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

  @Public()
  @Get('check-job/:id')
  async checkJob(@Param('id') id: string) {
    try {
      const { jobPosts } = require('@castlyo/database');
      
      // Check if job exists
      const job = await this.db.select({
        id: jobPosts.id,
        title: jobPosts.title,
        status: jobPosts.status,
        agencyId: jobPosts.agencyId,
        applicationDeadline: jobPosts.applicationDeadline,
        currentApplications: jobPosts.currentApplications
      })
      .from(jobPosts)
      .where(eq(jobPosts.id, id))
      .limit(1);
      
      // List all jobs for comparison
      const allJobs = await this.db.select({
        id: jobPosts.id,
        title: jobPosts.title,
        status: jobPosts.status
      })
      .from(jobPosts)
      .limit(10);
      
      return {
        success: true,
        message: 'Job check',
        requestedId: id,
        jobFound: job.length > 0,
        job: job[0] || null,
        allJobs: allJobs
      };
    } catch (error) {
      return {
        success: false,
        message: 'Job check failed',
        error: error.message
      };
    }
  }

  @Public()
  @Get('check-talent-profiles')
  async checkTalentProfiles() {
    try {
      const { users, talentProfiles } = require('@castlyo/database');
      
      // Get all users with TALENT role
      const talentUsers = await this.db.select({
        id: users.id,
        email: users.email,
        role: users.role,
        status: users.status
      }).from(users).where(eq(users.role, 'TALENT'));
      
      // Get all talent profiles
      const profiles = await this.db.select({
        id: talentProfiles.id,
        userId: talentProfiles.userId,
        firstName: talentProfiles.firstName,
        lastName: talentProfiles.lastName,
        displayName: talentProfiles.displayName
      }).from(talentProfiles);
      
      // Check for the specific user from logs
      const specificUser = await this.usersService.findByEmail('suleymanyakuboglu@gmail.com');
      const specificUserProfile = specificUser ? await this.db.select({
        id: talentProfiles.id,
        userId: talentProfiles.userId,
        firstName: talentProfiles.firstName,
        lastName: talentProfiles.lastName,
        displayName: talentProfiles.displayName,
      })
        .from(talentProfiles)
        .where(eq(talentProfiles.userId, specificUser.id)) : null;
      
      return {
        success: true,
        message: 'Talent profiles check',
        talentUsersCount: talentUsers.length,
        profilesCount: profiles.length,
        talentUsers: talentUsers,
        profiles: profiles,
        specificUser: specificUser ? {
          id: specificUser.id,
          email: specificUser.email,
          role: specificUser.role,
          status: specificUser.status
        } : null,
        specificUserProfile: specificUserProfile || []
      };
    } catch (error) {
      return {
        success: false,
        message: 'Talent profiles check failed',
        error: error.message
      };
    }
  }
}

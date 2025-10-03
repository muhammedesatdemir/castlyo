import { Injectable, Inject, Logger, NotFoundException } from '@nestjs/common';
import { DRIZZLE } from '@/config/database.module';
import { eq } from 'drizzle-orm';
import { users, talentProfiles } from '@castlyo/database';
import { UpdateUserDto } from './dto/update-user.dto';
import { TALENT_REQUIRED_FIELDS, AGENCY_REQUIRED_FIELDS } from '@/common/constants/profile-completeness';

@Injectable()
export class UsersService {
  private readonly logger = new Logger(UsersService.name);
  constructor(@Inject(DRIZZLE) private readonly db: any) {}

  // Base columns - only existing columns in database
  private baseCols = {
    id: users.id, 
    email: users.email, 
    phone: users.phone,
    role: users.role,
    status: users.status, 
    emailVerified: users.emailVerified,
    createdAt: users.createdAt, 
    updatedAt: users.updatedAt,
    passwordHash: users.passwordHash,
  };

  async findByEmail(email: string) {
    try {
      this.logger.log(`[findByEmail] Searching for email: ${email}`);
      
      // Test with simple select first
      const testResult = await this.db.select({
        id: users.id,
        email: users.email,
        passwordHash: users.passwordHash,
        role: users.role,
        status: users.status,
        emailVerified: users.emailVerified,
      }).from(users).where(eq(users.email, email)).limit(1);
      
      this.logger.log(`[findByEmail] Test query result: ${testResult.length > 0 ? 'Found' : 'Not found'}`);
      
      if (testResult.length > 0) {
        const user = testResult[0];
        this.logger.log(`[findByEmail] User details: id=${user.id}, status=${user.status}, emailVerified=${user.emailVerified}`);
        return user;
      }
      
      return null;
    } catch (e) {
      this.logger.error(`[findByEmail] DB error for ${email}: ${(e as Error).message}`);
      this.logger.error(`[findByEmail] Error stack:`, e.stack);
      throw e;
    }
  }

  async findById(id: string) {
    this.logger.debug(`[findById] Searching for user: ${id}`);
    
    const result = await this.db
      .select({
        id: users.id,
        email: users.email,
        role: users.role,
        status: users.status,
        emailVerified: users.emailVerified,
        createdAt: users.createdAt,
        updatedAt: users.updatedAt,
      })
      .from(users)
      .where(eq(users.id, id))
      .limit(1);
    return result[0] || null;
  }

  async getMe(userId: string) {
    this.logger.debug(`[getMe] Getting user profile: ${userId}`);
    
    const user = await this.db.select({
      id: users.id,
      email: users.email,
      phone: users.phone,
      role: users.role,
      status: users.status,
      emailVerified: users.emailVerified,
      createdAt: users.createdAt,
      updatedAt: users.updatedAt,
    })
    .from(users)
    .where(eq(users.id, userId))
    .limit(1);
    
    if (!user.length) {
      this.logger.warn(`[getMe] User not found: ${userId}`);
      throw new NotFoundException('User not found');
    }

    const userData = user[0];
    const role = userData.role;

    // Check profile completeness in parallel
    const [talentComplete, agencyComplete] = await Promise.all([
      this.isTalentProfileComplete(userId),
      this.isAgencyProfileComplete(userId),
    ]);

    // Calculate job permissions based on role and profile completeness
    const canPostJobs = role === 'AGENCY' && agencyComplete;
    const canApplyJobs = role === 'TALENT' && talentComplete;

    this.logger.debug(`[getMe] User ${userId} - Role: ${role}, Talent Complete: ${talentComplete}, Agency Complete: ${agencyComplete}, Can Post: ${canPostJobs}, Can Apply: ${canApplyJobs}`);
    
    return {
      ...userData,
      isAgencyProfileComplete: agencyComplete,
      isTalentProfileComplete: talentComplete,
      canPostJobs,
      canApplyJobs,
    };
  }

  async create(payload: { 
    email: string; 
    passwordHash: string; 
    role: string; 
    status?: string; 
    emailVerified?: boolean; 
  }) {
    const [row] = await this.db.insert(users).values({
      email: payload.email,
      passwordHash: payload.passwordHash,
      role: payload.role as any,
      status: payload.status as any,
      emailVerified: payload.emailVerified,
    }).returning(this.baseCols);

    return row;
  }

  async updateMe(userId: string, dto: UpdateUserDto) {
    this.logger.log(`[updateMe] Updating user: ${userId}`);
    
    // Helper function to clean undefined values
    function clean<T extends Record<string, any>>(obj: T) {
      const o: any = {};
      Object.entries(obj).forEach(([k, v]) => {
        if (v === undefined) return;
        o[k] = v;
      });
      return o;
    }

    const updateData = clean({
      phone: dto.phone,
      updatedAt: new Date(),
    });

    if (Object.keys(updateData).length === 1) { // Only updatedAt
      this.logger.log(`[updateMe] No fields to update for user: ${userId}`);
      return { success: true };
    }

    const result = await this.db
      .update(users)
      .set(updateData)
      .where(eq(users.id, userId))
      .returning();

    if (result.length === 0) {
      throw new NotFoundException('User not found');
    }

    this.logger.log(`[updateMe] Success for user: ${userId}`);
    return { success: true };
  }

  async completeOnboarding(userId: string) {
    this.logger.log(`[completeOnboarding] Completing onboarding for user: ${userId}`);
    
    const result = await this.db
      .update(users)
      .set({ 
        updatedAt: new Date()
      })
      .where(eq(users.id, userId))
      .returning();

    if (result.length === 0) {
      throw new Error('User not found');
    }

    this.logger.log(`[completeOnboarding] Success for user: ${userId}`);
    return result[0];
  }

  /**
   * Check if talent profile is complete based on required fields
   */
  async isTalentProfileComplete(userId: string): Promise<boolean> {
    try {
      this.logger.debug(`[isTalentProfileComplete] Checking profile for user: ${userId}`);
      
      const profile = await this.db
        .select({
          firstName: talentProfiles.firstName,
          lastName: talentProfiles.lastName,
          city: talentProfiles.city,
          gender: talentProfiles.gender,
          birthDate: talentProfiles.birthDate,
        })
        .from(talentProfiles)
        .where(eq(talentProfiles.userId, userId))
        .limit(1);

      if (!profile.length) {
        this.logger.debug(`[isTalentProfileComplete] No talent profile found for user: ${userId}`);
        return false;
      }

      const profileData = profile[0];
      
      // Check if all required fields are present and not empty
      const isComplete = TALENT_REQUIRED_FIELDS.every(field => {
        const value = profileData[field as keyof typeof profileData];
        return value !== null && value !== undefined && value !== '';
      });

      this.logger.debug(`[isTalentProfileComplete] Profile completeness for user ${userId}: ${isComplete}`);
      return isComplete;
    } catch (error) {
      this.logger.error(`[isTalentProfileComplete] Error checking profile for user ${userId}:`, error);
      return false;
    }
  }

  /**
   * Check if agency profile is complete based on required fields
   * For agencies, we check basic user fields since there's no separate agency_profiles table
   */
  async isAgencyProfileComplete(userId: string): Promise<boolean> {
    try {
      this.logger.debug(`[isAgencyProfileComplete] Checking profile for user: ${userId}`);
      
      const user = await this.db
        .select({
          email: users.email,
          phone: users.phone,
        })
        .from(users)
        .where(eq(users.id, userId))
        .limit(1);

      if (!user.length) {
        this.logger.debug(`[isAgencyProfileComplete] No user found: ${userId}`);
        return false;
      }

      const userData = user[0];
      
      // Check if all required fields are present and not empty
      const isComplete = AGENCY_REQUIRED_FIELDS.every(field => {
        const value = userData[field as keyof typeof userData];
        return value !== null && value !== undefined && value !== '';
      });

      this.logger.debug(`[isAgencyProfileComplete] Profile completeness for user ${userId}: ${isComplete}`);
      return isComplete;
    } catch (error) {
      this.logger.error(`[isAgencyProfileComplete] Error checking profile for user ${userId}:`, error);
      return false;
    }
  }
}

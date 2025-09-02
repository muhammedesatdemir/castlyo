import { 
  Injectable, 
  Inject, 
  NotFoundException, 
  ForbiddenException, 
  BadRequestException 
} from '@nestjs/common';
import { eq, and } from 'drizzle-orm';
import { DATABASE_CONNECTION } from '../../config/database.module';
import { 
  users, 
  talentProfiles, 
  agencyProfiles 
} from '@packages/database/schema/users';
import { 
  CreateTalentProfileDto, 
  UpdateTalentProfileDto,
  CreateAgencyProfileDto,
  UpdateAgencyProfileDto 
} from './dto/profile.dto';
import type { Database } from '@packages/database';

@Injectable()
export class ProfilesService {
  constructor(
    @Inject(DATABASE_CONNECTION) private readonly db: Database,
  ) {}

  async createTalentProfile(userId: string, profileData: CreateTalentProfileDto) {
    // Check if user exists and is a talent
    const user = await this.db.select()
      .from(users)
      .where(eq(users.id, userId))
      .limit(1);

    if (!user.length) {
      throw new NotFoundException('User not found');
    }

    if (user[0].role !== 'TALENT') {
      throw new BadRequestException('User is not a talent');
    }

    // Check if profile already exists
    const existingProfile = await this.db.select()
      .from(talentProfiles)
      .where(eq(talentProfiles.userId, userId))
      .limit(1);

    if (existingProfile.length > 0) {
      throw new BadRequestException('Talent profile already exists');
    }

    const newProfile = await this.db.insert(talentProfiles)
      .values({
        userId,
        ...profileData,
        skills: profileData.skills || [],
        languages: profileData.languages || [],
        specialties: profileData.specialties || [],
        portfolioImages: profileData.portfolioImages || [],
        portfolioVideos: profileData.portfolioVideos || [],
        isPublic: profileData.isPublic ?? true,
        country: profileData.country || 'TR',
      })
      .returning();

    return newProfile[0];
  }

  async createAgencyProfile(userId: string, profileData: CreateAgencyProfileDto) {
    // Check if user exists and is an agency
    const user = await this.db.select()
      .from(users)
      .where(eq(users.id, userId))
      .limit(1);

    if (!user.length) {
      throw new NotFoundException('User not found');
    }

    if (user[0].role !== 'AGENCY') {
      throw new BadRequestException('User is not an agency');
    }

    // Check if profile already exists
    const existingProfile = await this.db.select()
      .from(agencyProfiles)
      .where(eq(agencyProfiles.userId, userId))
      .limit(1);

    if (existingProfile.length > 0) {
      throw new BadRequestException('Agency profile already exists');
    }

    const newProfile = await this.db.insert(agencyProfiles)
      .values({
        userId,
        ...profileData,
        specialties: profileData.specialties || [],
        verificationDocuments: profileData.verificationDocuments || [],
        isVerified: false,
        country: profileData.country || 'TR',
      })
      .returning();

    return newProfile[0];
  }

  async getTalentProfile(userId: string, requestingUserId?: string) {
    const profile = await this.db.select()
      .from(talentProfiles)
      .leftJoin(users, eq(talentProfiles.userId, users.id))
      .where(eq(talentProfiles.userId, userId))
      .limit(1);

    if (!profile.length) {
      throw new NotFoundException('Talent profile not found');
    }

    const talentProfile = profile[0].talent_profiles;
    const user = profile[0].users;

    // Check if profile is public or if it's the owner viewing
    if (!talentProfile.isPublic && requestingUserId !== userId) {
      throw new ForbiddenException('Profile is private');
    }

    // Increment profile views if different user is viewing
    if (requestingUserId && requestingUserId !== userId) {
      await this.db.update(talentProfiles)
        .set({ 
          profileViews: (talentProfile.profileViews || 0) + 1,
          updatedAt: new Date()
        })
        .where(eq(talentProfiles.userId, userId));
    }

    return {
      ...talentProfile,
      user: {
        id: user.id,
        email: user.email,
        role: user.role,
        status: user.status,
        emailVerified: user.emailVerified,
      }
    };
  }

  async getAgencyProfile(userId: string, requestingUserId?: string) {
    const profile = await this.db.select()
      .from(agencyProfiles)
      .leftJoin(users, eq(agencyProfiles.userId, users.id))
      .where(eq(agencyProfiles.userId, userId))
      .limit(1);

    if (!profile.length) {
      throw new NotFoundException('Agency profile not found');
    }

    const agencyProfile = profile[0].agency_profiles;
    const user = profile[0].users;

    return {
      ...agencyProfile,
      user: {
        id: user.id,
        email: user.email,
        role: user.role,
        status: user.status,
        emailVerified: user.emailVerified,
      }
    };
  }

  async updateTalentProfile(
    userId: string, 
    profileData: UpdateTalentProfileDto,
    requestingUserId: string
  ) {
    // Check if user is updating their own profile
    if (userId !== requestingUserId) {
      throw new ForbiddenException('Cannot update another user\'s profile');
    }

    const existingProfile = await this.db.select()
      .from(talentProfiles)
      .where(eq(talentProfiles.userId, userId))
      .limit(1);

    if (!existingProfile.length) {
      throw new NotFoundException('Talent profile not found');
    }

    const updatedProfile = await this.db.update(talentProfiles)
      .set({
        ...profileData,
        updatedAt: new Date()
      })
      .where(eq(talentProfiles.userId, userId))
      .returning();

    return updatedProfile[0];
  }

  async updateAgencyProfile(
    userId: string, 
    profileData: UpdateAgencyProfileDto,
    requestingUserId: string
  ) {
    // Check if user is updating their own profile
    if (userId !== requestingUserId) {
      throw new ForbiddenException('Cannot update another user\'s profile');
    }

    const existingProfile = await this.db.select()
      .from(agencyProfiles)
      .where(eq(agencyProfiles.userId, userId))
      .limit(1);

    if (!existingProfile.length) {
      throw new NotFoundException('Agency profile not found');
    }

    const updatedProfile = await this.db.update(agencyProfiles)
      .set({
        ...profileData,
        updatedAt: new Date()
      })
      .where(eq(agencyProfiles.userId, userId))
      .returning();

    return updatedProfile[0];
  }

  async getMyProfile(userId: string) {
    // First check user role
    const user = await this.db.select()
      .from(users)
      .where(eq(users.id, userId))
      .limit(1);

    if (!user.length) {
      throw new NotFoundException('User not found');
    }

    if (user[0].role === 'TALENT') {
      try {
        return await this.getTalentProfile(userId, userId);
      } catch (error) {
        if (error instanceof NotFoundException) {
          return null; // Profile not created yet
        }
        throw error;
      }
    } else if (user[0].role === 'AGENCY') {
      try {
        return await this.getAgencyProfile(userId, userId);
      } catch (error) {
        if (error instanceof NotFoundException) {
          return null; // Profile not created yet
        }
        throw error;
      }
    }

    throw new BadRequestException('Invalid user role');
  }

  async deleteProfile(userId: string, requestingUserId: string) {
    // Check if user is deleting their own profile
    if (userId !== requestingUserId) {
      throw new ForbiddenException('Cannot delete another user\'s profile');
    }

    const user = await this.db.select()
      .from(users)
      .where(eq(users.id, userId))
      .limit(1);

    if (!user.length) {
      throw new NotFoundException('User not found');
    }

    if (user[0].role === 'TALENT') {
      await this.db.delete(talentProfiles)
        .where(eq(talentProfiles.userId, userId));
    } else if (user[0].role === 'AGENCY') {
      await this.db.delete(agencyProfiles)
        .where(eq(agencyProfiles.userId, userId));
    }

    return { message: 'Profile deleted successfully' };
  }
}

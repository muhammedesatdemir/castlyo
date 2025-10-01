import { 
  Injectable, 
  Inject, 
  NotFoundException, 
  ForbiddenException, 
  BadRequestException 
} from '@nestjs/common';
import { eq, and } from 'drizzle-orm';
// DATABASE_CONNECTION import removed - using 'DRIZZLE' directly
import { 
  users, 
  talentProfiles, 
  agencyProfiles,
  contactPermissions,
  db
} from '@castlyo/database';
import { 
  CreateTalentProfileDto, 
  UpdateTalentProfileDto,
  CreateAgencyProfileDto,
  UpdateAgencyProfileDto 
} from './dto/profile.dto';

@Injectable()
export class ProfilesService {
  constructor(
    @Inject('DRIZZLE') private readonly database: any,
  ) {}

  async createTalentProfile(userId: string, profileData: CreateTalentProfileDto) {
    // Check if user exists and is a talent
    const user = await this.database.select()
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
    const existingProfile = await this.database.select()
      .from(talentProfiles)
      .where(eq(talentProfiles.userId, userId))
      .limit(1);

    if (existingProfile.length > 0) {
      throw new BadRequestException('Talent profile already exists');
    }

    const newProfile = await this.database.insert(talentProfiles)
      .values({
        userId,
        ...profileData,
        specialties: profileData.specialties || [],
        country: profileData.country || 'TR',
      })
      .returning();

    return newProfile[0];
  }

  async createAgencyProfile(userId: string, profileData: CreateAgencyProfileDto) {
    // Check if user exists and is an agency
    const user = await this.database.select()
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
    const existingProfile = await this.database.select()
      .from(agencyProfiles)
      .where(eq(agencyProfiles.userId, userId))
      .limit(1);

    if (existingProfile.length > 0) {
      throw new BadRequestException('Agency profile already exists');
    }

    const newProfile = await this.database.insert(agencyProfiles)
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
    const profile = await this.database.select()
      .from(talentProfiles)
      .leftJoin(users, eq(talentProfiles.userId, users.id))
      .where(eq(talentProfiles.userId, userId))
      .limit(1);

    if (!profile.length) {
      throw new NotFoundException('Talent profile not found');
    }

    const talentProfile = profile[0].talent_profiles;
    const user = profile[0].users;

    // Note: isPublic column doesn't exist in schema, so we'll allow access for now
    // TODO: Implement proper visibility controls when needed

    // Note: profileViews column doesn't exist in schema
    // TODO: Implement profile view tracking when needed

    // If not the owner, return PII-safe version
    if (requestingUserId !== userId) {
      return this.sanitizeTalentProfile(talentProfile, user);
    }

    return {
      ...talentProfile,
      user: {
        id: user.id,
        email: user.email,
        phone: user.phone,
        role: user.role,
        status: user.status,
        emailVerified: user.emailVerified,
        phoneVerified: user.phoneVerified,
      }
    };
  }

  /**
   * Get public talent profile without PII (for public viewing)
   */
  async getPublicTalentProfile(userId: string, requestingUserId?: string) {
    const profile = await this.database.select()
      .from(talentProfiles)
      .leftJoin(users, eq(talentProfiles.userId, users.id))
      .where(eq(talentProfiles.userId, userId))
      .limit(1);

    if (!profile.length) {
      throw new NotFoundException('Talent profile not found');
    }

    const talentProfile = profile[0].talent_profiles;
    const user = profile[0].users;

    // Check visibility settings
    if (!talentProfile.isPublic) {
      throw new ForbiddenException('Profile is private');
    }

    // Check visibility level
    if (talentProfile.visibility === 'private') {
      throw new ForbiddenException('Profile is private');
    }

    if (talentProfile.visibility === 'only-applied-agencies' && requestingUserId) {
      // Check if requesting user is an agency that has applied/has permission
      const hasPermission = await this.database.select()
        .from(contactPermissions)
        .where(
          and(
            eq(contactPermissions.talentId, userId),
            eq(contactPermissions.agencyId, requestingUserId)
          )
        )
        .limit(1);

      if (hasPermission.length === 0) {
        throw new ForbiddenException('Profile is only visible to applied agencies');
      }
    }

    // Increment profile views if different user is viewing
    // Note: profileViews column doesn't exist in schema
    // TODO: Implement profile view tracking when needed

    return this.sanitizeTalentProfile(talentProfile, user);
  }

  /**
   * Remove PII from talent profile for public viewing
   */
  private sanitizeTalentProfile(talentProfile: any, user: any) {
    return {
      id: talentProfile.id,
      userId: talentProfile.userId,
      firstName: talentProfile.firstName,
      lastName: talentProfile.lastName,
      displayName: talentProfile.displayName,
      bio: talentProfile.bio,
      city: talentProfile.city,
      country: talentProfile.country,
      heightCm: talentProfile.heightCm,
      weightKg: talentProfile.weightKg,
      experience: talentProfile.experience,
      specialties: talentProfile.specialties,
      profileImage: talentProfile.profileImage,
      createdAt: talentProfile.createdAt,
      updatedAt: talentProfile.updatedAt,
      user: {
        id: user.id,
        role: user.role,
        status: user.status,
        // PII fields excluded: email, phone, dateOfBirth
      }
    };
  }

  async getAgencyProfile(userId: string, requestingUserId?: string) {
    const profile = await this.database.select()
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

    try {
      const existingProfile = await this.database.select()
        .from(talentProfiles)
        .where(eq(talentProfiles.userId, userId))
        .limit(1);

      // If no existing profile, create one first
      if (!existingProfile.length) {
        await this.database.insert(talentProfiles).values({
          userId,
          displayName: profileData.displayName ?? null,
          city: profileData.city ?? null,
          country: profileData.country ?? null,
          firstName: profileData.firstName ?? null,
          lastName: profileData.lastName ?? null,
          bio: profileData.bio ?? null,
          headline: profileData.headline ?? null,
          heightCm: profileData.height ?? null,
          weightKg: profileData.weight ?? null,
          specialties: profileData.specialties ?? [],
          experience: profileData.experience ?? null,
        });
      }

      // Handle birthDate vs dateOfBirth field mapping
      const dataToUpdate = { ...profileData };
      // Support legacy clients that might send 'dateOfBirth' instead of 'birthDate'
      if ((dataToUpdate as any).dateOfBirth && !dataToUpdate.birthDate) {
        dataToUpdate.birthDate = (dataToUpdate as any).dateOfBirth as string;
        delete (dataToUpdate as any).dateOfBirth;
      }

      // Map frontend fields to database fields
      const mappedData = {
        displayName: profileData.displayName ?? null,
        firstName: profileData.firstName ?? null,
        lastName: profileData.lastName ?? null,
        city: profileData.city ?? null,
        country: profileData.country ?? null,
        bio: profileData.bio ?? null,
        headline: profileData.headline ?? null,
        heightCm: profileData.height ?? null,
        weightKg: profileData.weight ?? null,
        specialties: profileData.specialties ?? [],
        experience: profileData.experience ?? null,
        birthDate: profileData.birthDate ?? null,
        gender: profileData.gender ?? null,
        profileImage: profileData.profileImage ?? null,
        resumeUrl: profileData.resumeUrl ?? null,
        skills: profileData.skills ?? [],
        languages: profileData.languages ?? [],
        updatedAt: new Date()
      };

      const updatedProfile = await this.database.update(talentProfiles)
        .set(mappedData)
        .where(eq(talentProfiles.userId, userId))
        .returning();

      return updatedProfile[0];
    } catch (error) {
      if (error instanceof NotFoundException || error instanceof ForbiddenException) {
        throw error;
      }
      throw new BadRequestException('Invalid profile payload');
    }
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

    const existingProfile = await this.database.select()
      .from(agencyProfiles)
      .where(eq(agencyProfiles.userId, userId))
      .limit(1);

    if (!existingProfile.length) {
      throw new NotFoundException('Agency profile not found');
    }

    const updatedProfile = await this.database.update(agencyProfiles)
      .set({
        ...profileData,
        updatedAt: new Date()
      })
      .where(eq(agencyProfiles.userId, userId))
      .returning();

    return updatedProfile[0];
  }

  async getMyProfile(userId: string) {
    try {
      // First check user exists
      const user = await this.database.select()
        .from(users)
        .where(eq(users.id, userId))
        .limit(1);

      if (!user.length) {
        return null; // User not found
      }

      const userData = user[0];

      // Get profile data based on role
      if (userData.role === 'TALENT') {
        const profile = await this.database.select()
          .from(talentProfiles)
          .where(eq(talentProfiles.userId, userId))
          .limit(1);

        if (profile.length > 0) {
          const talentProfile = profile[0];
          return {
            id: talentProfile.id,
            userId: talentProfile.userId,
            firstName: talentProfile.firstName ?? '',
            lastName: talentProfile.lastName ?? '',
            displayName: talentProfile.displayName ?? '',
            bio: talentProfile.bio ?? '',
            headline: talentProfile.headline ?? '',
            city: talentProfile.city ?? '',
            country: talentProfile.country ?? '',
            heightCm: talentProfile.heightCm ?? null,
            weightKg: talentProfile.weightKg ?? null,
            profileImage: talentProfile.profileImage ?? null,
            specialties: talentProfile.specialties ?? [],
            experience: talentProfile.experience ?? '',
            phone: userData.phone ?? '',
            email: userData.email ?? '',
            role: userData.role,
            status: userData.status,
            createdAt: talentProfile.createdAt,
            updatedAt: talentProfile.updatedAt,
          };
        }
      }

      // Return null if no profile found - controller will handle this
      return null;
    } catch (error) {
      console.error('[ProfilesService] getMyProfile error:', error);
      return null; // Safe fallback
    }
  }

  async deleteProfile(userId: string, requestingUserId: string) {
    // Check if user is deleting their own profile
    if (userId !== requestingUserId) {
      throw new ForbiddenException('Cannot delete another user\'s profile');
    }

    const user = await this.database.select()
      .from(users)
      .where(eq(users.id, userId))
      .limit(1);

    if (!user.length) {
      throw new NotFoundException('User not found');
    }

    if (user[0].role === 'TALENT') {
      await this.database.delete(talentProfiles)
        .where(eq(talentProfiles.userId, userId));
    } else if (user[0].role === 'AGENCY') {
      await this.database.delete(agencyProfiles)
        .where(eq(agencyProfiles.userId, userId));
    }

    return { message: 'Profile deleted successfully' };
  }

  /**
   * Export user profile data for KVKK compliance
   */
  async exportUserData(userId: string, requestingUserId: string) {
    // Check if user is exporting their own data
    if (userId !== requestingUserId) {
      throw new ForbiddenException('Cannot export another user\'s data');
    }

    const user = await this.database.select()
      .from(users)
      .where(eq(users.id, userId))
      .limit(1);

    if (!user.length) {
      throw new NotFoundException('User not found');
    }

    const userData = user[0];
    let profileData = null;

    // Get profile data based on role
    if (userData.role === 'TALENT') {
      const profile = await this.database.select()
        .from(talentProfiles)
        .where(eq(talentProfiles.userId, userId))
        .limit(1);
      
      profileData = profile.length > 0 ? profile[0] : null;
    } else if (userData.role === 'AGENCY') {
      const profile = await this.database.select()
        .from(agencyProfiles)
        .where(eq(agencyProfiles.userId, userId))
        .limit(1);
      
      profileData = profile.length > 0 ? profile[0] : null;
    }

    // Get contact permissions
    const contactPerms = await this.database.select()
      .from(contactPermissions)
      .where(eq(contactPermissions.talentId, userId));

    return {
      exportDate: new Date().toISOString(),
      exportVersion: '1.0',
      user: {
        id: userData.id,
        email: userData.email,
        phone: userData.phone,
        role: userData.role,
        status: userData.status,
        emailVerified: userData.emailVerified,
        phoneVerified: userData.phoneVerified,
        createdAt: userData.createdAt,
        lastLoginAt: userData.lastLoginAt,
      },
      profile: profileData,
      contactPermissions: contactPerms,
      note: 'This export contains all personal data stored in Castlyo platform. For consent logs and audit trail, please use the consent export endpoint.',
    };
  }

  /**
   * Get public talents list for explore page
   */
  async getPublicTalents(page: number = 1, limit: number = 12, skills?: string[]) {
    const offset = (page - 1) * limit;
    
    // Build query for public talent profiles
    let query = this.database.select({
      id: talentProfiles.id,
      userId: talentProfiles.userId,
      firstName: talentProfiles.firstName,
      lastName: talentProfiles.lastName,
      displayName: talentProfiles.displayName,
      bio: talentProfiles.bio,
      city: talentProfiles.city,
      country: talentProfiles.country,
      heightCm: talentProfiles.heightCm,
      weightKg: talentProfiles.weightKg,
      specialties: talentProfiles.specialties,
      experience: talentProfiles.experience,
      profileImage: talentProfiles.profileImage,
      createdAt: talentProfiles.createdAt,
      updatedAt: talentProfiles.updatedAt,
    })
    .from(talentProfiles)
    .limit(limit)
    .offset(offset);

    // Add skills filter if provided
    if (skills && skills.length > 0) {
      // Note: This is a simplified filter. For complex filtering, consider using a proper search engine
      // For now, we'll just return all profiles since isPublic column doesn't exist
      // TODO: Implement proper skills filtering when needed
    }

    const talents = await query;
    const totalCount = await this.database.select({ count: talentProfiles.id })
      .from(talentProfiles);

    return {
      hits: talents,
      totalHits: totalCount.length,
      page,
      limit,
      totalPages: Math.ceil(totalCount.length / limit),
    };
  }
}

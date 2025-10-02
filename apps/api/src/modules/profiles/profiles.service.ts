import { 
  Injectable, 
  Inject, 
  NotFoundException, 
  ForbiddenException, 
  BadRequestException 
} from '@nestjs/common';
import { eq, and, sql } from 'drizzle-orm';
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

    // Format birthDate to ISO string if it's a Date object
    const formattedProfile = {
      ...talentProfile,
      birthDate: talentProfile.birthDate 
        ? (talentProfile.birthDate instanceof Date 
           ? talentProfile.birthDate.toISOString().slice(0, 10) 
           : String(talentProfile.birthDate).slice(0, 10))
        : null,
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

    return formattedProfile;
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
      birthDate: talentProfile.birthDate 
        ? (talentProfile.birthDate instanceof Date 
           ? talentProfile.birthDate.toISOString().slice(0, 10) 
           : String(talentProfile.birthDate).slice(0, 10))
        : null,
      gender: talentProfile.gender,
      resumeUrl: talentProfile.resumeUrl,
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
    raw?: any
  ) {
    try {
      console.log('[SRV] updateTalentProfile jwtUserId=', userId, 'dto=', JSON.stringify(profileData, null, 2));
      console.log('[SRV] updateTalentProfile raw=', JSON.stringify(raw, null, 2));
      
      // Helper functions
      const toNum = (v: any) =>
        v === '' || v === null || v === undefined ? undefined : Number(v);

      const isEmpty = (v: any) =>
        v === undefined || v === null || (typeof v === 'string' && v.trim() === '');

      function removeUndefined<T extends Record<string, any>>(obj: T): T {
        const out: any = {};
        Object.keys(obj).forEach((k) => {
          const v = (obj as any)[k];
          if (!isEmpty(v)) out[k] = v;
        });
        return out;
      }

      // Merge raw (snake_case) and dto (camelCase) - raw takes precedence for snake_case fields
      const src = { ...(raw ?? {}), ...(profileData as any) };

      // Normalize data: snake_case takes precedence, fallback to camelCase
      const mappedData = removeUndefined({
        userId, // Use only the JWT user ID
        firstName:     src.first_name     ?? profileData.firstName,
        lastName:      src.last_name      ?? profileData.lastName,
        city:          src.city           ?? profileData.city,
        birthDate:     src.birth_date     ?? profileData.birthDate,
        gender:        src.gender         ?? profileData.gender,
        heightCm:      toNum(src.height_cm ?? profileData.heightCm ?? src.height ?? profileData.height),
        weightKg:      toNum(src.weight_kg ?? profileData.weightKg ?? src.weight ?? profileData.weight),
        bio:           src.bio            ?? profileData.bio,
        experience:    src.experience     ?? profileData.experience,
        specialties:   src.specialties    ?? profileData.specialties,
        resumeUrl:     (src.resume_url ?? profileData.resumeUrl) || null,
        profileImage:  src.profile_image  ?? profileData.profileImage ?? src.profilePhotoUrl,
        displayName:   src.display_name   ?? profileData.displayName,
        headline:      src.headline       ?? profileData.headline,
        country:       src.country        ?? profileData.country,
        skills:        src.skills         ?? profileData.skills,
        languages:     src.languages      ?? profileData.languages,
        isPublic:      src.is_public      ?? profileData.isPublic,
        publishedAt:   (src.is_public ?? profileData.isPublic) ? new Date() : undefined,
        updatedAt:     new Date(),
      });

      console.log('[SRV] normalized mappedData =', JSON.stringify(mappedData, null, 2));

      // Upsert (insert or update) - one record per user
      // Build update set object with only defined fields
      const updateSet: Record<string, any> = {
        updatedAt: sql`EXCLUDED.updated_at`,
      };
      
      // Only include fields that are defined in the update
      if (mappedData.displayName !== undefined) updateSet.displayName = sql`EXCLUDED.display_name`;
      if (mappedData.firstName !== undefined) updateSet.firstName = sql`EXCLUDED.first_name`;
      if (mappedData.lastName !== undefined) updateSet.lastName = sql`EXCLUDED.last_name`;
      if (mappedData.city !== undefined) updateSet.city = sql`EXCLUDED.city`;
      if (mappedData.country !== undefined) updateSet.country = sql`EXCLUDED.country`;
      if (mappedData.bio !== undefined) updateSet.bio = sql`EXCLUDED.bio`;
      if (mappedData.experience !== undefined) updateSet.experience = sql`EXCLUDED.experience`;
      if (mappedData.profileImage !== undefined) updateSet.profileImage = sql`EXCLUDED.profile_image`;
      if (mappedData.resumeUrl !== undefined) updateSet.resumeUrl = sql`EXCLUDED.resume_url`;
      if (mappedData.birthDate !== undefined) updateSet.birthDate = sql`EXCLUDED.birth_date`;
      if (mappedData.gender !== undefined) updateSet.gender = sql`EXCLUDED.gender`;
      if (mappedData.heightCm !== undefined) updateSet.heightCm = sql`EXCLUDED.height_cm`;
      if (mappedData.weightKg !== undefined) updateSet.weightKg = sql`EXCLUDED.weight_kg`;
      if (mappedData.headline !== undefined) updateSet.headline = sql`EXCLUDED.headline`;
      if (mappedData.specialties !== undefined) updateSet.specialties = sql`EXCLUDED.specialties`;
      if (mappedData.skills !== undefined) updateSet.skills = sql`EXCLUDED.skills`;
      if (mappedData.languages !== undefined) updateSet.languages = sql`EXCLUDED.languages`;
      if (mappedData.isPublic !== undefined) updateSet.isPublic = sql`EXCLUDED.is_public`;
      if (mappedData.publishedAt !== undefined) updateSet.publishedAt = sql`EXCLUDED.published_at`;

      const result = await this.database
        .insert(talentProfiles)
        .values({ ...mappedData, createdAt: new Date() })
        .onConflictDoUpdate({
          target: talentProfiles.userId,
          set: updateSet,
        })
        .returning();

      return result[0];
    } catch (e) {
      // DEBUG: Log detailed error information
      console.error('[UPDATE TALENT ME FAILED]', {
        message: (e as any)?.message,
        stack: (e as any)?.stack,
        cause: (e as any)?.cause,
      });
      console.error('[DB ERROR RAW]', e);
      throw e;
    }
  }

  async updateAgencyProfile(
    userId: string, 
    profileData: UpdateAgencyProfileDto
  ) {
    const mappedData = {
      userId, // Use only the JWT user ID
      ...profileData,
      updatedAt: new Date()
    };

    // Upsert (insert or update) - one record per user
    const result = await this.database
      .insert(agencyProfiles)
      .values({ ...mappedData, createdAt: new Date() })
      .onConflictDoUpdate({
        target: agencyProfiles.userId,
        set: mappedData,
      })
      .returning();

    return result[0];
  }

  async updateTalentProfileById(
    profileId: string,
    profileData: UpdateTalentProfileDto,
    requestingUserId: string
  ) {
    // Check if user is updating their own profile
    const existingProfile = await this.database.select()
      .from(talentProfiles)
      .where(eq(talentProfiles.id, profileId))
      .limit(1);

    if (!existingProfile.length) {
      throw new NotFoundException('Talent profile not found');
    }

    if (existingProfile[0].userId !== requestingUserId) {
      throw new ForbiddenException('Cannot update another user\'s profile');
    }

    // Use the existing updateTalentProfile method with the profile owner's userId
    return this.updateTalentProfile(existingProfile[0].userId, profileData);
  }

  async updateAgencyProfileById(
    profileId: string,
    profileData: UpdateAgencyProfileDto,
    requestingUserId: string
  ) {
    // Check if user is updating their own profile
    const existingProfile = await this.database.select()
      .from(agencyProfiles)
      .where(eq(agencyProfiles.id, profileId))
      .limit(1);

    if (!existingProfile.length) {
      throw new NotFoundException('Agency profile not found');
    }

    if (existingProfile[0].userId !== requestingUserId) {
      throw new ForbiddenException('Cannot update another user\'s profile');
    }

    // Use the existing updateAgencyProfile method with the profile owner's userId
    return this.updateAgencyProfile(existingProfile[0].userId, profileData);
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
            birthDate: talentProfile.birthDate ? talentProfile.birthDate.toISOString().slice(0,10) : null,
            gender: talentProfile.gender,
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
      headline: talentProfiles.headline,
      city: talentProfiles.city,
      country: talentProfiles.country,
      heightCm: talentProfiles.heightCm,
      weightKg: talentProfiles.weightKg,
      specialties: talentProfiles.specialties,
      experience: talentProfiles.experience,
      profileImage: talentProfiles.profileImage,
      publishedAt: talentProfiles.publishedAt,
      createdAt: talentProfiles.createdAt,
      updatedAt: talentProfiles.updatedAt,
    })
    .from(talentProfiles)
    // .where(eq(talentProfiles.isPublic, true)) // Only published profiles - geçici olarak kapatıldı
    .orderBy(sql`${talentProfiles.publishedAt} DESC NULLS LAST, ${talentProfiles.updatedAt} DESC`) // Recent published first
    .limit(limit)
    .offset(offset);

    // Add skills filter if provided
    if (skills && skills.length > 0) {
      // Filter by specialties array overlap
      query = query.where(
        sql`${talentProfiles.specialties} && ${skills}` // PostgreSQL array overlap operator
      );
    }

    const talents = await query;
    
    // Count total published profiles (with same filters)
    let countQuery = this.database.select({ count: sql`count(*)` })
      .from(talentProfiles);
      // .where(eq(talentProfiles.isPublic, true)); // geçici olarak kapatıldı
    
    if (skills && skills.length > 0) {
      countQuery = countQuery.where(
        sql`${talentProfiles.specialties} && ${skills}`
      );
    }
    
    const totalResult = await countQuery;
    const totalHits = Number(totalResult[0]?.count || 0);

    return {
      hits: talents,
      totalHits,
      page,
      limit,
      totalPages: Math.ceil(totalHits / limit),
    };
  }
}

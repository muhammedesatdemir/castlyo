import { 
  Injectable, 
  Inject, 
  NotFoundException, 
  ForbiddenException, 
  BadRequestException,
  InternalServerErrorException,
  Logger
} from '@nestjs/common';
import { eq, and, sql } from 'drizzle-orm';
// DATABASE_CONNECTION import removed - using 'DRIZZLE' directly
import { 
  users, 
  talentProfiles, 
  agencyProfiles,
  contactPermissions,
  guardianContacts,
  db
} from '@castlyo/database';
import { isCorporateDomain } from '../../utils/email';
import { 
  CreateTalentProfileDto, 
  UpdateTalentProfileDto,
  CreateAgencyProfileDto,
  UpdateAgencyProfileDto 
} from './dto/profile.dto';
import { UpsertAgencyProfileDto } from './dto/agency.dto';

@Injectable()
export class ProfilesService {
  private readonly logger = new Logger(ProfilesService.name);

  constructor(
    @Inject('DRIZZLE') private readonly database: any,
  ) {}

  // Normalize Turkish city labels to enum codes using slug-like rules
  private normalizeCity(label?: string | null): (any) /* CityCode | null */ {
    if (!label) return null;
    const slug = String(label)
      .trim()
      .toLowerCase()
      .replace(/ğ/g,'g').replace(/ü/g,'u').replace(/ş/g,'s')
      .replace(/ı/g,'i').replace(/ö/g,'o').replace(/ç/g,'c')
      .replace(/[^a-z0-9]+/g,'');

    const map: Record<string, string> = {
      adana:'ADANA', adiyaman:'ADIYAMAN', afyonkarahisar:'AFYONKARAHISAR', agri:'AGRI', amasya:'AMASYA',
      ankara:'ANKARA', antalya:'ANTALYA', artvin:'ARTVIN', aydin:'AYDIN', balikseir:'BALIKESIR', balikesir:'BALIKESIR',
      bilecik:'BILECIK', bingol:'BINGOL', bitlis:'BITLIS', bolu:'BOLU', burdur:'BURDUR', bursa:'BURSA',
      canakkale:'CANAKKALE', cankiri:'CANKIRI', corum:'CORUM', denizli:'DENIZLI', diyarbakir:'DIYARBAKIR',
      edirne:'EDIRNE', elazig:'ELAZIG', erzincan:'ERZINCAN', erzurum:'ERZURUM', eskisehir:'ESKISEHIR',
      gaziantep:'GAZIANTEP', giresun:'GIRESUN', gumushane:'GUMUSHANE', hakkari:'HAKKARI', hatay:'HATAY',
      isparta:'ISPARTA', mersin:'MERSIN', istanbul:'ISTANBUL', izmir:'IZMIR', kars:'KARS', kastamonu:'KASTAMONU',
      kayseri:'KAYSERI', kirklareli:'KIRKLARELI', kirsehir:'KIRSEHIR', kocaeli:'KOCAELI', konya:'KONYA',
      kutahya:'KUTAHYA', malatya:'MALATYA', manisa:'MANISA', kahramanmaras:'KAHRAMANMARAS', mardin:'MARDIN',
      mugla:'MUGLA', mus:'MUS', nevsehir:'NEVSEHIR', nigde:'NIGDE', ordu:'ORDU', rize:'RIZE', sakarya:'SAKARYA',
      samsun:'SAMSUN', siirt:'SIIRT', sinop:'SINOP', sivas:'SIVAS', tekirdag:'TEKIRDAG', tokat:'TOKAT',
      trabzon:'TRABZON', tunceli:'TUNCELI', sanliurfa:'SANLIURFA', usak:'USAK', van:'VAN', yozgat:'YOZGAT',
      zonguldak:'ZONGULDAK', aksaray:'AKSARAY', bayburt:'BAYBURT', karaman:'KARAMAN', kirikkale:'KIRIKKALE',
      batman:'BATMAN', sirnak:'SIRNAK', bartin:'BARTIN', ardahan:'ARDAHAN', igdir:'IGDIR', yalova:'YALOVA',
      karabuk:'KARABUK', kilis:'KILIS', osmaniye:'OSMANIYE', duzce:'DUZCE'
    };
    return map[slug] ?? null;
  }

  private normalizeRelation(input: string): string {
    const x = input?.toLowerCase();
    if (x === 'baba') return 'father';
    if (x === 'anne') return 'mother';
    if (x === 'vasi') return 'guardian';
    if (x === 'diğer' || x === 'diger') return 'other';
    return ['mother','father','guardian','other'].includes(x) ? x : 'other';
  }

  private calcAge(birth?: Date | string | null): number | null {
    if (!birth) return null;
    const birthDate = typeof birth === 'string' ? new Date(birth) : birth;
    if (isNaN(birthDate.getTime())) return null;
    
    const now = new Date();
    let age = now.getFullYear() - birthDate.getFullYear();
    const monthDiff = now.getMonth() - birthDate.getMonth();
    
    if (monthDiff < 0 || (monthDiff === 0 && now.getDate() < birthDate.getDate())) {
      age--;
    }
    
    return age;
  }

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

    // Normalize city from label -> code (nullable if not matched)
    const cityLabel = (profileData as any).city_label?.trim() || undefined;
    const normalizedCode = this.normalizeCity(cityLabel);

    const newProfile = await this.database.insert(talentProfiles)
      .values({
        userId,
        ...profileData,
        // Dual city model
        cityLabel: cityLabel ?? null,
        cityCode: normalizedCode ?? null,
        // legacy compatibility field for older consumers expecting "city"
        city: normalizedCode ?? null,
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

    // Auto-verify rule: document present AND corporate email (contactEmail or fallback to users.email)
    const contactOrUserEmail = profileData.contactEmail ?? user[0]?.email;
    const hasDoc = Boolean(profileData.document_url);
    const corporate = isCorporateDomain(contactOrUserEmail);
    const autoVerified = hasDoc && corporate;

    const newProfile = await this.database.insert(agencyProfiles)
      .values({
        userId,
        ...profileData,
        document_url: profileData.document_url ?? null,
        isVerified: autoVerified,
        country: profileData.country || 'TR',
      })
      .returning();

    // Update user status to ACTIVE
    await this.database.update(users)
      .set({ 
        status: 'ACTIVE',
        emailVerified: true // Also mark email as verified
      })
      .where(eq(users.id, userId));

    return newProfile[0];
  }

  async getTalentProfile(userId: string, requestingUserId?: string) {
    try {
      const rows = await this.database
        .select({
          tp: talentProfiles,
          u: users,
          g: {
            id: guardianContacts.id,
            fullName: guardianContacts.fullName,
            relation: guardianContacts.relation,
            phone: guardianContacts.phone,
            email: guardianContacts.email,
          }
        })
        .from(talentProfiles)
        .leftJoin(users, eq(talentProfiles.userId, users.id))
        .leftJoin(guardianContacts, eq(guardianContacts.talentProfileId, talentProfiles.id))
        .where(eq(talentProfiles.userId, userId))
        .limit(1);

      const row = rows[0];
      if (!row) {
        // Return null instead of throwing - let controller handle 404
        return null;
      }

    const { tp, u, g } = row;

    // If not the owner, return PII-safe version
    if (requestingUserId !== userId) {
      return this.sanitizeTalentProfile(tp, u);
    }

    // Format birthDate to ISO string if it's a Date object
    const formattedProfile = {
      ...tp,
      birthDate: tp.birthDate 
        ? (tp.birthDate instanceof Date 
           ? tp.birthDate.toISOString().slice(0, 10) 
           : String(tp.birthDate).slice(0, 10))
        : null,
      user: {
        id: u.id,
        email: u.email,
        phone: u.phone,
        role: u.role,
        status: u.status,
        emailVerified: u.emailVerified,
        phoneVerified: u.phoneVerified,
      },
      guardian: g?.id ? {
        fullName: g.fullName,
        relation: g.relation,
        phone: g.phone,
        email: g.email ?? null,
      } : null,
    };

      return formattedProfile;
    } catch (error) {
      this.logger.error(`[getTalentProfile] Error fetching profile for user ${userId}:`, error);
      return null; // Safe fallback - let controller handle 404
    }
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

  async getMyAgencyProfile(userId: string) {
    const rows = await this.database.select()
      .from(agencyProfiles)
      .leftJoin(users, eq(agencyProfiles.userId, users.id))
      .where(eq(agencyProfiles.userId, userId))
      .limit(1);

    if (!rows.length) return null;

    const agencyProfile = rows[0].agency_profiles;
    const user = rows[0].users;
    return {
      ...agencyProfile,
      user: user ? { id: user.id, role: user.role, email: user.email } : undefined,
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
        // City dual fields
        cityLabel:     src.city_label     ?? (profileData as any).city_label,
        cityCode:      undefined,
        // city_code accepted but overridden by city_label normalization
        city:          undefined,
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

      // Apply city normalization
      if (mappedData.cityLabel !== undefined) {
        const code = this.normalizeCity(mappedData.cityLabel);
        mappedData.cityCode = code ?? null;
        mappedData.city = code ?? null; // legacy response compatibility
      } else if ((src.city_code ?? (profileData as any)?.city_code) !== undefined) {
        // Allow explicit code only if label absent
        const code = String(src.city_code ?? (profileData as any)?.city_code).toUpperCase();
        const valid = [
          'ADANA','ADIYAMAN','AFYONKARAHISAR','AGRI','AMASYA','ANKARA','ANTALYA','ARTVIN','AYDIN',
          'BALIKESIR','BILECIK','BINGOL','BITLIS','BOLU','BURDUR','BURSA',
          'CANAKKALE','CANKIRI','CORUM','DENIZLI','DIYARBAKIR','EDIRNE','ELAZIG','ERZINCAN','ERZURUM',
          'ESKISEHIR','GAZIANTEP','GIRESUN','GUMUSHANE','HAKKARI','HATAY','ISPARTA','MERSIN','ISTANBUL','IZMIR',
          'KARS','KASTAMONU','KAYSERI','KIRKLARELI','KIRSEHIR','KOCAELI','KONYA','KUTAHYA','MALATYA','MANISA',
          'KAHRAMANMARAS','MARDIN','MUGLA','MUS','NEVSEHIR','NIGDE','ORDU','RIZE','SAKARYA','SAMSUN','SIIRT','SINOP',
          'SIVAS','TEKIRDAG','TOKAT','TRABZON','TUNCELI','SANLIURFA','USAK','VAN','YOZGAT','ZONGULDAK',
          'AKSARAY','BAYBURT','KARAMAN','KIRIKKALE','BATMAN','SIRNAK','BARTIN','ARDAHAN','IGDIR','YALOVA',
          'KARABUK','KILIS','OSMANIYE','DUZCE'
        ];
        const finalCode = valid.includes(code as any) ? code : null;
        mappedData.cityCode = finalCode;
        mappedData.city = finalCode; // legacy compatibility
      }

      // Upsert (insert or update) - one record per user
      // Build update set object with only defined fields
      const updateSet: Record<string, any> = {
        updatedAt: sql`EXCLUDED.updated_at`,
      };
      
      // Only include fields that are defined in the update
      if (mappedData.displayName !== undefined) updateSet.displayName = sql`EXCLUDED.display_name`;
      if (mappedData.firstName !== undefined) updateSet.firstName = sql`EXCLUDED.first_name`;
      if (mappedData.lastName !== undefined) updateSet.lastName = sql`EXCLUDED.last_name`;
      if (mappedData.cityLabel !== undefined) updateSet.cityLabel = sql`EXCLUDED.city_label`;
      if (mappedData.cityCode !== undefined) updateSet.cityCode = sql`EXCLUDED.city_code`;
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

      const tpRow = result[0];

      // 2) Handle guardian upsert for minors
      const guardianData = profileData.guardian || src.guardian;
      if (guardianData) {
        const age = this.calcAge(tpRow.birthDate);
        if (age !== null && age < 18) {
          await this.database.insert(guardianContacts)
            .values({
              talentProfileId: tpRow.id,
              fullName: guardianData.fullName,
              relation: this.normalizeRelation(guardianData.relation),
              phone: guardianData.phone,
              email: guardianData.email ?? null,
            })
            .onConflictDoUpdate({
              target: guardianContacts.talentProfileId,
              set: {
                fullName: guardianData.fullName,
                relation: this.normalizeRelation(guardianData.relation),
                phone: guardianData.phone,
                email: guardianData.email ?? null,
                updatedAt: new Date(),
              }
            });
        }
      }

      // 3) Return updated profile with guardian data
      return this.getTalentProfile(userId);
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
    // Fetch user email for fallback
    const user = await this.database.select()
      .from(users)
      .where(eq(users.id, userId))
      .limit(1);

    const contactOrUserEmail = (profileData as any)?.contactEmail ?? user[0]?.email;
    const hasDoc = Boolean((profileData as any)?.document_url);
    const corporate = isCorporateDomain(contactOrUserEmail);
    const autoVerified = hasDoc && corporate;

    const mappedData = {
      userId,
      ...profileData,
      isVerified: autoVerified,
      updatedAt: new Date(),
    } as any;

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

  async upsertMyAgencyProfile(userId: string, dto: UpsertAgencyProfileDto) {
    // Helper function to pick only defined values
    const pickDefined = <T extends object>(o: T): Partial<T> => {
      const r: any = {};
      for (const [k, v] of Object.entries(o)) if (v !== undefined) r[k] = v;
      return r;
    };

    try {
      // 1) Get user for email fallback
      const user = await this.database.select()
        .from(users)
        .where(eq(users.id, userId))
        .limit(1);

      const userRow = user[0];
      if (!userRow) {
        throw new NotFoundException('User not found');
      }

      // 2) Auto-verify rule: corporate email + document
      const hasDoc = Boolean(dto.verificationDocKey);
      const corporate = isCorporateDomain(dto.contactEmail ?? userRow.email);
      const autoVerified = hasDoc && corporate;

      // 3) UPDATE fields (only defined ones)
      const updateSet = pickDefined({
        agencyName: dto.agencyName,
        companyName: dto.companyName,
        taxNumber: dto.taxNumber,
        about: dto.about,
        website: dto.website,
        address: dto.address,
        city: dto.city,
        country: dto.country,
        contactName: dto.contactName,
        contactEmail: dto.contactEmail,
        contactPhone: dto.contactPhone,
        specialties: dto.specialties,
        verificationDocKey: dto.verificationDocKey,
        isVerified: autoVerified,
        updatedAt: new Date(),
      });

      // 4) CREATE values (for INSERT if needed)
      const createValues = {
        userId,
        agencyName: dto.agencyName ?? null,
        companyName: dto.companyName ?? null,
        taxNumber: dto.taxNumber ?? null,
        about: dto.about ?? null,
        website: dto.website ?? null,
        address: dto.address ?? null,
        city: dto.city ?? null,
        country: dto.country ?? null,
        contactName: dto.contactName ?? null,
        contactEmail: dto.contactEmail ?? null,
        contactPhone: dto.contactPhone ?? null,
        specialties: dto.specialties ?? [],
        verificationDocKey: dto.verificationDocKey ?? null,
        isVerified: autoVerified,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      console.log('[AGENCY UPSERT] Update set:', JSON.stringify(updateSet, null, 2));
      console.log('[AGENCY UPSERT] Create values:', JSON.stringify(createValues, null, 2));

      // 5) Two-step UPSERT (transaction-safe)
      const result = await this.database.transaction(async (tx) => {
        // Try UPDATE first
        const updated = await tx
          .update(agencyProfiles)
          .set(updateSet)
          .where(eq(agencyProfiles.userId, userId))
          .returning();

        if (updated.length > 0) {
          console.log('[AGENCY UPSERT] Updated existing record:', updated[0].id);
          return updated[0];
        }

        // If no rows updated, INSERT new record
        const inserted = await tx
          .insert(agencyProfiles)
          .values(createValues)
          .returning();

        console.log('[AGENCY UPSERT] Inserted new record:', inserted[0].id);
        return inserted[0];
      });

      return {
        ...result,
        user: {
          id: userRow.id,
          role: userRow.role,
          email: userRow.email,
          status: userRow.status,
          emailVerified: userRow.emailVerified,
        },
      };
    } catch (err: any) {
      console.error('[AGENCY UPSERT ERROR]', {
        code: err?.code,
        detail: err?.detail,
        message: err?.message,
        stack: err?.stack,
        userId,
        dto: JSON.stringify(dto, null, 2)
      });
      throw err;
    }
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
    try {
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
        city_label: talentProfiles.cityLabel,
        city_code: talentProfiles.cityCode,
        country: talentProfiles.country,
        gender: talentProfiles.gender,
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

      // Map talents to ensure new fields are nullable
      const mappedTalents = talents.map(talent => ({
        ...talent,
        city_label: talent.city_label ?? null,
        city_code: talent.city_code ?? null,
        gender: talent.gender ?? null,
      }));

      return {
        hits: mappedTalents,
        totalHits,
        page,
        limit,
        totalPages: Math.ceil(totalHits / limit),
      };
    } catch (error: any) {
      // Log detailed error information for debugging
      this.logger.error(`[getPublicTalents] Failed to fetch talents`, {
        error: error.message,
        code: error.code,
        detail: error.detail,
        hint: error.hint,
        stack: error.stack,
        page,
        limit,
        skills,
      });

      // Check for missing tables
      if (error?.code === '42P01') {
        this.logger.error('[DB] Missing table(s) – run migrations');
      }
      
      throw new InternalServerErrorException('Profiles service temporarily unavailable');
    }
  }
}

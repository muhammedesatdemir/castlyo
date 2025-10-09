import { 
  Injectable, 
  Inject, 
  NotFoundException, 
  ForbiddenException, 
  BadRequestException,
  ConflictException,
  InternalServerErrorException,
} from '@nestjs/common';
import { eq, and, desc, asc, sql, ilike, or, inArray, count } from 'drizzle-orm';
// DATABASE_CONNECTION import removed - using 'DRIZZLE' directly
import { 
  users,
  agencyProfiles,
  talentProfiles
} from '@castlyo/database';
import { 
  jobPosts,
  jobApplications,
  jobViews
} from '@castlyo/database';
import { 
  CreateJobPostDto, 
  UpdateJobPostDto,
  CreateJobApplicationDto,
  UpdateJobApplicationDto
} from './dto/job.dto';
import { JobsQueryDto } from './dto/jobs-query.dto';
import type { Database } from '@castlyo/database';
import { JOB_VISIBLE_STATUSES, JOB_APPLYABLE_STATUSES } from '../../config/jobs.config';

// ISO date conversion helper
function toIso(x?: string | Date | null) {
  if (!x) return null;
  if (x instanceof Date) return x.toISOString();
  
  const str = String(x);
  // Handle PostgreSQL timestamp format: "2025-10-23 13:55:06.736651+00"
  if (str.includes(' ')) {
    const isoString = str.replace(' ', 'T').replace(/\+00$/, 'Z');
    const dateObj = new Date(isoString);
    return isNaN(dateObj.getTime()) ? null : dateObj.toISOString();
  }
  
  // Handle other formats
  const dateObj = new Date(str);
  return isNaN(dateObj.getTime()) ? null : dateObj.toISOString();
}

// Canonical safe selection aligned with actual DB schema
const jobPostSelectBase = {
  id: jobPosts.id,
  agencyId: jobPosts.agencyId,
  title: jobPosts.title,
  description: jobPosts.description,
  jobType: jobPosts.jobType,
  city: jobPosts.city,
  status: jobPosts.status,
  expiresAt: jobPosts.applicationDeadline, // Map applicationDeadline to expiresAt for API compatibility
  publishedAt: jobPosts.publishedAt,
  createdAt: jobPosts.createdAt,
  updatedAt: jobPosts.updatedAt,
  budgetRange: sql`"job_posts"."budget_range"`,
  // ageMin and ageMax fields removed - columns no longer exist in DB
  maxApplications: sql`"job_posts"."max_applications"`,
  // API field names
  salary_min: jobPosts.salaryMin,
  salary_max: jobPosts.salaryMax,
  currency: jobPosts.currency,
  application_deadline: jobPosts.applicationDeadline,
} as const;

@Injectable()
export class JobsService {
  constructor(
    @Inject('DRIZZLE') private readonly db: Database,
  ) {}

  async createJobPost(userId: string, jobData: CreateJobPostDto) {
    // Check if user is an agency and has an active profile
    const user = await this.db.select({ id: users.id, role: users.role })
      .from(users)
      .where(eq(users.id, userId))
      .limit(1);

    if (!user.length || user[0].role !== 'AGENCY') {
      throw new ForbiddenException('Only agencies can create job posts');
    }

    // Check if agency profile exists and is verified
    const agencyProfile = await this.db.select({ id: agencyProfiles.id, userId: agencyProfiles.userId })
      .from(agencyProfiles)
      .where(eq(agencyProfiles.userId, userId))
      .limit(1);

    if (!agencyProfile.length) {
      throw new BadRequestException('Agency profile must be created first');
    }

    // TODO: Check subscription/entitlement limits here
    // For now, allow unlimited job posts

    const newJobPost = await this.db.insert(jobPosts)
      .values({
        agencyId: agencyProfile[0].id,
        title: jobData.title,
        description: jobData.description,
        jobType: jobData.job_type as any,
        genderRequirement: (jobData.genderPreference?.[0] ?? 'ANY') as 'ANY'|'MALE'|'FEMALE',
        city: jobData.city,
        applicationDeadline: jobData.application_deadline ? new Date(jobData.application_deadline) : null,
        salaryMin: jobData.salary_min ?? jobData.budgetMin,
        salaryMax: jobData.salary_max ?? jobData.budgetMax,
        currency: jobData.currency || 'TRY',
        // ageMin and ageMax fields removed - columns no longer exist in DB
        status: 'DRAFT',
      })
      .returning();

    return newJobPost[0];
  }

  async publishJobPost(jobId: string, userId: string) {
    const jobPost = await this.db.select({
      post: jobPosts,
      agency: agencyProfiles,
    })
      .from(jobPosts)
      .leftJoin(agencyProfiles, eq(jobPosts.agencyId, agencyProfiles.id))
      .where(eq(jobPosts.id, jobId))
      .limit(1);

    if (!jobPost.length || jobPost[0].agency.userId !== userId) {
      throw new NotFoundException('Job post not found');
    }

    if (jobPost[0].post.status === 'PUBLISHED') {
      throw new BadRequestException('Job post is already published');
    }

    const updatedJobPost = await this.db.update(jobPosts)
      .set({
        status: 'PUBLISHED',
        publishedAt: new Date(),
        updatedAt: new Date()
      })
      .where(eq(jobPosts.id, jobId))
      .returning();

    return updatedJobPost[0];
  }

  async getJobPosts({ q, city, jobType, status, page = 1, limit = 20 }: JobsQueryDto, viewerId?: string) {
    const offset = (page - 1) * limit;

    const conditions = [];
    
    if (q) {
      conditions.push(or(
        ilike(jobPosts.title, `%${q}%`),
        ilike(jobPosts.description, `%${q}%`)
      ));
    }
    
    if (city) {
      conditions.push(ilike(jobPosts.city, `%${city}%`));
    }
    
    if (jobType) {
      conditions.push(eq(jobPosts.jobType, jobType as any));
    }
    
    if (status) {
      conditions.push(eq(jobPosts.status, status as any));
    }
    
    // Access control: DRAFT ilanları sadece sahibine göster
    if (viewerId) {
      // Ajans sahibi ise kendi + yayımlanmış ilanları görebilir
      conditions.push(or(
        inArray(jobPosts.status, JOB_VISIBLE_STATUSES as any),
        sql`${jobPosts.agencyId} IN (SELECT id FROM agency_profiles WHERE user_id = ${viewerId})`
      ));
    } else {
      // Ziyaretçi ise sadece yayımlanmış ilanları görebilir
      conditions.push(inArray(jobPosts.status, JOB_VISIBLE_STATUSES as any));
    }
    
    const where = conditions.length > 0 ? and(...conditions) : undefined;

    const [rows, [{ total }]] = await Promise.all([
      this.db.select({
        id: jobPosts.id,
        agencyId: jobPosts.agencyId,
        title: jobPosts.title,
        description: jobPosts.description,
        jobType: jobPosts.jobType,
        city: jobPosts.city,
        status: jobPosts.status,
        // DB alanın adı applicationDeadline ise, expiresAt diye map'le:
        expiresAt: jobPosts.applicationDeadline,
        publishedAt: jobPosts.publishedAt,
        createdAt: jobPosts.createdAt,
        updatedAt: jobPosts.updatedAt,
        budgetRange: sql`"job_posts"."budget_range"`,
        // ageMin and ageMax fields removed - columns no longer exist in DB
        maxApplications: sql`"job_posts"."max_applications"`,
        // API field names
        salary_min: jobPosts.salaryMin,
        salary_max: jobPosts.salaryMax,
        currency: jobPosts.currency,
        application_deadline: jobPosts.applicationDeadline,
        applicationsCount: sql<number>`COALESCE((SELECT COUNT(*) FROM job_applications ja WHERE ja.job_id = ${jobPosts.id}), 0)`,
        // Agency data
        agency: sql`json_build_object(
          'id', "agency_profiles"."id",
          'name', "agency_profiles"."company_name",
          'city', "agency_profiles"."city",
          'verified', "agency_profiles"."is_verified",
          'website', "agency_profiles"."website"
        )`,
      })
      .from(jobPosts)
      .leftJoin(agencyProfiles, eq(jobPosts.agencyId, agencyProfiles.id))
      .where(where)
      .orderBy(desc(jobPosts.publishedAt))
      .limit(limit)
      .offset(offset),
      this.db.select({ total: count() }).from(jobPosts).where(where),
    ]);

    const data = rows.map((r) => ({
      ...r,
      expiresAt: toIso(r.expiresAt),
      publishedAt: toIso(r.publishedAt),
      createdAt: toIso(r.createdAt),
      updatedAt: toIso(r.updatedAt),
    }));

    return { data, meta: { page, limit, total } };
  }

  async getJobByIdPublic(jobId: string, viewerId?: string | null) {
    const jobPost = await this.db.select({
      id: jobPosts.id,
      title: jobPosts.title,
      description: jobPosts.description,
      status: jobPosts.status,
      jobType: jobPosts.jobType,
      city: jobPosts.city,
      salaryMin: jobPosts.salaryMin,
      salaryMax: jobPosts.salaryMax,
      currency: jobPosts.currency,
      applicationDeadline: jobPosts.applicationDeadline,
      // ageMin and ageMax fields removed - columns no longer exist in DB
      createdAt: jobPosts.createdAt,
      updatedAt: jobPosts.updatedAt,
      agencyId: jobPosts.agencyId,
      agencyUserId: agencyProfiles.userId,
      agencyName: agencyProfiles.companyName,
      agencyCity: agencyProfiles.city,
      agencyWebsite: agencyProfiles.website,
      agencyVerified: agencyProfiles.isVerified,
      agencyAbout: agencyProfiles.about,
      applicationsCount: sql<number>`COALESCE((SELECT COUNT(*) FROM job_applications ja WHERE ja.job_id = ${jobPosts.id}), 0)`,
    })
      .from(jobPosts)
      .leftJoin(agencyProfiles, eq(jobPosts.agencyId, agencyProfiles.id))
      .where(eq(jobPosts.id, jobId))
      .limit(1);

    if (!jobPost.length) {
      throw new NotFoundException('Job not found');
    }

    const post = jobPost[0];
    // Status visibility: only allow public statuses
    if (!(JOB_VISIBLE_STATUSES as readonly string[]).includes(post.status as any)) {
      throw new NotFoundException('Job post is not available');
    }

    // Deadline logic: consider null as not expired
    const now = new Date();
    const deadline = post.applicationDeadline as any as string | Date | null;
    if (deadline && new Date(deadline) < now) {
      throw new NotFoundException('Job post is not available');
    }
    const isOwner = !!viewerId && post.agencyUserId === viewerId;

    // Detay herkese açık. Sadece log tutuyoruz:
    console.log(`Job ${jobId} details served publicly (status=${post.status}) viewer=${viewerId ?? 'anon'}`);

    return {
      ...post,
      isOwner,
      agency: {
        id: post.agencyId,
        name: post.agencyName,
        city: post.agencyCity,
        website: post.agencyWebsite,
        verified: post.agencyVerified,
      },
    };
  }

  async getJobPost(jobId: string, viewerId?: string) {
    const jobPost = await this.db.select({
      ...jobPostSelectBase,
      agencyCompanyName: agencyProfiles.companyName,
      agencyLogo: agencyProfiles.logo,
      agencyIsVerified: agencyProfiles.isVerified,
      agencyUserId: agencyProfiles.userId,
      // Agency data in same format as getJobPosts
      agency: sql`json_build_object(
        'id', "agency_profiles"."id",
        'name', "agency_profiles"."company_name",
        'city', "agency_profiles"."city",
        'verified', "agency_profiles"."is_verified",
        'website', "agency_profiles"."website"
      )`,
    })
      .from(jobPosts)
      .leftJoin(agencyProfiles, eq(jobPosts.agencyId, agencyProfiles.id))
      .where(eq(jobPosts.id, jobId))
      .limit(1);

    if (!jobPost.length) {
      throw new NotFoundException('Job post not found');
    }

    const post = jobPost[0];

    // Check if job is accessible: PUBLISHED status or owner can see any status
    const isOwner = !!viewerId && post.agencyUserId === viewerId;
    
    const isPublic = post.status === 'PUBLISHED';
    
    // Debug logging
    console.log(`Job ${jobId} - Status: ${post.status}, isOwner: ${isOwner}, isPublic: ${isPublic}, viewerId: ${viewerId}`);
    
    if (!isOwner && !isPublic) {
      throw new ForbiddenException('Job post is not accessible');
    }

    // Increment view count if viewer is not the owner
    if (viewerId && viewerId !== post.agencyUserId) {
      // Record the view
      await this.db.insert(jobViews)
        .values({
          jobId: jobId,
          viewerUserId: viewerId,
        })
        .onConflictDoNothing();
    }

    // Add isOwner flag to response
    return {
      ...post,
      isOwner
    };
  }

  async updateJobPost(jobId: string, userId: string, jobData: UpdateJobPostDto) {
    const existingJobPost = await this.db.select({
      post: jobPosts,
      agency: agencyProfiles,
    })
      .from(jobPosts)
      .leftJoin(agencyProfiles, eq(jobPosts.agencyId, agencyProfiles.id))
      .where(eq(jobPosts.id, jobId))
      .limit(1);

    if (!existingJobPost.length || existingJobPost[0].agency.userId !== userId) {
      throw new NotFoundException('Job post not found');
    }

    const updatedJobPost = await this.db.update(jobPosts)
      .set({
        title: jobData.title,
        description: jobData.description,
        jobType: jobData.category as any,
        // requirements: jobData.requirements, // Field doesn't exist in schema
        // ageMin and ageMax fields removed - columns no longer exist in DB
        genderRequirement: (jobData.genderPreference?.[0] ?? 'ANY') as 'ANY'|'MALE'|'FEMALE',
        // heightMin: jobData.heightMin, // field doesn't exist in schema
        // heightMax: jobData.heightMax, // field doesn't exist in schema
        // skills: jobData.skills, // field doesn't exist in schema
        // languages: jobData.languages, // field doesn't exist in schema
        city: jobData.location,
        // not updating expires_at here due to schema mismatch in types
        // tags: jobData.tags, // field doesn't exist in schema
        updatedAt: new Date()
      })
      .where(eq(jobPosts.id, jobId))
      .returning();

    return updatedJobPost[0];
  }

  async deleteJobPost(jobId: string, userId: string) {
    const existingJobPost = await this.db.select({
      post: jobPosts,
      agency: agencyProfiles,
    })
      .from(jobPosts)
      .leftJoin(agencyProfiles, eq(jobPosts.agencyId, agencyProfiles.id))
      .where(eq(jobPosts.id, jobId))
      .limit(1);

    if (!existingJobPost.length || existingJobPost[0].agency.userId !== userId) {
      throw new NotFoundException('Job post not found');
    }

    // Soft delete by updating status to CLOSED
    await this.db.update(jobPosts)
      .set({
        status: 'CLOSED',
        updatedAt: new Date()
      })
      .where(eq(jobPosts.id, jobId));

    return { message: 'Job post deleted successfully' };
  }

  async createJobApplication(userId: string, applicationData: CreateJobApplicationDto) {
    // Check if user is a talent
    const user = await this.db.select({ id: users.id, role: users.role })
      .from(users)
      .where(eq(users.id, userId))
      .limit(1);

    if (!user.length || user[0].role !== 'TALENT') {
      throw new ForbiddenException('Only talents can apply to jobs');
    }

    // Flexible talentProfile selection
    const providedTalentProfileId = (applicationData as any).talentProfileId || (applicationData as any)?.profile?.talentProfileId || null;
    let effectiveTalentProfileId: string | null = providedTalentProfileId;
    if (!effectiveTalentProfileId) {
      const prof = await this.db.select({ id: talentProfiles.id })
        .from(talentProfiles)
        .where(eq(talentProfiles.userId, userId))
        .orderBy(asc(talentProfiles.createdAt as any))
        .limit(1);
      effectiveTalentProfileId = prof[0]?.id ?? null;
    }
    if (!effectiveTalentProfileId) {
      throw new BadRequestException('Talent profile must be created first');
    }

    // Check if job post exists and is appliable
    const jobPost = await this.db.select({ 
      status: jobPosts.status, 
      applicationDeadline: jobPosts.applicationDeadline,
      agencyId: jobPosts.agencyId
    })
      .from(jobPosts)
      .where(eq(jobPosts.id, (applicationData as any).jobId || applicationData.jobPostId))
      .limit(1);
    
    if (!jobPost.length) {
      throw new NotFoundException('Job post not found');
    }
    
    if (!(JOB_APPLYABLE_STATUSES as readonly string[]).includes(jobPost[0].status as any)) {
      throw new NotFoundException('Job post is not available for applications');
    }

    // Check if user is trying to apply to their own job
    if (jobPost[0].agencyId === userId) {
      throw new BadRequestException('You cannot apply to your own job');
    }

    // (optional) Check if application deadline has passed
    if (jobPost[0].applicationDeadline && new Date(jobPost[0].applicationDeadline) < new Date()) {
      throw new NotFoundException('Job post is not available for applications');
    }

    // Check if user has already applied
    const existingApplication = await this.db.select({ id: jobApplications.id })
      .from(jobApplications)
      .where(and(
        eq(jobApplications.jobId, (applicationData as any).jobId || applicationData.jobPostId),
        eq(jobApplications.talentProfileId, effectiveTalentProfileId)
      ))
      .limit(1);

    if (existingApplication.length > 0) {
      // Aynı ilana tekrar başvuru denemesi
      throw new ConflictException('Bu ilana zaten başvurmuşsunuz.');
    }

    // TODO: Check application quota/entitlement here

    try {
      const newApplication = await this.db.insert(jobApplications)
        .values({
          jobId: (applicationData as any).jobId || applicationData.jobPostId,
          talentProfileId: effectiveTalentProfileId,
          applicantUserId: userId,
          coverLetter: applicationData.coverLetter,
          status: 'SUBMITTED',
        })
        .returning();

      // Do not update any counter column here; counts will be computed dynamically.

      return newApplication[0];
    } catch (e: any) {
      const code = e?.code;
      const constraint = e?.constraint;
      // PG unique violation -> tekilleştirme hatası
      if (code === '23505' && constraint === 'uq_job_applications_job_user') {
        throw new ConflictException('Bu ilana zaten başvurmuşsunuz.');
      }
      if (code === '23503' || code === '23502') {
        throw new BadRequestException('Geçersiz istek (FK/NULL ihlali).');
      }
      throw new InternalServerErrorException();
    }
  }

  async getJobApplications(jobId: string, userId: string, page = 1, limit = 20) {
    // Verify that the user owns this job post
    const jobPost = await this.db.select({
      post: jobPosts,
      agency: agencyProfiles,
    })
      .from(jobPosts)
      .leftJoin(agencyProfiles, eq(jobPosts.agencyId, agencyProfiles.id))
      .where(eq(jobPosts.id, jobId))
      .limit(1);

    if (!jobPost.length || jobPost[0].agency.userId !== userId) {
      throw new NotFoundException('Job post not found');
    }

    const offset = (page - 1) * limit;

    const applications = await this.db.select({
      id: jobApplications.id,
      status: jobApplications.status,
      coverLetter: jobApplications.coverLetter,
      reviewedAt: jobApplications.reviewedAt,
      talentProfileId: talentProfiles.id,
      talentFirstName: talentProfiles.firstName,
      talentLastName: talentProfiles.lastName,
      talentDisplayName: talentProfiles.displayName,
      talentProfileImage: talentProfiles.profileImage,
      talentCity: talentProfiles.city,
      talentSpecialties: talentProfiles.specialties,
      talentExperience: talentProfiles.experience,
    })
      .from(jobApplications)
      .leftJoin(talentProfiles, eq(jobApplications.talentProfileId, talentProfiles.id))
      .where(eq(jobApplications.jobId, jobId))
      .orderBy(desc(jobApplications.createdAt as any))
      .limit(limit)
      .offset(offset);

    return applications;
  }

  async updateJobApplication(applicationId: string, userId: string, updateData: UpdateJobApplicationDto) {
    // Check if the application exists and the user owns the related job post
    const application = await this.db.select({
      application: jobApplications,
      jobPost: jobPosts,
      agency: agencyProfiles,
    })
      .from(jobApplications)
      .leftJoin(jobPosts, eq(jobApplications.jobId, jobPosts.id))
      .leftJoin(agencyProfiles, eq(jobPosts.agencyId, agencyProfiles.id))
      .where(eq(jobApplications.id, applicationId))
      .limit(1);

    if (!application.length) {
      throw new NotFoundException('Application not found');
    }

    if (application[0].agency.userId !== userId) {
      throw new ForbiddenException('You can only update applications for your job posts');
    }

    const updatedApplication = await this.db.update(jobApplications)
      .set({
        status: updateData.status as any,
        reviewNotes: updateData.notes,
        reviewedAt: new Date(),
        updatedAt: new Date()
      })
      .where(eq(jobApplications.id, applicationId))
      .returning();

    return updatedApplication[0];
  }

  async getMyApplications(userId: string, page = 1, limit = 20) {
    const offset = (page - 1) * limit;

    const applications = await this.db.select({
      id: jobApplications.id,
      status: jobApplications.status,
      coverLetter: jobApplications.coverLetter,
      reviewedAt: jobApplications.reviewedAt,
      createdAt: jobApplications.createdAt,
      jobId: jobPosts.id,
      jobTitle: jobPosts.title,
      jobType: jobPosts.jobType,
      jobCity: jobPosts.city,
      applicationDeadline: jobPosts.applicationDeadline,
      agencyCompanyName: agencyProfiles.companyName,
    })
      .from(jobApplications)
      .leftJoin(jobPosts, eq(jobApplications.jobId, jobPosts.id))
      .leftJoin(agencyProfiles, eq(jobPosts.agencyId, agencyProfiles.id))
      .leftJoin(talentProfiles, eq(jobApplications.talentProfileId, talentProfiles.id))
      .where(eq(talentProfiles.userId, userId))
      .orderBy(desc(jobApplications.createdAt as any))
      .limit(limit)
      .offset(offset);

    return applications;
  }

  async getMyJobPosts(userId: string, page = 1, limit = 20) {
    const offset = (page - 1) * limit;

    const agency = await this.db.select({ id: agencyProfiles.id, userId: agencyProfiles.userId }).from(agencyProfiles).where(eq(agencyProfiles.userId, userId)).limit(1);
    if (!agency.length) {
      return [];
    }

    const jobPostsList = await this.db.select(jobPostSelectBase)
      .from(jobPosts)
      .where(and(
        eq(jobPosts.agencyId, agency[0].id),
        sql`${jobPosts.status} != 'CLOSED'`
      ))
      .orderBy(desc(jobPosts.createdAt))
      .limit(limit)
      .offset(offset);

    return jobPostsList;
  }
}

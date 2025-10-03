import { 
  Injectable, 
  Inject, 
  NotFoundException, 
  ForbiddenException, 
  BadRequestException 
} from '@nestjs/common';
import { eq, and, desc, sql, ilike, or, count } from 'drizzle-orm';
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
  ageMin: sql`"job_posts"."age_min"`,
  ageMax: sql`"job_posts"."age_max"`,
  maxApplications: sql`"job_posts"."max_applications"`,
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
        jobType: jobData.category as any,
        // requirements: jobData.requirements, // Field doesn't exist in schema
        // ageMin: jobData.ageMin, // field doesn't exist in schema
        // ageMax: jobData.ageMax, // field doesn't exist in schema
        genderRequirement: (jobData.genderPreference?.[0] ?? 'ANY') as 'ANY'|'MALE'|'FEMALE',
        // heightMin: jobData.heightMin, // field doesn't exist in schema
        // heightMax: jobData.heightMax, // field doesn't exist in schema
        // skills: jobData.skills || [], // field doesn't exist in schema
        // languages: jobData.languages || [], // field doesn't exist in schema
        city: jobData.location,
        // expires_at is the DB column; set via raw SQL to avoid TS mismatch
        // eslint-disable-next-line @typescript-eslint/ban-ts-comment
        // @ts-ignore
        // not setting expires_at here due to schema mismatch; handled separately if needed
        status: 'DRAFT',
        // tags: jobData.tags || [], // field doesn't exist in schema
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

  async getJobPosts({ q, city, jobType, status, page = 1, limit = 20 }: JobsQueryDto) {
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
        ageMin: sql`"job_posts"."age_min"`,
        ageMax: sql`"job_posts"."age_max"`,
        maxApplications: sql`"job_posts"."max_applications"`,
      })
      .from(jobPosts)
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

  async getJobPost(jobId: string, viewerId?: string) {
    const jobPost = await this.db.select({
      ...jobPostSelectBase,
      agencyCompanyName: agencyProfiles.companyName,
      agencyLogo: agencyProfiles.logo,
      agencyIsVerified: agencyProfiles.isVerified,
      agencyUserId: agencyProfiles.userId,
    })
      .from(jobPosts)
      .leftJoin(agencyProfiles, eq(jobPosts.agencyId, agencyProfiles.id))
      .where(eq(jobPosts.id, jobId))
      .limit(1);

    if (!jobPost.length) {
      throw new NotFoundException('Job post not found');
    }

    const post = jobPost[0];

    // Check if job is active or if viewer is the owner
    if (post.status !== 'PUBLISHED' && post.agencyUserId !== viewerId) {
      throw new ForbiddenException('Job post is not available');
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

    return post;
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
        // ageMin: jobData.ageMin, // field doesn't exist in schema
        // ageMax: jobData.ageMax, // field doesn't exist in schema
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

    // Check if talent profile exists
    const talentProfile = await this.db.select({ id: talentProfiles.id, userId: talentProfiles.userId })
      .from(talentProfiles)
      .where(eq(talentProfiles.userId, userId))
      .limit(1);

    if (!talentProfile.length) {
      throw new BadRequestException('Talent profile must be created first');
    }

    // Check if job post exists and is published
    const jobPost = await this.db.select({ status: jobPosts.status, expiresAt: sql`"job_posts"."expires_at"` })
      .from(jobPosts)
      .where(eq(jobPosts.id, applicationData.jobPostId))
      .limit(1);

    if (!jobPost.length || jobPost[0].status !== 'PUBLISHED') {
      throw new NotFoundException('Job post not found or not available');
    }

    // Check if application deadline has passed
    const deadline = new Date((jobPost[0] as any).expiresAt as any);
    if (deadline < new Date()) {
      throw new BadRequestException('Application deadline has passed');
    }

    // Check if user has already applied
    const existingApplication = await this.db.select({ id: jobApplications.id })
      .from(jobApplications)
      .where(and(
        eq(jobApplications.jobId, applicationData.jobPostId),
        eq(jobApplications.talentProfileId, talentProfile[0].id)
      ))
      .limit(1);

    if (existingApplication.length > 0) {
      throw new BadRequestException('You have already applied to this job');
    }

    // TODO: Check application quota/entitlement here

    const newApplication = await this.db.insert(jobApplications)
      .values({
        jobId: applicationData.jobPostId,
        talentProfileId: talentProfile[0].id,
        applicantUserId: userId,
        coverLetter: applicationData.coverLetter,
        // selectedMedia: applicationData.portfolioItems || [], // Field doesn't exist in schema
        // additionalNotes: undefined, // Field doesn't exist in schema
        status: 'SUBMITTED',
      })
      .returning();

    // Update application count
    await this.db.update(jobPosts)
      .set({
        currentApplications: sql`${jobPosts.currentApplications} + 1`,
        updatedAt: new Date()
      })
      .where(eq(jobPosts.id, applicationData.jobPostId));

    return newApplication[0];
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
      jobId: jobPosts.id,
      jobTitle: jobPosts.title,
      jobType: jobPosts.jobType,
      jobCity: jobPosts.city,
      expiresAt: sql`"job_posts"."expires_at"`,
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

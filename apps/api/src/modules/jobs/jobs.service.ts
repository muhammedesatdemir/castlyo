import { 
  Injectable, 
  Inject, 
  NotFoundException, 
  ForbiddenException, 
  BadRequestException 
} from '@nestjs/common';
import { eq, and, desc, sql, ilike, or } from 'drizzle-orm';
import { DATABASE_CONNECTION } from '../../config/database.module';
import { 
  users,
  agencyProfiles,
  talentProfiles
} from '@castlyo/database/schema/users';
import { 
  jobPosts,
  jobApplications,
  jobViews
} from '@castlyo/database/schema/jobs';
import { 
  CreateJobPostDto, 
  UpdateJobPostDto,
  CreateJobApplicationDto,
  UpdateJobApplicationDto
} from './dto/job.dto';
import type { Database } from '@castlyo/database';

interface JobSearchFilters {
  category?: string; // maps to jobType
  location?: string; // matches city
  ageMin?: number;
  ageMax?: number;
  gender?: string;
  languages?: string[];
  skills?: string[];
  isUrgent?: boolean;
  isFeatured?: boolean;
  search?: string;
}

@Injectable()
export class JobsService {
  constructor(
    @Inject(DATABASE_CONNECTION) private readonly db: Database,
  ) {}

  async createJobPost(userId: string, jobData: CreateJobPostDto) {
    // Check if user is an agency and has an active profile
    const user = await this.db.select()
      .from(users)
      .where(eq(users.id, userId))
      .limit(1);

    if (!user.length || user[0].role !== 'AGENCY') {
      throw new ForbiddenException('Only agencies can create job posts');
    }

    // Check if agency profile exists and is verified
    const agencyProfile = await this.db.select()
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
        requirements: jobData.requirements,
        ageMin: jobData.ageMin,
        ageMax: jobData.ageMax,
        genderRequirement: jobData.genderPreference?.[0] || 'ANY',
        heightMin: jobData.heightMin,
        heightMax: jobData.heightMax,
        skills: jobData.skills || [],
        languages: jobData.languages || [],
        city: jobData.location,
        shootingStartDate: jobData.shootingStartDate ? new Date(jobData.shootingStartDate) : null,
        shootingEndDate: jobData.shootingEndDate ? new Date(jobData.shootingEndDate) : null,
        applicationDeadline: new Date(jobData.applicationDeadline),
        status: 'DRAFT',
        isUrgent: jobData.isUrgent || false,
        isFeatured: jobData.isFeatured || false,
        tags: jobData.tags || [],
        currentApplications: 0,
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

    if (jobPost[0].post.status === 'ACTIVE') {
      throw new BadRequestException('Job post is already active');
    }

    const updatedJobPost = await this.db.update(jobPosts)
      .set({
        status: 'ACTIVE',
        publishedAt: new Date(),
        updatedAt: new Date()
      })
      .where(eq(jobPosts.id, jobId))
      .returning();

    return updatedJobPost[0];
  }

  async getJobPosts(filters: JobSearchFilters, page = 1, limit = 20) {
    const selectFields = {
      id: jobPosts.id,
      title: jobPosts.title,
      description: jobPosts.description,
      jobType: jobPosts.jobType,
      city: jobPosts.city,
      applicationDeadline: jobPosts.applicationDeadline,
      isUrgent: jobPosts.isUrgent,
      isFeatured: jobPosts.isFeatured,
      publishedAt: jobPosts.publishedAt,
      currentApplications: jobPosts.currentApplications,
      agencyCompanyName: agencyProfiles.companyName,
      agencyLogo: agencyProfiles.logo,
      agencyIsVerified: agencyProfiles.isVerified,
    } as const;

    const conditions = [eq(jobPosts.status, 'ACTIVE')];
    if (filters.category) conditions.push(eq(jobPosts.jobType, filters.category as any));
    if (filters.location) conditions.push(ilike(jobPosts.city, `%${filters.location}%`));
    if (filters.isUrgent) conditions.push(eq(jobPosts.isUrgent, true));
    if (filters.isFeatured) conditions.push(eq(jobPosts.isFeatured, true));
    if (filters.search) conditions.push(or(
      ilike(jobPosts.title, `%${filters.search}%`),
      ilike(jobPosts.description, `%${filters.search}%`)
    ));

    const offset = (page - 1) * limit;
    const results = await this.db.select(selectFields)
      .from(jobPosts)
      .leftJoin(agencyProfiles, eq(jobPosts.agencyId, agencyProfiles.id))
      .where(and(...conditions))
      .orderBy(
        desc(jobPosts.isFeatured),
        desc(jobPosts.isUrgent),
        desc(jobPosts.publishedAt)
      )
      .limit(limit)
      .offset(offset);

    return results;
  }

  async getJobPost(jobId: string, viewerId?: string) {
    const jobPost = await this.db.select({
      id: jobPosts.id,
      title: jobPosts.title,
      description: jobPosts.description,
      jobType: jobPosts.jobType,
      city: jobPosts.city,
      applicationDeadline: jobPosts.applicationDeadline,
      status: jobPosts.status,
      publishedAt: jobPosts.publishedAt,
      agencyId: jobPosts.agencyId,
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
    if (post.status !== 'ACTIVE' && post.agencyUserId !== viewerId) {
      throw new ForbiddenException('Job post is not available');
    }

    // Increment view count if viewer is not the owner
    if (viewerId && viewerId !== post.agencyUserId) {
      // Record the view
      await this.db.insert(jobViews)
        .values({
          jobId: jobId,
          viewerId,
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
        requirements: jobData.requirements,
        ageMin: jobData.ageMin,
        ageMax: jobData.ageMax,
        genderRequirement: jobData.genderPreference?.[0],
        heightMin: jobData.heightMin,
        heightMax: jobData.heightMax,
        skills: jobData.skills,
        languages: jobData.languages,
        city: jobData.location,
        applicationDeadline: jobData.applicationDeadline ? new Date(jobData.applicationDeadline) : undefined,
        isUrgent: jobData.isUrgent,
        isFeatured: jobData.isFeatured,
        tags: jobData.tags,
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

    // Soft delete by updating status to CANCELLED
    await this.db.update(jobPosts)
      .set({
        status: 'CANCELLED',
        updatedAt: new Date()
      })
      .where(eq(jobPosts.id, jobId));

    return { message: 'Job post deleted successfully' };
  }

  async createJobApplication(userId: string, applicationData: CreateJobApplicationDto) {
    // Check if user is a talent
    const user = await this.db.select()
      .from(users)
      .where(eq(users.id, userId))
      .limit(1);

    if (!user.length || user[0].role !== 'TALENT') {
      throw new ForbiddenException('Only talents can apply to jobs');
    }

    // Check if talent profile exists
    const talentProfile = await this.db.select()
      .from(talentProfiles)
      .where(eq(talentProfiles.userId, userId))
      .limit(1);

    if (!talentProfile.length) {
      throw new BadRequestException('Talent profile must be created first');
    }

    // Check if job post exists and is published
    const jobPost = await this.db.select()
      .from(jobPosts)
      .where(eq(jobPosts.id, applicationData.jobPostId))
      .limit(1);

    if (!jobPost.length || jobPost[0].status !== 'ACTIVE') {
      throw new NotFoundException('Job post not found or not available');
    }

    // Check if application deadline has passed
    const deadline = new Date(jobPost[0].applicationDeadline as any);
    if (deadline < new Date()) {
      throw new BadRequestException('Application deadline has passed');
    }

    // Check if user has already applied
    const existingApplication = await this.db.select()
      .from(jobApplications)
      .where(and(
        eq(jobApplications.jobId, applicationData.jobPostId),
        eq(jobApplications.talentId, talentProfile[0].id)
      ))
      .limit(1);

    if (existingApplication.length > 0) {
      throw new BadRequestException('You have already applied to this job');
    }

    // TODO: Check application quota/entitlement here

    const newApplication = await this.db.insert(jobApplications)
      .values({
        jobId: applicationData.jobPostId,
        talentId: talentProfile[0].id,
        coverLetter: applicationData.coverLetter,
        selectedMedia: applicationData.portfolioItems || [],
        additionalNotes: undefined,
        status: 'PENDING',
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
      talentId: talentProfiles.id,
      talentFirstName: talentProfiles.firstName,
      talentLastName: talentProfiles.lastName,
      talentDisplayName: talentProfiles.displayName,
      talentProfileImage: talentProfiles.profileImage,
      talentCity: talentProfiles.city,
      talentSpecialties: talentProfiles.specialties,
      talentExperience: talentProfiles.experience,
    })
      .from(jobApplications)
      .leftJoin(talentProfiles, eq(jobApplications.talentId, talentProfiles.id))
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
      applicationDeadline: jobPosts.applicationDeadline,
      agencyCompanyName: agencyProfiles.companyName,
    })
      .from(jobApplications)
      .leftJoin(jobPosts, eq(jobApplications.jobId, jobPosts.id))
      .leftJoin(agencyProfiles, eq(jobPosts.agencyId, agencyProfiles.id))
      .leftJoin(talentProfiles, eq(jobApplications.talentId, talentProfiles.id))
      .where(eq(talentProfiles.userId, userId))
      .orderBy(desc(jobApplications.createdAt as any))
      .limit(limit)
      .offset(offset);

    return applications;
  }

  async getMyJobPosts(userId: string, page = 1, limit = 20) {
    const offset = (page - 1) * limit;

    const agency = await this.db.select().from(agencyProfiles).where(eq(agencyProfiles.userId, userId)).limit(1);
    if (!agency.length) {
      return [];
    }

    const jobPostsList = await this.db.select()
      .from(jobPosts)
      .where(and(
        eq(jobPosts.agencyId, agency[0].id),
        sql`${jobPosts.status} != 'CANCELLED'`
      ))
      .orderBy(desc(jobPosts.createdAt))
      .limit(limit)
      .offset(offset);

    return jobPostsList;
  }
}

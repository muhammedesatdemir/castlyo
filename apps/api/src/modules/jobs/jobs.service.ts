import { 
  Injectable, 
  Inject, 
  NotFoundException, 
  ForbiddenException, 
  BadRequestException 
} from '@nestjs/common';
import { eq, and, desc, sql, gte, lte, ilike, or } from 'drizzle-orm';
import { DATABASE_CONNECTION } from '../../config/database.module';
import { 
  users,
  agencyProfiles,
  talentProfiles
} from '@packages/database/schema/users';
import { 
  jobPosts,
  jobApplications,
  jobViews
} from '@packages/database/schema/jobs';
import { 
  CreateJobPostDto, 
  UpdateJobPostDto,
  CreateJobApplicationDto,
  UpdateJobApplicationDto
} from './dto/job.dto';
import type { Database } from '@packages/database';

interface JobSearchFilters {
  category?: string;
  talentType?: string;
  location?: string;
  budgetMin?: number;
  budgetMax?: number;
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
        budgetRange: jobData.budgetMin && jobData.budgetMax 
          ? `${jobData.budgetMin}-${jobData.budgetMax} ${jobData.currency || 'TRY'}`
          : undefined,
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
    const jobPost = await this.db.select()
      .from(jobPosts)
      .where(and(
        eq(jobPosts.id, jobId),
        eq(jobPosts.userId, userId)
      ))
      .limit(1);

    if (!jobPost.length) {
      throw new NotFoundException('Job post not found');
    }

    if (jobPost[0].status === 'PUBLISHED') {
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

  async getJobPosts(filters: JobSearchFilters, page = 1, limit = 20) {
    let query = this.db.select({
      id: jobPosts.id,
      title: jobPosts.title,
      description: jobPosts.description,
      category: jobPosts.category,
      talentType: jobPosts.talentType,
      location: jobPosts.location,
      budgetMin: jobPosts.budgetMin,
      budgetMax: jobPosts.budgetMax,
      currency: jobPosts.currency,
      applicationDeadline: jobPosts.applicationDeadline,
      isUrgent: jobPosts.isUrgent,
      isFeatured: jobPosts.isFeatured,
      views: jobPosts.views,
      applicationCount: jobPosts.applicationCount,
      publishedAt: jobPosts.publishedAt,
      images: jobPosts.images,
      agency: {
        companyName: agencyProfiles.companyName,
        logo: agencyProfiles.logo,
        isVerified: agencyProfiles.isVerified,
      }
    })
      .from(jobPosts)
      .leftJoin(agencyProfiles, eq(jobPosts.userId, agencyProfiles.userId))
      .where(eq(jobPosts.status, 'PUBLISHED'));

    // Apply filters
    const conditions = [eq(jobPosts.status, 'PUBLISHED')];

    if (filters.category) {
      conditions.push(eq(jobPosts.category, filters.category));
    }

    if (filters.talentType) {
      conditions.push(eq(jobPosts.talentType, filters.talentType));
    }

    if (filters.location) {
      conditions.push(ilike(jobPosts.location, `%${filters.location}%`));
    }

    if (filters.budgetMin) {
      conditions.push(gte(jobPosts.budgetMin, filters.budgetMin));
    }

    if (filters.budgetMax) {
      conditions.push(lte(jobPosts.budgetMax, filters.budgetMax));
    }

    if (filters.isUrgent) {
      conditions.push(eq(jobPosts.isUrgent, true));
    }

    if (filters.isFeatured) {
      conditions.push(eq(jobPosts.isFeatured, true));
    }

    if (filters.search) {
      conditions.push(
        or(
          ilike(jobPosts.title, `%${filters.search}%`),
          ilike(jobPosts.description, `%${filters.search}%`)
        )
      );
    }

    if (conditions.length > 1) {
      query = query.where(and(...conditions));
    }

    // Order by featured first, then urgent, then by published date
    query = query.orderBy(
      desc(jobPosts.isFeatured),
      desc(jobPosts.isUrgent),
      desc(jobPosts.publishedAt)
    );

    // Apply pagination
    const offset = (page - 1) * limit;
    const results = await query.limit(limit).offset(offset);

    return results;
  }

  async getJobPost(jobId: string, viewerId?: string) {
    const jobPost = await this.db.select({
      ...jobPosts,
      agency: {
        companyName: agencyProfiles.companyName,
        logo: agencyProfiles.logo,
        isVerified: agencyProfiles.isVerified,
        city: agencyProfiles.city,
        description: agencyProfiles.description,
        website: agencyProfiles.website,
      }
    })
      .from(jobPosts)
      .leftJoin(agencyProfiles, eq(jobPosts.userId, agencyProfiles.userId))
      .where(eq(jobPosts.id, jobId))
      .limit(1);

    if (!jobPost.length) {
      throw new NotFoundException('Job post not found');
    }

    const post = jobPost[0];

    // Check if job is published or if viewer is the owner
    if (post.status !== 'PUBLISHED' && post.userId !== viewerId) {
      throw new ForbiddenException('Job post is not available');
    }

    // Increment view count if viewer is not the owner
    if (viewerId && viewerId !== post.userId) {
      // Record the view
      await this.db.insert(jobViews)
        .values({
          jobPostId: jobId,
          viewerId,
        })
        .onConflictDoNothing();

      // Update view count
      await this.db.update(jobPosts)
        .set({
          views: sql`${jobPosts.views} + 1`,
          updatedAt: new Date()
        })
        .where(eq(jobPosts.id, jobId));
    }

    return post;
  }

  async updateJobPost(jobId: string, userId: string, jobData: UpdateJobPostDto) {
    const existingJobPost = await this.db.select()
      .from(jobPosts)
      .where(and(
        eq(jobPosts.id, jobId),
        eq(jobPosts.userId, userId)
      ))
      .limit(1);

    if (!existingJobPost.length) {
      throw new NotFoundException('Job post not found');
    }

    const updatedJobPost = await this.db.update(jobPosts)
      .set({
        ...jobData,
        updatedAt: new Date()
      })
      .where(eq(jobPosts.id, jobId))
      .returning();

    return updatedJobPost[0];
  }

  async deleteJobPost(jobId: string, userId: string) {
    const existingJobPost = await this.db.select()
      .from(jobPosts)
      .where(and(
        eq(jobPosts.id, jobId),
        eq(jobPosts.userId, userId)
      ))
      .limit(1);

    if (!existingJobPost.length) {
      throw new NotFoundException('Job post not found');
    }

    // Soft delete by updating status
    await this.db.update(jobPosts)
      .set({
        status: 'DELETED',
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

    if (!jobPost.length || jobPost[0].status !== 'PUBLISHED') {
      throw new NotFoundException('Job post not found or not available');
    }

    // Check if application deadline has passed
    const deadline = new Date(jobPost[0].applicationDeadline);
    if (deadline < new Date()) {
      throw new BadRequestException('Application deadline has passed');
    }

    // Check if user has already applied
    const existingApplication = await this.db.select()
      .from(jobApplications)
      .where(and(
        eq(jobApplications.jobPostId, applicationData.jobPostId),
        eq(jobApplications.applicantId, userId)
      ))
      .limit(1);

    if (existingApplication.length > 0) {
      throw new BadRequestException('You have already applied to this job');
    }

    // TODO: Check application quota/entitlement here

    const newApplication = await this.db.insert(jobApplications)
      .values({
        ...applicationData,
        applicantId: userId,
        status: 'PENDING',
        portfolioItems: applicationData.portfolioItems || [],
      })
      .returning();

    // Update application count
    await this.db.update(jobPosts)
      .set({
        applicationCount: sql`${jobPosts.applicationCount} + 1`,
        updatedAt: new Date()
      })
      .where(eq(jobPosts.id, applicationData.jobPostId));

    return newApplication[0];
  }

  async getJobApplications(jobId: string, userId: string, page = 1, limit = 20) {
    // Verify that the user owns this job post
    const jobPost = await this.db.select()
      .from(jobPosts)
      .where(and(
        eq(jobPosts.id, jobId),
        eq(jobPosts.userId, userId)
      ))
      .limit(1);

    if (!jobPost.length) {
      throw new NotFoundException('Job post not found');
    }

    const offset = (page - 1) * limit;

    const applications = await this.db.select({
      id: jobApplications.id,
      status: jobApplications.status,
      coverLetter: jobApplications.coverLetter,
      expectedSalary: jobApplications.expectedSalary,
      availability: jobApplications.availability,
      appliedAt: jobApplications.appliedAt,
      reviewedAt: jobApplications.reviewedAt,
      notes: jobApplications.notes,
      talent: {
        id: talentProfiles.id,
        firstName: talentProfiles.firstName,
        lastName: talentProfiles.lastName,
        displayName: talentProfiles.displayName,
        profileImage: talentProfiles.profileImage,
        city: talentProfiles.city,
        specialties: talentProfiles.specialties,
        experience: talentProfiles.experience,
      }
    })
      .from(jobApplications)
      .leftJoin(talentProfiles, eq(jobApplications.applicantId, talentProfiles.userId))
      .where(eq(jobApplications.jobPostId, jobId))
      .orderBy(desc(jobApplications.appliedAt))
      .limit(limit)
      .offset(offset);

    return applications;
  }

  async updateJobApplication(applicationId: string, userId: string, updateData: UpdateJobApplicationDto) {
    // Check if the application exists and the user owns the related job post
    const application = await this.db.select({
      application: jobApplications,
      jobPost: jobPosts,
    })
      .from(jobApplications)
      .leftJoin(jobPosts, eq(jobApplications.jobPostId, jobPosts.id))
      .where(eq(jobApplications.id, applicationId))
      .limit(1);

    if (!application.length) {
      throw new NotFoundException('Application not found');
    }

    if (application[0].jobPost.userId !== userId) {
      throw new ForbiddenException('You can only update applications for your job posts');
    }

    const updatedApplication = await this.db.update(jobApplications)
      .set({
        ...updateData,
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
      expectedSalary: jobApplications.expectedSalary,
      availability: jobApplications.availability,
      appliedAt: jobApplications.appliedAt,
      reviewedAt: jobApplications.reviewedAt,
      notes: jobApplications.notes,
      jobPost: {
        id: jobPosts.id,
        title: jobPosts.title,
        category: jobPosts.category,
        location: jobPosts.location,
        applicationDeadline: jobPosts.applicationDeadline,
        agency: agencyProfiles.companyName,
      }
    })
      .from(jobApplications)
      .leftJoin(jobPosts, eq(jobApplications.jobPostId, jobPosts.id))
      .leftJoin(agencyProfiles, eq(jobPosts.userId, agencyProfiles.userId))
      .where(eq(jobApplications.applicantId, userId))
      .orderBy(desc(jobApplications.appliedAt))
      .limit(limit)
      .offset(offset);

    return applications;
  }

  async getMyJobPosts(userId: string, page = 1, limit = 20) {
    const offset = (page - 1) * limit;

    const jobPostsList = await this.db.select()
      .from(jobPosts)
      .where(and(
        eq(jobPosts.userId, userId),
        sql`${jobPosts.status} != 'DELETED'`
      ))
      .orderBy(desc(jobPosts.createdAt))
      .limit(limit)
      .offset(offset);

    return jobPostsList;
  }
}

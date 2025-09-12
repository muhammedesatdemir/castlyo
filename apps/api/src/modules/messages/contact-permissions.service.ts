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
  agencyProfiles,
  talentProfiles
} from '@castlyo/database/schema/users';
import { 
  jobPosts,
  jobApplications,
  applicationContactPermissions
} from '@castlyo/database/schema/jobs';
import { 
  CreateContactPermissionRequestDto,
  RespondToContactRequestDto
} from './dto/message.dto';
import type { Database } from '@castlyo/database';

@Injectable()
export class ContactPermissionsService {
  constructor(
    @Inject(DATABASE_CONNECTION) private readonly db: Database,
  ) {}

  async requestContactPermission(
    requesterId: string, 
    requestData: CreateContactPermissionRequestDto
  ) {
    // Get job application details
    const application = await this.db.select({
      application: jobApplications,
      job: jobPosts,
      talent: talentProfiles,
    })
      .from(jobApplications)
      .leftJoin(jobPosts, eq(jobApplications.jobId, jobPosts.id))
      .leftJoin(talentProfiles, eq(jobApplications.talentId, talentProfiles.id))
      .where(eq(jobApplications.id, requestData.jobApplicationId))
      .limit(1);

    if (!application.length) {
      throw new NotFoundException('Job application not found');
    }

    const { job, talent } = application[0];

    // Verify requester is the agency that owns the job
    if (job.agencyId !== requesterId) {
      throw new ForbiddenException('Only the job owner can request contact permissions');
    }

    // Check if permission request already exists
    const existingRequest = await this.db.select()
      .from(applicationContactPermissions)
      .where(eq(applicationContactPermissions.applicationId, requestData.jobApplicationId))
      .limit(1);

    if (existingRequest.length > 0) {
      throw new BadRequestException('Contact permission request already exists for this application');
    }

    // Create permission request
    const permissionRequest = await this.db.insert(applicationContactPermissions)
      .values({
        applicationId: requestData.jobApplicationId,
        agencyId: job.agencyId,
        talentId: talent.id,
        requestMessage: requestData.requestMessage,
        status: 'PENDING',
        expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days
      })
      .returning();

    // TODO: Send notification to talent about permission request

    return permissionRequest[0];
  }

  async respondToContactRequest(
    talentId: string,
    requestId: string,
    responseData: RespondToContactRequestDto
  ) {
    // Get permission request
    const permissionRequest = await this.db.select()
      .from(applicationContactPermissions)
      .where(eq(applicationContactPermissions.id, requestId))
      .limit(1);

    if (!permissionRequest.length) {
      throw new NotFoundException('Contact permission request not found');
    }

    const request = permissionRequest[0];

    // Verify request belongs to the talent
    if (request.talentId !== talentId) {
      throw new ForbiddenException('You can only respond to your own permission requests');
    }

    // Check if request is still pending
    if (request.status !== 'PENDING') {
      throw new BadRequestException('This request has already been responded to');
    }

    // Check if request has expired
    if (request.expiresAt && new Date() > request.expiresAt) {
      throw new BadRequestException('This request has expired');
    }

    // Update permission request
    const updatedRequest = await this.db.update(applicationContactPermissions)
      .set({
        status: responseData.status,
        responseMessage: responseData.responseMessage,
        respondedAt: new Date(),
        allowEmail: responseData.status === 'GRANTED',
        allowPhone: responseData.status === 'GRANTED',
        allowMessaging: responseData.status === 'GRANTED',
        updatedAt: new Date()
      })
      .where(eq(applicationContactPermissions.id, requestId))
      .returning();

    // TODO: Send notification to agency about response
    // TODO: If granted, create message thread

    return updatedRequest[0];
  }

  async getContactPermissions(userId: string, userRole: string, page = 1, limit = 20) {
    const offset = (page - 1) * limit;

    let query;
    
    if (userRole === 'AGENCY') {
      // Get requests made by this agency
      query = this.db.select({
        permission: contactPermissions,
        application: jobApplications,
        talent: {
          firstName: talentProfiles.firstName,
          lastName: talentProfiles.lastName,
          profileImage: talentProfiles.profileImage,
        }
      })
        .from(contactPermissions)
        .leftJoin(jobApplications, eq(contactPermissions.applicationId, jobApplications.id))
        .leftJoin(talentProfiles, eq(contactPermissions.talentId, talentProfiles.id))
        .where(eq(contactPermissions.agencyId, userId));
    } else if (userRole === 'TALENT') {
      // Get requests for this talent
      query = this.db.select({
        permission: contactPermissions,
        application: jobApplications,
        agency: {
          companyName: agencyProfiles.companyName,
          logo: agencyProfiles.logo,
          isVerified: agencyProfiles.isVerified,
        }
      })
        .from(contactPermissions)
        .leftJoin(jobApplications, eq(contactPermissions.applicationId, jobApplications.id))
        .leftJoin(agencyProfiles, eq(contactPermissions.agencyId, agencyProfiles.id))
        .where(eq(contactPermissions.talentId, userId));
    } else {
      throw new BadRequestException('Invalid user role');
    }

    const results = await query
      .orderBy(contactPermissions.createdAt)
      .limit(limit)
      .offset(offset);

    return results;
  }

  async getContactPermission(permissionId: string, userId: string) {
    const permission = await this.db.select({
      permission: contactPermissions,
      application: jobApplications,
      talent: talentProfiles,
      agency: agencyProfiles,
    })
      .from(contactPermissions)
      .leftJoin(jobApplications, eq(contactPermissions.applicationId, jobApplications.id))
      .leftJoin(talentProfiles, eq(contactPermissions.talentId, talentProfiles.id))
      .leftJoin(agencyProfiles, eq(contactPermissions.agencyId, agencyProfiles.id))
      .where(eq(contactPermissions.id, permissionId))
      .limit(1);

    if (!permission.length) {
      throw new NotFoundException('Contact permission not found');
    }

    const result = permission[0];

    // Verify user has access to this permission
    if (result.permission.agencyId !== userId && result.permission.talentId !== userId) {
      throw new ForbiddenException('You do not have access to this permission');
    }

    return result;
  }

  async checkContactPermission(agencyId: string, talentId: string): Promise<{
    hasPermission: boolean;
    permissionType: string[];
    expiresAt?: Date;
  }> {
    const permission = await this.db.select()
      .from(applicationContactPermissions)
      .where(
        and(
          eq(applicationContactPermissions.agencyId, agencyId),
          eq(applicationContactPermissions.talentId, talentId),
          eq(applicationContactPermissions.status, 'GRANTED')
        )
      )
      .limit(1);

    if (!permission.length) {
      return { hasPermission: false, permissionType: [] };
    }

    const perm = permission[0];

    // Check if permission has expired
    if (perm.expiresAt && new Date() > perm.expiresAt) {
      return { hasPermission: false, permissionType: [] };
    }

    const permissionTypes = [];
    if (perm.allowEmail) permissionTypes.push('email');
    if (perm.allowPhone) permissionTypes.push('phone');
    if (perm.allowMessaging) permissionTypes.push('messaging');

    return {
      hasPermission: true,
      permissionType: permissionTypes,
      expiresAt: perm.expiresAt,
    };
  }
}

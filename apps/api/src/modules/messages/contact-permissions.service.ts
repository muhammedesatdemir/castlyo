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
  agencyProfiles,
  talentProfiles,
  jobPosts,
  jobApplications,
  contactPermissions
} from '@castlyo/database';
import { 
  CreateContactPermissionRequestDto,
  RespondToContactRequestDto
} from './dto/message.dto';
import type { Database } from '@castlyo/database';

@Injectable()
export class ContactPermissionsService {
  constructor(
    @Inject('DRIZZLE') private readonly db: Database,
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
    const existingRequest = await this.db.select({ id: contactPermissions.id, status: contactPermissions.status })
      .from(contactPermissions)
      .where(eq(contactPermissions.applicationId, requestData.jobApplicationId))
      .limit(1);

    if (existingRequest.length > 0) {
      throw new BadRequestException('Contact permission request already exists for this application');
    }

    // Create permission request
    const permissionRequest = await this.db.insert(contactPermissions)
      .values({
        applicationId: requestData.jobApplicationId,
        agencyId: job.agencyId,
        talentId: talent.id,
        requestMessage: requestData.requestMessage,
        status: 'REQUESTED',
        // expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days - field doesn't exist in schema
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
    const permissionRequest = await this.db.select({ id: contactPermissions.id, status: contactPermissions.status, agencyId: contactPermissions.agencyId, talentId: contactPermissions.talentId })
      .from(contactPermissions)
      .where(eq(contactPermissions.id, requestId))
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
    if (request.status !== 'REQUESTED') {
      throw new BadRequestException('This request has already been responded to');
    }

    // Check if request has expired - field doesn't exist in schema
    // if (request.expiresAt && new Date() > request.expiresAt) {
    //   throw new BadRequestException('This request has expired');
    // }

    // Update permission request
    const updatedRequest = await this.db.update(contactPermissions)
      .set({
        status: responseData.status,
        // responseMessage: responseData.responseMessage, // field doesn't exist in schema
        // respondedAt: new Date(), // field doesn't exist in schema
        // allowEmail: responseData.status === 'GRANTED', // field doesn't exist in schema
        // allowPhone: responseData.status === 'GRANTED', // field doesn't exist in schema
        // allowMessaging: responseData.status === 'GRANTED', // field doesn't exist in schema
        updatedAt: new Date()
      })
      .where(eq(contactPermissions.id, requestId))
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
    const permission = await this.db.select({ id: contactPermissions.id, status: contactPermissions.status, agencyId: contactPermissions.agencyId, talentId: contactPermissions.talentId })
      .from(contactPermissions)
      .where(
        and(
          eq(contactPermissions.agencyId, agencyId),
          eq(contactPermissions.talentId, talentId),
          eq(contactPermissions.status, 'GRANTED')
        )
      )
      .limit(1);

    if (!permission.length) {
      return { hasPermission: false, permissionType: [] };
    }

    const perm = permission[0];

    // Check if permission has expired
    // if (perm.expiresAt && new Date() > perm.expiresAt) {
    //   return { hasPermission: false, permissionType: [] };
    // }

    const permissionTypes: string[] = [];
    if ((perm as any).granted) permissionTypes.push('contact');

    return {
      hasPermission: true,
      permissionType: permissionTypes,
      // expiresAt: perm.expiresAt, // field doesn't exist in schema
    };
  }
}

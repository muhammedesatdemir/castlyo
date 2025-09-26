import { Injectable, ForbiddenException, NotFoundException } from '@nestjs/common';
import { eq, and } from 'drizzle-orm';
import { db } from '@castlyo/database';
import { contactPermissions, users, talentProfiles, agencyProfiles } from '@castlyo/database';
import { AuditService } from './audit.service';

export interface ContactPermissionRequest {
  talentId: string;
  agencyId: string;
  applicationId: string;
  requestContext?: string;
  requestMessage?: string;
  ipAddress?: string;
  userAgent?: string;
}

export interface GrantPermissionRequest {
  permissionId: string;
  talentId: string;
  ipAddress?: string;
  userAgent?: string;
}

@Injectable()
export class PermissionsService {
  constructor(private auditService: AuditService) {}

  /**
   * Request permission to contact a talent
   */
  async requestContactPermission(request: ContactPermissionRequest) {
    // Check if agency is verified
    const agency = await db
      .select()
      .from(users)
      .leftJoin(agencyProfiles, eq(users.id, agencyProfiles.userId))
      .where(eq(users.id, request.agencyId))
      .limit(1);

    if (!agency.length) {
      throw new NotFoundException('Agency not found');
    }

    const agencyProfile = agency[0].agency_profiles;
    if (!agencyProfile?.isVerified) {
      await this.auditService.logAccessDenied(
        request.agencyId,
        'AGENCY',
        'TALENT_CONTACT',
        request.talentId,
        'Agency not verified - cannot request contact permissions',
        request.ipAddress,
        request.userAgent
      );
      
      throw new ForbiddenException(
        'Agency verification required. Please complete the verification process before contacting talents.'
      );
    }

    // Check if permission already exists
    const existingPermission = await db
      .select()
      .from(contactPermissions)
      .where(
        and(
          eq(contactPermissions.talentId, request.talentId),
          eq(contactPermissions.agencyId, request.agencyId)
        )
      )
      .limit(1);

    if (existingPermission.length > 0) {
      const permission = existingPermission[0];
      if (permission.granted) {
        return permission;
      }
      // If not granted, update the request
      const updated = await db
        .update(contactPermissions)
        .set({
          requestedAt: new Date(),
          requestContext: request.requestContext,
          requestMessage: request.requestMessage,
          ipAddress: request.ipAddress,
          userAgent: request.userAgent,
          updatedAt: new Date(),
        })
        .where(eq(contactPermissions.id, permission.id))
        .returning();

      // Log the permission request
      await this.auditService.log({
        userId: request.agencyId,
        userRole: 'AGENCY',
        action: 'CONTACT_REQUESTED',
        resource: 'TALENT_CONTACT',
        resourceId: request.talentId,
        targetUserId: request.talentId,
        details: JSON.stringify({
          context: request.requestContext,
          message: request.requestMessage,
        }),
        ipAddress: request.ipAddress,
        userAgent: request.userAgent,
      });

      return updated[0];
    }

    // Create new permission request
    const newPermission = await db
      .insert(contactPermissions)
      .values({
        applicationId: request.applicationId,
        talentId: request.talentId,
        agencyId: request.agencyId,
        granted: false,
        requestedAt: new Date(),
        requestContext: request.requestContext,
        requestMessage: request.requestMessage,
        ipAddress: request.ipAddress,
        userAgent: request.userAgent,
      })
      .returning();

    // Log the permission request
    await this.auditService.log({
      userId: request.agencyId,
      userRole: 'AGENCY',
      action: 'CONTACT_REQUESTED',
      resource: 'TALENT_CONTACT',
      resourceId: request.talentId,
      targetUserId: request.talentId,
      details: JSON.stringify({
        context: request.requestContext,
        message: request.requestMessage,
      }),
      ipAddress: request.ipAddress,
      userAgent: request.userAgent,
    });

    return newPermission[0];
  }

  /**
   * Grant permission for an agency to contact a talent
   */
  async grantContactPermission(request: GrantPermissionRequest) {
    const permission = await db
      .select()
      .from(contactPermissions)
      .where(eq(contactPermissions.id, request.permissionId))
      .limit(1);

    if (permission.length === 0) {
      throw new NotFoundException('Permission request not found');
    }

    const permissionRecord = permission[0];

    // Verify that the talent is granting their own permission
    if (permissionRecord.talentId !== request.talentId) {
      throw new ForbiddenException('You can only grant permissions for your own profile');
    }

    // Update permission to granted
    const updated = await db
      .update(contactPermissions)
      .set({
        granted: true,
        grantedAt: new Date(),
        updatedAt: new Date(),
      })
      .where(eq(contactPermissions.id, request.permissionId))
      .returning();

    // Log the permission grant
    await this.auditService.log({
      userId: request.talentId,
      userRole: 'TALENT',
      action: 'CONTACT_GRANTED',
      resource: 'TALENT_CONTACT',
      resourceId: request.talentId,
      targetUserId: permissionRecord.agencyId,
      details: JSON.stringify({
        permissionId: request.permissionId,
      }),
      ipAddress: request.ipAddress,
      userAgent: request.userAgent,
    });

    return updated[0];
  }

  /**
   * Revoke contact permission
   */
  async revokeContactPermission(permissionId: string, talentId: string, ipAddress?: string, userAgent?: string) {
    const permission = await db
      .select()
      .from(contactPermissions)
      .where(eq(contactPermissions.id, permissionId))
      .limit(1);

    if (permission.length === 0) {
      throw new NotFoundException('Permission not found');
    }

    const permissionRecord = permission[0];

    if (permissionRecord.talentId !== talentId) {
      throw new ForbiddenException('You can only revoke your own permissions');
    }

    const updated = await db
      .update(contactPermissions)
      .set({
        granted: false,
        revokedAt: new Date(),
        updatedAt: new Date(),
      })
      .where(eq(contactPermissions.id, permissionId))
      .returning();

    // Log the permission revocation
    await this.auditService.log({
      userId: talentId,
      userRole: 'TALENT',
      action: 'CONTACT_REVOKED',
      resource: 'TALENT_CONTACT',
      resourceId: talentId,
      targetUserId: permissionRecord.agencyId,
      details: JSON.stringify({
        permissionId,
      }),
      ipAddress,
      userAgent,
    });

    return updated[0];
  }

  /**
   * Check if an agency has permission to contact a talent
   */
  async hasContactPermission(talentId: string, agencyId: string): Promise<boolean> {
    const permission = await db
      .select()
      .from(contactPermissions)
      .where(
        and(
          eq(contactPermissions.talentId, talentId),
          eq(contactPermissions.agencyId, agencyId),
          eq(contactPermissions.granted, true)
        )
      )
      .limit(1);

    return permission.length > 0;
  }

  /**
   * Get all contact permissions for a talent
   */
  async getTalentPermissions(talentId: string) {
    return await db
      .select({
        id: contactPermissions.id,
        agencyId: contactPermissions.agencyId,
        granted: contactPermissions.granted,
        grantedAt: contactPermissions.grantedAt,
        requestedAt: contactPermissions.requestedAt,
        revokedAt: contactPermissions.revokedAt,
        requestContext: contactPermissions.requestContext,
        requestMessage: contactPermissions.requestMessage,
        // Include agency info
        agencyName: agencyProfiles.companyName,
        agencyLogo: agencyProfiles.logo,
      })
      .from(contactPermissions)
      .leftJoin(users, eq(contactPermissions.agencyId, users.id))
      .leftJoin(agencyProfiles, eq(users.id, agencyProfiles.userId))
      .where(eq(contactPermissions.talentId, talentId))
      .orderBy(contactPermissions.requestedAt);
  }

  /**
   * Get all permissions requested by an agency
   */
  async getAgencyPermissions(agencyId: string) {
    return await db
      .select({
        id: contactPermissions.id,
        talentId: contactPermissions.talentId,
        granted: contactPermissions.granted,
        grantedAt: contactPermissions.grantedAt,
        requestedAt: contactPermissions.requestedAt,
        revokedAt: contactPermissions.revokedAt,
        requestContext: contactPermissions.requestContext,
        requestMessage: contactPermissions.requestMessage,
        // Include talent info
        talentName: talentProfiles.firstName,
        talentLastName: talentProfiles.lastName,
        talentImage: talentProfiles.profileImage,
      })
      .from(contactPermissions)
      .leftJoin(users, eq(contactPermissions.talentId, users.id))
      .leftJoin(talentProfiles, eq(users.id, talentProfiles.userId))
      .where(eq(contactPermissions.agencyId, agencyId))
      .orderBy(contactPermissions.requestedAt);
  }
}

import { Injectable } from '@nestjs/common';
import { eq, desc, or } from 'drizzle-orm';
import { db } from '@castlyo/database';
import { auditLogs } from '@castlyo/database/schema';

export interface AuditLogEntry {
  userId: string;
  userRole: 'TALENT' | 'AGENCY' | 'ADMIN';
  action: string;
  resource: string;
  resourceId?: string;
  targetUserId?: string;
  details?: string;
  ipAddress?: string;
  userAgent?: string;
  success?: boolean;
  errorMessage?: string;
}

@Injectable()
export class AuditService {
  /**
   * Log an audit event
   */
  async log(entry: AuditLogEntry) {
    try {
      await db.insert(auditLogs).values({
        userId: entry.userId,
        userRole: entry.userRole,
        action: entry.action,
        resource: entry.resource,
        resourceId: entry.resourceId,
        targetUserId: entry.targetUserId,
        details: entry.details,
        ipAddress: entry.ipAddress,
        userAgent: entry.userAgent,
        success: entry.success ?? true,
        errorMessage: entry.errorMessage,
      });
    } catch (error) {
      // Audit logging should not break the main application flow
      console.error('Failed to log audit event:', error);
    }
  }

  /**
   * Log successful data access
   */
  async logDataAccess(userId: string, userRole: 'TALENT' | 'AGENCY' | 'ADMIN', resource: string, resourceId: string, targetUserId?: string, ipAddress?: string, userAgent?: string) {
    await this.log({
      userId,
      userRole,
      action: 'DATA_ACCESSED',
      resource,
      resourceId,
      targetUserId,
      ipAddress,
      userAgent,
    });
  }

  /**
   * Log data sharing event
   */
  async logDataSharing(userId: string, userRole: 'TALENT' | 'AGENCY' | 'ADMIN', resource: string, resourceId: string, targetUserId: string, details?: string, ipAddress?: string, userAgent?: string) {
    await this.log({
      userId,
      userRole,
      action: 'DATA_SHARED',
      resource,
      resourceId,
      targetUserId,
      details,
      ipAddress,
      userAgent,
    });
  }

  /**
   * Log failed access attempt
   */
  async logAccessDenied(userId: string, userRole: 'TALENT' | 'AGENCY' | 'ADMIN', resource: string, resourceId: string, reason: string, ipAddress?: string, userAgent?: string) {
    await this.log({
      userId,
      userRole,
      action: 'ACCESS_DENIED',
      resource,
      resourceId,
      success: false,
      errorMessage: reason,
      ipAddress,
      userAgent,
    });
  }

  /**
   * Get audit logs for a user
   */
  async getUserAuditLogs(userId: string, limit = 50) {
    return await db
      .select()
      .from(auditLogs)
      .where(eq(auditLogs.userId, userId))
      .orderBy(desc(auditLogs.createdAt))
      .limit(limit);
  }

  /**
   * Get audit logs for data sharing activities
   */
  async getDataSharingLogs(limit = 100) {
    return await db
      .select()
      .from(auditLogs)
      .where(
        or(
          eq(auditLogs.action, 'DATA_SHARED'),
          eq(auditLogs.action, 'CONTACT_GRANTED'),
          eq(auditLogs.action, 'CONTACT_REQUESTED')
        )
      )
      .orderBy(desc(auditLogs.createdAt))
      .limit(limit);
  }
}

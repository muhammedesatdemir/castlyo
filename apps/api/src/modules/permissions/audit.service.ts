import { Injectable } from '@nestjs/common';
import { eq, desc, or } from 'drizzle-orm';
import { db } from '@castlyo/database';
import { auditLogs, auditActionEnum, auditEntityTypeEnum } from '@castlyo/database/schema/audit';

export interface AuditLogEntry {
  userId?: string;
  userEmail?: string;
  userRole?: string;
  action: typeof auditActionEnum.enumValues[number];
  entityType: typeof auditEntityTypeEnum.enumValues[number];
  entityId?: string;
  description?: string;
  oldValues?: any;
  newValues?: any;
  ipAddress?: string;
  userAgent?: string;
  metadata?: any;
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
        userEmail: entry.userEmail,
        userRole: entry.userRole,
        action: entry.action,
        entityType: entry.entityType,
        entityId: entry.entityId,
        description: entry.description,
        oldValues: entry.oldValues,
        newValues: entry.newValues,
        ipAddress: entry.ipAddress,
        userAgent: entry.userAgent,
        metadata: entry.metadata,
      });
    } catch (error) {
      // Audit logging should not break the main application flow
      console.error('Failed to log audit event:', error);
    }
  }

  /**
   * Log successful data access
   */
  async logDataAccess(userId: string, userRole: string, entityType: typeof auditEntityTypeEnum.enumValues[number], entityId: string, ipAddress?: string, userAgent?: string) {
    await this.log({
      userId,
      userRole,
      action: 'VIEW',
      entityType,
      entityId,
      ipAddress,
      userAgent,
    });
  }

  /**
   * Log data sharing event
   */
  async logDataSharing(userId: string, userRole: string, entityType: typeof auditEntityTypeEnum.enumValues[number], entityId: string, description?: string, ipAddress?: string, userAgent?: string) {
    await this.log({
      userId,
      userRole,
      action: 'DATA_SHARED',
      entityType,
      entityId,
      description,
      ipAddress,
      userAgent,
    });
  }

  /**
   * Log failed access attempt
   */
  async logAccessDenied(userId: string, userRole: string, entityType: typeof auditEntityTypeEnum.enumValues[number], entityId: string, reason: string, ipAddress?: string, userAgent?: string) {
    await this.log({
      userId,
      userRole,
      action: 'VIEW',
      entityType,
      entityId,
      description: `access_denied: ${reason}`,
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
      .orderBy(desc(auditLogs.performedAt))
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
      .orderBy(desc(auditLogs.performedAt))
      .limit(limit);
  }
}

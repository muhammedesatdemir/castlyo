import { Injectable, ForbiddenException, NotFoundException } from '@nestjs/common';
import { eq, and } from 'drizzle-orm';
import { db } from '@castlyo/database';
import { consentLogs, contactPermissions, users } from '@castlyo/database/schema';
import { AuditService } from '../permissions/audit.service';

export interface UpdateConsentRequest {
  userId: string;
  consentType: string;
  granted: boolean;
  ipAddress?: string;
  userAgent?: string;
}

export interface ConsentWithdrawalPolicy {
  consentType: string;
  canWithdraw: boolean;
  reason?: string;
  affectedServices: string[];
}

@Injectable()
export class ConsentService {
  constructor(private auditService: AuditService) {}

  /**
   * Update user consent
   */
  async updateConsent(request: UpdateConsentRequest) {
    // Check if consent type can be withdrawn
    const policy = this.getConsentWithdrawalPolicy(request.consentType);
    
    if (!request.granted && !policy.canWithdraw) {
      throw new ForbiddenException(policy.reason || 'This consent cannot be withdrawn');
    }

    // Log the consent change
    const consentLog = await db.insert(consentLogs).values({
      userId: request.userId,
      consentType: request.consentType,
      consentVersion: '1.0', // TODO: Get from config
      granted: request.granted,
      consentText: this.getConsentText(request.consentType),
      ipAddress: request.ipAddress,
      userAgent: request.userAgent,
      consentedAt: new Date(),
      revokedAt: request.granted ? null : new Date(),
    }).returning();

    // Log audit event
    await this.auditService.log({
      userId: request.userId,
      userRole: 'TALENT', // TODO: Get actual role
      action: request.granted ? 'CONSENT_GRANTED' : 'CONSENT_REVOKED',
      resource: 'USER_CONSENT',
      resourceId: request.userId,
      details: JSON.stringify({
        consentType: request.consentType,
        previousState: !request.granted,
        newState: request.granted,
        policy: policy,
      }),
      ipAddress: request.ipAddress,
      userAgent: request.userAgent,
    });

    // Handle side effects of consent withdrawal
    if (!request.granted) {
      await this.handleConsentWithdrawalSideEffects(request.userId, request.consentType);
    }

    return {
      success: true,
      consentLog: consentLog[0],
      policy,
    };
  }

  /**
   * Get consent withdrawal policy for a specific consent type
   */
  private getConsentWithdrawalPolicy(consentType: string): ConsentWithdrawalPolicy {
    const policies: Record<string, ConsentWithdrawalPolicy> = {
      KVKK: {
        consentType: 'KVKK',
        canWithdraw: false,
        reason: 'KVKK consent is required for platform usage. Please contact support to delete your account.',
        affectedServices: ['platform_usage'],
      },
      MARKETING: {
        consentType: 'MARKETING',
        canWithdraw: true,
        affectedServices: ['email_marketing', 'sms_marketing'],
      },
      COMMUNICATION: {
        consentType: 'COMMUNICATION',
        canWithdraw: true,
        affectedServices: ['job_notifications', 'platform_updates'],
      },
      DATA_SHARING: {
        consentType: 'DATA_SHARING',
        canWithdraw: true,
        affectedServices: ['profile_visibility', 'new_contact_permissions'],
      },
    };

    return policies[consentType] || {
      consentType,
      canWithdraw: false,
      reason: 'Unknown consent type',
      affectedServices: [],
    };
  }

  /**
   * Handle side effects when consent is withdrawn
   */
  private async handleConsentWithdrawalSideEffects(userId: string, consentType: string) {
    switch (consentType) {
      case 'DATA_SHARING':
        // When data sharing consent is withdrawn:
        // 1. Existing contact permissions remain valid (they were granted with explicit consent)
        // 2. But no NEW contact permissions can be granted
        // 3. Profile visibility might be restricted
        
        await this.auditService.log({
          userId,
          userRole: 'TALENT',
          action: 'DATA_SHARING_RESTRICTED',
          resource: 'USER_PROFILE',
          resourceId: userId,
          details: JSON.stringify({
            restriction: 'new_contact_permissions_blocked',
            existingPermissions: 'remain_valid',
            note: 'User withdrew data sharing consent - existing permissions remain valid but new ones blocked'
          }),
        });
        break;

      case 'MARKETING':
        // Stop all marketing communications
        await this.auditService.log({
          userId,
          userRole: 'TALENT',
          action: 'MARKETING_STOPPED',
          resource: 'USER_PREFERENCES',
          resourceId: userId,
          details: JSON.stringify({
            action: 'marketing_communications_stopped',
          }),
        });
        break;

      case 'COMMUNICATION':
        // Stop platform communications (except critical ones)
        await this.auditService.log({
          userId,
          userRole: 'TALENT',
          action: 'COMMUNICATION_RESTRICTED',
          resource: 'USER_PREFERENCES', 
          resourceId: userId,
          details: JSON.stringify({
            action: 'non_critical_communications_stopped',
          }),
        });
        break;
    }
  }

  /**
   * Get all user consents
   */
  async getUserConsents(userId: string) {
    const consents = await db
      .select()
      .from(consentLogs)
      .where(eq(consentLogs.userId, userId))
      .orderBy(consentLogs.consentedAt);

    // Group by consent type and get latest for each
    const latestConsents: Record<string, any> = {};
    
    for (const consent of consents) {
      if (!latestConsents[consent.consentType] || 
          consent.consentedAt > latestConsents[consent.consentType].consentedAt) {
        latestConsents[consent.consentType] = consent;
      }
    }

    return {
      current: latestConsents,
      history: consents,
    };
  }

  /**
   * Check if user has given specific consent
   */
  async hasConsent(userId: string, consentType: string): Promise<boolean> {
    const latestConsent = await db
      .select()
      .from(consentLogs)
      .where(
        and(
          eq(consentLogs.userId, userId),
          eq(consentLogs.consentType, consentType)
        )
      )
      .orderBy(consentLogs.consentedAt)
      .limit(1);

    return latestConsent.length > 0 && latestConsent[0].granted;
  }

  /**
   * Get consent text for a specific type
   */
  private getConsentText(consentType: string): string {
    const texts: Record<string, string> = {
      KVKK: 'KVKK Aydınlatma Metni kapsamında kişisel verilerimin işlenmesine onay veriyorum.',
      MARKETING: 'Pazarlama amaçlı e-posta ve SMS gönderilmesine onay veriyorum.',
      COMMUNICATION: 'Platform güncellemeleri ve iş fırsatları hakkında bilgilendirilmeye onay veriyorum.',
      DATA_SHARING: 'Profil bilgilerimin doğrulanmış ajanslarla paylaşılmasına onay veriyorum.',
    };

    return texts[consentType] || `${consentType} onayı`;
  }

  /**
   * Export user consent data
   */
  async exportUserConsentData(userId: string) {
    const consents = await this.getUserConsents(userId);
    
    const contactPerms = await db
      .select()
      .from(contactPermissions)
      .where(eq(contactPermissions.talentId, userId));

    return {
      userId,
      exportDate: new Date().toISOString(),
      consents: consents.current,
      consentHistory: consents.history,
      contactPermissions: contactPerms,
      policies: Object.keys(consents.current).map(type => 
        this.getConsentWithdrawalPolicy(type)
      ),
    };
  }
}

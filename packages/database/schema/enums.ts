import { pgEnum } from 'drizzle-orm/pg-core';

export const userRoleEnum = pgEnum('user_role', ['TALENT', 'AGENCY', 'ADMIN']);
export const userStatusEnum = pgEnum('user_status', ['PENDING', 'ACTIVE', 'SUSPENDED', 'DELETED']);
export const genderEnum = pgEnum('gender', ['MALE', 'FEMALE', 'OTHER']);
export const genderRequirementEnum = pgEnum('gender_requirement', ['ANY', 'MALE', 'FEMALE', 'OTHER']);
export const locationTypeEnum = pgEnum('location_type', ['ONSITE', 'REMOTE', 'HYBRID']);
export const jobTypeEnum = pgEnum('job_type', ['FULL_TIME', 'PART_TIME', 'CONTRACT', 'INTERN']);
export const experienceLevelEnum = pgEnum('exp_level', ['JUNIOR', 'MID', 'SENIOR', 'LEAD']);
export const jobStatusEnum = pgEnum('job_status', ['DRAFT', 'PUBLISHED', 'CLOSED']);

export const messageTypeEnum = pgEnum('message_type', ['TEXT', 'IMAGE', 'FILE', 'SYSTEM']);

export const permissionStatusEnum = pgEnum('perm_status', ['REQUESTED', 'GRANTED', 'DENIED', 'REVOKED']);

export const subscriptionPlanTypeEnum = pgEnum('plan_type', ['FREE', 'PRO', 'TEAM']);
export const subscriptionAudienceEnum = pgEnum('plan_audience', ['TALENT', 'AGENCY', 'BOTH']);
export const paymentProviderEnum = pgEnum('payment_provider', ['STRIPE', 'IYZICO', 'MOCK']);
export const paymentStatusEnum = pgEnum('payment_status', ['PENDING', 'SUCCEEDED', 'FAILED', 'REFUNDED']);

export const auditActionEnum = pgEnum('audit_action', [
  'CREATE', 'UPDATE', 'DELETE', 'LOGIN', 'LOGOUT', 'VIEW', 'DOWNLOAD', 'EXPORT',
  'DATA_SHARED', 'CONTACT_GRANTED', 'CONTACT_REQUESTED', 'CONTACT_REVOKED',
  'CONSENT_GRANTED', 'CONSENT_REVOKED',
  // legacy / consent.service needs:
  'DATA_SHARING_RESTRICTED', 'MARKETING_STOPPED', 'COMMUNICATION_RESTRICTED'
]);

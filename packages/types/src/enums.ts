// Centralized job status types and visibility/apply policies

export type JobStatus =
  | 'DRAFT'
  | 'PUBLISHED'
  | 'OPEN'
  | 'CLOSED'
  | 'CANCELLED';

export const JOB_PUBLIC_STATUSES: JobStatus[] = ['PUBLISHED', 'OPEN'];
export const JOB_APPLIABLE_STATUSES: JobStatus[] = ['PUBLISHED', 'OPEN'];



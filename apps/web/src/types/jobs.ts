// Job related types
export interface Job {
  id: string;
  agencyId: string;
  title: string;
  description: string;
  jobType: string;
  city?: string;
  status: string;
  expiresAt?: string;
  publishedAt?: string;
  createdAt: string;
  updatedAt: string;
  budgetRange?: string;
  ageMin?: number;
  ageMax?: number;
  maxApplications?: number;
  // API field names for salary and deadline
  salary_min?: number | null;
  salary_max?: number | null;
  currency?: string;
  application_deadline?: string | null;
  // Optional UI fields for backward compatibility
  category?: string;
  talentType?: string;
  location?: string;
  budgetMin?: number;
  budgetMax?: number;
  isUrgent?: boolean;
  isFeatured?: boolean;
  views?: number;
  applicationCount?: number;
  images?: string[];
  agency?: {
    companyName: string;
    logo?: string;
    isVerified: boolean;
  };
}

export interface JobsResponse {
  data: Job[];
  meta: {
    page: number;
    limit: number;
    total: number;
  };
}

export interface JobsQueryParams {
  page?: number;
  limit?: number;
  q?: string;
  city?: string;
  jobType?: string;
  status?: string;
}

// User flags from /users/me endpoint
export interface UsersMeFlags {
  id: string;
  email: string;
  phone?: string;
  role: 'AGENCY' | 'TALENT' | 'USER';
  status: string;
  emailVerified: boolean;
  createdAt: string;
  updatedAt: string;
  isAgencyProfileComplete: boolean;
  isTalentProfileComplete: boolean;
  canPostJobs: boolean;
  canApplyJobs: boolean;
}

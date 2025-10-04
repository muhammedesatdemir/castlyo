export type AgencyPublic = {
  id: string;
  name: string;
  city?: string | null;
  verified?: boolean | null;
  website?: string | null;
};

export type Job = {
  id: string;
  title: string;
  description: string;
  job_type: string;
  city?: string | null;
  application_deadline?: string | null;
  published_at?: string | null;
  salary_min?: number | null;
  salary_max?: number | null;
  currency?: string | null;
  status: 'PUBLISHED' | 'DRAFT' | 'CLOSED';
  agency_id: string;
  agency?: AgencyPublic;           // <- modal ve kartta kullanacağız
  isOwner?: boolean;               // <- API'den gelen sahiplik bilgisi
  // Additional fields that might come from API
  budget_min?: number | null;
  budget_max?: number | null;
  expiresAt?: string | null;
  location?: string | null;
};

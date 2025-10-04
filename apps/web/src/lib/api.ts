import axios from 'axios'
import { getSession } from 'next-auth/react'

// güvenli join
const join = (...parts: string[]) =>
  parts
    .map((p, i) => (i === 0 ? p.replace(/\/+$/,'') : p.replace(/^\/+|\/+$/g,'')))
    .filter(Boolean)
    .join('/');

const isServer = typeof window === 'undefined';

// API base URL: force proxy usage on the client by default
// Example env override: NEXT_PUBLIC_API_BASE_URL=/api/proxy/api/v1
const BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL ?? '/api/proxy/api/v1';

const PREFIX = ''; // No prefix needed, URL already includes /api/v1

// Create axios instance with proper API base URL
export const api = axios.create({
  baseURL: BASE_URL,
  timeout: 10000,
  withCredentials: true, // Include credentials for CORS
  headers: { "Content-Type": "application/json" },
});

// KRİTİK: Authorization header'ını asla ekleme
// Cookie tabanlı kimlik doğrulama kullan


// Response interceptor for error handling
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    if (error.response?.status === 401) {
      // Token expired, redirect to login
      if (typeof window !== 'undefined') {
        window.location.href = '/auth'
      }
    }
    return Promise.reject(error)
  }
)

// API functions
export const profileApi = {
  // Users
  getMe: () => api.get('/users/me'),
  updateMe: (data: any) => api.put('/users/me', data),

  // Talents
  getMyTalent: () => api.get('/profiles/talent/me'),
  createTalent: (data: any) => api.post('/profiles/talent', data),
  updateTalent: (id: string, data: any) => api.patch(`/profiles/talent/${id}`, data),
  
  // Profile endpoints
  getMyProfile: () => api.get('/profiles/me'),
  updateMyTalentProfile: (data: any) => api.put('/profiles/talent/me', data),
}

export const uploadApi = {
  // Get presigned URL for upload
  getPresignedUrl: (data: { fileName: string; fileType: string; folder: string }) => 
    api.post('/upload/presigned-url', data),
  
  // Delete file
  deleteFile: (fileUrl: string) => api.delete('/upload/file', { data: { fileUrl } }),
  
  // Get file info
  getFileInfo: (fileUrl: string) => api.get(`/upload/file-info?fileUrl=${encodeURIComponent(fileUrl)}`),
}

export const talentsApi = {
  // Get talents with filters  
  getTalents: (params?: any) => api.get('/talents', { params }),
}

export const jobsApi = {
  // Get job posts with filters
  getJobPosts: (params?: any) => api.get('/jobs', { params }),
  
  // Get single job post
  getJobPost: (id: string) => api.get(`/jobs/${id}`),
  
  // Create job post
  createJobPost: (data: any) => api.post('/jobs', data),
  
  // Update job post
  updateJobPost: (id: string, data: any) => api.put(`/jobs/${id}`, data),
  
  // Publish job post
  publishJobPost: (id: string) => api.put(`/jobs/${id}/publish`),
  
  // Delete job post
  deleteJobPost: (id: string) => api.delete(`/jobs/${id}`),
  
  // Get my job posts
  getMyJobPosts: (params?: any) => api.get('/jobs/my/posts', { params }),
  
  // Job Applications
  createJobApplication: (data: any) => api.post('/jobs/applications', data),
  
  // Get applications for a job (agency view)
  getJobApplications: (jobId: string, params?: any) => 
    api.get(`/jobs/${jobId}/applications`, { params }),
  
  // Update application status
  updateJobApplication: (id: string, data: any) => api.put(`/jobs/applications/${id}`, data),
  
  // Get my applications (talent view)
  getMyApplications: (params?: any) => api.get('/jobs/my/applications', { params }),
}
// New lightweight fetch wrapper aligned with direct API
export const API_BASE = process.env.NEXT_PUBLIC_API_BASE_URL ?? '/api/proxy/api/v1';

// KRİTİK: Token fonksiyonunu kaldırdık - cookie tabanlı kimlik doğrulama kullan

export async function apiFetch<T>(
  path: string,
  opts: RequestInit & { json?: any } = {}
): Promise<T> {
  const headers: Record<string, string> = {
    ...(opts.headers as Record<string, string>),
  };
  if (opts.json !== undefined && headers['Content-Type'] == null) {
    headers['Content-Type'] = 'application/json';
  }

  // KRİTİK: Authorization header'ını asla ekleme - cookie tabanlı kimlik doğrulama kullan

  const res = await fetch(`${API_BASE}${path}`, {
    ...opts,
    headers,
    body: opts.json !== undefined ? JSON.stringify(opts.json) : (opts.body as BodyInit | null | undefined),
    credentials: opts.credentials ?? 'include',
  });

  // 404'u "profil yok" olarak ele al - hata fırlatma
  if (res.status === 404) {
    return null as T;
  }
  
  if (!res.ok) {
    const text = await res.text().catch(() => '');
    const err: any = new Error(`HTTP ${res.status}: ${text || res.statusText}`);
    err.status = res.status;
    err.body = text;
    throw err;
  }
  if (res.status === 204) return undefined as unknown as T;
  const ct = res.headers.get('content-type') || '';
  if (!ct.includes('application/json')) return undefined as unknown as T;
  return (await res.json()) as T;
}

// API Guard function to check user email match
export async function guardApiUser(expectedEmail?: string) {
  if (!expectedEmail) return;
  
  try {
    const me = await fetch('/api/proxy/api/v1/users/me', { credentials: 'include' })
      .then(r => r.ok ? r.json() : null)
      .catch(() => null);

    if (me?.email && me.email !== expectedEmail) {
      // API'de başka user açık => logout + uyarı
      console.warn('[API Guard] Session mismatch detected:', { expected: expectedEmail, actual: me.email });
      await fetch('/api/proxy/api/v1/auth/logout', { method: 'POST', credentials: 'include' });
      throw new Error('Oturum uyuşmazlığı: Lütfen tekrar giriş yapın.');
    }
  } catch (error) {
    if (error instanceof Error && error.message.includes('Oturum uyuşmazlığı')) {
      throw error;
    }
    // Diğer hatalar için sessizce devam et
    console.warn('[API Guard] Failed to check user match:', error);
  }
}

// Profile API using fetch with proper endpoint structure
export const profileApiFetch = {
  // Load user's talent profile using the correct flow: /users/me -> /talents/:id
  async loadMyProfile() {
    const me = await apiFetch('/users/me') as any;
    if (!me?.id) throw new Error('Kullanıcı bulunamadı');

    if (me.talent_profile_id) {
      const profile = await apiFetch(`/talents/${me.talent_profile_id}`);
      if (!profile) throw new Error('Profil getirilemedi');
      return profile;
    }
    // profil yok -> FE'de boş form göster
    return null;
  },

  // Save user's talent profile using the correct flow
  async saveMyProfile(data: any) {
    const me = await apiFetch('/users/me') as any;
    if (!me?.id) throw new Error('Kullanıcı bulunamadı');

    if (me.talent_profile_id) {
      // Update existing profile
      const response = await apiFetch(`/talents/${me.talent_profile_id}`, {
        method: 'PATCH',
        json: data,
      });
      return response;
    } else {
      // Create new profile
      const response = await apiFetch('/talents', {
        method: 'POST',
        json: data,
      });
      return response;
    }
  },

  // Legacy methods for backward compatibility (will be deprecated)
  updateMyTalentProfile: (data: any) => apiFetch('/profiles/talent/me', { method: 'PUT', json: data }),
  getMyProfile: () => apiFetch('/profiles/me'),
};
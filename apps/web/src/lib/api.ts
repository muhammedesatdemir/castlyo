import axios from 'axios'
import { getSession } from 'next-auth/react'
import { toast } from '@/components/ui/toast'

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
    if (typeof window !== 'undefined') {
      const status = error?.response?.status
      const url: string | undefined = error?.config?.url
      if (!__SESSION_KILLED__ && (status === 401 || (status === 404 && isUsersMe(url)))) {
        killSessionAndRedirect('axios')
        return Promise.reject(new Error('SESSION_INVALID'))
      }
    }
    return Promise.reject(error)
  }
)

// Client-side auth cleanup utility
export function clearClientAuth() {
  try {
    if (typeof window !== 'undefined') {
      // 0) Sunucu logout'unu dene (httpOnly cookie'leri düşürür)
      try { fetch('/api/proxy/api/v1/auth/logout', { method: 'POST', credentials: 'include' }); } catch {}

      // 1) Bilinen anahtarlar
      const explicitKeys = [
        'role','accountType','isTalent',
        'talentProfileId','agencyProfileId',
        'onboardingRole','onboardingStep',
        'appliedJobs','appliedJobIds',
        'savedJobs','savedTalents','favorites',
        'nextauth.message','castlyo_notification_permission','ally-supports-cache',
        // legacy
        'accessToken','refreshToken','user','castlyo_user'
      ];
      explicitKeys.forEach((k) => { try { localStorage.removeItem(k); } catch {} });

      // 2) Heuristik: isimde belirli parçaları geçen TÜM anahtarları sil
      try {
        const patterns = /(zustand|apply|applied|basvur|favorite|saved|bookmark|profile|me:|user:|castlyo:)/i;
        for (let i = localStorage.length - 1; i >= 0; i--) {
          const k = localStorage.key(i) || '';
          if (patterns.test(k)) {
            try { localStorage.removeItem(k); } catch {}
          }
        }
      } catch {}

      // 3) Cache'leri boşalt
      try { (globalThis as any)?.queryClient?.clear?.(); } catch {}
      try {
        const { mutate } = require('swr');
        mutate((key: any) => typeof key === 'string' && key.includes('/users/me'), null, { revalidate: false });
      } catch {}

      // 4) Kill-switch sıfırla
      try { (globalThis as any).__SESSION_KILLED__ = false; } catch {}

      // 5) Görünür cookie'leri temizlemeyi dene (httpOnly olmayanlar)
      try {
        const cookieNames = document.cookie.split(';').map((c) => c.split('=')[0].trim());
        cookieNames.forEach((name) => {
          try { document.cookie = `${name}=; expires=Thu, 01 Jan 1970 00:00:00 GMT; path=/`; } catch {}
        });
      } catch {}
    }
  } catch {}
}

// Prefer '/auth' if available, otherwise known alternatives, fall back to '/'
let __SESSION_REDIRECTING__ = false;

export function redirectToAuth() {
  try {
    if (__SESSION_REDIRECTING__) return;
    __SESSION_REDIRECTING__ = true;

    const current = typeof window !== 'undefined' ? window.location.pathname : '/';
    const candidates = ['/auth', '/signin', '/giris', '/login', '/'];
    const target = candidates.find(Boolean) || '/';

    if (current === target) {
      __SESSION_REDIRECTING__ = false; // allow auth page to work normally
      return;
    }

    window.location.replace(target)
  } catch {
    try { window.location.replace('/') } catch {}
  }
}

// --- Global session kill-switch & helpers ---
export let __SESSION_KILLED__ = false;

function isUsersMe(url: string | undefined) {
  if (!url) return false;
  try {
    const clean = url.split('?')[0];
    return clean.endsWith('/users/me');
  } catch {
    return false;
  }
}

function killSessionAndRedirect(_reason?: string) {
  if (__SESSION_KILLED__) return;
  __SESSION_KILLED__ = true;
  try { clearClientAuth(); } catch {}
  try {
    toast.error(
      'Oturum geçersiz',
      'Hesabınız silinmiş olabilir veya oturum süresi doldu. Lütfen yeniden giriş yapın.',
      3000,
      'session-invalid'
    );
  } catch {}
  try { redirectToAuth(); } catch {}
}

// Axios request interceptor: short-circuit users/me when killed
api.interceptors.request.use((config) => {
  if (typeof window !== 'undefined') {
    if (__SESSION_KILLED__ && isUsersMe(config?.url as string | undefined)) {
      const err: any = new Error('SESSION_KILLED');
      (err as any).status = 401;
      throw err;
    }
  }
  return config;
});

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

  const url = `${API_BASE}${path}`
  if (typeof window !== 'undefined') {
    if (__SESSION_KILLED__ && isUsersMe(url)) {
      const e: any = new Error('SESSION_KILLED');
      (e as any).status = 401;
      throw e;
    }
  }

  const res = await fetch(url, {
    ...opts,
    headers,
    body: opts.json !== undefined ? JSON.stringify(opts.json) : (opts.body as BodyInit | null | undefined),
    credentials: opts.credentials ?? 'include',
  });

  // Global oturum kontrolü (yalnızca client)
  if (typeof window !== 'undefined') {
    if (!__SESSION_KILLED__ && (res.status === 401 || (url.endsWith('/users/me') && res.status === 404))) {
      killSessionAndRedirect('fetch')
      throw new Error('SESSION_INVALID')
    }
  }

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
import axios from 'axios'
import { getSession } from 'next-auth/react'

// güvenli join
const join = (...parts: string[]) =>
  parts
    .map((p, i) => (i === 0 ? p.replace(/\/+$/,'') : p.replace(/^\/+|\/+$/g,'')))
    .filter(Boolean)
    .join('/');

const isServer = typeof window === 'undefined';

// Use proxy for client-side requests, direct internal URL for server-side
const BASE_URL = isServer
  ? process.env.API_INTERNAL_URL ?? process.env.INTERNAL_API_URL ?? 'http://api:3001'
  : '/api/proxy'; // <-- YENİ: Tarayıcı tarafında proxy'yi kullan

const PREFIX = isServer ? '/api/v1' : ''; // <-- YENİ: Proxy path'i zaten /api/v1 içerecek

// Create axios instance with proper API base URL including prefix
export const api = axios.create({
  baseURL: isServer ? join(BASE_URL, PREFIX) : BASE_URL,
  timeout: 10000,
  withCredentials: true, // Include credentials for CORS
  headers: { "Content-Type": "application/json" },
});

// DEV: İstem dışı absolute URL'leri engelle
api.interceptors.request.use((cfg) => {
  // Her zaman relative path bekliyoruz
  if (/^https?:\/\//i.test(cfg.url || "")) {
    // localhost:3001 vb yakala
    if (cfg.url?.includes("localhost:3001")) {
      throw new Error("[API] Doğrudan :3001 çağrısı engellendi. /api/proxy kullanın.");
    }
  }
  return cfg;
});


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
  // Get my profile
  getMyProfile: () => api.get('/profiles/me'),
  
  // Create talent profile
  createTalentProfile: (data: any) => api.post('/profiles/talent', data),
  
  // Create agency profile
  createAgencyProfile: (data: any) => api.post('/profiles/agency', data),
  
  // Get talent profile by ID
  getTalentProfile: (id: string) => api.get(`/profiles/talent/${id}`),
  
  // Get agency profile by ID
  getAgencyProfile: (id: string) => api.get(`/profiles/agency/${id}`),
  
  // Update talent profile
  updateTalentProfile: (id: string, data: any) => api.put(`/profiles/talent/${id}`, data),
  
  // Update agency profile
  updateAgencyProfile: (id: string, data: any) => api.put(`/profiles/agency/${id}`, data),
  
  // Delete profile
  deleteProfile: (id: string) => api.delete(`/profiles/${id}`),
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

// Helper function for simple API calls through proxy
export async function apiFetch<T>(
  path: string,
  init: RequestInit = {}
): Promise<T> {
  const url = path.startsWith('/api/proxy')
    ? path
    : `/api/proxy${path.startsWith('/') ? '' : '/'}${path}`;

  const headers = new Headers(init.headers);
  if (!headers.has('Accept')) headers.set('Accept', 'application/json');
  if (init.body && !headers.has('Content-Type')) headers.set('Content-Type', 'application/json');

  const res = await fetch(url, { ...init, headers });

  const ct = res.headers.get('content-type') || '';
  if (!ct.includes('application/json')) {
    const text = await res.text(); // burada HTML'i asla UI'da göstermeyelim
    throw new Error(`Beklenmeyen yanıt (JSON değil). Status ${res.status}.`);
  }

  const data = await res.json();
  if (!res.ok) {
    const msg = (data?.message as string) || 'İstek başarısız';
    throw new Error(msg);
  }
  return data as T;
}
import axios from 'axios'
import { getSession } from 'next-auth/react'

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001'

// Create axios instance
export const api = axios.create({
  baseURL: API_BASE_URL,
  timeout: 10000,
})

// Request interceptor to add auth token
api.interceptors.request.use(
  async (config) => {
    const session = await getSession()
    if (session?.accessToken) {
      config.headers.Authorization = `Bearer ${session.accessToken}`
    }
    return config
  },
  (error) => {
    return Promise.reject(error)
  }
)

// Response interceptor for error handling
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    if (error.response?.status === 401) {
      // Token expired, redirect to login
      window.location.href = '/auth/signin'
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

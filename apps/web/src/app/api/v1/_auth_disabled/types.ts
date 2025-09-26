// Auth API Types - Standart Response Formatı

export interface AuthSuccessResponse<T = any> {
  success: true
  message: string
  data?: T
}

export interface AuthErrorResponse {
  success: false
  message: string
  errors?: string[]
  code?: string
}

export type AuthResponse<T = any> = AuthSuccessResponse<T> | AuthErrorResponse

// Request/Response DTOs
export interface RegisterRequest {
  email: string
  password: string
  passwordConfirm: string
  role: 'TALENT' | 'AGENCY'
  kvkkConsent: boolean
  termsConsent?: boolean
  marketingConsent?: boolean
  // Profile fields
  firstName?: string
  lastName?: string
  gender?: 'MALE' | 'FEMALE' | 'OTHER'
  city?: string
  experience?: 'BEGINNER' | 'AMATEUR' | 'SEMI_PRO' | 'PROFESSIONAL'
  specialties?: string[]
  languages?: string[]
}

export interface RegisterResponse {
  userId: string
  email: string
  emailVerificationRequired: true
}

export interface VerifyRequest {
  token: string
}

export interface VerifyResponse {
  userId: string
  email: string
  emailVerified: true
}

export interface LoginRequest {
  email: string
  password: string
}

export interface LoginResponse {
  user: {
    id: string
    email: string
    role: 'TALENT' | 'AGENCY'
    emailVerified: boolean
  }
  tokens: {
    accessToken: string
    refreshToken: string
    expiresAt: string
  }
}

export interface RefreshRequest {
  refreshToken: string
}

export interface RefreshResponse {
  accessToken: string
  expiresAt: string
}

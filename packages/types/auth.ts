import { z } from 'zod';

// User roles
export const UserRoleSchema = z.enum(['USER', 'TALENT', 'AGENCY', 'ADMIN', 'MODERATOR']);
export type UserRole = z.infer<typeof UserRoleSchema>;

// User status
export const UserStatusSchema = z.enum(['ACTIVE', 'INACTIVE', 'PENDING', 'SUSPENDED', 'VERIFIED']);
export type UserStatus = z.infer<typeof UserStatusSchema>;

// Login schema
export const LoginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(6),
  rememberMe: z.boolean().optional(),
});

export type LoginRequest = z.infer<typeof LoginSchema>;

// Register schema
export const RegisterSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8),
  confirmPassword: z.string().min(8),
  firstName: z.string().min(2),
  lastName: z.string().min(2),
  role: UserRoleSchema,
  acceptTerms: z.literal(true),
  acceptPrivacy: z.literal(true),
});

export type RegisterRequest = z.infer<typeof RegisterSchema>;

// User profile schema
export const UserProfileSchema = z.object({
  id: z.string().uuid(),
  email: z.string().email(),
  firstName: z.string(),
  lastName: z.string(),
  role: UserRoleSchema,
  status: UserStatusSchema,
  avatar: z.string().url().optional(),
  phone: z.string().optional(),
  dateOfBirth: z.date().optional(),
  bio: z.string().max(500).optional(),
  location: z.string().optional(),
  website: z.string().url().optional(),
  socialLinks: z.object({
    instagram: z.string().url().optional(),
    twitter: z.string().url().optional(),
    linkedin: z.string().url().optional(),
    youtube: z.string().url().optional(),
  }).optional(),
  isEmailVerified: z.boolean(),
  isPhoneVerified: z.boolean(),
  twoFactorEnabled: z.boolean(),
  createdAt: z.date(),
  updatedAt: z.date(),
});

export type UserProfile = z.infer<typeof UserProfileSchema>;

// JWT payload schema
export const JwtPayloadSchema = z.object({
  sub: z.string().uuid(),
  email: z.string().email(),
  role: UserRoleSchema,
  iat: z.number(),
  exp: z.number(),
});

export type JwtPayload = z.infer<typeof JwtPayloadSchema>;

// Refresh token schema
export const RefreshTokenSchema = z.object({
  token: z.string(),
  userId: z.string().uuid(),
  expiresAt: z.date(),
  isRevoked: z.boolean(),
});

export type RefreshToken = z.infer<typeof RefreshTokenSchema>;

// Password reset schema
export const PasswordResetSchema = z.object({
  email: z.string().email(),
});

export type PasswordResetRequest = z.infer<typeof PasswordResetSchema>;

// Password change schema
export const PasswordChangeSchema = z.object({
  currentPassword: z.string(),
  newPassword: z.string().min(8),
  confirmNewPassword: z.string().min(8),
});

export type PasswordChangeRequest = z.infer<typeof PasswordChangeSchema>;

// Two-factor authentication schema
export const TwoFactorSchema = z.object({
  code: z.string().length(6),
  rememberDevice: z.boolean().optional(),
});

export type TwoFactorRequest = z.infer<typeof TwoFactorSchema>;

// Auth response schema
export const AuthResponseSchema = z.object({
  user: UserProfileSchema,
  accessToken: z.string(),
  refreshToken: z.string(),
  expiresIn: z.number(),
});

export type AuthResponse = z.infer<typeof AuthResponseSchema>;

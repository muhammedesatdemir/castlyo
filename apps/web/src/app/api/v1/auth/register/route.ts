import { NextRequest } from 'next/server'
import { z } from 'zod'
import store from '@/lib/mock-store'
import {
  successResponse,
  errorResponse,
  validationErrorResponse,
  parseRequestBody,
  hashPassword,
  normalizeEmail,
  logAuthAction,
} from '../utils'
import type { RegisterResponse } from '../types'

// App Router runtime hints
export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

// Validation
const registerSchema = z
  .object({
    email: z.string().email().transform(normalizeEmail),
    password: z
      .string()
      .min(8, 'Şifre en az 8 karakter olmalı')
      .regex(/[A-Z]/, 'Şifre en az bir büyük harf içermeli')
      .regex(/[a-z]/, 'Şifre en az bir küçük harf içermeli')
      .regex(/[0-9]/, 'Şifre en az bir rakam içermeli'),
    passwordConfirm: z.string().min(8),
    role: z.enum(['TALENT', 'AGENCY']),
    kvkkConsent: z.boolean().refine((val) => val === true, 'KVKK onayı gerekli'),
    termsConsent: z.boolean().optional(),
    marketingConsent: z.boolean().optional(),
    // Profile fields
    firstName: z.string().optional(),
    lastName: z.string().optional(),
    gender: z.enum(['MALE', 'FEMALE', 'OTHER']).optional(),
    city: z.string().optional(),
    experience: z.enum(['BEGINNER', 'AMATEUR', 'SEMI_PRO', 'PROFESSIONAL']).optional(),
    specialties: z.array(z.string()).optional(),
    languages: z.array(z.string()).optional(),
  })
  .refine((data) => data.password === data.passwordConfirm, {
    message: 'Şifreler eşleşmiyor',
    path: ['passwordConfirm'],
  })

export async function POST(request: NextRequest) {
  logAuthAction('REGISTER_START')

  try {
    // Parse + validate
    const data = await parseRequestBody(request, registerSchema)
    logAuthAction('REGISTER_VALIDATED', data.email)

    // Duplicate email
    const existingUser = store.findUserByEmail(data.email)
    if (existingUser) {
      logAuthAction('REGISTER_DUPLICATE', data.email)
      return errorResponse('Bu e-posta adresi zaten kayıtlı', 409, undefined, 'EMAIL_EXISTS')
    }

    // Hash pwd
    const passwordHash = await hashPassword(data.password)
    logAuthAction('REGISTER_PASSWORD_HASHED', data.email)

    // Create user in mock store (or swap here with real API later)
    const user = store.createUser({
      email: data.email,
      passwordHash,
      role: data.role,
      emailVerified: false,
      firstName: data.firstName,
      lastName: data.lastName,
      gender: data.gender,
      city: data.city,
      experience: data.experience,
      specialties: data.specialties,
      languages: data.languages,
    })

    // Create verification token (24h)
    const { url } = store.createVerificationToken(user.id, 24 * 60 * 60 * 1000)

    logAuthAction('REGISTER_SUCCESS', data.email, {
      userId: user.id,
      verificationUrl: url,
    })

    // Response
    const responseData: RegisterResponse = {
      userId: user.id,
      email: user.email,
      emailVerificationRequired: true,
    }

    return successResponse('Kayıt başarılı! E-posta adresinizi kontrol edin.', responseData)
  } catch (error: any) {
    logAuthAction('REGISTER_ERROR', undefined, { error: error.message })

    if (error instanceof z.ZodError) {
      return validationErrorResponse(error)
    }

    if (error.message?.includes('Content-Type') || error.message?.includes('JSON')) {
      return errorResponse('Geçersiz istek formatı', 400, undefined, 'INVALID_FORMAT')
    }

    return errorResponse('Kayıt işlemi sırasında bir hata oluştu', 500, undefined, 'INTERNAL_ERROR')
  }
}

// CORS support
export async function OPTIONS() {
  const origin = process.env.WEB_ORIGIN || '*'
  return new Response(null, {
    status: 204,
    headers: {
      'Access-Control-Allow-Origin': origin,
      'Access-Control-Allow-Methods': 'POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization',
      'Cache-Control': 'no-store',
    },
  })
}

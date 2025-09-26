import { NextRequest } from 'next/server'
import { z } from 'zod'
import store from '@/lib/mock-store'
import {
  successResponse,
  errorResponse,
  validationErrorResponse,
  parseRequestBody,
  comparePassword,
  generateAccessToken,
  generateRefreshToken,
  normalizeEmail,
  logAuthAction
} from '../utils'
import type { LoginRequest, LoginResponse } from '../types'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

// Login schema
const loginSchema = z.object({
  email: z.string().email().transform(normalizeEmail),
  password: z.string().min(1, 'Şifre gerekli')
})

export async function POST(request: NextRequest) {
  logAuthAction('LOGIN_START')

  try {
    // Parse and validate request
    const data = await parseRequestBody(request, loginSchema)
    logAuthAction('LOGIN_VALIDATED', data.email)

    // Find user
    const user = store.findUserByEmail(data.email)
    if (!user) {
      logAuthAction('LOGIN_USER_NOT_FOUND', data.email)
      return errorResponse('E-posta adresi veya şifre hatalı', 401, undefined, 'INVALID_CREDENTIALS')
    }

    // Check if email is verified
    if (!user.emailVerified) {
      logAuthAction('LOGIN_EMAIL_NOT_VERIFIED', data.email)
      return errorResponse('E-posta adresinizi doğrulamanız gerekiyor', 403, undefined, 'EMAIL_NOT_VERIFIED')
    }

    // Check password
    const passwordValid = await comparePassword(data.password, user.passwordHash)
    if (!passwordValid) {
      logAuthAction('LOGIN_INVALID_PASSWORD', data.email)
      return errorResponse('E-posta adresi veya şifre hatalı', 401, undefined, 'INVALID_CREDENTIALS')
    }

    // Generate tokens
    const accessToken = generateAccessToken({
      userId: user.id,
      email: user.email,
      role: user.role
    })

    const refreshToken = generateRefreshToken({
      userId: user.id
    })

    // Calculate expiration
    const expiresAt = new Date(Date.now() + 60 * 60 * 1000) // 1 hour from now

    logAuthAction('LOGIN_SUCCESS', user.email, { userId: user.id })

    // Response
    const responseData: LoginResponse = {
      user: {
        id: user.id,
        email: user.email,
        role: user.role,
        emailVerified: user.emailVerified
      },
      tokens: {
        accessToken,
        refreshToken,
        expiresAt: expiresAt.toISOString()
      }
    }

    return successResponse('Giriş başarılı!', responseData)

  } catch (error: any) {
    logAuthAction('LOGIN_ERROR', undefined, { error: error.message })

    if (error instanceof z.ZodError) {
      return validationErrorResponse(error)
    }

    if (error.message.includes('Content-Type') || error.message.includes('JSON')) {
      return errorResponse('Geçersiz istek formatı', 400, undefined, 'INVALID_FORMAT')
    }

    return errorResponse('Giriş sırasında bir hata oluştu', 500, undefined, 'INTERNAL_ERROR')
  }
}

// CORS support
export async function OPTIONS() {
  return new Response(null, {
    status: 204,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization',
      'Cache-Control': 'no-store',
    },
  })
}

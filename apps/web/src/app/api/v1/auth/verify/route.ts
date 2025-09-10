import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import store from '@/lib/mock-store'
import {
  successResponse,
  errorResponse,
  validationErrorResponse,
  parseRequestBody,
  logAuthAction
} from '../utils'
import type { VerifyRequest, VerifyResponse } from '../types'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

// Verify schema
const verifySchema = z.object({
  token: z.string().min(1, 'Token gerekli')
})

export async function POST(request: NextRequest) {
  logAuthAction('VERIFY_START')

  try {
    // Parse and validate request
    const data = await parseRequestBody(request, verifySchema)
    logAuthAction('VERIFY_TOKEN_RECEIVED', undefined, { tokenLength: data.token.length })

    // Consume verification token (raw)
    const result = store.consumeVerificationToken(data.token)

    if (!result.ok) {
      const reasonMap: Record<string, string> = {
        not_found: 'Geçersiz doğrulama linki',
        expired: 'Süresi dolmuş doğrulama linki',
        used: 'Bu link daha önce kullanılmış',
      }
      
      logAuthAction('VERIFY_TOKEN_INVALID', undefined, { reason: result.reason })
      return errorResponse(reasonMap[result.reason] || 'Doğrulama hatası', 400, undefined, 'INVALID_TOKEN')
    }

    // Find user by ID and update email verification
    const users = Array.from(store.users.values())
    const user = users.find(u => u.id === result.userId)
    
    if (!user) {
      logAuthAction('VERIFY_USER_NOT_FOUND', undefined, { userId: result.userId })
      return errorResponse('Kullanıcı bulunamadı', 400, undefined, 'USER_NOT_FOUND')
    }

    // Update user email verification
    const updated = store.updateUserEmailVerified(user.email, true)
    if (!updated) {
      logAuthAction('VERIFY_UPDATE_FAILED', user.email)
      return errorResponse('E-posta doğrulama güncelleme hatası', 500, undefined, 'UPDATE_FAILED')
    }

    logAuthAction('VERIFY_SUCCESS', user.email, { userId: user.id })

    // Response
    const responseData: VerifyResponse = {
      userId: user.id,
      email: user.email,
      emailVerified: true
    }

    return successResponse('E-posta adresiniz başarıyla doğrulandı!', responseData)

  } catch (error: any) {
    logAuthAction('VERIFY_ERROR', undefined, { error: error.message })

    if (error instanceof z.ZodError) {
      return validationErrorResponse(error)
    }

    if (error.message.includes('Content-Type') || error.message.includes('JSON')) {
      return errorResponse('Geçersiz istek formatı', 400, undefined, 'INVALID_FORMAT')
    }

    return errorResponse('E-posta doğrulama sırasında bir hata oluştu', 500, undefined, 'INTERNAL_ERROR')
  }
}

// GET support for email links
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const token = searchParams.get('token')

  if (!token) {
    return errorResponse('Token parametresi gerekli', 400, undefined, 'MISSING_TOKEN')
  }

  // Forward to POST with token in body
  return POST(new NextRequest(request.url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ token })
  }))
}

// CORS support
export async function OPTIONS() {
  return new Response(null, {
    status: 204,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'POST, GET, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization',
      'Cache-Control': 'no-store',
    },
  })
}
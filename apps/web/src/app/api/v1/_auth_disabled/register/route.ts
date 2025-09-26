import { NextRequest, NextResponse } from 'next/server'
import type { ApiResult } from '@/lib/api-types'
import { API_BASE_URL } from '@/lib/config'

// App Router runtime hints
export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'


export async function POST(request: NextRequest) {
  try {
    // Parse and validate request body
    const data = await request.json()
    
    // Basic validation for required fields
    if (!data.email || !data.password || !data.passwordConfirm || !data.role) {
      return NextResponse.json<ApiResult>(
        { success: false, ok: false, message: 'Eksik alanlar var. Lütfen tüm alanları doldurun.' },
        { status: 400 }
      )
    }

    // Check required consents
    if (!data.kvkkConsent || !data.termsConsent) {
      return NextResponse.json<ApiResult>(
        { success: false, ok: false, message: 'KVKK ve Kullanım Şartlarını kabul etmeniz gerekmektedir.' },
        { status: 400 }
      )
    }

    // Call API to register user
    let registerResponse: Response
    try {
      registerResponse = await fetch(`${API_BASE_URL}/auth/register`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
        cache: 'no-store',
      })
    } catch (e: any) {
      // Buraya düşüyorsa "fetch failed" network hatasıdır.
      console.error('[register] fetch error ->', e?.message)
      return NextResponse.json<ApiResult>(
        { success: false, ok: false, message: 'Sunucuya bağlanılamadı. API çalışıyor mu?' },
        { status: 502 }
      )
    }

    const apiResult = await registerResponse.json().catch(() => ({}))

    if (!registerResponse.ok) {
      // Map API errors to user-friendly messages
      const message = apiResult?.message || 
        (registerResponse.status === 409 ? 'Bu e-posta adresi zaten kayıtlı.' : 'Kayıt işlemi sırasında bir hata oluştu')

      return NextResponse.json<ApiResult>(
        { success: false, ok: false, message },
        { status: registerResponse.status }
      )
    }

    // Success response
    return NextResponse.json<ApiResult>(
      {
        success: true,
        ok: true,
        message: apiResult?.message || 'Kayıt başarılı. Lütfen e-posta doğrulamasını tamamlayın.',
        data: {
          userId: apiResult?.data?.userId ?? apiResult?.userId,
          email: data.email,
          emailVerificationRequired: apiResult?.data?.emailVerificationRequired ?? apiResult?.emailVerificationRequired ?? true,
        },
      },
      { status: 200 }
    )
  } catch (e: any) {
    return NextResponse.json<ApiResult>(
      { success: false, ok: false, message: e?.message || 'Sunucu hatası' },
      { status: 500 }
    )
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

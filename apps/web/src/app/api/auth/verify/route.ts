import { NextRequest, NextResponse } from 'next/server'
import * as crypto from 'crypto'
import mockStore from '@/lib/mock-store'

export const runtime = 'nodejs'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const token = searchParams.get('token')
    
    console.log(`[VERIFY ROUTE] Starting verification process`)
    if ((mockStore as any)?.dev?.stats) {
      console.log(`[VERIFY ROUTE] Mock Store Stats:`, (mockStore as any).dev.stats());
    }
    
    if (!token) {
      console.log(`[VERIFY ROUTE] No token provided`)
      const loginUrl = new URL('/auth', request.url)
      loginUrl.searchParams.set('verified', 'false')
      loginUrl.searchParams.set('message', 'Doğrulama token\'ı eksik.')
      return NextResponse.redirect(loginUrl)
    }
    
    console.log(`[VERIFY ROUTE] Processing verification token: ${token.substring(0, 8)}...`)
    
    // Hash the token to check against stored hash
    const tokenHash = crypto.createHash('sha256').update(token).digest('hex')
    
    // Look up token in mock store
    const tokenRecord = mockStore.tokens.findByHash(tokenHash)
    
    if (!tokenRecord) {
      console.log(`[VERIFY ROUTE] Token not found: ${token.substring(0, 8)}...`)
      const loginUrl = new URL('/auth', request.url)
      loginUrl.searchParams.set('verified', 'false')
      loginUrl.searchParams.set('message', 'Geçersiz veya kullanılmış doğrulama linki.')
      return NextResponse.redirect(loginUrl)
    }
    
    if (tokenRecord.used) {
      console.log(`[VERIFY ROUTE] Token already used: ${token.substring(0, 8)}...`)
      const loginUrl = new URL('/auth', request.url)
      loginUrl.searchParams.set('verified', 'false')
      loginUrl.searchParams.set('message', 'Bu doğrulama linki daha önce kullanılmış.')
      return NextResponse.redirect(loginUrl)
    }
    
    if (tokenRecord.expiresAt < new Date()) {
      console.log(`[VERIFY ROUTE] Token expired: ${token.substring(0, 8)}...`)
      const loginUrl = new URL('/auth', request.url)
      loginUrl.searchParams.set('verified', 'false')
      loginUrl.searchParams.set('message', 'Doğrulama linkinin süresi dolmuş. Yeni bir doğrulama isteyin.')
      return NextResponse.redirect(loginUrl)
    }
    
    // Find user by token's userId
    const users = mockStore.users.list()
    const user = users.find(u => u.id === tokenRecord.userId)
    
    if (!user) {
      console.log(`[VERIFY ROUTE] User not found for token: ${tokenRecord.userId}`)
      const loginUrl = new URL('/auth', request.url)
      loginUrl.searchParams.set('verified', 'false')
      loginUrl.searchParams.set('message', 'Kullanıcı bulunamadı.')
      return NextResponse.redirect(loginUrl)
    }
    
    // Update user verification status
    const updated = mockStore.users.updateEmailVerified(user.email, true)
    if (updated) {
      // Mark token as used
      mockStore.tokens.markAsUsed(tokenHash)
      
      console.log(`[VERIFY ROUTE] ✅ User verified successfully: ${user.email}`)
      if ((mockStore as any)?.dev?.stats) {
        console.log(`[VERIFY ROUTE] 📊 Mock Store Stats:`, (mockStore as any).dev.stats());
      }
      
      // Redirect to login page with success message
      const loginUrl = new URL('/auth', request.url)
      loginUrl.searchParams.set('verified', 'true')
      loginUrl.searchParams.set('message', 'E-posta adresiniz başarıyla doğrulandı! Şimdi giriş yapabilirsiniz.')
      
      return NextResponse.redirect(loginUrl)
    } else {
      console.log(`[VERIFY ROUTE] Failed to update user: ${user.email}`)
      const loginUrl = new URL('/auth', request.url)
      loginUrl.searchParams.set('verified', 'false')
      loginUrl.searchParams.set('message', 'Doğrulama sırasında bir hata oluştu.')
      return NextResponse.redirect(loginUrl)
    }
    
  } catch (error) {
    console.error('[VERIFY ROUTE] Error:', error)
    
    const loginUrl = new URL('/auth', request.url)
    loginUrl.searchParams.set('verified', 'false')
    loginUrl.searchParams.set('message', 'Doğrulama sırasında bir hata oluştu.')
    
    return NextResponse.redirect(loginUrl)
  }
}

// POST endpoint for API-style verification
export async function POST(request: NextRequest) {
  try {
    const { token } = await request.json() as { token?: string }
    
    if (!token) {
      return NextResponse.json({ ok: false, message: 'Token yok' }, { status: 400 })
    }
    
    console.log(`[VERIFY API] Processing token: ${token.substring(0, 8)}...`)
    if ((mockStore as any)?.dev?.stats) {
      console.log(`[VERIFY API] Mock Store Stats:`, (mockStore as any).dev.stats());
    }
    
    const tokenHash = crypto.createHash('sha256').update(token).digest('hex')
    
    // Look up token in mock store
    const tokenRecord = mockStore.tokens.findByHash(tokenHash)
    
    if (!tokenRecord) {
      console.log(`[VERIFY API] Token not found: ${token.substring(0, 8)}...`)
      return NextResponse.json({ ok: false, message: 'Geçersiz veya kullanılmış doğrulama token\'ı' }, { status: 400 })
    }
    
    if (tokenRecord.used) {
      console.log(`[VERIFY API] Token already used: ${token.substring(0, 8)}...`)
      return NextResponse.json({ ok: false, message: 'Bu doğrulama token\'ı daha önce kullanılmış' }, { status: 400 })
    }
    
    if (tokenRecord.expiresAt < new Date()) {
      console.log(`[VERIFY API] Token expired: ${token.substring(0, 8)}...`)
      return NextResponse.json({ ok: false, message: 'Doğrulama token\'ının süresi dolmuş' }, { status: 400 })
    }
    
    // Find user by token's userId
    const users = mockStore.users.list()
    const user = users.find(u => u.id === tokenRecord.userId)
    
    if (!user) {
      console.log(`[VERIFY API] User not found for token: ${tokenRecord.userId}`)
      return NextResponse.json({ ok: false, message: 'Kullanıcı bulunamadı' }, { status: 400 })
    }
    
    // Update user verification status - THIS IS THE CRITICAL PART
    const updated = mockStore.users.updateEmailVerified(user.email, true)
    if (updated) {
      // Mark token as used
      mockStore.tokens.markAsUsed(tokenHash)
      
      console.log(`[VERIFY API] ✅ User verified successfully: ${user.email}`)
      if ((mockStore as any)?.dev?.stats) {
        console.log(`[VERIFY API] 📊 Mock Store Stats:`, (mockStore as any).dev.stats());
      }
      
      return NextResponse.json({ ok: true, message: 'E-posta başarıyla doğrulandı' })
    } else {
      console.log(`[VERIFY API] Failed to update user: ${user.email}`)
      return NextResponse.json({ ok: false, message: 'Doğrulama sırasında bir hata oluştu' }, { status: 500 })
    }
    
  } catch (error) {
    console.error('[VERIFY API] Error:', error)
    return NextResponse.json({ ok: false, message: 'Beklenmeyen hata' }, { status: 500 })
  }
}

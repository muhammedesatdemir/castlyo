/**
 * Mock user store for development - SINGLETON PATTERN
 * Shared between register, verify, and login flows
 * TODO: Replace with real database integration
 */

import crypto from 'crypto'
const isProd = process.env.NODE_ENV === 'production'

export type User = {
  id: string
  email: string         // lowercased
  passwordHash: string  // bcrypt hash
  emailVerified: boolean
  role: 'TALENT' | 'AGENCY'
  // Profile fields
  firstName?: string
  lastName?: string
  gender?: 'MALE' | 'FEMALE' | 'OTHER'
  city?: string
  experience?: 'BEGINNER' | 'AMATEUR' | 'SEMI_PRO' | 'PROFESSIONAL'
  specialties?: string[]
  languages?: string[]
}

type VerifyToken = {
  userId: string
  expiresAt: number // ms timestamp
  used: boolean
}

class MockStore {
  users = new Map<string, User>()                 // key: email
  tokens = new Map<string, VerifyToken>()         // key: SHA-256(raw)

  private sha(input: string) {
    return crypto.createHash('sha256').update(input).digest('hex')
  }

  createUser(userData: Omit<User, 'id'>): User {
    const user: User = {
      ...userData,
      id: `user_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
    }
    
    this.users.set(user.email, user)
    console.log(`[STORE] User created: ${user.email} (${user.id})`)
    return user
  }

  findUserByEmail(email: string): User | null {
    const user = this.users.get(email.toLowerCase())
    console.log(`[STORE] User lookup: ${email} -> ${user ? 'found' : 'not found'}`)
    return user || null
  }

  createVerificationToken(userId: string, ttlMs = 30 * 60 * 1000) {
    const raw = crypto.randomBytes(24).toString('hex') // 48 char
    const hash = this.sha(raw)
    this.tokens.set(hash, { userId, expiresAt: Date.now() + ttlMs, used: false })

    const url = `${process.env.NEXT_PUBLIC_WEB_URL || 
      (process.env.NODE_ENV === 'production' 
        ? 'https://castlyo-web.onrender.com' 
        : 'http://localhost:3000')}/auth/verify?token=${raw}`

    if (!isProd) {
      // Prod'da ham token/hashing detaylarını loglamıyoruz
      console.log(`[STORE] Verification token created for user: ${userId}`)
      console.log(`[STORE] Raw token (masked): ${raw.slice(0, 6)}***... (${raw.length} chars)`) 
      console.log(`[STORE] Hash (prefix): ${hash.slice(0, 8)}...`) 
    }

    // Ham token sadece linkte kullanılıyor; dışarıya sadece URL veriyoruz
    return { url }
  }

  consumeVerificationToken(raw: string) {
    const hash = this.sha(raw)
    const rec = this.tokens.get(hash)

    if (!isProd) {
      console.log(`[STORE] Consuming token (masked): ${raw.slice(0, 6)}***... -> hash: ${hash.slice(0, 8)}...`)
      console.log(`[STORE] Token found: ${!!rec}`)
    }
    
    if (!rec) return { ok: false as const, reason: 'not_found' as const }

    if (rec.used) {
      this.tokens.delete(hash)
      console.log(`[STORE] Token already used`)
      return { ok: false as const, reason: 'used' as const }
    }
    
    if (rec.expiresAt < Date.now()) {
      this.tokens.delete(hash)
      console.log(`[STORE] Token expired`)
      return { ok: false as const, reason: 'expired' as const }
    }

    rec.used = true
    this.tokens.delete(hash) // tek kullanımlık
    if (!isProd) console.log(`[STORE] Token consumed successfully for user: ${rec.userId}`)
    return { ok: true as const, userId: rec.userId }
  }

  updateUserEmailVerified(email: string, verified: boolean): boolean {
    const user = this.users.get(email.toLowerCase())
    if (user) {
      user.emailVerified = verified
      this.users.set(user.email, user)
      console.log(`[STORE] User ${email} verified: ${verified}`)
      return true
    }
    return false
  }

  cleanup() {
    // Güvence: yanlışlıkla object'e dönmüşse toparla
    if (!(this.tokens instanceof Map)) {
      console.warn('[STORE] tokens corrupted; resetting Map')
      this.tokens = new Map<string, VerifyToken>()
      return
    }
    
    // Users Map güvencesi de ekleyelim
    if (!(this.users instanceof Map)) {
      console.warn('[STORE] users corrupted; resetting Map')
      this.users = new Map<string, User>()
      return
    }
    
    const now = Date.now()
    let cleaned = 0
    
    try {
      for (const [hash, t] of Array.from(this.tokens.entries())) {
        if (t.used || t.expiresAt < now) {
          this.tokens.delete(hash)
          cleaned++
        }
      }
      
      if (cleaned > 0) {
        console.log(`[STORE] Cleaned up ${cleaned} tokens`)
      }
    } catch (error) {
      console.error('[STORE] Cleanup error, resetting tokens Map:', error)
      this.tokens = new Map<string, VerifyToken>()
    }
  }

  stats() {
    const now = Date.now()
    let activeTokens = 0
    
    // Güvence: Map değilse sıfırla
    if (!(this.tokens instanceof Map)) {
      console.warn('[STORE] tokens corrupted in stats; resetting')
      this.tokens = new Map<string, VerifyToken>()
      return { users: this.users.size, tokens: 0, activeTokens: 0 }
    }
    
    for (const [, t] of Array.from(this.tokens.entries())) {
      if (!t.used && t.expiresAt > now) activeTokens++
    }
    
    return { users: this.users.size, tokens: this.tokens.size, activeTokens }
  }

  // Development helpers
  clear() {
    this.users.clear()
    this.tokens.clear()
    console.log('[STORE] All data cleared')
  }
}

// Singleton (hot-reload güvenli)
const g = globalThis as any
if (!g.__CASTLYO_STORE__) g.__CASTLYO_STORE__ = new MockStore()
const store: MockStore = g.__CASTLYO_STORE__

// Temizlik job (dev için)
if (!g.__CASTLYO_TOKEN_CLEANER__) {
  g.__CASTLYO_TOKEN_CLEANER__ = setInterval(() => {
    try { 
      store.cleanup() 
    } catch (e) { 
      console.error('[STORE] cleanup error', e) 
    }
  }, 60_000)
}

export default store
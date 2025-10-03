// Simple in-memory store for development
// TODO: Replace with real database

export interface User {
  id: string
  email: string
  passwordHash: string
  role: 'TALENT' | 'AGENCY'
  status: 'PENDING' | 'ACTIVE'
  emailVerified: boolean
  createdAt: Date
  // Profile
  firstName?: string
  lastName?: string
  gender?: 'MALE' | 'FEMALE' | 'OTHER'
  city?: string
  experience?: 'BEGINNER' | 'AMATEUR' | 'SEMI_PRO' | 'PROFESSIONAL'
  specialties?: string[]
  languages?: string[]
}

export interface VerificationToken {
  id: string
  userId: string
  tokenHash: string
  expiresAt: Date
  used: boolean
  createdAt: Date
}

// In-memory storage
const users = new Map<string, User>() // email -> user
const tokens = new Map<string, VerificationToken>() // tokenHash -> token

export const store = {
  users: {
    create(userData: Omit<User, 'id' | 'createdAt'>): User {
      const user: User = {
        ...userData,
        id: `user_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        createdAt: new Date()
      }
      
      users.set(user.email, user)
      console.log(`[STORE] User created: ${user.email} (${user.id})`)
      return user
    },

    findByEmail(email: string): User | null {
      const user = users.get(email.toLowerCase())
      console.log(`[STORE] User lookup: ${email} -> ${user ? 'found' : 'not found'}`)
      return user || null
    },

    updateEmailVerified(email: string, verified: boolean): boolean {
      const user = users.get(email.toLowerCase())
      if (user) {
        user.emailVerified = verified
        user.status = verified ? 'ACTIVE' : 'PENDING'
        users.set(user.email, user)
        console.log(`[STORE] User ${email} verified: ${verified}`)
        return true
      }
      return false
    },

    getAll(): User[] {
      return Array.from(users.values())
    },

    clear(): void {
      users.clear()
      console.log('[STORE] Users cleared')
    }
  },

  tokens: {
    create(userId: string, tokenHash: string, expiresAt: Date): VerificationToken {
      const token: VerificationToken = {
        id: `token_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        userId,
        tokenHash,
        expiresAt,
        used: false,
        createdAt: new Date()
      }
      
      tokens.set(tokenHash, token)
      console.log(`[STORE] Token created for user: ${userId}`)
      return token
    },

    findByHash(tokenHash: string): VerificationToken | null {
      const token = tokens.get(tokenHash)
      console.log(`[STORE] Token lookup: ${tokenHash.slice(0, 8)}... -> ${token ? 'found' : 'not found'}`)
      return token || null
    },

    markAsUsed(tokenHash: string): boolean {
      const token = tokens.get(tokenHash)
      if (token) {
        token.used = true
        tokens.set(tokenHash, token)
        console.log(`[STORE] Token marked as used: ${tokenHash.slice(0, 8)}...`)
        return true
      }
      return false
    },

    delete(tokenHash: string): boolean {
      const deleted = tokens.delete(tokenHash)
      console.log(`[STORE] Token deleted: ${tokenHash.slice(0, 8)}... -> ${deleted}`)
      return deleted
    },

    cleanup(): number {
      const now = new Date()
      let cleaned = 0
      
      for (const [hash, token] of Array.from(tokens.entries())) {
        if (token.expiresAt < now || token.used) {
          tokens.delete(hash)
          cleaned++
        }
      }
      
      if (cleaned > 0) {
        console.log(`[STORE] Cleaned up ${cleaned} tokens`)
      }
      return cleaned
    }
  },

  // Development helpers
  dev: {
    stats() {
      return {
        users: users.size,
        tokens: tokens.size,
        activeTokens: Array.from(tokens.values()).filter(t => !t.used && t.expiresAt > new Date()).length
      }
    },

    clear() {
      users.clear()
      tokens.clear()
      console.log('[STORE] All data cleared')
    }
  }
}

import NextAuth from 'next-auth'
import { NextAuthOptions } from 'next-auth'
import CredentialsProvider from 'next-auth/providers/credentials'
import { loginSchema } from '@/lib/validations/auth'
import store from '@/lib/mock-store'
import * as bcrypt from 'bcryptjs'

export const runtime = 'nodejs'

const authOptions: NextAuthOptions = {
  providers: [
    CredentialsProvider({
      name: 'credentials',
      credentials: {
        email: { label: 'Email', type: 'email' },
        password: { label: 'Password', type: 'password' }
      },
      async authorize(credentials) {
        try {
          if (!credentials?.email || !credentials?.password) {
            console.log('[NextAuth] Missing credentials')
            return null
          }

          // Validate input
          const validatedCredentials = loginSchema.parse({
            email: credentials.email,
            password: credentials.password,
          })

          // Normalize email for consistency
          const normalizedEmail = validatedCredentials.email.trim().toLowerCase()
          console.log(`[NextAuth] Attempting login for: ${normalizedEmail}`)

          // Use mock store for user lookup (same source as register/verify)
          console.log(`[NextAuth] 📊 Mock Store Stats:`, store.stats())
          
          const user = store.findUserByEmail(normalizedEmail)
          
          if (!user) {
            console.log(`[NextAuth] User not found: ${normalizedEmail}`)
            throw new Error('INVALID_CREDENTIALS')
          }
          
          // Password check using bcrypt
          const isPasswordValid = await bcrypt.compare(validatedCredentials.password, user.passwordHash)
          
          if (!isPasswordValid) {
            console.log(`[NextAuth] Invalid password for: ${normalizedEmail}`)
            console.log(`[NextAuth] Password hash: ${user.passwordHash.substring(0, 10)}...`)
            throw new Error('INVALID_CREDENTIALS')
          }
          
          // Email verification check - this is the key check
          if (!user.emailVerified) {
            console.log(`[NextAuth] Email not verified for user: ${user.id}`)
            throw new Error('EMAIL_NOT_VERIFIED')
          }
          
          console.log(`[NextAuth] ✅ Login successful for user: ${user.id}`)
          return {
            id: user.id,
            email: user.email,
            role: user.role,
            emailVerified: user.emailVerified,
          }
        } catch (error) {
          console.error('[NextAuth] Authorization error:', error)
          return null
        }
      }
    })
  ],
  session: {
    strategy: 'jwt',
    maxAge: 30 * 24 * 60 * 60, // 30 days
  },
  jwt: {
    maxAge: 60 * 60 * 24 * 30, // 30 days
  },
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.role = user.role
        token.emailVerified = user.emailVerified
      }
      return token
    },
    async session({ session, token }) {
      if (token) {
        session.user.id = token.sub!
        session.user.role = token.role as string
        session.user.emailVerified = token.emailVerified as boolean
      }
      return session
    },
  },
  pages: {
    // Castlyo'da tekleştirilmiş kimlik sayfası `/auth` altında.
    // NextAuth default signIn ekranını bu sayfaya yönlendiriyoruz.
    signIn: '/auth',
    // Kayıt ekranı da aynı sayfa içinde mod ile yönetiliyor.
    // İsterseniz `'/auth?mode=register'` yapabilirsiniz; şimdilik gerek yok.
    signUp: '/auth',
    error: '/auth/error',
  },
  events: {
    async signOut() {
      // Could add logout API call here if needed
    },
  },
}

const handler = NextAuth(authOptions)

export { handler as GET, handler as POST }

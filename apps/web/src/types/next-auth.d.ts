import NextAuth, { DefaultSession, DefaultUser } from 'next-auth'
import { JWT } from 'next-auth/jwt'

declare module 'next-auth' {
  interface Session {
    user: {
      id: string
      role: string
      status: string
      emailVerified: boolean
    } & DefaultSession['user']
    accessToken: string
    refreshToken: string
  }

  interface User extends DefaultUser {
    role: string
    status: string
    emailVerified: boolean
    accessToken: string
    refreshToken: string
  }
}

declare module 'next-auth/jwt' {
  interface JWT {
    role: string
    status: string
    emailVerified: boolean
    accessToken: string
    refreshToken: string
  }
}

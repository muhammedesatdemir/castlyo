// apps/web/src/lib/auth.ts
import type { NextAuthOptions } from 'next-auth';
import Credentials from 'next-auth/providers/credentials';
import { api } from './api';

export const authOptions: NextAuthOptions = {
  secret: process.env.NEXTAUTH_SECRET,
  session: { strategy: 'jwt' },
  debug: process.env.NEXTAUTH_DEBUG === 'true',
  providers: [
    Credentials({
      name: 'credentials',
      credentials: {
        email: { label: 'Email', type: 'email' },
        password: { label: 'Password', type: 'password' },
      },
      async authorize(creds) {
        try {
          const response = await api.post('/auth/login', {
            email: creds?.email,
            password: creds?.password,
          });
          
          const json = response.data;
          return {
            id: json?.user?.id ?? json?.userId ?? 'me',
            email: json?.user?.email ?? creds?.email,
            access_token: json?.access_token ?? json?.accessToken,
            refresh_token: json?.refresh_token ?? json?.refreshToken,
          };
        } catch (error) {
          console.error('Authentication failed:', error);
          return null;
        }
      },
    }),
  ],
  callbacks: {
    async jwt({ token, user, account }) {
      if (account?.type === 'credentials' && user) {
        token.access_token = (user as any).access_token;
        token.refresh_token = (user as any).refresh_token;
      }
      return token;
    },
    async session({ session, token }) {
      (session as any).access_token = token.access_token as string | undefined;
      (session as any).refresh_token = token.refresh_token as string | undefined;
      return session;
    },
  },
};

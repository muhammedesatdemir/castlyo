import Credentials from "next-auth/providers/credentials";
import type { NextAuthOptions } from "next-auth";

const API = process.env.INTERNAL_API_URL ?? "http://castlyo-api:3001";

export const authOptions: NextAuthOptions = {
  session: { strategy: "jwt" },
  providers: [
    Credentials({
      name: "Credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) return null;

        const res = await fetch(`${API}/api/v1/auth/login`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            email: credentials.email,
            password: credentials.password,
          }),
        });

        if (!res.ok) return null;
        const data = await res.json();

        if (!data?.access_token || !data?.user?.id) return null;

        // ⬇⬇⬇  ROLÜ MUTLAKA DÖN!  ⬇⬇⬇
        return {
          id: data.user.id,
          email: data.user.email,
          role: data.user.role,           // <— KRİTİK
          accessToken: data.access_token, // NextAuth için camelCase
          refreshToken: data.refresh_token,
        };
      },
    }),
  ],
  callbacks: {
    async jwt({ token, user }) {
      // İlk login'de user gelir → role'ü JWT'ye yaz
      if (user) {
        token.role = (user as any).role ?? null;            // <— KRİTİK
        (token as any).accessToken  = (user as any).accessToken;
        (token as any).refreshToken = (user as any).refreshToken;
      }
      return token;
    },
    async session({ session, token }) {
      // Her session'da role'ü user'a koy
      (session.user as any).role = (token as any)?.role ?? null;  // <— KRİTİK
      (session as any).accessToken  = (token as any)?.accessToken;
      (session as any).refreshToken = (token as any)?.refreshToken;
      return session;
    },
  },
  pages: { signIn: "/auth" }, // projede özel login sayfan varsa
  secret: process.env.NEXTAUTH_SECRET,
  debug: true,
};

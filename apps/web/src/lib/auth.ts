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
        if (!credentials?.email || !credentials?.password) return null; // boş post guard

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

        // NextAuth 'user' nesnesine tokenları taşı
        return {
          id: data.user.id,
          email: data.user.email,
          role: data.user.role,
          access_token: data.access_token,  // Backend'den gelen format
          refresh_token: data.refresh_token,
        };
      },
    }),
  ],
  callbacks: {
    async jwt({ token, user }) {
      // Login anında user gelir → token'a yaz
      if (user?.access_token) {
        token.access_token = user.access_token;
        token.refresh_token = user.refresh_token;
      }
      return token;
    },
    async session({ session, token }) {
      // Session'a geçir (frontend için camelCase)
      if (token?.access_token) {
        (session as any).accessToken = token.access_token;
        (session as any).refreshToken = token.refresh_token;
      }
      return session;
    },
  },
  pages: { signIn: "/auth" }, // projede özel login sayfan varsa
  secret: process.env.NEXTAUTH_SECRET,
  debug: true,
};

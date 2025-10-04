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

        // Backend login'i client-side'da yapıldı, burada sadece FE session oluştur
        // Basit user objesi döndür - gerçek doğrulama client-side'da yapıldı
        return {
          id: credentials.email, // Email'i ID olarak kullan
          email: credentials.email,
          role: 'TALENT', // Default role, gerçek role backend'den alınacak
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

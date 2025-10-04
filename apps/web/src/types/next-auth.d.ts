import { DefaultSession } from "next-auth";

declare module "next-auth" {
  interface Session extends DefaultSession {
    accessToken?: string | null;
    refreshToken?: string | null;
    user?: {
      name?: string | null;
      email?: string | null;
      image?: string | null;
      talent_profile_id?: string | null;
    };
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    accessToken?: string | null;
    refreshToken?: string | null;
  }
}

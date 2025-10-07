import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { getToken } from "next-auth/jwt";

export async function middleware(req: NextRequest) {
  const p = req.nextUrl.pathname;
  const wantsAgency = p.startsWith("/onboarding/agency");
  const wantsTalent = p.startsWith("/onboarding/talent");
  if (!wantsAgency && !wantsTalent) return NextResponse.next();

  const token = await getToken({ req: req as any, secret: process.env.NEXTAUTH_SECRET });
  const role = (token as any)?.role ?? null;

  console.log("[MW]", { path: p, role, hasSecret: !!process.env.NEXTAUTH_SECRET });

  if (!token) return NextResponse.next(); // oturum yoksa serbest

  const home = req.nextUrl.clone();
  home.pathname = "/";

  if (wantsAgency && role === "TALENT") {
    home.searchParams.set("toast", "agency_forbidden");
    return NextResponse.redirect(home);
  }
  if (wantsTalent && role === "AGENCY") {
    home.searchParams.set("toast", "talent_forbidden");
    return NextResponse.redirect(home);
  }
  return NextResponse.next();
}

export const config = {
  matcher: ["/onboarding/:path*"],
};

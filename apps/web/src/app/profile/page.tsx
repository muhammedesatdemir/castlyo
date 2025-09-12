// apps/web/src/app/profile/page.tsx
import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";
import { cookies } from "next/headers";         // 👈 eklendi
import ProfileClient from "./ProfileClient";

async function fetchProfile() {
  // ❶ Relative fetch (öncelikli ve en sağlam)
  // const res = await fetch("/api/profile/me", { cache: "no-store" });

  // ❷ Absolute fetch yapman gerekiyorsa cookie'yi forward et:
  const base = process.env.NEXTAUTH_URL ?? process.env.NEXT_PUBLIC_BASE_URL ?? "";
  const res = await fetch(`${base}/api/profile/me`, {
    cache: "no-store",
    headers: {
      // Next.js app router'da server component içinden cookie'leri böyle geç
      cookie: cookies().toString(),
    },
    credentials: "include",
  });

  if (!res.ok) return { profile: null as any };
  return res.json();
}

export default async function ProfilePage() {
  const session = await getServerSession();        // gerekiyorsa getServerSession(authOptions)
  if (!session?.user) redirect("/auth?next=/profile");

  const { profile } = await fetchProfile();

  return (
    <ProfileClient
      session={{ email: session.user?.email ?? null, role: (session.user as any)?.role ?? null }}
      profile={profile}
    />
  );
}

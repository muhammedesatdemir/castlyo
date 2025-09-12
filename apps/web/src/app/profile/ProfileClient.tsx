// apps/web/src/app/profile/ProfileClient.tsx  (Client Component)
"use client";

import { useRouter } from "next/navigation";

type SessionLite =
  | {
      email: string | null;
      role: "TALENT" | "AGENCY" | string | null;
    }
  | null;

type Profile =
  | {
      bio?: string;
      experience?: string;
      specialties?: string[];
    }
  | null;

export default function ProfileClient({
  session,
  profile,
}: {
  session: SessionLite;
  profile: Profile;
}) {
  const router = useRouter();

  // SSR'de zaten oturum kontrolü var; yine de güvenli fallback
  if (!session) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <span className="opacity-70">Yükleniyor…</span>
      </div>
    );
  }

  // Profil yoksa “oluştur” önerisi (onboarding akışına yönlendiriyoruz)
  if (!profile) {
    const isAgency = session.role === "AGENCY";

    return (
      <main className="mx-auto max-w-3xl p-6">
        <h1 className="text-2xl font-semibold mb-4">Profiliniz eksik</h1>
        <p className="opacity-80 mb-6">
          {isAgency
            ? "Ajans profilinizi tamamlayın."
            : "Yetenek profilinizi tamamlayın."}
        </p>

        <button
          className="px-4 py-2 rounded bg-amber-700 hover:bg-amber-600"
          onClick={() =>
            router.push(isAgency ? "/onboarding/agency" : "/onboarding/talent")
          }
        >
          Profil Oluştur
        </button>
      </main>
    );
  }

  // Profil varsa sade görüntüleme
  return (
    <main className="mx-auto max-w-3xl p-6">
      <h1 className="text-2xl font-semibold mb-6">Profilim</h1>

      <section className="rounded-2xl p-5 bg-white/5 shadow mb-4">
        <h2 className="text-lg font-medium mb-2">Biyografi</h2>
        <p className="opacity-80 whitespace-pre-wrap">{profile.bio || "—"}</p>
      </section>

      <section className="rounded-2xl p-5 bg-white/5 shadow mb-4">
        <h2 className="text-lg font-medium mb-2">Deneyim</h2>
        <p className="opacity-80 whitespace-pre-wrap">
          {profile.experience || "—"}
        </p>
      </section>

      <section className="rounded-2xl p-5 bg-white/5 shadow mb-4">
        <h2 className="text-lg font-medium mb-3">Uzmanlık Alanları</h2>
        <div className="flex flex-wrap gap-2">
          {(profile.specialties ?? []).length > 0 ? (
            profile.specialties!.map((s) => (
              <span key={s} className="px-3 py-1 rounded-full bg-amber-800/60">
                {s}
              </span>
            ))
          ) : (
            <span>—</span>
          )}
        </div>
      </section>
    </main>
  );
}

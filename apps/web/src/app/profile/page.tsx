// apps/web/src/app/profile/page.tsx
"use client";

import { useEffect, useState, useCallback } from "react";
import ProfileClient from "./ProfileClient";

type Profile = {
  firstName?: string; lastName?: string; email?: string; phone?: string;
  role?: string; status?: string; lastLogin?: string;
  company?: string | null; position?: string | null; profilePhotoUrl?: string | null;
  professional?: { specialties?: string[]; bio?: string; experience?: string };
  personal?: { city?: string; birthDate?: string; gender?: string; heightCm?: number; weightKg?: number };
  activities?: { id: string; icon?: string; text: string; when: string }[];
};

const THEME = { light: "#F6E6C3", dark: "#962901", black: "#000000" };

export default function ProfilePage() {
  const [data, setData] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);

  const refetch = useCallback(async () => {
    const res = await fetch("/api/profile/me", { cache: "no-store" });
    const p: Profile = await res.json();
    setData(p);
  }, []);

  useEffect(() => {
    let alive = true;
    (async () => {
      try {
        const res = await fetch("/api/profile/me", { cache: "no-store" });
        const p: Profile = await res.json();
        if (alive) setData(p);
      } finally {
        if (alive) setLoading(false);
      }
    })();
    return () => { alive = false; };
  }, []);

  return (
    <main
      className="min-h-screen"
      style={{ background: `linear-gradient(180deg, ${THEME.light} 0%, #ffffff 55%)` }}
    >
      <header className="sticky top-0 z-10 border-b border-neutral-200/70 bg-white/70 backdrop-blur">
        <div className="mx-auto max-w-6xl px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl grid place-items-center font-bold text-white" style={{ backgroundColor: THEME.dark }}>C</div>
            <span className="font-semibold tracking-tight" style={{ color: THEME.black }}>Castlyo</span>
          </div>
        </div>
      </header>

      <div className="mx-auto max-w-6xl px-4 py-8">
        {loading && <div className="opacity-70">Yükleniyor…</div>}
        {data && (
          <ProfileClient
            initialProfile={data}
            theme={THEME}
            // Çocuk bileşen başarılı kayıttan sonra taze profili buraya gönderecek
            onSaved={(fresh) => setData(fresh)}
            onDemandRefetch={refetch}
          />
        )}
      </div>
    </main>
  );
}

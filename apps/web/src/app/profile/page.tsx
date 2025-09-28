"use client";

import { useEffect, useState, useCallback } from "react";
import ProfileClient from "./ProfileClient";

/** Sunucudan dönen profil tipi — ProfileClient de bunu kullanır */
export type Profile = {
  firstName?: string;
  lastName?: string;
  email?: string;
  phone?: string;

  role?: string | null;
  status?: string | null;

  /** Bazı yerlerde gösteriliyor; opsiyonel */
  company?: string | null;

  profilePhotoUrl?: string | null;

  professional?: {
    specialties?: string[];
    bio?: string;
    experience?: string;
    cvUrl?: string | null;
  };

  personal?: {
    city?: string;
    birthDate?: string;            // ISO (yyyy-MM-dd)
    gender?: string;               // "MALE" | "FEMALE" | ""
    heightCm?: number;
    weightKg?: number;

    guardian?: {
      fullName?: string;
      relation?: "Anne" | "Baba" | "Vasi" | "Diğer" | string;
      phone?: string;
      email?: string | null;
      /** Back-end uyumluluğu için iki alan da tutuluyor */
      consent?: boolean;
      consentAccepted?: boolean;
    } | null;
  };
};

const THEME = { light: "#F6E6C3", dark: "#962901", black: "#000000" };

export default function ProfilePage() {
  const [data, setData] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const refetch = useCallback(async () => {
    try {
      setError(null);
      console.debug('[ProfilePage] Refetching profile data...');
      // DEĞİŞİKLİK: /api/profile/me -> /api/proxy/profiles/me
      const res = await fetch("/api/proxy/profiles/me", { cache: "no-store" });
      
      if (!res.ok) {
        const errorData = await res.json().catch(() => ({ error: 'NON_JSON_ERROR' }));
        throw new Error(errorData.error ?? `Request failed: ${res.status}`);
      }
      
      const p: Profile = await res.json();
      console.debug('[ProfilePage] Profile data received:', p);
      setData(p);
    } catch (error) {
      console.error('[ProfilePage] Refetch error:', error);
      setError(error instanceof Error ? error.message : 'Beklenmeyen bir hata oluştu');
    }
  }, []);

  useEffect(() => {
    let alive = true;
    (async () => {
      try {
        setError(null);
        console.debug('[ProfilePage] Initial profile fetch...');
        // DEĞİŞİKLİK: /api/profile/me -> /api/proxy/profiles/me
        const res = await fetch("/api/proxy/profiles/me", { cache: "no-store" });
        
        if (!res.ok) {
          const errorData = await res.json().catch(() => ({ error: 'NON_JSON_ERROR' }));
          throw new Error(errorData.error ?? `Request failed: ${res.status}`);
        }
        
        const p: Profile = await res.json();
        console.debug('[ProfilePage] Initial profile data received:', p);
        if (alive) setData(p);
      } catch (error) {
        console.error('[ProfilePage] Initial fetch error:', error);
        if (alive) setError(error instanceof Error ? error.message : 'Profil verileri yüklenemedi');
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
            <div
              className="w-9 h-9 rounded-xl grid place-items-center font-bold text-white"
              style={{ backgroundColor: THEME.dark }}
            >
              C
            </div>
            <span className="font-semibold tracking-tight" style={{ color: THEME.black }}>
              Castlyo
            </span>
          </div>
        </div>
      </header>

      <div className="mx-auto max-w-6xl px-4 py-8">
        {loading && (
          <div className="flex items-center justify-center py-12">
            <div className="text-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 mx-auto mb-4" style={{ borderColor: THEME.dark }}></div>
              <div className="text-lg font-medium text-gray-600">Profil yükleniyor...</div>
            </div>
          </div>
        )}

        {error && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-6 text-center">
            <div className="text-red-800 font-medium mb-2">Hata</div>
            <div className="text-red-600 mb-4">{error}</div>
            <button
              onClick={refetch}
              className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
            >
              Tekrar Dene
            </button>
          </div>
        )}

        {!loading && !error && data && (
          <ProfileClient
            initialProfile={data}
            theme={THEME}
            onSaved={(fresh) => setData(fresh)}
            onDemandRefetch={refetch}
          />
        )}
      </div>
    </main>
  );
}

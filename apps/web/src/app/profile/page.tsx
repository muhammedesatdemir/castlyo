"use client";

import { useEffect, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
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
    birthDate?: string | null;     // ISO (yyyy-MM-dd) or null
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

/* ---------- API mapping helpers ---------- */
const g = (o: any, ...keys: string[]) => {
  for (const k of keys) {
    const v = o?.[k];
    if (v !== undefined && v !== null) return v;
  }
  return undefined;
};

const toDateOnly = (v: any): string | null => {
  if (!v) return null;
  // 24.04.2009 gibi TR formatını da destekle
  if (typeof v === "string" && /^\d{2}\.\d{2}\.\d{4}$/.test(v)) {
    const [dd, mm, yyyy] = v.split(".");
    return `${yyyy}-${mm}-${dd}`;
  }
  const d = new Date(v);
  return Number.isNaN(d.getTime()) ? null : d.toISOString().slice(0, 10);
};

function mapApiToProfile(api: any): Profile {
  // API now returns flat structure with camelCase fields
  const data = api ?? {};

  // Helper function to safely convert to number
  const num = (v: any) => v === null || v === undefined || v === '' ? null : Number(v);

  // specialties hem ["ACTING"] hem [{code:"ACTING"}] hem ["Oyunculuk"] gelebilir
  const rawSpecs = data.specialties ?? [];
  const specialties = Array.isArray(rawSpecs)
    ? rawSpecs.map((s: any) => (typeof s === "string" ? s : s?.code ?? s?.label)).filter(Boolean)
    : [];

  return {
    firstName: data.firstName ?? data.first_name ?? "",
    lastName: data.lastName ?? data.last_name ?? "",
    email: data.email ?? "",
    phone: data.phone ?? "",
    role: data.role ?? null,
    status: data.status ?? null,
    company: data.company ?? null,
    profilePhotoUrl: data.profileImage ?? data.profilePhotoUrl ?? data.avatarUrl ?? data.photoUrl ?? data.avatar ?? null,

    professional: {
      specialties,
      bio: data.bio ?? "",
      experience: data.experience ?? "",
      cvUrl: data.cvUrl ?? data.cv_url ?? null,
    },

    personal: {
      city: data.city ?? "",
      birthDate: toDateOnly(data.birthDate ?? data.birth_date),
      gender: data.gender ?? "",
      heightCm: num(data.heightCm ?? data.height_cm) ?? undefined,
      weightKg: num(data.weightKg ?? data.weight_kg) ?? undefined,
      guardian: data.guardian
        ? {
            fullName: data.guardian.fullName ?? data.guardian.name ?? "",
            relation: data.guardian.relation ?? "",
            phone: data.guardian.phone ?? data.guardian.mobile ?? "",
            email: data.guardian.email ?? "",
            consent: data.guardian.consent ?? data.guardian.consentAccepted ?? false,
            consentAccepted: undefined,
          }
        : null,
    },
  };
}

export default function ProfilePage() {
  const router = useRouter();
  const [data, setData] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const refetch = useCallback(async () => {
    try {
      setError(null);
      console.debug('[ProfilePage] Refetching profile data...');
      // DEĞİŞİKLİK: /api/profile/me -> /api/proxy/profiles/me
      const res = await fetch("/api/proxy/profiles/me", { 
        cache: "no-store",
        credentials: 'include'
      });
      
      if (!res.ok) {
        // 401 için özel handling
        if (res.status === 401) {
          router.push('/auth/login?next=/profile');
          throw new Error('Oturum açmanız gerekiyor.');
        }
        
        // Ham gövdeyi al ve parse etmeye çalış
        const text = await res.text();
        let obj: any = null;
        try { 
          obj = JSON.parse(text); 
        } catch (_) { 
          // JSON değilse yoksay
        }

        const msg =
          obj?.error ??
          obj?.message ??
          (text?.trim() || `Request failed: ${res.status}`);

        throw new Error(msg);
      }
      
      const apiResponse = await res.json();
      console.debug('[ProfilePage] Profile data received:', apiResponse);
      console.log('[ProfilePage] API Response structure (refetch):', {
        hasUser: !!apiResponse.user,
        hasProfile: !!apiResponse.profile,
        userKeys: apiResponse.user ? Object.keys(apiResponse.user) : [],
        profileKeys: apiResponse.profile ? Object.keys(apiResponse.profile) : []
      });
      
      // API response'u Profile formatına dönüştür
      const p: Profile = mapApiToProfile(apiResponse);
      
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
        const res = await fetch("/api/proxy/profiles/me", { 
          cache: "no-store",
          credentials: 'include'
        });
        
        if (!res.ok) {
          // 401 için özel handling
          if (res.status === 401) {
            router.push('/auth/login?next=/profile');
            throw new Error('Oturum açmanız gerekiyor.');
          }
          
          // Ham gövdeyi al ve parse etmeye çalış
          const text = await res.text();
          let obj: any = null;
          try { 
            obj = JSON.parse(text); 
          } catch (_) { 
            // JSON değilse yoksay
          }

          const msg =
            obj?.error ??
            obj?.message ??
            (text?.trim() || `Request failed: ${res.status}`);

          throw new Error(msg);
        }
        
        const apiResponse = await res.json();
        console.debug('[ProfilePage] Initial profile data received:', apiResponse);
        console.log('[ProfilePage] API Response structure:', {
          hasUser: !!apiResponse.user,
          hasProfile: !!apiResponse.profile,
          userKeys: apiResponse.user ? Object.keys(apiResponse.user) : [],
          profileKeys: apiResponse.profile ? Object.keys(apiResponse.profile) : []
        });
        
        // API response'u Profile formatına dönüştür
        const p: Profile = mapApiToProfile(apiResponse);
        
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

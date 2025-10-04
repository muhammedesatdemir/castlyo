"use client";

import { useEffect, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import useSWR from "swr";
import ProfileClient from "./ProfileClient";
import { mapApiSpecialtiesToUI } from "@/lib/profile-mapper";
import { guardApiUser } from "@/lib/api-guard";
import { useMe } from "@/hooks/useMe";

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

/* ---------- SWR fetcher ---------- */
async function fetchProfileData(userRole?: string): Promise<Profile> {
  try {
    // Role'e göre doğru endpoint'i seç
    const profileEndpoint = userRole === 'AGENCY' 
      ? '/api/proxy/api/v1/profiles/agency/me'
      : '/api/proxy/api/v1/profiles/talent/me';
    
    const [uRes, pRes] = await Promise.all([
      fetch('/api/proxy/api/v1/users/me', { credentials: 'include' }),
      fetch(profileEndpoint, { credentials: 'include' }),
    ]);

    const user = uRes.ok ? await uRes.json() : {};
    let profileRaw: any = {};
    
    // 404'u "profil yok" olarak ele al - hata değil
    if (pRes.ok) {
      const p = await pRes.json();
      profileRaw = p && typeof p === 'object' && !Array.isArray(p) ? p : {};
    } else if (pRes.status === 404) {
      // Profil henüz oluşturulmamış - bu normal
      console.debug('[ProfilePage] Profile not found (404) - user has no profile yet');
      profileRaw = {};
    } else if (!pRes.ok) {
      // Gerçek hata durumu
      console.error('[ProfilePage] Profile fetch error:', pRes.status, pRes.statusText);
      profileRaw = {};
    }

    const hasProfile = Object.keys(profileRaw).length > 0;

    console.info('[ProfilePage] API Response structure', {
      hasUser: !!user?.id,
      hasProfile,
      userKeys: Object.keys(user || {}),
      profileKeys: Object.keys(profileRaw || {}),
      profileStatus: pRes.status,
    });

    // Merge user and profile data with proper priority
    // Profile data takes priority for all fields, user data as fallback
    const combinedData = {
      // Start with user data as base
      ...user,
      // Profile data takes priority for all fields (profile > user > '')
      first_name: profileRaw?.first_name ?? user?.first_name ?? '',
      last_name: profileRaw?.last_name ?? user?.last_name ?? '',
      email: user?.email ?? profileRaw?.email ?? '',
      phone: profileRaw?.phone ?? user?.phone ?? '',
      // Add all other profile fields
      ...profileRaw,
    };

    // Map API → UI (safe defaults)
    return mapApiToProfile(combinedData);
  } catch (error) {
    console.error('[ProfilePage] Fetch error:', error);
    throw error;
  }
}

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
  // 24.04.2009 gibi TR formatını da destekle (ISO'ya çevir)
  if (typeof v === "string" && /^\d{2}\.\d{2}\.\d{4}$/.test(v)) {
    const [dd, mm, yyyy] = v.split(".");
    return `${yyyy}-${mm.padStart(2,'0')}-${dd.padStart(2,'0')}`;
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
    ? mapApiSpecialtiesToUI(rawSpecs.map((s: any) => (typeof s === "string" ? s : s?.code ?? s?.label)).filter(Boolean))
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
      gender: data.gender ?? "",  // Keep API format (MALE/FEMALE) for ProfileClient
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
  const { data: me, isLoading: isMeLoading } = useMe();

  // Guard: Check session sync on page load
  useEffect(() => {
    guardApiUser().catch((e) => {
      console.warn(e.message);
      // Optionally show toast: "Oturum yenilendi, lütfen tekrar deneyin."
    });
  }, []);

  // Use SWR with keepPreviousData to prevent form clearing during revalidation
  const { data, error, isLoading, isValidating, mutate } = useSWR(
    me?.role ? ['profile-data', me.role] : null,
    () => fetchProfileData(me?.role),
    {
      revalidateOnFocus: false,
      keepPreviousData: true,     // SWR v2 - prevents data from becoming undefined during revalidation
      revalidateOnMount: true,
      dedupingInterval: 5000,     // Prevent excessive refetches
    }
  );

  const refetch = useCallback(async () => {
    console.debug('[ProfilePage] Refetching profile data...');
    await mutate();
  }, [mutate]);

  return (
    <main
      id="profile-page"
      className="profile-page min-h-screen"
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
        {(isMeLoading || isLoading) && (
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
            <div className="text-red-600 mb-4">{error instanceof Error ? error.message : 'Beklenmeyen bir hata oluştu'}</div>
            <button
              onClick={refetch}
              className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
            >
              Tekrar Dene
            </button>
          </div>
        )}

        {!isLoading && !error && data && (
          <ProfileClient
            initialProfile={data}
            theme={THEME}
            onSaved={(fresh) => {
              // Optimistic update: update SWR cache immediately
              mutate(fresh, { revalidate: false });
              // Then revalidate in background
              mutate();
            }}
            onDemandRefetch={refetch}
            isValidating={isValidating}
          />
        )}
      </div>
    </main>
  );
}

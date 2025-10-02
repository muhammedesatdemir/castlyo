'use client';

import { fetcher } from '@/lib/fetcher';
import useSWRInfinite from 'swr/infinite';
import { useMemo } from 'react';
import Image from 'next/image';
import { montserratDisplay } from '@/lib/fonts';

type TalentCard = {
  id: string;
  firstName: string;
  lastName: string;
  city: string | null;
  profileImage: string | null;
  specialties: string[];
  createdAt?: string;
  updatedAt?: string;
  isMe?: boolean;
};

// Specialty mapping
const SPECIALTY_MAP: Record<string, string> = {
  THEATER: "Tiyatro",
  DANCE: "Dans", 
  MUSIC: "Müzik",
  VOICE_OVER: "Dublaj",
  ACTING: "Oyunculuk",
  MODELING: "Modellik"
};

const trSpecialties = (arr?: string[]) =>
  (arr ?? []).map((s) => SPECIALTY_MAP[s] ?? s);

const PAGE_SIZE = 12;

// Feature flag: Backend endpoint hazır olana kadar liste isteği yapma
const ENABLE_INDEX = process.env.NEXT_PUBLIC_TALENTS_INDEX_API === 'true';

const getKey = (index: number) =>
  ENABLE_INDEX ? `/api/proxy/api/v1/talents?limit=${PAGE_SIZE}&offset=${index * PAGE_SIZE}&order=-updated_at` : null;

function sortByNewest(a: TalentCard, b: TalentCard) {
  const ak = new Date(a.updatedAt ?? a.createdAt ?? 0).getTime();
  const bk = new Date(b.updatedAt ?? b.createdAt ?? 0).getTime();
  return bk - ak;
}

function dedupeById(list: TalentCard[]) {
  const map = new Map<string, TalentCard>();
  for (const item of list) map.set(item.id, item);
  return Array.from(map.values());
}

export default function TalentsPage() {
  const { data, size, setSize, isValidating, error } = useSWRInfinite<TalentCard[] | null>(getKey, fetcher, {
    shouldRetryOnError: false,
    revalidateOnFocus: false
  });
  const flat = useMemo(() => dedupeById((data ?? []).filter((page): page is TalentCard[] => page !== null).flat()).sort(sortByNewest), [data]);
  const isEmpty = (data?.[0]?.length ?? 0) === 0;
  const isReachingEnd =
    isEmpty || (data && data[data.length - 1] && data[data.length - 1] !== null && data[data.length - 1]!.length < PAGE_SIZE);

  // Index kapalıysa bilgilendirici mesaj göster
  if (!ENABLE_INDEX) {
    return (
      <main className="max-w-6xl mx-auto px-4 py-8">
        <h1 className={montserratDisplay.className + " text-2xl font-bold text-white mb-6"}>
          Tüm Yetenekler
        </h1>
        <div className="rounded-xl border border-neutral-800 p-6 text-neutral-300 text-center">
          Yetenek listesi henüz hazır değil. Yakında aktif olacak!
        </div>
      </main>
    );
  }

  if (error) {
    return (
      <main className="max-w-6xl mx-auto px-4 py-8">
        <div className="p-6 text-neutral-300">Liste yüklenemedi.</div>
      </main>
    );
  }

  return (
    <main className="max-w-6xl mx-auto px-4 py-8">
      <h1 className={montserratDisplay.className + " text-2xl font-bold text-white mb-6"}>
        Tüm Yetenekler
      </h1>

      {!data && (
        <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="h-72 rounded-2xl bg-neutral-800/40 animate-pulse" />
          ))}
        </div>
      )}

      {!!flat.length && (
        <>
          <div className="grid gap-6 grid-cols-1 sm:grid-cols-2 lg:grid-cols-4">
            {flat.map((t) => (
              <article key={t.id} className="rounded-2xl bg-neutral-900 border border-neutral-800 overflow-hidden">
                <div className="aspect-[4/3] bg-neutral-800 relative">
                  <Image
                    alt={`${t.firstName} ${t.lastName}`}
                    src={t.profileImage ?? '/images/placeholder-profile.png'}
                    fill
                    className="object-cover"
                    unoptimized
                  />
                </div>
                <div className="p-4">
                  <div className="flex items-center gap-2">
                    <h3 className={montserratDisplay.className + " font-semibold text-white"}>
                      {t.firstName} {t.lastName}
                    </h3>
                    {t.isMe && (
                      <span className="text-xs px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-300">
                        Ben
                      </span>
                    )}
                  </div>
                  <p className="text-sm text-neutral-400 mt-1">
                    {t.city ? `Yetenek · ${t.city}` : 'Yetenek'}
                  </p>
                  <div className="flex flex-wrap gap-2 mt-3">
                    {trSpecialties(t.specialties ?? []).slice(0, 3).map((sp, idx) => (
                      <span key={`${sp}-${idx}`} className="text-xs px-2 py-0.5 rounded-full bg-neutral-800 text-neutral-300">
                        {sp}
                      </span>
                    ))}
                  </div>
                </div>
              </article>
            ))}
          </div>

          <div className="flex justify-center mt-8">
            <button
              disabled={Boolean(isValidating || isReachingEnd)}
              onClick={() => setSize(size + 1)}
              className="px-4 py-2 rounded-full bg-neutral-800 text-neutral-100 hover:bg-neutral-700 disabled:opacity-50 transition"
            >
              {isReachingEnd ? 'Hepsi yüklendi' : 'Daha Fazla Yükle'}
            </button>
          </div>
        </>
      )}

      {!flat.length && !!data && (
        <div className="rounded-xl border border-neutral-800 p-6 text-neutral-300 text-center">
          Gösterilecek profil bulunamadı.
        </div>
      )}
    </main>
  );
}

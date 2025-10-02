'use client';

import useSWR from 'swr';
import Link from 'next/link';
import { fetcher } from '@/lib/fetcher';
import { motion } from 'framer-motion';
import Image from 'next/image';
import { useRouter, useSearchParams } from 'next/navigation';
import { montserratDisplay } from '@/lib/fonts';
import { ALL_OPTION, CATEGORIES, normalizeSkill, type SkillSlug } from '@/constants/categories';

type TalentCard = {
  id: string;
  firstName: string;
  lastName: string;
  city: string | null;
  profileImage: string | null;
  specialties: string[];     // backend enumlar: THEATER, DANCE, MUSIC, VOICE_OVER...
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

// Map specialty to filter slug
function mapSpecialtyToFilterSlug(s: string): SkillSlug | null {
  switch (s) {
    case 'THEATER':    return 'tiyatro';
    case 'DANCE':      return 'dans';
    case 'MUSIC':      return 'muzik';
    case 'VOICE_OVER': return 'dublaj';
    case 'ACTING':     return 'oyunculuk';
    case 'MODELING':   return 'modellik';
    // Also handle Turkish versions
    case 'Tiyatro':    return 'tiyatro';
    case 'Dans':       return 'dans';
    case 'Müzik':      return 'muzik';
    case 'Dublaj':     return 'dublaj';
    case 'Oyunculuk':  return 'oyunculuk';
    case 'Modellik':   return 'modellik';
    default:           return null;
  }
}

function mapSpecialtiesToSlugs(list: string[]): SkillSlug[] {
  return Array.from(
    new Set(list.map(mapSpecialtyToFilterSlug).filter(Boolean) as SkillSlug[])
  );
}

// Map slug to badge text
function mapSlugToBadge(slug: SkillSlug): string {
  switch (slug) {
    case 'tiyatro': return 'Tiyatro';
    case 'oyunculuk': return 'Oyuncu';
    case 'modellik': return 'Model';
    case 'dans': return 'Dans';
    case 'dublaj': return 'Dublaj';
    case 'muzik': return 'Müzik';
  }
}

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

export default function ExploreGrid() {
  const router = useRouter();
  const params = useSearchParams();
  
  // Feature flag: Backend endpoint hazır olana kadar liste isteği yapma
  const ENABLE_INDEX = process.env.NEXT_PUBLIC_TALENTS_INDEX_API === 'true';
  const LIST_URL = '/api/proxy/api/v1/talents?limit=12&order=-updated_at';
  
  // ❶ Tüm yetenekleri çekmeye çalış (flag açıksa)
  const { data: allTalents, error } = useSWR<TalentCard[] | null>(
    ENABLE_INDEX ? LIST_URL : null, // FLAG: null => hiç istek atılmaz
    fetcher,
    { shouldRetryOnError: false, revalidateOnFocus: false }
  );

  // ❂ Me (kendim) fallback — backend list endpoint hazır değilse en azından kendi kartımı göstereyim
  const { data: me } = useSWR<TalentCard>(
    '/api/proxy/api/v1/profiles/talent/me',
    fetcher
  );

  // URL'den mevcut skill parametresini oku ve normalize et
  const currentSkill = (normalizeSkill(params.get('skill') ?? '') ?? 'all') as SkillSlug | 'all';

  const setSkill = (slug: SkillSlug | 'all') => {
    const sp = new URLSearchParams(params.toString());
    if (slug === 'all') {
      sp.delete('skill');
    } else {
      sp.set('skill', slug);
    }
    router.push(`/?${sp.toString()}#discover`, { scroll: false });
  };

  // ❸ Kaynakları birleştir (me + server), duplicate'leri kaldır, en yeni üste
  const serverCards = ENABLE_INDEX && Array.isArray(allTalents) ? allTalents : [];
  let merged: TalentCard[] = [];
  
  if (me && me.id) {
    const meWithFlag = { ...me, isMe: true };
    merged = dedupeById([meWithFlag, ...serverCards]);
  } else {
    merged = serverCards;
  }
  merged = merged.sort(sortByNewest);

  // Apply filtering
  const filtered = currentSkill === 'all' 
    ? merged 
    : merged.filter(card => 
        mapSpecialtiesToSlugs(card.specialties || []).includes(currentSkill)
      );

  // ❹ Ekrandaki 12'yi sınırla
  const limited = filtered.slice(0, 12);

  const isLoading = !error && !me && (ENABLE_INDEX ? !allTalents : false);
  
  // "Tümünü Gör" butonu sadece index açıksa ve 12+ kayıt varsa
  const total = ENABLE_INDEX ? filtered.length : (me ? 1 : 0);
  const hasMore = ENABLE_INDEX && total > 12;

  // Chip bileşeni
  const Chip = ({ slug, label }: { slug: SkillSlug | 'all'; label: string }) => {
    const selected = currentSkill === slug;
    return (
        <button
          onClick={() => setSkill(slug)}
          aria-selected={selected}
          className={montserratDisplay.className + " px-4 py-2 rounded-full text-sm md:text-[15px] font-semibold focus:outline-none focus:ring-2 focus:ring-white/20 transition-colors " + 
            (selected 
              ? "bg-[#F6E6C3] text-[#29231A]" 
              : "bg-white/10 text-white/90 hover:bg-white/15")
          }
        >
          {label}
        </button>
    );
  };

  if (isLoading) {
    return (
      <section className="bg-black text-white py-20" id="discover">
        <div className="mx-auto max-w-6xl px-6">
          <div className="text-center mb-12">
            <h2 className={montserratDisplay.className + " text-center text-3xl md:text-5xl font-extrabold tracking-tight text-white"}>
              Yetenekleri ve Fırsatları Keşfet
            </h2>
            <p className="mt-3 max-w-3xl mx-auto text-center text-base md:text-lg text-white/80">
              Oyuncular, modeller ve ajanslar tek platformda buluşuyor. İlanları incele, fırsatları yakala!
            </p>
          </div>

          {/* Filtre pill'leri */}
          <div className="mt-6 flex flex-wrap items-center justify-center gap-3">
            <Chip slug={'all'} label={ALL_OPTION.label} />
            {CATEGORIES.map(category => (
              <Chip key={category.slug} slug={category.slug} label={category.filterLabel} />
            ))}
          </div>

          <div className="mt-10 grid gap-6 md:gap-8 grid-cols-1 sm:grid-cols-2 lg:grid-cols-4">
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="h-72 rounded-2xl bg-neutral-800/40 animate-pulse" />
            ))}
          </div>
        </div>
      </section>
    );
  }

  if (!limited.length) {
    return (
      <section className="bg-black text-white py-20" id="discover">
        <div className="mx-auto max-w-6xl px-6">
          <div className="text-center mb-12">
            <h2 className={montserratDisplay.className + " text-center text-3xl md:text-5xl font-extrabold tracking-tight text-white"}>
              Yetenekleri ve Fırsatları Keşfet
            </h2>
            <p className="mt-3 max-w-3xl mx-auto text-center text-base md:text-lg text-white/80">
              Oyuncular, modeller ve ajanslar tek platformda buluşuyor. İlanları incele, fırsatları yakala!
            </p>
          </div>

          {/* Filtre pill'leri */}
          <div className="mt-6 flex flex-wrap items-center justify-center gap-3">
            <Chip slug={'all'} label={ALL_OPTION.label} />
            {CATEGORIES.map(category => (
              <Chip key={category.slug} slug={category.slug} label={category.filterLabel} />
            ))}
          </div>

          <div className="mt-10 rounded-xl border border-neutral-800 p-6 text-neutral-300 text-center">
            Henüz keşfedilecek bir profil yok.
          </div>
        </div>
      </section>
    );
  }

  return (
    <section className="bg-black text-white py-20" id="discover">
      <div className="mx-auto max-w-6xl px-6">
        <div className="text-center mb-12">
          {/* Başlık */}
          <h2 className={montserratDisplay.className + " text-center text-3xl md:text-5xl font-extrabold tracking-tight text-white"}>
            Yetenekleri ve Fırsatları Keşfet
          </h2>

          {/* Alt başlık */}
          <p className="mt-3 max-w-3xl mx-auto text-center text-base md:text-lg text-white/80">
            Oyuncular, modeller ve ajanslar tek platformda buluşuyor. İlanları incele, fırsatları yakala!
          </p>
        </div>

        {/* Filtre pill'leri (erişilebilirlik + aktif stil) */}
        <div className="mt-6 flex flex-wrap items-center justify-center gap-3">
          {/* Tümü çipi */}
          <Chip slug={'all'} label={ALL_OPTION.label} />
          
          {/* Kategori çipleri */}
          {CATEGORIES.map(category => (
            <Chip key={category.slug} slug={category.slug} label={category.filterLabel} />
          ))}
        </div>

        <div className="space-y-6 mt-10">
          {/* Kartlar */}
          <div className="grid gap-6 md:gap-8 grid-cols-1 sm:grid-cols-2 lg:grid-cols-4">
            {limited.map((t, i) => (
              <motion.article
                key={t.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.1 }}
                whileHover={{ y: -8, transition: { duration: 0.2 } }}
                className="overflow-hidden rounded-2xl bg-[#121212] ring-1 ring-white/5
                           transition-all duration-200 hover:-translate-y-1 hover:shadow-xl"
              >
                <div className="relative aspect-[4/5]">
                  <Image 
                    src={t.profileImage ?? '/images/placeholder-profile.png'} 
                    alt={`${t.firstName} ${t.lastName}`}
                    fill
                    className="object-cover"
                    unoptimized
                  />
                </div>
                
                <div className="p-4">
                  {/* İsim */}
                  <div className="flex items-center gap-2">
                    <h3 className={montserratDisplay.className + " text-white text-lg md:text-xl font-bold tracking-tight"}>
                      {t.firstName} {t.lastName}
                    </h3>
                    {t.isMe && (
                      <span className="text-xs px-2 py-0.5 rounded-full bg-emerald-600/20 text-emerald-300 border border-emerald-600/40">
                        Ben
                      </span>
                    )}
                  </div>

                  {/* Rol • Şehir */}
                  <p className={montserratDisplay.className + " mt-1.5 text-white/80 text-[13px] md:text-sm font-medium"}>
                    {t.city ? `Yetenek · ${t.city}` : 'Yetenek'}
                  </p>
                  
                  {/* Etiketler */}
                  <div className="profile-tags mt-2.5 flex flex-wrap gap-2">
                    {trSpecialties(t.specialties ?? []).slice(0, 3).map((sp, idx) => (
                      <span
                        key={`${sp}-${idx}`}
                        className={montserratDisplay.className + " text-[11px] font-semibold px-2 py-1 rounded-md bg-white/8 text-white/85"}
                      >
                        {sp}
                      </span>
                    ))}
                  </div>

                  {/* Gizlilik rozeti */}
                  <div className="mt-3">
                    <span className={montserratDisplay.className + " inline-flex items-center gap-1 text-[11px] font-semibold px-2 py-1 rounded-md bg-green-500/15 text-green-300"}>
                      🔒 İletişim gizli
                    </span>
                  </div>
                </div>
              </motion.article>
            ))}
          </div>

          {/* Tümünü Gör */}
          {hasMore && (
            <div className="flex justify-center">
              <Link
                href="/talents"
                className="px-4 py-2 rounded-full bg-amber-200/10 text-amber-200 hover:bg-amber-200/20 transition"
              >
                Tümünü Gör
              </Link>
            </div>
          )}
        </div>
      </div>
    </section>
  );
}
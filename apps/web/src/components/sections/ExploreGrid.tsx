'use client';

import useSWR from 'swr';
import Link from 'next/link';
import { fetcher } from '@/lib/fetcher';
import { motion } from 'framer-motion';
import Image from 'next/image';
import { useRouter, useSearchParams } from 'next/navigation';
import { useSession } from 'next-auth/react';
import { montserratDisplay } from '@/lib/fonts';
import { ALL_OPTION, CATEGORIES, normalizeSkill, type SkillSlug } from '@/constants/categories';
import { normalizeList, toCard, type TalentCard } from '@/utils/talent-mapper';
import React from 'react';

// URL'deki skill paramı TR -> kod eşleşmesi
const SKILL_CODE_BY_SLUG: Record<string, string[]> = {
  tum: [], // hepsi
  tiyatro: ['THEATRE', 'ACTING'],   // tiyatroda oynayanlar da görülsün istiyorsan ACTING'i ekle
  oyunculuk: ['ACTING'],
  modellik: ['MODELING'],
  dans: ['DANCE'],
  dublaj: ['VOICE_OVER'],
  muzik: ['MUSIC'],
};

// Specialty mapping for display
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
  // Since TalentCard doesn't have timestamps, just return 0 for stable sort
  return 0;
}

function dedupeById(list: TalentCard[]) {
  const map = new Map<string, TalentCard>();
  for (const item of list) map.set(item.id, item);
  return Array.from(map.values());
}

export default function ExploreGrid() {
  const router = useRouter();
  const params = useSearchParams();
  
  // Discover artık her zaman aktif - tüm yayınlanmış profilleri göster
  const ENABLE_INDEX = true; // Her zaman aktif
  const LIST_URL = '/api/proxy/api/v1/profiles/talents?limit=12&order=-updated_at';
  
  // ❶ Tüm yayınlanmış yetenekleri çek
  const { data: rawTalents, error } = useSWR<any>(
    LIST_URL,
    fetcher,
    { shouldRetryOnError: false, revalidateOnFocus: false }
  );


  // API response'u normalize et ve kart formatına çevir
  const slug = (params.get('skill') || 'tum')
    .toString()
    .toLocaleLowerCase('tr')
    .replace(/\s+/g, '-');
  
  const serverList = normalizeList(rawTalents);
  const cards = serverList.map(toCard);

  // ✅ TEK filtre kaynağı: normalize edilmiş uzmanlık KODLARI
  const filteredByCode = React.useMemo(() => {
    const want = SKILL_CODE_BY_SLUG[slug] || [];
    if (!want.length) return cards;
    return cards.filter(c => c.specialtyCodes?.some(code => want.includes(code)));
  }, [cards, slug]);

  // Boş kartları ayıkla (görseli veya adı olanlar)
  const allTalents: TalentCard[] = filteredByCode.filter(c => c.name || c.imageUrl);

  // ❂ Me (kendim) - sadece kendi kartımı işaretlemek için
  // Only fetch talent profile if user is a talent
  const { data: session } = useSession();
  const isTalent = (session?.user as any)?.role === 'TALENT';
  
  const { data: rawMe } = useSWR<any>(
    isTalent ? '/api/proxy/api/v1/users/me' : null,
    fetcher,
    { 
      shouldRetryOnError: (err) => err?.status !== 404, // 404'te retry yapma
      revalidateOnFocus: false 
    }
  );

  // Me verisini de mapper ile işle
  const me: TalentCard | null = rawMe ? toCard(rawMe) : null;

  // URL'den mevcut skill parametresini oku
  const currentSkill = slug;

  const setSkill = (newSlug: string) => {
    const sp = new URLSearchParams(params.toString());
    if (newSlug === 'tum') {
      sp.delete('skill');
    } else {
      sp.set('skill', newSlug);
    }
    router.push(`/?${sp.toString()}#discover`, { scroll: false });
  };

  // Kendi kartımı işaretle
  let merged: TalentCard[] = allTalents;
  if (me && me.id) {
    merged = allTalents.map(card => 
      card.id === me.id ? { ...card, isMe: true } : card
    );
  }

  // ❹ Ekrandaki 12'yi sınırla  
  const limited = merged.slice(0, 12);

  const isLoading = !error && !rawTalents;
  
  // "Tümünü Gör" butonu 12+ kayıt varsa
  const total = merged.length;
  const hasMore = total > 12;

  // Helper function to get chip label
  const chipLabel = (slug: string) => {
    const labels: Record<string, string> = {
      tum: 'Tümü',
      tiyatro: 'Tiyatro',
      oyunculuk: 'Oyuncu',
      modellik: 'Model',
      dans: 'Dansçı',
      dublaj: 'Dublaj Sanatçısı',
      muzik: 'Müzisyen',
    };
    return labels[slug] || 'Seçim';
  };

  // Chip bileşeni
  const Chip = ({ slug, label }: { slug: string; label: string }) => {
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
            <Chip slug={'tum'} label={ALL_OPTION.label} />
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
            <Chip slug={'tum'} label={ALL_OPTION.label} />
            {CATEGORIES.map(category => (
              <Chip key={category.slug} slug={category.slug} label={category.filterLabel} />
            ))}
          </div>

          <div className="mt-10 rounded-xl border border-neutral-800 p-6 text-neutral-300 text-center">
            {currentSkill === 'tum' 
              ? "Henüz yayınlanmış profil yok. İlk sen ol!" 
              : `${chipLabel(currentSkill)} alanında henüz yayınlanmış profil yok.`
            }
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
                    src={t.imageUrl ?? '/images/avatar-placeholder.png'} 
                    alt={t.name}
                    fill
                    className="object-cover"
                    unoptimized
                  />
                </div>
                
                <div className="p-4">
                  {/* İsim */}
                  <div className="flex items-center gap-2">
                    <h3 className={montserratDisplay.className + " text-white text-lg md:text-xl font-bold tracking-tight"}>
                      {t.name}
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
                    {t.tags.slice(0, 3).map((sp: string, idx: number) => (
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
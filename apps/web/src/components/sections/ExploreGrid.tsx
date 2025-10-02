'use client'

import { useState, useEffect, useMemo } from 'react'
import { motion } from 'framer-motion'
import Image from 'next/image'
import { useRouter, useSearchParams } from 'next/navigation'
import { montserratDisplay } from '@/lib/fonts'
import { ALL_OPTION, CATEGORIES, normalizeSkill, type SkillSlug } from '@/constants/categories'
import { talentsApi } from '@/lib/api'


// Basit tip
type TalentCard = {
  id: string;
  name: string;
  city?: string | null;
  avatar?: string | null;
  specialties: string[];
  isMe?: boolean;
  firstName?: string;
  lastName?: string;
  profilePicture?: string;
  image?: string;
  role?: string;
  skills?: string[];
  isNew?: boolean;
  createdAt?: string;
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

// fallback avatar
const FALLBACK_AVATAR = "/avatars/default-avatar.png";

export default function ExploreGrid() {
  const router = useRouter()
  const params = useSearchParams()
  const [talents, setTalents] = useState<any[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [meCard, setMeCard] = useState<TalentCard | null>(null)
  
  // URL'den mevcut skill parametresini oku ve normalize et
  const currentSkill = (normalizeSkill(params.get('skill') ?? '') ?? 'all') as SkillSlug | 'all'

  const setSkill = (slug: SkillSlug | 'all') => {
    const sp = new URLSearchParams(params.toString())
    if (slug === 'all') {
      sp.delete('skill')
    } else {
      sp.set('skill', slug)
    }
    router.push(`/?${sp.toString()}`, { scroll: false })
  }

  // API'den talents'ları fetch et (geçici olarak devre dışı)
  const fetchTalents = async () => {
    try {
      setLoading(true)
      setError(null)
      
      // Geçici olarak API çağrısını devre dışı bırak
      // TODO: API hazır olduğunda bu kısmı aktif et
      /*
      const params: any = {
        page: 1,
        limit: 12,
      }
      
      // Skill filtresi ekle
      if (currentSkill !== 'all') {
        params.skills = currentSkill
      }
      
      const response = await talentsApi.getTalents(params)
      setTalents(response.data?.hits || [])
      */
      
      // Şimdilik mock data kullan
      console.log('Using mock data for talents (API not ready)')
      setTalents(mockTalents.filter(talent => 
        currentSkill === 'all' || talent.skillSlug === currentSkill
      ))
      
    } catch (err: any) {
      console.error('Talents fetch error:', err)
      setError('Yetenekler yüklenirken hata oluştu')
      
      // Mock data kullan
      setTalents(mockTalents.filter(talent => 
        currentSkill === 'all' || talent.skillSlug === currentSkill
      ))
    } finally {
      setLoading(false)
    }
  }

  // Fetch user's own profile card
  useEffect(() => {
    let alive = true;
    (async () => {
      try {
        const r = await fetch("/api/proxy/api/v1/profiles/talent/me");
        if (!r.ok) return;
        const p = await r.json();
        if (!alive) return;

        const card: TalentCard = {
          id: p.id,
          name: [p.firstName, p.lastName].filter(Boolean).join(" "),
          city: p.city ?? undefined,
          avatar: p.profileImage || FALLBACK_AVATAR,
          specialties: trSpecialties(p.specialties),
          isMe: true,
          firstName: p.firstName,
          lastName: p.lastName,
          profilePicture: p.profileImage,
          role: "Yetenek"
        };
        setMeCard(card);
      } catch (_) {
        // sessizce geç
      }
    })();
    return () => {
      alive = false;
    };
  }, []);

  // URL parametresi değiştiğinde yeniden fetch et
  useEffect(() => {
    fetchTalents()
  }, [currentSkill])

  // Şimdilik mock data ile filtrele (API entegrasyonu sonraki adım)
  const mockTalents = [
    {
      id: 1,
      name: "Ayşe Demir",
      role: "Oyuncu",
      city: "İstanbul",
      image: "/mock/talents/oyuncu1.jpg",
      isNew: true,
      skills: ["Tiyatro", "Sinema"],
      skillSlug: "oyunculuk"
    },
    {
      id: 2,
      name: "Elif Kaya",
      role: "Model",
      city: "Ankara",
      image: "/mock/talents/oyuncu2.jpg",
      isNew: true,
      skills: ["Moda", "Reklam"],
      skillSlug: "modellik"
    },
    {
      id: 3,
      name: "Zeynep Yılmaz",
      role: "Oyuncu",
      city: "İzmir",
      image: "/mock/talents/oyuncu3.jpg",
      isNew: true,
      skills: ["Dizi", "Reklam"],
      skillSlug: "oyunculuk"
    },
    {
      id: 4,
      name: "Murat Özkan",
      role: "Tiyatrocu",
      city: "Bursa",
      image: "/mock/talents/oyuncu4.jpg",
      isNew: false,
      skills: ["Sinema", "Tiyatro"],
      skillSlug: "tiyatro"
    },
    {
      id: 5,
      name: "Selin Arslan",
      role: "Müzisyen",
      city: "İstanbul", 
      image: "/mock/talents/oyuncu1.jpg",
      isNew: false,
      skills: ["Vokal", "Piyano"],
      skillSlug: "muzik"
    },
    {
      id: 6,
      name: "Can Erdoğan",
      role: "Dansçı",
      city: "Ankara",
      image: "/mock/talents/oyuncu4.jpg", 
      isNew: false,
      skills: ["Modern", "Halk Oyunları"],
      skillSlug: "dans"
    },
    {
      id: 7,
      name: "Deniz Toprak",
      role: "Model",
      city: "İzmir",
      image: "/mock/talents/oyuncu2.jpg",
      isNew: false,
      skills: ["Katalog", "Editorial"],
      skillSlug: "modellik"
    },
    {
      id: 8,
      name: "Gizem Çelik",
      role: "Oyuncu",
      city: "İstanbul",
      image: "/mock/talents/oyuncu3.jpg",
      isNew: false,
      skills: ["Komedi", "Drama"],
      skillSlug: "oyunculuk"
    },
    {
      id: 9,
      name: "Ahmet Yıldız",
      role: "Dublaj Sanatçısı",
      city: "İstanbul",
      image: "/mock/talents/oyuncu4.jpg",
      isNew: true,
      skills: ["Karakter Dublajı", "Belgesel"],
      skillSlug: "dublaj"
    }
  ]

  // meCard varsa başa ekle
  const displayTalents: TalentCard[] = useMemo(() => {
    const base = talents.length > 0 ? talents.map((m) => ({
      id: m.id,
      name: m.firstName ? `${m.firstName} ${m.lastName || ''}` : m.name,
      city: m.city,
      avatar: m.profilePicture || m.image,
      specialties: m.skills || m.specialties || [],
      firstName: m.firstName,
      lastName: m.lastName,
      profilePicture: m.profilePicture,
      image: m.image,
      role: m.role,
      skills: m.skills,
      isNew: m.isNew,
      createdAt: m.createdAt
    })) : [];
    return meCard ? [meCard, ...base] : base;
  }, [talents, meCard]);

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

      {/* Loading state */}
      {loading && (
        <div className="mt-10 text-center">
          <div className="text-white/60">Yetenekler yükleniyor...</div>
        </div>
      )}

      {/* Error state */}
      {error && !loading && (
        <div className="mt-10 text-center">
          <div className="text-red-400 text-sm">{error}</div>
        </div>
      )}

      {/* Kartlar */}
      {!loading && (
        <div className="mt-10 grid gap-6 md:gap-8 grid-cols-1 sm:grid-cols-2 lg:grid-cols-4">
          {displayTalents.map((talent, i) => (
            <motion.article
              key={`${talent.isMe ? "me-" : ""}${talent.id || i}-${currentSkill}`}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.1 }}
              whileHover={{ y: -8, transition: { duration: 0.2 } }}
              className="overflow-hidden rounded-2xl bg-[#121212] ring-1 ring-white/5
                         transition-all duration-200 hover:-translate-y-1 hover:shadow-xl"
            >
              <div className="relative aspect-[4/5]">
                <Image 
                  src={talent.avatar || talent.profilePicture || talent.image || FALLBACK_AVATAR} 
                  alt={talent.name || 'Talent'}
                  fill
                  className="object-cover"
                  unoptimized
                />
                {/* "Yeni" rozeti varsa */}
                {(talent.isNew || talent.createdAt) && !talent.isMe && (
                  <span className={montserratDisplay.className + " absolute top-3 right-3 rounded-full bg-[#C0713A] text-white/95 text-[11px] font-semibold px-2 py-1 shadow-sm"}>
                    Yeni
                  </span>
                )}
              </div>
              
              <div className="p-4">
                {/* İsim */}
                <div className="flex items-center gap-2">
                  <h3 className={montserratDisplay.className + " text-white text-lg md:text-xl font-bold tracking-tight"}>
                    {talent.name}
                  </h3>
                  {talent.isMe && (
                    <span className="text-xs px-2 py-0.5 rounded-full bg-emerald-600/20 text-emerald-300 border border-emerald-600/40">
                      Ben
                    </span>
                  )}
                </div>

                {/* Rol • Şehir */}
                <p className={montserratDisplay.className + " mt-1.5 text-white/80 text-[13px] md:text-sm font-medium"}>
                  {talent.role || 'Yetenek'} • {talent.city}
                </p>
                
                {/* Etiketler */}
                <div className="profile-tags mt-2.5 flex flex-wrap gap-2">
                  {(talent.skills || talent.specialties || []).slice(0, 3).map((skill: string, idx: number) => (
                    <span
                      key={`${skill}-${idx}`}
                      className={montserratDisplay.className + " text-[11px] font-semibold px-2 py-1 rounded-md bg-white/8 text-white/85"}
                    >
                      {skill}
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
      )}

      </div>
    </section>
  )
}

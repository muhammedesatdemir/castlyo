'use client'

import { useState } from 'react'
import { motion } from 'framer-motion'
import Image from 'next/image'
import { montserratDisplay } from '@/lib/fonts'

const talents = [
  {
    id: 1,
    name: "Ayşe Demir",
    role: "Oyuncu",
    city: "İstanbul",
    image: "/mock/talents/oyuncu1.jpg",
    isNew: true,
    skills: ["Tiyatro", "Sinema"]
  },
  {
    id: 2,
    name: "Elif Kaya",
    role: "Model",
    city: "Ankara",
    image: "/mock/talents/oyuncu2.jpg",
    isNew: true,
    skills: ["Moda", "Reklam"]
  },
  {
    id: 3,
    name: "Zeynep Yılmaz",
    role: "Oyuncu",
    city: "İzmir",
    image: "/mock/talents/oyuncu3.jpg",
    isNew: true,
    skills: ["Dizi", "Reklam"]
  },
  {
    id: 4,
    name: "Murat Özkan",
    role: "Oyuncu",
    city: "Bursa",
    image: "/mock/talents/oyuncu4.jpg",
    isNew: false,
    skills: ["Sinema", "Tiyatro"]
  },
  {
    id: 5,
    name: "Selin Arslan",
    role: "Müzisyen",
    city: "İstanbul", 
    image: "/mock/talents/oyuncu1.jpg",
    isNew: false,
    skills: ["Vokal", "Piyano"]
  },
  {
    id: 6,
    name: "Can Erdoğan",
    role: "Dansçı",
    city: "Ankara",
    image: "/mock/talents/oyuncu4.jpg", 
    isNew: false,
    skills: ["Modern", "Halk Oyunları"]
  },
  {
    id: 7,
    name: "Deniz Toprak",
    role: "Model",
    city: "İzmir",
    image: "/mock/talents/oyuncu2.jpg",
    isNew: false,
    skills: ["Katalog", "Editorial"]
  },
  {
    id: 8,
    name: "Gizem Çelik",
    role: "Oyuncu",
    city: "İstanbul",
    image: "/mock/talents/oyuncu3.jpg",
    isNew: false,
    skills: ["Komedi", "Drama"]
  }
]

export default function ExploreGrid() {
  const [selectedFilter, setSelectedFilter] = useState('Tümü')
  const filters = ['Tümü', 'Oyuncu', 'Model', 'Müzisyen', 'Dansçı']

  // Filtreleme mantığı
  const filteredTalents = selectedFilter === 'Tümü' 
    ? talents 
    : talents.filter(talent => talent.role === selectedFilter)

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
          {filters.map((filter) => {
            const active = filter === selectedFilter;
            return (
              <button
                key={filter}
                aria-selected={active}
                onClick={() => setSelectedFilter(filter)}
                className={montserratDisplay.className + " px-4 py-2 rounded-full text-sm md:text-[15px] font-semibold focus:outline-none focus:ring-2 focus:ring-white/20 " + 
                  (active 
                    ? "bg-[#F6E6C3] text-[#29231A]" 
                    : "bg-white/10 text-white/90 hover:bg-white/15")
                }
              >
                {filter}
              </button>
            );
          })}
        </div>

      {/* Kartlar */}
      <div className="mt-10 grid gap-6 md:gap-8 grid-cols-1 sm:grid-cols-2 lg:grid-cols-4">
        {filteredTalents.map((talent, i) => (
          <motion.article
            key={`${talent.id}-${selectedFilter}`}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.1 }}
            whileHover={{ y: -8, transition: { duration: 0.2 } }}
            className="overflow-hidden rounded-2xl bg-[#121212] ring-1 ring-white/5
                       transition-all duration-200 hover:-translate-y-1 hover:shadow-xl"
          >
            <div className="relative aspect-[4/5]">
              <Image 
                src={talent.image} 
                alt={talent.name}
                fill
                className="object-cover"
                unoptimized
              />
              {/* "Yeni" rozeti varsa */}
              {talent.isNew && (
                <span className={montserratDisplay.className + " absolute top-3 right-3 rounded-full bg-[#C0713A] text-white/95 text-[11px] font-semibold px-2 py-1 shadow-sm"}>
                  Yeni
                </span>
              )}
            </div>
            
            <div className="p-4">
              {/* İsim */}
              <h3 className={montserratDisplay.className + " text-white text-lg md:text-xl font-bold tracking-tight"}>
                {talent.name}
              </h3>

              {/* Rol • Şehir */}
              <p className={montserratDisplay.className + " mt-1.5 text-white/80 text-[13px] md:text-sm font-medium"}>
                {talent.role} • {talent.city}
              </p>
              
              {/* Etiketler */}
              <div className="mt-2.5 flex flex-wrap gap-2">
                {talent.skills?.map((skill: string) => (
                  <span
                    key={skill}
                    className={montserratDisplay.className + " text-[11px] font-semibold px-2 py-1 rounded-md bg-white/8 text-white/85"}
                  >
                    {skill}
                  </span>
                ))}
              </div>

              {/* Gizlilik rozetini de daha "sert" gösterelim */}
              <div className="mt-3">
                <span className={montserratDisplay.className + " inline-flex items-center gap-1 text-[11px] font-semibold px-2 py-1 rounded-md bg-green-500/15 text-green-300"}>
                  🔒 İletişim gizli
                </span>
              </div>
            </div>
          </motion.article>
        ))}
      </div>

      </div>
    </section>
  )
}

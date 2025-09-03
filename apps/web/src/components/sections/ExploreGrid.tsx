'use client'

import { motion } from 'framer-motion'
import Image from 'next/image'

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
  return (
    <section className="bg-black text-white py-20" id="explore">
      <div className="mx-auto max-w-6xl px-6">
        <div className="text-center mb-12">
          <p className="text-sm tracking-widest text-[#F6E6C3] mb-3">
            Keşfet
          </p>
          <h2 className="text-4xl font-bold text-white mb-4">
            Yetenekleri ve Fırsatları Keşfet
          </h2>
          <p className="text-white/80 text-lg max-w-3xl mx-auto">
            Oyuncular, modeller ve ajanslar tek platformda buluşuyor. 
            İlanları incele, fırsatları yakala!
          </p>
        </div>

        {/* Filter Chips */}
        <div className="flex flex-wrap justify-center gap-3 mb-12">
          {['Tümü', 'Oyuncu', 'Model', 'Müzisyen', 'Dansçı'].map((filter) => (
            <button
              key={filter}
              className={`px-4 py-2 rounded-full text-sm font-medium transition-all duration-300 ${
                filter === 'Tümü'
                  ? 'bg-gradient-to-r from-[#F6E6C3] to-white text-black shadow-lg'
                  : 'bg-white/10 text-white border border-white/20 hover:bg-white/20'
              }`}
            >
              {filter}
            </button>
          ))}
        </div>

      {/* Talent Grid */}
      <div className="grid gap-6 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
        {talents.map((talent, i) => (
          <motion.div
            key={talent.id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.1 }}
            whileHover={{ y: -8, transition: { duration: 0.2 } }}
            className="group overflow-hidden rounded-2xl border border-white/10 bg-white/5 shadow-lg hover:shadow-xl transition-all duration-300"
          >
            <div className="relative overflow-hidden h-64">
              <Image 
                src={talent.image} 
                alt={talent.name}
                width={400}
                height={256}
                className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
                unoptimized
              />
              {talent.isNew && (
                <div className="absolute top-3 right-3">
                  <span className="rounded-full bg-gradient-to-r from-brand-primary to-brand-secondary px-3 py-1 text-xs font-semibold text-white shadow-lg">
                    Yeni
                  </span>
                </div>
              )}
              
              {/* Hover Overlay */}
              <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                <div className="absolute bottom-4 left-4 right-4">
                  <button className="w-full rounded-lg bg-white/20 py-2 text-sm font-medium text-white backdrop-blur-sm hover:bg-white/30 transition-colors">
                    Profili Görüntüle
                  </button>
                </div>
              </div>
            </div>
            
            <div className="p-4">
              <div className="flex items-center justify-between mb-2">
                <h3 className="font-semibold text-white">
                  {talent.name}
                </h3>
                <div className="flex items-center gap-1">
                  <div className="h-2 w-2 rounded-full bg-green-500"></div>
                  <span className="text-xs text-white/60">Aktif</span>
                </div>
              </div>
              <p className="text-sm text-white/70">
                {talent.role} • {talent.city}
              </p>
              
              {/* Skills/Tags */}
              <div className="mt-3 flex flex-wrap gap-1">
                {talent.skills.map((skill, index) => (
                  <span 
                    key={index}
                    className={`rounded-md px-2 py-1 text-xs ${
                      index === 0 
                        ? 'bg-[#F6E6C3]/20 text-[#F6E6C3]' 
                        : 'bg-white/10 text-white/80'
                    }`}
                  >
                    {skill}
                  </span>
                ))}
              </div>
            </div>
          </motion.div>
        ))}
      </div>

        {/* View More Button */}
        <div className="text-center mt-12">
          <button className="rounded-xl bg-gradient-to-r from-[#F6E6C3] to-white text-black px-8 py-3 font-semibold shadow-lg hover:scale-105 transition-all duration-300 hover:shadow-xl">
            Daha Fazla Keşfet
          </button>
        </div>
      </div>
    </section>
  )
}

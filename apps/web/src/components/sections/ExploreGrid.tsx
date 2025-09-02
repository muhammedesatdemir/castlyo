'use client'

import { motion } from 'framer-motion'

const talents = Array.from({ length: 8 }).map((_, i) => ({
  id: i + 1,
  name: `Yetenek ${i + 1}`,
  role: ['Oyuncu', 'Model', 'Müzisyen', 'Dansçı'][i % 4],
  city: ['İstanbul', 'Ankara', 'İzmir', 'Bursa'][i % 4],
  image: `/placeholders/talent-${(i % 4) + 1}.jpg`,
  isNew: i < 3
}))

export default function ExploreGrid() {
  return (
    <section className="mx-auto max-w-6xl px-6 py-20" id="explore">
      <div className="text-center mb-12">
        <h2 className="text-4xl font-bold bg-gradient-to-r from-gray-900 to-gray-600 bg-clip-text text-transparent dark:from-white dark:to-gray-300">
          Keşfet
        </h2>
        <p className="text-gray-600 dark:text-gray-400 mt-4 text-lg">
          Yeni yüzler, yeni enerjiler, sonsuz olasılıklar
        </p>
      </div>

      {/* Filter Chips */}
      <div className="flex flex-wrap justify-center gap-3 mb-12">
        {['Tümü', 'Oyuncu', 'Model', 'Müzisyen', 'Dansçı'].map((filter) => (
          <button
            key={filter}
            className={`px-4 py-2 rounded-full text-sm font-medium transition-all duration-300 ${
              filter === 'Tümü'
                ? 'bg-gradient-to-r from-brand-primary to-brand-secondary text-white shadow-lg'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200 dark:bg-gray-800 dark:text-gray-300 dark:hover:bg-gray-700'
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
            className="group overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-sm hover:shadow-xl dark:border-gray-800 dark:bg-gray-900 transition-all duration-300"
          >
            <div className="relative overflow-hidden">
              <img 
                src={talent.image} 
                alt={talent.name}
                className="h-64 w-full object-cover transition-transform duration-500 group-hover:scale-110"
                onError={(e) => {
                  const target = e.target as HTMLImageElement;
                  target.src = `https://images.unsplash.com/photo-${1500000000000 + talent.id}?w=400&h=600&fit=crop&crop=face`;
                }}
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
                <h3 className="font-semibold text-gray-900 dark:text-white">
                  {talent.name}
                </h3>
                <div className="flex items-center gap-1">
                  <div className="h-2 w-2 rounded-full bg-green-500"></div>
                  <span className="text-xs text-gray-500 dark:text-gray-400">Aktif</span>
                </div>
              </div>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                {talent.role} • {talent.city}
              </p>
              
              {/* Skills/Tags */}
              <div className="mt-3 flex flex-wrap gap-1">
                <span className="rounded-md bg-brand-50 px-2 py-1 text-xs text-brand-primary dark:bg-brand-900/30 dark:text-brand-300">
                  Deneyimli
                </span>
                <span className="rounded-md bg-brand-100 px-2 py-1 text-xs text-brand-700">
                  Profesyonel
                </span>
              </div>
            </div>
          </motion.div>
        ))}
      </div>

      {/* View More Button */}
      <div className="text-center mt-12">
        <button className="rounded-xl bg-brand-gradient-smooth px-8 py-3 font-semibold text-white shadow-lg hover:scale-105 transition-all duration-300 hover:shadow-xl">
          Daha Fazla Keşfet
        </button>
      </div>
    </section>
  )
}

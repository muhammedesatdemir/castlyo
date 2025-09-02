'use client'

import { motion } from 'framer-motion'
import Link from 'next/link'

interface HeroShowreelProps {
  onSignup: (type: "talent" | "agency") => void
}

export default function HeroShowreel({ onSignup }: HeroShowreelProps) {
  return (
    <section className="relative overflow-hidden min-h-screen flex items-center">
      {/* Video Background */}
      <div className="absolute inset-0">
        <video
          className="h-full w-full object-cover"
          src="/showreel.mp4" 
          autoPlay 
          muted 
          loop 
          playsInline
          poster="/hero-poster.jpg"
        />
      </div>
      
      {/* Dark Overlay + Gradient Glow */}
      <div className="absolute inset-0 bg-gradient-to-b from-black/50 via-black/60 to-[#100822]/90" />
      <div className="pointer-events-none absolute -top-24 left-1/2 h-[520px] w-[520px] -translate-x-1/2 rounded-full bg-[radial-gradient(ellipse_at_center,rgba(150,41,1,0.35),rgba(16,8,8,0))] blur-2xl" />

      <div className="relative mx-auto max-w-6xl px-6 pt-24 pb-32 text-center z-10">
        <motion.p 
          initial={{ opacity: 0, y: 10 }} 
          animate={{ opacity: 1, y: 0 }} 
          transition={{ delay: 0.1 }}
          className="mx-auto inline-flex rounded-full bg-white/10 px-4 py-1 text-sm text-white/80 backdrop-blur-sm"
        >
          Türkiye'nin en canlı casting platformu
        </motion.p>
        
        <motion.h1 
          initial={{ opacity: 0, y: 10 }} 
          animate={{ opacity: 1, y: 0 }} 
          transition={{ delay: 0.2 }}
          className="mt-6 text-5xl font-extrabold tracking-tight text-white md:text-6xl lg:text-7xl"
        >
          Yetenekler{' '}
          <span className="text-brand-gradient-smooth">
            Sahneye
          </span>{' '}
          Çıkıyor
        </motion.h1>
        
        <motion.p 
          initial={{ opacity: 0, y: 10 }} 
          animate={{ opacity: 1, y: 0 }} 
          transition={{ delay: 0.3 }}
          className="mx-auto mt-6 max-w-2xl text-lg text-white/80 md:text-xl"
        >
          Oyuncu, model, müzisyen... Hepsi ajanslarla tek yerde buluşuyor. 
          Güvenli, hızlı, eğlenceli.
        </motion.p>

        <motion.div 
          initial={{ opacity: 0, y: 10 }} 
          animate={{ opacity: 1, y: 0 }} 
          transition={{ delay: 0.4 }}
          className="mt-8 flex flex-col sm:flex-row items-center justify-center gap-4"
        >
          <button
            onClick={() => onSignup("talent")}
            className="w-full sm:w-auto rounded-xl bg-brand-gradient-smooth px-8 py-4 text-lg font-semibold text-white shadow-lg shadow-brand-primary/20 hover:scale-105 transition-all duration-300 hover:shadow-xl hover:shadow-brand-primary/30"
          >
            Yetenek Olarak Başla
          </button>
          <button
            onClick={() => onSignup("agency")}
            className="w-full sm:w-auto rounded-xl border border-white/20 bg-white/10 px-8 py-4 text-lg font-semibold text-white backdrop-blur-sm hover:bg-white/20 transition-all duration-300"
          >
            Ajans Olarak Başla
          </button>
        </motion.div>

        {/* Stats Row */}
        <motion.div 
          initial={{ opacity: 0, y: 10 }} 
          animate={{ opacity: 1, y: 0 }} 
          transition={{ delay: 0.6 }}
          className="mt-16 flex flex-col sm:flex-row items-center justify-center gap-8 text-white/80"
        >
          <div className="text-center">
            <div className="text-3xl font-bold text-white">500+</div>
            <div className="text-sm">Yetenek</div>
          </div>
          <div className="hidden sm:block w-px h-8 bg-white/20"></div>
          <div className="text-center">
            <div className="text-3xl font-bold text-white">50+</div>
            <div className="text-sm">Ajans</div>
          </div>
          <div className="hidden sm:block w-px h-8 bg-white/20"></div>
          <div className="text-center">
            <div className="text-3xl font-bold text-white">1000+</div>
            <div className="text-sm">Başarılı Eşleşme</div>
          </div>
        </motion.div>
      </div>
    </section>
  )
}

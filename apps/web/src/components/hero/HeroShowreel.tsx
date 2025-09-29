'use client'

import { motion } from 'framer-motion'
import Link from 'next/link'
import RoleGateCTA from '@/components/shared/RoleGateCTA'

interface HeroShowreelProps {
  onSignup: (type: "talent" | "agency") => void
}

export default function HeroShowreel({ onSignup }: HeroShowreelProps) {
  return (
    <section className="relative overflow-hidden min-h-screen flex items-center castlyo-hero-bg castlyo-hero-vignette">

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
          className="mt-6 text-5xl sm:text-6xl md:text-7xl font-extrabold leading-tight"
        >
          <span className="text-white/90">Yetenekler </span>
          <span className="bg-gradient-to-r from-[#a24b22] via-[#c67942] to-[#edc8a0] bg-clip-text text-transparent">
            Sahneye
          </span>
          <span className="text-white/90"> Çıkıyor</span>
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
          <RoleGateCTA
            targetRole="TALENT"
            to="/onboarding/talent"
            className="w-full sm:w-auto rounded-2xl px-8 py-4 shadow-xl shadow-black/30 bg-gradient-to-r from-[#a24b22] via-[#c67942] to-[#edc8a0] text-white/95 hover:opacity-95 transition"
          >
            Yetenek Olarak Başla
          </RoleGateCTA>
          <RoleGateCTA
            targetRole="AGENCY"
            to="/onboarding/agency"
            className="w-full sm:w-auto rounded-xl border border-white/20 bg-white/10 px-8 py-4 text-lg font-semibold text-white backdrop-blur-sm hover:bg-white/20 transition-all duration-300"
          >
            Ajans Olarak Başla
          </RoleGateCTA>
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

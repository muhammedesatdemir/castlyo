'use client'

import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { ArrowRight, Play, Star } from 'lucide-react'

export default function Hero() {
  const scrollToSection = (sectionId: string) => {
    const element = document.getElementById(sectionId);
    if (element) {
      element.scrollIntoView({ behavior: 'smooth' });
    }
  };

  return (
    <section className="relative overflow-hidden bg-gradient-to-br from-slate-900 via-slate-800 to-black py-20 sm:py-32">
      <div className="absolute inset-0 bg-[url('/grid.svg')] bg-center [mask-image:linear-gradient(180deg,white,rgba(255,255,255,0))]" />
      <div className="relative mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-2xl text-center">
          <div className="mb-8 flex items-center justify-center gap-2 rounded-full bg-white/10 px-4 py-2 text-sm text-white backdrop-blur-sm">
            <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
            <span>Türkiye'nin en büyük casting platformu</span>
          </div>
          
          <h1 className="bg-gradient-to-r from-white to-gray-300 bg-clip-text text-4xl font-bold tracking-tight text-transparent sm:text-6xl">
            Yetenekler ve Fırsatlar
            <span className="block text-brand-gradient-smooth">Sahneye Çıkıyor</span>
          </h1>
          
          <p className="mt-6 text-lg leading-8 text-gray-300">
            Castlyo ile oyuncu, model ve müzisyen gibi yetenekler, 
            film, dizi, reklam ve daha fazlası için ajanslarla buluşuyor. 
            Güvenli, profesyonel ve kullanıcı dostu platform.
          </p>
          
          <div className="mt-10 flex items-center justify-center gap-x-6">
            <Button 
              size="lg" 
              className="bg-brand-gradient-smooth hover:from-brand-700 hover:to-brand-300 text-white font-semibold shadow-lg"
              onClick={() => scrollToSection('register')}
            >
              Hemen Başla
              <ArrowRight className="ml-2 h-4 w-4" />
            </Button>
            
            <Button 
              variant="outline" 
              size="lg" 
              className="border-white/20 text-white hover:bg-white/10 bg-white/5"
              onClick={() => scrollToSection('features')}
            >
              <Play className="mr-2 h-4 w-4" />
              Nasıl Çalışır?
            </Button>
          </div>
          
          <div className="mt-16 flex items-center justify-center gap-x-8 text-sm text-gray-400">
            <div className="flex items-center gap-2">
              <div className="h-2 w-2 rounded-full bg-green-400" />
              <span>Güvenli ödeme</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="h-2 w-2 rounded-full bg-green-400" />
              <span>7/24 destek</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="h-2 w-2 rounded-full bg-green-400" />
              <span>Ücretsiz kayıt</span>
            </div>
          </div>
        </div>
      </div>
      
      {/* Floating elements */}
      <div className="absolute left-1/4 top-1/4 h-32 w-32 rounded-full bg-brand-primary/20 blur-3xl" />
      <div className="absolute right-1/4 bottom-1/4 h-40 w-40 rounded-full bg-brand-secondary/20 blur-3xl" />
    </section>
  )
}

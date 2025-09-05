'use client'

import { useRouter } from 'next/navigation'
import Header from '@/components/layout/Header'
import HeroShowreel from '@/components/hero/HeroShowreel'
import LogoMarquee from '@/components/sections/LogoMarquee'
import ExploreGrid from '@/components/sections/ExploreGrid'
import StickyCta from '@/components/StickyCta'
import { montserratDisplay } from '@/lib/fonts'

export default function Home() {
  const router = useRouter()

  const handleSignup = (type: "talent" | "agency") => {
    // First show privacy info, then redirect to auth page with role and return URL
    const returnUrl = encodeURIComponent(`/onboarding/${type}`)
    router.push(`/privacy-info?role=${type}&next=${returnUrl}`)
  }

  return (
    <main className="min-h-screen">
      <Header onSignup={handleSignup} />
      <HeroShowreel onSignup={handleSignup} />
      <LogoMarquee />
      
      <section id="features" className="bg-black text-white py-24 sm:py-32 pb-32 -mt-px">
        <div className="mx-auto max-w-7xl px-6 lg:px-8">
          <div className="mx-auto max-w-2xl lg:text-center">
            <p className={montserratDisplay.className + " text-center text-xs md:text-sm font-semibold tracking-[0.2em] uppercase text-white/70"}>
              Neden Castlyo?
            </p>
            <h2 className={montserratDisplay.className + " mt-3 text-center text-3xl md:text-5xl font-extrabold tracking-tight text-white"}>
              Sahne Senin, Fırsat Bizim!
            </h2>
            <p className="mt-4 max-w-3xl mx-auto text-center text-base md:text-lg text-white/80">
              Güvenli, hızlı ve eğlenceli casting deneyimi. Yetenekler ve ajanslar tek platformda
              buluşuyor, hayaller gerçek oluyor.
            </p>
          </div>
          
          <div className="mt-12 grid gap-6 md:gap-8 grid-cols-1 md:grid-cols-3">
            {/* 1 */}
            <div className="rounded-2xl bg-[#962901] p-4 md:p-6 text-center
                            flex flex-col items-center justify-between min-h-[240px]
                            transition-all duration-200 hover:-translate-y-1 hover:shadow-xl/20">
              <div className="mx-auto mb-4 flex items-center justify-center">
                <div className="flex items-center justify-center w-14 h-14 rounded-2xl bg-[#F6E6C3] shadow-[0_6px_24px_rgba(0,0,0,0.12)] ring-1 ring-black/5">
                  <div className="w-7 h-7 rounded-md bg-[#962901]" />
                </div>
              </div>
              <h3 className={montserratDisplay.className + " text-xl md:text-2xl font-bold text-[#F6E6C3]"}>
                Güvenli Platform
              </h3>
              <p className="mt-3 text-sm md:text-base leading-relaxed text-[#F6E6C3] max-w-[40ch] mx-auto">
                KVKK uyumlu sistem ile verileriniz güvende, profesyonel deneyim garantili.
              </p>
            </div>

            {/* 2 */}
            <div className="rounded-2xl bg-[#962901] p-4 md:p-6 text-center
                            flex flex-col items-center justify-between min-h-[240px]
                            transition-all duration-200 hover:-translate-y-1 hover:shadow-xl/20">
              <div className="mx-auto mb-4 flex items-center justify-center">
                <div className="flex items-center justify-center w-14 h-14 rounded-2xl bg-[#F6E6C3] shadow-[0_6px_24px_rgba(0,0,0,0.12)] ring-1 ring-black/5">
                  <div className="w-7 h-7 rounded-md bg-[#962901]" />
                </div>
              </div>
              <h3 className={montserratDisplay.className + " text-xl md:text-2xl font-bold text-[#F6E6C3]"}>
                Canlı Ağ
              </h3>
              <p className="mt-3 text-sm md:text-base leading-relaxed text-[#F6E6C3] max-w-[40ch] mx-auto">
                Binlerce yetenek ve yüzlerce ajans aktif olarak buluşuyor, networking hiç bu kadar kolay olmamıştı.
              </p>
            </div>

            {/* 3 */}
            <div className="rounded-2xl bg-[#962901] p-4 md:p-6 text-center
                            flex flex-col items-center justify-between min-h-[240px]
                            transition-all duration-200 hover:-translate-y-1 hover:shadow-xl/20">
              <div className="mx-auto mb-4 flex items-center justify-center">
                <div className="flex items-center justify-center w-14 h-14 rounded-2xl bg-[#F6E6C3] shadow-[0_6px_24px_rgba(0,0,0,0.12)] ring-1 ring-black/5">
                  <div className="w-7 h-7 rounded-md bg-[#962901]" />
                </div>
              </div>
              <h3 className={montserratDisplay.className + " text-xl md:text-2xl font-bold text-[#F6E6C3]"}>
                Akıllı Eşleştirme
              </h3>
              <p className="mt-3 text-sm md:text-base leading-relaxed text-[#F6E6C3] max-w-[40ch] mx-auto">
                AI destekli algoritma ile saniyeler içinde doğru rolle doğru yetenek.
              </p>
            </div>
          </div>
        </div>
      </section>
      
      <ExploreGrid />
      
      <section id="register" data-hide-sticky className="py-20 bg-black text-white">
        <div className="mx-auto max-w-4xl px-6 lg:px-8">
          <div className="text-center mb-12">
            {/* ANA BAŞLIK */}
            <h2 className={montserratDisplay.className + " text-center text-3xl md:text-5xl font-extrabold tracking-tight text-white"}>
              Sahne Seni Bekliyor! 🎬
            </h2>

            {/* ALT BAŞLIK (body fontunda kalsın) */}
            <p className="mt-3 max-w-3xl mx-auto text-center text-base md:text-lg text-white/80">
              Ücretsiz kayıt ol, profilini oluştur ve hemen başla!
            </p>
          </div>
          
          {/* KARTLAR */}
          <div className="mt-10 grid gap-6 md:gap-8 grid-cols-1 md:grid-cols-2">
            {/* Yetenekler İçin */}
            <div className="rounded-2xl bg-[#962901] p-8 md:p-10 text-white shadow-inner/30">
              <div className="flex h-full flex-col">
                <h3 className={montserratDisplay.className + " text-2xl md:text-3xl font-bold leading-tight text-[#F6E6C3]"}>
                  🎭 Yetenekler İçin
                </h3>

                <ul className="mt-4 space-y-3 text-[#F6E6C3] text-sm md:text-base">
                  <li className="flex items-start gap-2"><span className="mt-2 size-2 rounded-full bg-[#F6E6C3]/70" />Ücretsiz profil oluştur ve sergile</li>
                  <li className="flex items-start gap-2"><span className="mt-2 size-2 rounded-full bg-[#F6E6C3]/70" />Ajanslarla doğrudan buluş</li>
                  <li className="flex items-start gap-2"><span className="mt-2 size-2 rounded-full bg-[#F6E6C3]/70" />Portföyünü profesyonelce yönet</li>
                </ul>

                <div className="mt-6 md:mt-8 md:pt-2 mt-auto">
                  <button
                    onClick={() => handleSignup("talent")}
                    className={montserratDisplay.className + " inline-flex items-center justify-center rounded-xl bg-[#F6E6C3] px-5 py-3 text-sm md:text-base font-bold text-[#962901] shadow w-full"}
                  >
                    Yetenek Olarak Başla
                  </button>
                </div>
              </div>
            </div>
            
            {/* Ajanslar İçin */}
            <div className="rounded-2xl bg-[#962901] p-8 md:p-10 text-white shadow-inner/30">
              <div className="flex h-full flex-col">
                <h3 className={montserratDisplay.className + " text-2xl md:text-3xl font-bold leading-tight text-[#F6E6C3]"}>
                  🏢 Ajanslar İçin
                </h3>

                <ul className="mt-4 space-y-3 text-[#F6E6C3] text-sm md:text-base">
                  <li className="flex items-start gap-2"><span className="mt-2 size-2 rounded-full bg-[#F6E6C3]/70" />Akıllı yetenek arama ve filtrele</li>
                  <li className="flex items-start gap-2"><span className="mt-2 size-2 rounded-full bg-[#F6E6C3]/70" />Proje ve casting'leri yönet</li>
                  <li className="flex items-start gap-2"><span className="mt-2 size-2 rounded-full bg-[#F6E6C3]/70" />Güvenli ödeme ve sözleşme</li>
                </ul>

                <div className="mt-6 md:mt-8 md:pt-2 mt-auto">
                  <button
                    onClick={() => handleSignup("agency")}
                    className={montserratDisplay.className + " inline-flex items-center justify-center rounded-xl bg-[#F6E6C3] px-5 py-3 text-sm md:text-base font-bold text-[#962901] shadow w-full"}
                  >
                    Ajans Olarak Başla
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <StickyCta />
    </main>
  )
}
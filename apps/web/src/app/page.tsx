'use client'

import { useRouter } from 'next/navigation'
import Header from '@/components/layout/Header'
import HeroShowreel from '@/components/hero/HeroShowreel'
import LogoMarquee from '@/components/sections/LogoMarquee'
import ExploreGrid from '@/components/sections/ExploreGrid'
import CTASticky from '@/components/sections/CTASticky'

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
      
      <section id="features" className="bg-black text-white py-24 sm:py-32 -mt-px">
        <div className="mx-auto max-w-7xl px-6 lg:px-8">
          <div className="mx-auto max-w-2xl lg:text-center">
            <h2 className="text-base font-semibold leading-7 text-[#F6E6C3] tracking-widest">
              Neden Castlyo?
            </h2>
            <p className="mt-2 text-3xl font-bold tracking-tight text-white sm:text-4xl">
              Sahne Senin, Fırsat Bizim!
            </p>
            <p className="mt-6 text-lg leading-8 text-white/80">
              Güvenli, hızlı ve eğlenceli casting deneyimi. Yetenekler ve ajanslar 
              tek platformda buluşuyor, hayaller gerçek oluyor.
            </p>
          </div>
          
          <div className="mx-auto mt-16 max-w-2xl sm:mt-20 lg:mt-24 lg:max-w-none">
            <div className="grid grid-cols-1 gap-8 md:grid-cols-2 lg:grid-cols-3">
              <div className="text-center p-8 bg-[#F6E6C3] border border-gray-200 rounded-2xl shadow-lg hover:shadow-xl hover:-translate-y-1 transition-all duration-300">
                <div className="w-16 h-16 bg-black/10 rounded-2xl flex items-center justify-center mx-auto mb-6">
                  <div className="w-8 h-8 bg-black rounded-lg"></div>
                </div>
                <h3 className="text-xl font-bold text-black mb-3">Güvenli Platform</h3>
                <p className="text-gray-800">KVKV uyumlu sistem ile verileriniz güvende, profesyonel deneyim garantili</p>
              </div>
              
              <div className="text-center p-8 bg-[#F6E6C3] border border-gray-200 rounded-2xl shadow-lg hover:shadow-xl hover:-translate-y-1 transition-all duration-300">
                <div className="w-16 h-16 bg-black/10 rounded-2xl flex items-center justify-center mx-auto mb-6" style={{ animationDelay: '1s' }}>
                  <div className="w-8 h-8 bg-black rounded-lg"></div>
                </div>
                <h3 className="text-xl font-bold text-black mb-3">Canlı Ağ</h3>
                <p className="text-gray-800">Binlerce yetenek ve yüzlerce ajans aktif olarak buluşuyor, networking hiç bu kadar kolay olmamıştı</p>
                
                {/* CTA Diyeti: Bu buton kaldırıldı - sayfa başına tek ana CTA */}
              </div>
              
              <div className="text-center p-8 bg-[#F6E6C3] border border-gray-200 rounded-2xl shadow-lg hover:shadow-xl hover:-translate-y-1 transition-all duration-300">
                <div className="w-16 h-16 bg-black/10 rounded-2xl flex items-center justify-center mx-auto mb-6" style={{ animationDelay: '2s' }}>
                  <div className="w-8 h-8 bg-black rounded-lg"></div>
                </div>
                <h3 className="text-xl font-bold text-black mb-3">Akıllı Eşleştirme</h3>
                <p className="text-gray-800">AI destekli algoritma ile saniyeler içinde mükemmel eşleştirmeler, doğru rolle doğru yetenek</p>
              </div>
            </div>
          </div>
        </div>
      </section>
      
      <ExploreGrid />
      
      <section id="register" className="py-20 bg-black text-white">
        <div className="mx-auto max-w-4xl px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-4xl font-bold text-[#F6E6C3] mb-4">
              Sahne Seni Bekliyor! 🎬
            </h2>
            <p className="text-xl text-white/80">
              Ücretsiz kayıt ol, profilini oluştur ve hemen başla!
            </p>
          </div>
          
          <div className="grid md:grid-cols-2 gap-8">
            <div className="bg-[#962901] rounded-2xl p-8 text-[#F6E6C3] ring-1 ring-white/10 shadow-2xl transition hover:-translate-y-0.5 will-change-transform">
              <h3 className="text-2xl font-semibold text-[#F6E6C3] mb-6">
                🎭 Yetenekler İçin
              </h3>
              <ul className="space-y-3 mb-8">
                <li className="flex items-start gap-3">
                  <span className="mt-2 inline-block h-2.5 w-2.5 rounded-full bg-[#F6E6C3]/90"></span>
                  <span className="text-[#F6E6C3]">Ücretsiz profil oluştur ve sergile</span>
                </li>
                <li className="flex items-start gap-3">
                  <span className="mt-2 inline-block h-2.5 w-2.5 rounded-full bg-[#F6E6C3]/90"></span>
                  <span className="text-[#F6E6C3]">Ajanslarla doğrudan buluş</span>
                </li>
                <li className="flex items-start gap-3">
                  <span className="mt-2 inline-block h-2.5 w-2.5 rounded-full bg-[#F6E6C3]/90"></span>
                  <span className="text-[#F6E6C3]">Portföyünü profesyonelce yönet</span>
                </li>
              </ul>
              <button 
                onClick={() => handleSignup("talent")}
                className="w-full bg-white text-[#962901] py-4 px-6 rounded-2xl hover:bg-[#F6E6C3] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/40 transition cursor-pointer font-semibold text-lg shadow-lg"
              >
                Yetenek Olarak Başla
              </button>
            </div>
            
            <div className="bg-[#962901] rounded-2xl p-8 text-[#F6E6C3] ring-1 ring-white/10 shadow-2xl transition hover:-translate-y-0.5 will-change-transform">
              <h3 className="text-2xl font-semibold text-[#F6E6C3] mb-6">
                🏢 Ajans Olarak Başla
              </h3>
              <ul className="space-y-3 mb-8">
                <li className="flex items-start gap-3">
                  <span className="mt-2 inline-block h-2.5 w-2.5 rounded-full bg-[#F6E6C3]/90"></span>
                  <span className="text-[#F6E6C3]">Akıllı yetenek arama ve filtrele</span>
                </li>
                <li className="flex items-start gap-3">
                  <span className="mt-2 inline-block h-2.5 w-2.5 rounded-full bg-[#F6E6C3]/90"></span>
                  <span className="text-[#F6E6C3]">Proje ve casting'leri yönet</span>
                </li>
                <li className="flex items-start gap-3">
                  <span className="mt-2 inline-block h-2.5 w-2.5 rounded-full bg-[#F6E6C3]/90"></span>
                  <span className="text-[#F6E6C3]">Güvenli ödeme ve sözleşme</span>
                </li>
              </ul>
              <button 
                onClick={() => handleSignup("agency")}
                className="w-full bg-white text-[#962901] py-4 px-6 rounded-2xl hover:bg-[#F6E6C3] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/40 transition cursor-pointer font-semibold text-lg shadow-lg"
              >
                Ajans Olarak Başla
              </button>
            </div>
          </div>
        </div>
      </section>

      <CTASticky />
    </main>
  );
}

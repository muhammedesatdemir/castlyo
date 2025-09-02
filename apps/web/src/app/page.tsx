'use client'

import { useState, useEffect } from 'react'
import Header from '@/components/layout/Header'
import HeroShowreel from '@/components/hero/HeroShowreel'
import LogoMarquee from '@/components/sections/LogoMarquee'
import ExploreGrid from '@/components/sections/ExploreGrid'
import CTASticky from '@/components/sections/CTASticky'
import { Modal } from '@/components/ui/modal'
import TalentRegistrationForm from '@/components/forms/TalentRegistrationForm'
import AgencyRegistrationForm from '@/components/forms/AgencyRegistrationForm'

export default function Home() {
  const [signup, setSignup] = useState<{open: boolean; type: "talent" | "agency" | null}>({
    open: false,
    type: null
  })

  const openSignup = (type: "talent" | "agency") => {
    setSignup({ open: true, type })
    // hash'i de güncelle (isteğe bağlı)
    window.location.hash = type === "talent" ? "#signup-talent" : "#signup-agency"
  }

  const closeSignup = () => {
    setSignup({ open: false, type: null })
    // hash'i temizle
    if (window.location.hash === "#signup-talent" || window.location.hash === "#signup-agency") {
      history.replaceState(null, "", " ")
    }
  }

  // Hash değişimini dinle (#signup-talent / #signup-agency doğrudan çalışsın)
  useEffect(() => {
    const handleHash = () => {
      if (window.location.hash === "#signup-talent") openSignup("talent")
      if (window.location.hash === "#signup-agency") openSignup("agency")
    }
    window.addEventListener("hashchange", handleHash)
    // sayfa yüklendiğinde mevcut hash'i de işle
    handleHash()
    return () => window.removeEventListener("hashchange", handleHash)
  }, [])

  return (
    <main className="min-h-screen">
      <Header onSignup={openSignup} />
      <HeroShowreel onSignup={openSignup} />
      <LogoMarquee />
      
      <section id="features" className="py-24 sm:py-32 bg-brand-50 dark:bg-gray-900">
        <div className="mx-auto max-w-7xl px-6 lg:px-8">
          <div className="mx-auto max-w-2xl lg:text-center">
            <h2 className="text-base font-semibold leading-7 bg-gradient-to-r from-brand-primary to-brand-secondary bg-clip-text text-transparent">
              Neden Castlyo?
            </h2>
            <p className="mt-2 text-3xl font-bold tracking-tight text-gray-900 dark:text-white sm:text-4xl">
              Sahne Senin, Fırsat Bizim!
            </p>
            <p className="mt-6 text-lg leading-8 text-gray-600 dark:text-gray-300">
              Güvenli, hızlı ve eğlenceli casting deneyimi. Yetenekler ve ajanslar 
              tek platformda buluşuyor, hayaller gerçek oluyor.
            </p>
          </div>
          
          <div className="mx-auto mt-16 max-w-2xl sm:mt-20 lg:mt-24 lg:max-w-none">
            <div className="grid grid-cols-1 gap-8 md:grid-cols-2 lg:grid-cols-3">
              <div className="text-center p-8 bg-white dark:bg-white/5 rounded-2xl shadow-lg hover:shadow-xl hover:-translate-y-1 transition-all duration-300 border border-gray-100 dark:border-gray-800 backdrop-blur">
                <div className="w-16 h-16 bg-brand-gradient-smooth rounded-2xl flex items-center justify-center mx-auto mb-6 animate-float">
                  <div className="w-8 h-8 bg-white rounded-lg"></div>
                </div>
                <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-3">Güvenli Platform</h3>
                <p className="text-gray-600 dark:text-gray-300">KVKV uyumlu sistem ile verileriniz güvende, profesyonel deneyim garantili</p>
              </div>
              
              <div className="text-center p-8 bg-white dark:bg-white/5 rounded-2xl shadow-lg hover:shadow-xl hover:-translate-y-1 transition-all duration-300 border border-gray-100 dark:border-gray-800 backdrop-blur">
                <div className="w-16 h-16 bg-brand-gradient-smooth rounded-2xl flex items-center justify-center mx-auto mb-6 animate-float" style={{ animationDelay: '1s' }}>
                  <div className="w-8 h-8 bg-white rounded-lg"></div>
                </div>
                <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-3">Canlı Ağ</h3>
                <p className="text-gray-600 dark:text-gray-300">Binlerce yetenek ve yüzlerce ajans aktif olarak buluşuyor, networking hiç bu kadar kolay olmamıştı</p>
              </div>
              
              <div className="text-center p-8 bg-white dark:bg-white/5 rounded-2xl shadow-lg hover:shadow-xl hover:-translate-y-1 transition-all duration-300 border border-gray-100 dark:border-gray-800 backdrop-blur">
                <div className="w-16 h-16 bg-brand-gradient-smooth rounded-2xl flex items-center justify-center mx-auto mb-6 animate-float" style={{ animationDelay: '2s' }}>
                  <div className="w-8 h-8 bg-white rounded-lg"></div>
                </div>
                <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-3">Akıllı Eşleştirme</h3>
                <p className="text-gray-600 dark:text-gray-300">AI destekli algoritma ile saniyeler içinde mükemmel eşleştirmeler, doğru rolle doğru yetenek</p>
              </div>
            </div>
          </div>
        </div>
      </section>
      
      <ExploreGrid />
      
      <section id="register" className="py-20 bg-gradient-to-br from-white to-brand-50 dark:from-gray-900 dark:to-brand-900/20">
        <div className="mx-auto max-w-4xl px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-4xl font-bold text-gray-900 dark:text-white mb-4">
              Sahne Seni Bekliyor! 🎬
            </h2>
            <p className="text-xl text-gray-600 dark:text-gray-300">
              Ücretsiz kayıt ol, profilini oluştur ve hemen başla!
            </p>
          </div>
          
          <div className="bg-white/80 dark:bg-gray-900/80 rounded-3xl shadow-2xl p-8 backdrop-blur border border-white/20">
            <div className="grid md:grid-cols-2 gap-10">
              <div className="relative">
                <div className="absolute -top-4 -left-4 w-20 h-20 bg-gradient-to-br from-brand-primary to-brand-secondary rounded-2xl opacity-10"></div>
                <h3 className="text-2xl font-bold text-gray-900 dark:text-white mb-6 relative">
                  🎭 Yetenekler İçin
                </h3>
                <ul className="space-y-4 text-gray-600 dark:text-gray-300 mb-8">
                  <li className="flex items-center gap-4">
                    <div className="w-3 h-3 bg-gradient-to-r from-brand-primary to-brand-secondary rounded-full"></div>
                    <span className="text-base">Ücretsiz profil oluştur ve sergile</span>
                  </li>
                  <li className="flex items-center gap-4">
                    <div className="w-3 h-3 bg-gradient-to-r from-brand-primary to-brand-secondary rounded-full"></div>
                    <span className="text-base">Ajanslarla doğrudan buluş</span>
                  </li>
                  <li className="flex items-center gap-4">
                    <div className="w-3 h-3 bg-gradient-to-r from-brand-primary to-brand-secondary rounded-full"></div>
                    <span className="text-base">Portföyünü profesyonelce yönet</span>
                  </li>
                </ul>
                <button 
                  onClick={() => openSignup("talent")}
                  className="w-full bg-gradient-to-r from-brand-primary to-brand-secondary text-white py-4 px-6 rounded-xl hover:scale-105 transition-all duration-300 cursor-pointer font-semibold text-lg shadow-lg"
                >
                  Yetenek Olarak Başla
                </button>
              </div>
              
              <div className="relative">
                <div className="absolute -top-4 -right-4 w-20 h-20 bg-gradient-to-br from-brand-secondary to-brand-primary rounded-2xl opacity-10"></div>
                <h3 className="text-2xl font-bold text-gray-900 dark:text-white mb-6 relative">
                  🏢 Ajanslar İçin
                </h3>
                <ul className="space-y-4 text-gray-600 dark:text-gray-300 mb-8">
                  <li className="flex items-center gap-4">
                    <div className="w-3 h-3 bg-gradient-to-r from-brand-secondary to-brand-primary rounded-full"></div>
                    <span className="text-base">Akıllı yetenek arama ve filtrele</span>
                  </li>
                  <li className="flex items-center gap-4">
                    <div className="w-3 h-3 bg-gradient-to-r from-brand-secondary to-brand-primary rounded-full"></div>
                    <span className="text-base">Proje ve casting'leri yönet</span>
                  </li>
                  <li className="flex items-center gap-4">
                    <div className="w-3 h-3 bg-gradient-to-r from-brand-secondary to-brand-primary rounded-full"></div>
                    <span className="text-base">Güvenli ödeme ve sözleşme</span>
                  </li>
                </ul>
                <button 
                  onClick={() => openSignup("agency")}
                  className="w-full bg-gradient-to-r from-brand-700 via-brand-primary to-brand-800 text-white py-4 px-6 rounded-xl hover:scale-105 transition-all duration-300 cursor-pointer font-semibold text-lg shadow-lg"
                >
                  Ajans Olarak Başla
                </button>
              </div>
            </div>
          </div>
        </div>
      </section>

      <CTASticky />

      {/* Signup Modal */}
      <Modal
        isOpen={signup.open}
        onClose={closeSignup}
        title={signup.type === "talent" ? "Sahne Senin! 🎬" : "Ajans Kaydı 🏢"}
      >
        {signup.type === "talent" ? <TalentRegistrationForm /> : <AgencyRegistrationForm />}
      </Modal>
    </main>
  );
}

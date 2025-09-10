'use client'

import { useRouter, useSearchParams } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { ArrowRight, Shield } from 'lucide-react'

export default function PrivacyInfoPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  
  const role = searchParams.get('role') as 'talent' | 'agency'
  const next = searchParams.get('next')

  const handleContinue = () => {
    const authUrl = `/auth?role=${role}&next=${next || ''}`
    router.push(authUrl)
  }

  const handleBack = () => {
    router.back()
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-black flex items-center justify-center p-4">
      <div className="w-full max-w-2xl">
        <div className="bg-white/5 backdrop-blur-lg rounded-2xl border border-white/10 p-8 shadow-2xl text-center">
          {/* Icon */}
          <div className="w-24 h-24 bg-green-500/20 rounded-full flex items-center justify-center mx-auto mb-6">
            <Shield className="w-12 h-12 text-green-400" />
          </div>
          
          {/* Title */}
          <h1 className="text-3xl font-bold text-white mb-4">
            Gizliliğin Güvende 🔒
          </h1>
          
          <p className="text-white/80 text-lg mb-8">
            Castlyo'da verileriniz nasıl korunuyor? İşte size verdiğimiz güvenceler:
          </p>

          {/* Privacy Guarantees */}
          <div className="grid gap-6 text-left mb-8">
            <div className="bg-green-500/10 border border-green-500/20 rounded-xl p-6">
              <div className="flex items-start space-x-4">
                <div className="w-12 h-12 bg-green-500/20 rounded-lg flex items-center justify-center flex-shrink-0">
                  <span className="text-2xl">✋</span>
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-green-200 mb-2">
                    İletişim Bilgilerin Sadece Onayınla Paylaşılır
                  </h3>
                  <p className="text-green-200/80">
                    E-posta ve telefon numaranız hiçbir zaman otomatik olarak paylaşılmaz. 
                    Her ajansla iletişim için ayrı onayınız alınır.
                  </p>
                </div>
              </div>
            </div>

            <div className="bg-blue-500/10 border border-blue-500/20 rounded-xl p-6">
              <div className="flex items-start space-x-4">
                <div className="w-12 h-12 bg-blue-500/20 rounded-lg flex items-center justify-center flex-shrink-0">
                  <span className="text-2xl">🛡️</span>
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-blue-200 mb-2">
                    Ajanslar Seni Platform İçinden Görür
                  </h3>
                  <p className="text-blue-200/80">
                    Profilin herkese açık ama iletişim bilgilerin gizli. Ajanslar sadece 
                    yeteneklerini, deneyimini ve portföyünü görür.
                  </p>
                </div>
              </div>
            </div>

            <div className="bg-purple-500/10 border border-purple-500/20 rounded-xl p-6">
              <div className="flex items-start space-x-4">
                <div className="w-12 h-12 bg-purple-500/20 rounded-lg flex items-center justify-center flex-shrink-0">
                  <span className="text-2xl">⚡</span>
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-purple-200 mb-2">
                    İstediğin Zaman Onayını Geri Çekebilirsin
                  </h3>
                  <p className="text-purple-200/80">
                    Ayarlar menüsünden izinleri yönetebilir, istediğin zaman 
                    ajanslarla paylaşımı durdurabilirsin.
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* KVKK Notice */}
          <div className="bg-yellow-500/10 border border-yellow-500/20 rounded-lg p-4 mb-8">
            <p className="text-sm text-yellow-200">
              <strong>📋 KVKK Uyumu:</strong> Tüm işlemlerimiz 6698 sayılı Kişisel Verilerin 
              Korunması Kanunu'na uygun olarak gerçekleştirilir.
            </p>
          </div>

          {/* Action Buttons */}
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button
              variant="outline"
              onClick={handleBack}
              className="border-white/20 text-white hover:bg-white/10 hover:text-white bg-transparent"
            >
              Geri Dön
            </Button>
            
            <Button
              onClick={handleContinue}
              className="bg-brand-primary hover:bg-brand-primary/90 text-white font-semibold px-8"
            >
              Anladım, Devam Et
              <ArrowRight className="w-4 h-4 ml-2" />
            </Button>
          </div>

          <p className="text-white/60 text-sm mt-6">
            {role === 'talent' ? 'Yetenek' : 'Ajans'} olarak kayıt olmaya devam edeceksiniz
          </p>
        </div>
      </div>
    </div>
  )
}

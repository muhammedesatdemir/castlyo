'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { ArrowLeft, ArrowRight, Check } from 'lucide-react'
import { AuthGuard } from '@/components/auth/AuthGuard'

const STEPS = [
  { id: 1, title: 'Gizlilik Güvencesi', description: 'Verileriniz nasıl korunuyor?' },
  { id: 2, title: 'Hesap Bilgileri', description: 'Temel bilgilerinizi tamamlayın' },
  { id: 3, title: 'Kişisel Bilgiler', description: 'Profil bilgilerinizi girin' },
  { id: 4, title: 'Profesyonel Bilgiler', description: 'Yetenek bilgilerinizi ekleyin' },
  { id: 5, title: 'Tamamlandı', description: 'Profiliniz hazır!' }
]

function TalentOnboardingContent() {
  const router = useRouter()
  const [currentStep, setCurrentStep] = useState(1)
  const [formData, setFormData] = useState({
    // Step 1 - Account
    firstName: '',
    lastName: '',
    phone: '',
    
    // Step 2 - Personal
    dateOfBirth: '',
    gender: '',
    city: '',
    height: '',
    weight: '',
    eyeColor: '',
    hairColor: '',
    
    // Step 3 - Professional
    bio: '',
    experience: '',
    skills: [] as string[],
    languages: [] as string[],
    specialties: [] as string[]
  })

  const handleNext = async () => {
    // Profesyonel Bilgiler adımındayken ara kaydet
    if (currentStep === 4) {
      try {
        await fetch('/api/profile/me', {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            bio: formData.bio,
            experience: formData.experience,
            specialties: formData.specialties,
          }),
        })
      } catch (e) {
        console.error('Ara kaydet başarısız', e)
      }
    }
    if (currentStep < STEPS.length) {
      setCurrentStep(currentStep + 1)
    }
  }

  const handlePrevious = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1)
    }
  }

  const handleSubmit = async () => {
    try {
      await fetch('/api/onboarding/talent/complete', { method: 'POST' })
      window.location.href = '/profile'
    } catch (error) {
      console.error('Tamamlama hatası:', error)
    }
  }

  const renderStepContent = () => {
    switch (currentStep) {
      case 1:
        return (
          <div className="space-y-6 text-center">
            <div className="w-20 h-20 bg-green-500/20 rounded-full flex items-center justify-center mx-auto">
              <div className="text-4xl">🔒</div>
            </div>
            
            <h2 className="text-2xl font-bold text-white mb-4">Verileriniz Güvende</h2>
            
            <p className="text-white/70 text-lg mb-8">
              Castlyo'da gizliliğiniz bizim önceliğimizdir. İşte size verdiğimiz güvenceler:
            </p>

            <div className="grid gap-6 text-left">
              <div className="bg-green-500/10 border border-green-500/20 rounded-xl p-6">
                <div className="flex items-start space-x-4">
                  <div className="w-12 h-12 bg-green-500/20 rounded-lg flex items-center justify-center flex-shrink-0">
                    <span className="text-2xl">✋</span>
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold text-green-200 mb-2">
                      Bilgilerin Sadece Onayınla Paylaşılır
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
                    <span className="text-2xl">👁️</span>
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
                    <span className="text-2xl">⚙️</span>
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

            <div className="bg-yellow-500/10 border border-yellow-500/20 rounded-lg p-4 mt-6">
              <p className="text-sm text-yellow-200">
                <strong>📋 KVKK Uyumu:</strong> Tüm işlemlerimiz 6698 sayılı Kişisel Verilerin 
                Korunması Kanunu'na uygun olarak gerçekleştirilir.
              </p>
            </div>
          </div>
        )
      
      case 2:
        return (
          <div className="space-y-4">
            <h2 className="text-2xl font-bold text-white mb-6">Hesap Bilgileri</h2>
            
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-white/90 mb-2">
                  Ad
                </label>
                <Input
                  value={formData.firstName}
                  onChange={(e) => setFormData({ ...formData, firstName: e.target.value })}
                  className="bg-white/10 border-white/20 text-white placeholder:text-white/50"
                  placeholder="Adınız"
                  required
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-white/90 mb-2">
                  Soyad
                </label>
                <Input
                  value={formData.lastName}
                  onChange={(e) => setFormData({ ...formData, lastName: e.target.value })}
                  className="bg-white/10 border-white/20 text-white placeholder:text-white/50"
                  placeholder="Soyadınız"
                  required
                />
              </div>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-white/90 mb-2">
                Telefon Numarası
              </label>
              <Input
                type="tel"
                value={formData.phone}
                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                className="bg-white/10 border-white/20 text-white placeholder:text-white/50"
                placeholder="+90 5XX XXX XX XX"
              />
            </div>
            
            <div className="bg-blue-500/10 border border-blue-500/20 rounded-lg p-4 mt-6">
              <p className="text-sm text-blue-200">
                <strong>🔒 Gizlilik:</strong> Bu bilgiler sadece profilinizin tamamlanması için gereklidir. 
                İletişim bilgileriniz sadece onayınızla paylaşılır.
              </p>
            </div>
          </div>
        )
      
      case 2:
        return (
          <div className="space-y-4">
            <h2 className="text-2xl font-bold text-white mb-6">Hesap Bilgileri</h2>
            
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-white/90 mb-2">
                  Ad
                </label>
                <Input
                  value={formData.firstName}
                  onChange={(e) => setFormData({ ...formData, firstName: e.target.value })}
                  className="bg-white/10 border-white/20 text-white placeholder:text-white/50"
                  placeholder="Adınız"
                  required
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-white/90 mb-2">
                  Soyad
                </label>
                <Input
                  value={formData.lastName}
                  onChange={(e) => setFormData({ ...formData, lastName: e.target.value })}
                  className="bg-white/10 border-white/20 text-white placeholder:text-white/50"
                  placeholder="Soyadınız"
                  required
                />
              </div>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-white/90 mb-2">
                Telefon Numarası
              </label>
              <Input
                type="tel"
                value={formData.phone}
                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                className="bg-white/10 border-white/20 text-white placeholder:text-white/50"
                placeholder="+90 5XX XXX XX XX"
              />
            </div>
            
            <div className="bg-blue-500/10 border border-blue-500/20 rounded-lg p-4 mt-6">
              <p className="text-sm text-blue-200">
                <strong>🔒 Gizlilik:</strong> Bu bilgiler sadece profilinizin tamamlanması için gereklidir. 
                İletişim bilgileriniz sadece onayınızla paylaşılır.
              </p>
            </div>
          </div>
        )
      
      case 3:
        return (
          <div className="space-y-4">
            <h2 className="text-2xl font-bold text-white mb-6">Kişisel Bilgiler</h2>
            
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-white/90 mb-2">
                  Doğum Tarihi
                </label>
                <Input
                  type="date"
                  value={formData.dateOfBirth}
                  onChange={(e) => setFormData({ ...formData, dateOfBirth: e.target.value })}
                  className="bg-white/10 border-white/20 text-white"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-white/90 mb-2">
                  Cinsiyet
                </label>
                <select
                  value={formData.gender}
                  onChange={(e) => setFormData({ ...formData, gender: e.target.value })}
                  className="w-full rounded-lg bg-white/10 border border-white/20 text-white px-3 py-2"
                >
                  <option value="">Seçin</option>
                  <option value="MALE">Erkek</option>
                  <option value="FEMALE">Kadın</option>
                  <option value="OTHER">Diğer</option>
                </select>
              </div>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-white/90 mb-2">
                Şehir
              </label>
              <Input
                value={formData.city}
                onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                className="bg-white/10 border-white/20 text-white placeholder:text-white/50"
                placeholder="İstanbul"
              />
            </div>
            
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-white/90 mb-2">
                  Boy (cm)
                </label>
                <Input
                  type="number"
                  value={formData.height}
                  onChange={(e) => setFormData({ ...formData, height: e.target.value })}
                  className="bg-white/10 border-white/20 text-white placeholder:text-white/50"
                  placeholder="175"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-white/90 mb-2">
                  Kilo (kg)
                </label>
                <Input
                  type="number"
                  value={formData.weight}
                  onChange={(e) => setFormData({ ...formData, weight: e.target.value })}
                  className="bg-white/10 border-white/20 text-white placeholder:text-white/50"
                  placeholder="70"
                />
              </div>
            </div>
          </div>
        )
      
      case 4:
        return (
          <div className="space-y-4">
            <h2 className="text-2xl font-bold text-white mb-6">Profesyonel Bilgiler</h2>
            
            <div>
              <label className="block text-sm font-medium text-white/90 mb-2">
                Biyografi
              </label>
              <textarea
                value={formData.bio}
                onChange={(e) => setFormData({ ...formData, bio: e.target.value })}
                className="w-full rounded-lg bg-white/10 border border-white/20 text-white placeholder:text-white/50 px-3 py-2 min-h-[100px]"
                placeholder="Kendinizden bahsedin..."
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-white/90 mb-2">
                Deneyim
              </label>
              <textarea
                value={formData.experience}
                onChange={(e) => setFormData({ ...formData, experience: e.target.value })}
                className="w-full rounded-lg bg-white/10 border border-white/20 text-white placeholder:text-white/50 px-3 py-2 min-h-[100px]"
                placeholder="Profesyonel deneyimlerinizi yazın..."
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-white/90 mb-2">
                Uzmanlık Alanları
              </label>
              <div className="grid grid-cols-2 gap-2">
                {['Oyunculuk', 'Modellik', 'Müzik', 'Dans', 'Dublaj', 'Tiyatro'].map((specialty) => (
                  <label key={specialty} className="flex items-center space-x-2">
                    <input
                      type="checkbox"
                      checked={formData.specialties.includes(specialty)}
                      onChange={(e) => {
                        if (e.target.checked) {
                          setFormData({
                            ...formData,
                            specialties: [...formData.specialties, specialty]
                          })
                        } else {
                          setFormData({
                            ...formData,
                            specialties: formData.specialties.filter(s => s !== specialty)
                          })
                        }
                      }}
                      className="rounded border-white/20 bg-white/10"
                    />
                    <span className="text-white/80 text-sm">{specialty}</span>
                  </label>
                ))}
              </div>
            </div>
          </div>
        )
      
      case 5:
        return (
          <div className="text-center space-y-6">
            <div className="w-20 h-20 bg-green-500 rounded-full flex items-center justify-center mx-auto">
              <Check className="w-10 h-10 text-white" />
            </div>
            
            <h2 className="text-3xl font-bold text-white">Tebrikler! 🎉</h2>
            
            <p className="text-white/80 text-lg">
              Profiliniz başarıyla oluşturuldu. Artık casting fırsatlarını keşfetmeye başlayabilirsiniz!
            </p>
            
            <div className="bg-green-500/10 border border-green-500/20 rounded-lg p-4">
              <p className="text-sm text-green-200">
                <strong>🔒 Gizlilik Güvencesi:</strong> Profiliniz oluşturuldu ancak iletişim bilgileriniz 
                sadece onayınızla ajanslarla paylaşılacak. Platform dışında hiçbir şekilde paylaşılmaz.
              </p>
            </div>
            
            <Button
              onClick={handleSubmit}
              className="w-full bg-brand-primary hover:bg-brand-primary/90 text-white font-semibold py-3"
            >
              Profilime Git
            </Button>
          </div>
        )
      
      default:
        return null
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-black">
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <Button
            variant="ghost"
            onClick={() => router.back()}
            className="text-white/70 hover:text-white p-0 h-auto"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Geri Dön
          </Button>
          
          <div className="text-center">
            <h1 className="text-2xl font-bold text-white">Yetenek Profili Oluştur</h1>
            <p className="text-white/70">Adım {currentStep} / {STEPS.length}</p>
          </div>
          
          <div className="w-20"> {/* Spacer */}</div>
        </div>

        {/* Progress Bar */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-4">
            {STEPS.map((step) => (
              <div
                key={step.id}
                className={`flex items-center ${step.id < STEPS.length ? 'flex-1' : ''}`}
              >
                <div
                  className={`w-10 h-10 rounded-full flex items-center justify-center text-sm font-semibold ${
                    step.id === currentStep
                      ? 'bg-brand-primary text-white'
                      : step.id < currentStep
                      ? 'bg-green-500 text-white'
                      : 'bg-white/10 text-white/50'
                  }`}
                >
                  {step.id < currentStep ? <Check className="w-5 h-5" /> : step.id}
                </div>
                
                {step.id < STEPS.length && (
                  <div
                    className={`flex-1 h-1 mx-4 ${
                      step.id < currentStep ? 'bg-green-500' : 'bg-white/10'
                    }`}
                  />
                )}
              </div>
            ))}
          </div>
          
          <div className="text-center">
            <h3 className="text-lg font-semibold text-white">
              {STEPS[currentStep - 1]?.title}
            </h3>
            <p className="text-white/70 text-sm">
              {STEPS[currentStep - 1]?.description}
            </p>
          </div>
        </div>

        {/* Form Content */}
        <div className="max-w-2xl mx-auto">
          <div className="bg-white/5 backdrop-blur-lg rounded-2xl border border-white/10 p-8 shadow-2xl">
            {renderStepContent()}
            
            {/* Navigation Buttons */}
            {currentStep < 5 && (
              <div className="flex justify-between mt-8 pt-6 border-t border-white/10">
                <Button
                  variant="outline"
                  onClick={handlePrevious}
                  disabled={currentStep === 1}
                  className="border-white/20 text-white hover:bg-white/10"
                >
                  <ArrowLeft className="w-4 h-4 mr-2" />
                  Önceki
                </Button>
                
                <Button
                  onClick={handleNext}
                  className="bg-brand-primary hover:bg-brand-primary/90 text-white"
                >
                  Sonraki
                  <ArrowRight className="w-4 h-4 ml-2" />
                </Button>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

export default function TalentOnboarding() {
  return (
    <AuthGuard checkOnboardingCompleted={true}>
      <TalentOnboardingContent />
    </AuthGuard>
  )
}

'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { ArrowLeft, ArrowRight, Check } from 'lucide-react'
import { AuthGuard } from '@/components/auth/AuthGuard'
import RoleRequired from '@/components/auth/RoleRequired'

const STEPS = [
  { id: 1, title: 'Şirket Bilgileri', description: 'Temel şirket bilgilerinizi girin' },
  { id: 2, title: 'İletişim Bilgileri', description: 'İletişim detaylarını tamamlayın' },
  { id: 3, title: 'Belge Yükleme', description: 'Şirket belgelerini yükleyin' },
  { id: 4, title: 'Tamamlandı', description: 'Doğrulama beklemede!' }
]

function AgencyOnboardingContent() {
  const router = useRouter()
  const [currentStep, setCurrentStep] = useState(1)
  const [formData, setFormData] = useState({
    // Step 1 - Company
    companyName: '',
    tradeName: '',
    taxNumber: '',
    description: '',
    website: '',
    
    // Step 2 - Contact
    contactPerson: '',
    contactEmail: '',
    contactPhone: '',
    address: '',
    city: '',
    
    // Step 3 - Verification
    specialties: [] as string[],
    verificationDocuments: [] as string[]
  })

  const handleNext = () => {
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
      // TODO: API call to save profile
      console.log('Saving agency profile:', formData)
      
      // Redirect to profile page
      router.push('/profile')
    } catch (error) {
      console.error('Error saving profile:', error)
    }
  }

  const renderStepContent = () => {
    switch (currentStep) {
      case 1:
        return (
          <div className="space-y-4">
            <h2 className="text-2xl font-bold text-white mb-6">Şirket Bilgileri</h2>
            
            <div>
              <label className="block text-sm font-medium text-white/90 mb-2">
                Şirket Adı *
              </label>
              <Input
                value={formData.companyName}
                onChange={(e) => setFormData({ ...formData, companyName: e.target.value })}
                className="bg-white/10 border-white/20 text-white placeholder:text-white/50"
                placeholder="ABC Casting Ajansı Ltd. Şti."
                required
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-white/90 mb-2">
                Ticari Ünvan
              </label>
              <Input
                value={formData.tradeName}
                onChange={(e) => setFormData({ ...formData, tradeName: e.target.value })}
                className="bg-white/10 border-white/20 text-white placeholder:text-white/50"
                placeholder="ABC Casting"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-white/90 mb-2">
                Vergi Numarası
              </label>
              <Input
                value={formData.taxNumber}
                onChange={(e) => setFormData({ ...formData, taxNumber: e.target.value })}
                className="bg-white/10 border-white/20 text-white placeholder:text-white/50"
                placeholder="1234567890"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-white/90 mb-2">
                Şirket Açıklaması
              </label>
              <textarea
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                className="w-full rounded-lg bg-white/10 border border-white/20 text-white placeholder:text-white/50 px-3 py-2 min-h-[100px]"
                placeholder="Şirketiniz hakkında bilgi verin..."
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-white/90 mb-2">
                Website
              </label>
              <Input
                type="url"
                value={formData.website}
                onChange={(e) => setFormData({ ...formData, website: e.target.value })}
                className="bg-white/10 border-white/20 text-white placeholder:text-white/50"
                placeholder="https://www.abccasting.com"
              />
            </div>
          </div>
        )
      
      case 2:
        return (
          <div className="space-y-4">
            <h2 className="text-2xl font-bold text-white mb-6">İletişim Bilgileri</h2>
            
            <div>
              <label className="block text-sm font-medium text-white/90 mb-2">
                İletişim Sorumlusu *
              </label>
              <Input
                value={formData.contactPerson}
                onChange={(e) => setFormData({ ...formData, contactPerson: e.target.value })}
                className="bg-white/10 border-white/20 text-white placeholder:text-white/50"
                placeholder="Ahmet Yılmaz"
                required
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-white/90 mb-2">
                İletişim E-postası *
              </label>
              <Input
                type="email"
                value={formData.contactEmail}
                onChange={(e) => setFormData({ ...formData, contactEmail: e.target.value })}
                className="bg-white/10 border-white/20 text-white placeholder:text-white/50"
                placeholder="info@abccasting.com"
                required
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-white/90 mb-2">
                İletişim Telefonu *
              </label>
              <Input
                type="tel"
                value={formData.contactPhone}
                onChange={(e) => setFormData({ ...formData, contactPhone: e.target.value })}
                className="bg-white/10 border-white/20 text-white placeholder:text-white/50"
                placeholder="+90 212 XXX XX XX"
                required
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-white/90 mb-2">
                Adres
              </label>
              <textarea
                value={formData.address}
                onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                className="w-full rounded-lg bg-white/10 border border-white/20 text-white placeholder:text-white/50 px-3 py-2 min-h-[80px]"
                placeholder="Şirket adresinizi girin..."
              />
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
            
            <div className="bg-blue-500/10 border border-blue-500/20 rounded-lg p-4 mt-6">
              <p className="text-sm text-blue-200">
                <strong>🔒 Gizlilik:</strong> Bu iletişim bilgileri sadece doğrulanmış ajanslar için 
                platform içinde kullanılır ve üçüncü taraflarla paylaşılmaz.
              </p>
            </div>
          </div>
        )
      
      case 3:
        return (
          <div className="space-y-6">
            <h2 className="text-2xl font-bold text-white mb-6">Belge Yükleme ve Doğrulama</h2>
            
            {/* Specialties */}
            <div>
              <label className="block text-sm font-medium text-white/90 mb-3">
                Hangi alanlarda çalışıyorsunuz?
              </label>
              <div className="grid grid-cols-2 gap-3">
                {[
                  'Film', 'Dizi', 'Reklam', 'Moda', 
                  'Tiyatro', 'Müzik Videosu', 'Katalog', 'Editorial'
                ].map((specialty) => (
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

            {/* Document Upload */}
            <div className="border-t border-white/10 pt-6">
              <h3 className="text-lg font-semibold text-white mb-4">Gerekli Belgeler</h3>
              
              <div className="space-y-4">
                <div className="bg-blue-500/10 border border-blue-500/20 rounded-lg p-4">
                  <h4 className="text-blue-200 font-medium mb-2">📄 Ticaret Sicil Gazetesi</h4>
                  <p className="text-blue-200/80 text-sm mb-3">
                    Şirketinizin ticaret sicil gazetesi (son 6 ay içinde alınmış)
                  </p>
                  <div className="border-2 border-dashed border-blue-500/30 rounded-lg p-6 text-center">
                    <div className="text-blue-300 mb-2">📁</div>
                    <p className="text-blue-200 text-sm">PDF dosyasını sürükleyin veya seçin</p>
                    <input 
                      type="file" 
                      accept=".pdf" 
                      className="mt-2 text-xs text-blue-200"
                      onChange={(e) => {
                        // TODO: Handle file upload
                        console.log('File selected:', e.target.files?.[0])
                      }}
                    />
                  </div>
                </div>

                <div className="bg-green-500/10 border border-green-500/20 rounded-lg p-4">
                  <h4 className="text-green-200 font-medium mb-2">🏢 Vergi Levhası</h4>
                  <p className="text-green-200/80 text-sm mb-3">
                    Güncel vergi levhası fotokopyası
                  </p>
                  <div className="border-2 border-dashed border-green-500/30 rounded-lg p-6 text-center">
                    <div className="text-green-300 mb-2">📁</div>
                    <p className="text-green-200 text-sm">PDF dosyasını sürükleyin veya seçin</p>
                    <input 
                      type="file" 
                      accept=".pdf,.jpg,.jpeg,.png" 
                      className="mt-2 text-xs text-green-200"
                      onChange={(e) => {
                        // TODO: Handle file upload
                        console.log('File selected:', e.target.files?.[0])
                      }}
                    />
                  </div>
                </div>

                <div className="bg-purple-500/10 border border-purple-500/20 rounded-lg p-4">
                  <h4 className="text-purple-200 font-medium mb-2">✍️ İmza Sirküleri</h4>
                  <p className="text-purple-200/80 text-sm mb-3">
                    Şirket imza sirküleri (yetkili kişiler)
                  </p>
                  <div className="border-2 border-dashed border-purple-500/30 rounded-lg p-6 text-center">
                    <div className="text-purple-300 mb-2">📁</div>
                    <p className="text-purple-200 text-sm">PDF dosyasını sürükleyin veya seçin</p>
                    <input 
                      type="file" 
                      accept=".pdf" 
                      className="mt-2 text-xs text-purple-200"
                      onChange={(e) => {
                        // TODO: Handle file upload
                        console.log('File selected:', e.target.files?.[0])
                      }}
                    />
                  </div>
                </div>
              </div>
            </div>
            
            <div className="bg-yellow-500/10 border border-yellow-500/20 rounded-lg p-4">
              <h3 className="text-yellow-200 font-medium mb-2">⏱️ Doğrulama Süreci</h3>
              <ul className="text-sm text-yellow-200/80 space-y-1">
                <li>• Belgeleriniz Castlyo ekibi tarafından 1-2 iş günü içinde incelenir</li>
                <li>• Doğrulama tamamlanana kadar yeteneklere teklif gönderemezsiniz</li>
                <li>• Eksik belge durumunda e-posta ile bilgilendirilirsiniz</li>
                <li>• Onay sonrası platform özelliklerine tam erişim sağlanır</li>
              </ul>
            </div>

            <div className="bg-red-500/10 border border-red-500/20 rounded-lg p-4">
              <h3 className="text-red-200 font-medium mb-2">🚫 Doğrulanmamış Ajanslar</h3>
              <p className="text-sm text-red-200/80">
                <strong>Güvenlik önlemi:</strong> Doğrulanmamış ajanslar yetenek profillerini 
                görüntüleyebilir ancak iletişim kurma ve teklif gönderme yetkisi yoktur.
              </p>
            </div>
          </div>
        )
      
      case 4:
        return (
          <div className="text-center space-y-6">
            <div className="w-20 h-20 bg-green-500 rounded-full flex items-center justify-center mx-auto">
              <Check className="w-10 h-10 text-white" />
            </div>
            
            <h2 className="text-3xl font-bold text-white">Başvurunuz Alındı! 🎉</h2>
            
            <p className="text-white/80 text-lg">
              Ajans profiliniz oluşturuldu ve belge doğrulama süreci başlatıldı.
            </p>
            
            <div className="space-y-3">
              <div className="bg-blue-500/10 border border-blue-500/20 rounded-lg p-4">
                <p className="text-sm text-blue-200">
                  <strong>⏱️ Doğrulama Süreci:</strong> Belgeleriniz 1-2 iş günü içinde incelenecek. 
                  Sonuç e-posta ile bildirilecek.
                </p>
              </div>
              
              <div className="bg-yellow-500/10 border border-yellow-500/20 rounded-lg p-4">
                <p className="text-sm text-yellow-200">
                  <strong>🚫 Geçici Kısıtlama:</strong> Doğrulama tamamlanana kadar yeteneklere 
                  teklif gönderemez, sadece profilleri görüntüleyebilirsiniz.
                </p>
              </div>
              
              <div className="bg-green-500/10 border border-green-500/20 rounded-lg p-4">
                <p className="text-sm text-green-200">
                  <strong>🔒 Gizlilik Güvencesi:</strong> Doğrulama sonrasında bile yetenek iletişim 
                  bilgilerine erişim sadece onaylarıyla mümkün olacak.
                </p>
              </div>
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
            <h1 className="text-2xl font-bold text-white">Ajans Profili Oluştur</h1>
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
            {currentStep < 4 && (
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

export default function AgencyOnboarding() {
  return (
    <AuthGuard checkOnboardingCompleted={true}>
      <RoleRequired required="AGENCY">
        <AgencyOnboardingContent />
      </RoleRequired>
    </AuthGuard>
  )
}

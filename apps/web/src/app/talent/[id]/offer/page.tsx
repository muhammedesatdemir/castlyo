'use client'

import { useState, useEffect } from 'react'
import { useRouter, useParams } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { ArrowLeft, Send, Shield, Check } from 'lucide-react'

export default function SendOfferPage() {
  const router = useRouter()
  const params = useParams()
  const talentId = params.id as string
  
  const [step, setStep] = useState<'consent' | 'offer' | 'sent'>('consent')
  const [consentGiven, setConsentGiven] = useState(false)
  const [offerData, setOfferData] = useState({
    subject: '',
    message: '',
    projectType: '',
    budget: '',
    timeline: '',
  })

  // Mock talent data - would come from API
  const [talent] = useState({
    id: talentId,
    name: 'Ayşe Demir',
    role: 'Oyuncu',
    city: 'İstanbul',
    image: '/mock/talents/oyuncu1.jpg',
  })

  const handleConsentSubmit = async () => {
    if (!consentGiven) {
      alert('İletişim izni vermeniz gerekmektedir.')
      return
    }

    try {
      // TODO: API call to request contact permission
      console.log('Requesting contact permission for talent:', talentId)
      setStep('offer')
    } catch (error) {
      console.error('Error requesting permission:', error)
    }
  }

  const handleOfferSubmit = async () => {
    try {
      // TODO: API call to send offer
      console.log('Sending offer:', offerData)
      setStep('sent')
    } catch (error) {
      console.error('Error sending offer:', error)
    }
  }

  const renderConsentStep = () => (
    <div className="space-y-6">
      <div className="text-center">
        <Shield className="w-16 h-16 text-blue-400 mx-auto mb-4" />
        <h2 className="text-2xl font-bold text-white mb-2">İletişim İzni Gerekli</h2>
        <p className="text-white/70">
          {talent.name} ile iletişime geçebilmek için izin almanız gerekiyor.
        </p>
      </div>

      <div className="bg-blue-500/10 border border-blue-500/20 rounded-lg p-6">
        <h3 className="text-blue-200 font-semibold mb-3">🔒 Gizlilik Güvencesi</h3>
        <ul className="space-y-2 text-sm text-blue-200/80">
          <li>• Yetenek iletişim bilgileri sadece onay verdikten sonra paylaşılır</li>
          <li>• Tüm iletişimler platform üzerinden güvenle yapılır</li>
          <li>• Kişisel veriler hiçbir şekilde üçüncü taraflarla paylaşılmaz</li>
          <li>• KVKK ve veri koruma yasalarına tam uyum</li>
        </ul>
      </div>

      <div className="bg-white/5 border border-white/10 rounded-lg p-6">
        <h3 className="text-white font-semibold mb-3">İzin Süreci</h3>
        <div className="space-y-3 text-sm text-white/80">
          <div className="flex items-start space-x-3">
            <div className="w-6 h-6 bg-brand-primary rounded-full flex items-center justify-center text-white text-xs font-bold">1</div>
            <div>
              <p className="font-medium">İletişim İsteği Gönder</p>
              <p className="text-white/60">Yetenek size ulaşma isteğinizi alacak</p>
            </div>
          </div>
          <div className="flex items-start space-x-3">
            <div className="w-6 h-6 bg-white/20 rounded-full flex items-center justify-center text-white text-xs">2</div>
            <div>
              <p className="font-medium">Yetenek Onayı</p>
              <p className="text-white/60">Yetenek isteğinizi değerlendirip karar verecek</p>
            </div>
          </div>
          <div className="flex items-start space-x-3">
            <div className="w-6 h-6 bg-white/20 rounded-full flex items-center justify-center text-white text-xs">3</div>
            <div>
              <p className="font-medium">Güvenli İletişim</p>
              <p className="text-white/60">Onay sonrası platform üzerinden iletişim kurabilirsiniz</p>
            </div>
          </div>
        </div>
      </div>

      <div className="flex items-start space-x-3">
        <input
          type="checkbox"
          id="consent"
          checked={consentGiven}
          onChange={(e) => setConsentGiven(e.target.checked)}
          className="mt-1 rounded border-white/20 bg-white/10"
        />
        <label htmlFor="consent" className="text-sm text-white/80 leading-relaxed">
          <strong className="text-white">İletişim İzni Talebi:</strong> {talent.name} ile iletişim kurmak 
          istiyorum ve kişisel verilerinin sadece onayı ile paylaşılmasını kabul ediyorum. 
          Bu talep yetenek tarafından değerlendirilecek ve onaylanması durumunda güvenli 
          iletişim kurulabilecektir.
        </label>
      </div>

      <div className="flex justify-between">
        <Button
          variant="outline"
          onClick={() => router.back()}
          className="border-white/20 text-white hover:bg-white/10"
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          Geri Dön
        </Button>
        
        <Button
          onClick={handleConsentSubmit}
          disabled={!consentGiven}
          className="bg-brand-primary hover:bg-brand-primary/90 text-white"
        >
          İletişim İzni Talep Et
          <Send className="w-4 h-4 ml-2" />
        </Button>
      </div>
    </div>
  )

  const renderOfferStep = () => (
    <div className="space-y-6">
      <div className="text-center">
        <h2 className="text-2xl font-bold text-white mb-2">Teklif Gönder</h2>
        <p className="text-white/70">
          {talent.name} için proje teklifinizi hazırlayın.
        </p>
      </div>

      <div className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-white/90 mb-2">
            Proje Konusu *
          </label>
          <Input
            value={offerData.subject}
            onChange={(e) => setOfferData({ ...offerData, subject: e.target.value })}
            className="bg-white/10 border-white/20 text-white placeholder:text-white/50"
            placeholder="Film casting, reklam çekimi, vs."
            required
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-white/90 mb-2">
            Proje Türü
          </label>
          <select
            value={offerData.projectType}
            onChange={(e) => setOfferData({ ...offerData, projectType: e.target.value })}
            className="w-full rounded-lg bg-white/10 border border-white/20 text-white px-3 py-2"
          >
            <option value="">Seçin</option>
            <option value="film">Film</option>
            <option value="dizi">Dizi</option>
            <option value="reklam">Reklam</option>
            <option value="tiyatro">Tiyatro</option>
            <option value="moda">Moda Çekimi</option>
            <option value="katalog">Katalog</option>
            <option value="other">Diğer</option>
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium text-white/90 mb-2">
            Mesaj *
          </label>
          <textarea
            value={offerData.message}
            onChange={(e) => setOfferData({ ...offerData, message: e.target.value })}
            className="w-full rounded-lg bg-white/10 border border-white/20 text-white placeholder:text-white/50 px-3 py-2 min-h-[120px]"
            placeholder="Projeniz hakkında detaylar, rol açıklaması, çekim tarihleri..."
            required
          />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-white/90 mb-2">
              Bütçe Aralığı
            </label>
            <Input
              value={offerData.budget}
              onChange={(e) => setOfferData({ ...offerData, budget: e.target.value })}
              className="bg-white/10 border-white/20 text-white placeholder:text-white/50"
              placeholder="5.000 - 10.000 TL"
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-white/90 mb-2">
              Zaman Çizelgesi
            </label>
            <Input
              value={offerData.timeline}
              onChange={(e) => setOfferData({ ...offerData, timeline: e.target.value })}
              className="bg-white/10 border-white/20 text-white placeholder:text-white/50"
              placeholder="2 hafta içinde"
            />
          </div>
        </div>
      </div>

      <div className="bg-yellow-500/10 border border-yellow-500/20 rounded-lg p-4">
        <p className="text-sm text-yellow-200">
          <strong>💡 İpucu:</strong> Detaylı ve profesyonel teklifler daha yüksek yanıt oranına sahiptir. 
          Projenizin kapsamını, beklentilerinizi ve çekim detaylarını net bir şekilde belirtin.
        </p>
      </div>

      <div className="flex justify-between">
        <Button
          variant="outline"
          onClick={() => setStep('consent')}
          className="border-white/20 text-white hover:bg-white/10"
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          Geri
        </Button>
        
        <Button
          onClick={handleOfferSubmit}
          disabled={!offerData.subject || !offerData.message}
          className="bg-brand-primary hover:bg-brand-primary/90 text-white"
        >
          Teklifi Gönder
          <Send className="w-4 h-4 ml-2" />
        </Button>
      </div>
    </div>
  )

  const renderSentStep = () => (
    <div className="text-center space-y-6">
      <div className="w-20 h-20 bg-green-500 rounded-full flex items-center justify-center mx-auto">
        <Check className="w-10 h-10 text-white" />
      </div>
      
      <h2 className="text-3xl font-bold text-white">Teklif Gönderildi! 🎉</h2>
      
      <p className="text-white/80 text-lg">
        Teklifiniz {talent.name} ile paylaşıldı. Yetenek değerlendirme yapacak ve 
        size geri dönüş sağlayacak.
      </p>
      
      <div className="space-y-3">
        <div className="bg-blue-500/10 border border-blue-500/20 rounded-lg p-4">
          <p className="text-sm text-blue-200">
            <strong>📬 Bildirim:</strong> Yetenek yanıt verdiğinde e-posta ile bilgilendirileceksiniz.
          </p>
        </div>
        
        <div className="bg-green-500/10 border border-green-500/20 rounded-lg p-4">
          <p className="text-sm text-green-200">
            <strong>⏱️ Yanıt Süresi:</strong> Ortalama yanıt süresi 2-3 iş günüdür.
          </p>
        </div>
      </div>
      
      <div className="space-y-3">
        <Button
          onClick={() => router.push('/profile')}
          className="w-full bg-brand-primary hover:bg-brand-primary/90 text-white font-semibold py-3"
        >
          Profilime Git
        </Button>
        
        <Button
          variant="outline"
          onClick={() => router.push('/')}
          className="w-full border-white/20 text-white hover:bg-white/10"
        >
          Ana Sayfaya Dön
        </Button>
      </div>
    </div>
  )

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-black">
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center space-x-4">
            <div className="w-12 h-12 bg-white/10 rounded-full overflow-hidden">
              {/* <img src={talent.image} alt={talent.name} className="w-full h-full object-cover" /> */}
              <div className="w-full h-full bg-gradient-to-br from-brand-primary to-brand-secondary"></div>
            </div>
            <div>
              <h1 className="text-xl font-bold text-white">{talent.name}</h1>
              <p className="text-white/70">{talent.role} • {talent.city}</p>
            </div>
          </div>
          
          {step !== 'sent' && (
            <div className="text-center">
              <div className="text-sm text-white/70">
                Adım {step === 'consent' ? '1' : '2'} / 2
              </div>
            </div>
          )}
        </div>

        {/* Content */}
        <div className="max-w-2xl mx-auto">
          <div className="bg-white/5 backdrop-blur-lg rounded-2xl border border-white/10 p-8 shadow-2xl">
            {step === 'consent' && renderConsentStep()}
            {step === 'offer' && renderOfferStep()}
            {step === 'sent' && renderSentStep()}
          </div>
        </div>
      </div>
    </div>
  )
}

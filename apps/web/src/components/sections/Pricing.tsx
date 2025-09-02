import { Check, Star } from 'lucide-react'
import { Button } from '@/components/ui/button'

const plans = [
  {
    name: 'Ücretsiz',
    price: '0₺',
    description: 'Bireysel kullanıcılar için temel özellikler',
    features: [
      'Profil oluşturma',
      'Aylık 5 başvuru hakkı',
      'Temel arama özellikleri',
      'E-posta bildirimleri',
      'Mobil uygulama erişimi',
    ],
    popular: false,
  },
  {
    name: 'Premium',
    price: '99₺',
    period: '/ay',
    description: 'Aktif yetenekler için gelişmiş özellikler',
    features: [
      'Ücretsiz planın tüm özellikleri',
      'Sınırsız başvuru hakkı',
      'Profil öne çıkarma',
      'Gelişmiş arama filtreleri',
      'Öncelikli destek',
      'Analitik raporlar',
      'Özel etiketler',
    ],
    popular: true,
  },
  {
    name: 'Pro',
    price: '199₺',
    period: '/ay',
    description: 'Profesyoneller için maksimum özellikler',
    features: [
      'Premium planın tüm özellikleri',
      'VIP ajans erişimi',
      'Özel casting etkinlikleri',
      'Kişisel casting danışmanı',
      'Portföy optimizasyonu',
      'Sosyal medya entegrasyonu',
      '7/24 öncelikli destek',
    ],
    popular: false,
  },
]

export default function Pricing() {
  return (
    <section className="py-24 sm:py-32">
      <div className="mx-auto max-w-7xl px-6 lg:px-8">
        <div className="mx-auto max-w-2xl lg:text-center">
          <h2 className="text-base font-semibold leading-7 text-brand-primary">
            Fiyatlandırma
          </h2>
          <p className="mt-2 text-3xl font-bold tracking-tight text-gray-900 sm:text-4xl">
            Her bütçeye uygun paketler
          </p>
          <p className="mt-6 text-lg leading-8 text-gray-600">
            İhtiyacınıza göre esnek paket seçenekleri. Ücretsiz başlayın, 
            ihtiyaç duydukça yükseltin. Hiçbir gizli ücret yok.
          </p>
        </div>
        
        <div className="mx-auto mt-16 grid max-w-lg grid-cols-1 gap-y-6 sm:mt-20 sm:max-w-none sm:grid-cols-3">
          {plans.map((plan) => (
            <div
              key={plan.name}
              className={`relative flex flex-col justify-between rounded-3xl bg-white p-8 ring-1 ring-gray-200 xl:p-10 ${
                plan.popular ? 'ring-2 ring-brand-primary' : ''
              }`}
            >
              {plan.popular && (
                <div className="absolute -top-5 left-0 right-0 mx-auto w-32 rounded-full bg-gradient-to-r from-brand-primary to-brand-secondary px-3 py-2 text-sm font-medium text-white text-center">
                  En Popüler
                </div>
              )}
              
              <div>
                <div className="flex items-center justify-between gap-x-4">
                  <h3 className="text-lg font-semibold leading-8 text-gray-900">
                    {plan.name}
                  </h3>
                  {plan.popular && (
                    <Star className="h-5 w-5 text-yellow-400" />
                  )}
                </div>
                
                <p className="mt-4 text-sm leading-6 text-gray-600">
                  {plan.description}
                </p>
                
                <p className="mt-6 flex items-baseline gap-x-1">
                  <span className="text-4xl font-bold tracking-tight text-gray-900">
                    {plan.price}
                  </span>
                  {plan.period && (
                    <span className="text-sm font-semibold leading-6 text-gray-600">
                      {plan.period}
                    </span>
                  )}
                </p>
                
                <ul className="mt-8 space-y-3 text-sm leading-6 text-gray-600">
                  {plan.features.map((feature) => (
                    <li key={feature} className="flex gap-x-3">
                      <Check className="h-6 w-5 flex-none text-green-600" aria-hidden="true" />
                      {feature}
                    </li>
                  ))}
                </ul>
              </div>
              
              <Button
                asChild
                className={`mt-8 w-full ${
                  plan.popular
                    ? 'bg-gradient-to-r from-brand-primary to-brand-secondary hover:from-brand-700 hover:to-brand-300'
                    : 'bg-gray-900 hover:bg-gray-700'
                }`}
              >
                <a href="/register">
                  {plan.name === 'Ücretsiz' ? 'Ücretsiz Başla' : 'Paketi Seç'}
                </a>
              </Button>
            </div>
          ))}
        </div>
        
        <div className="mt-16 text-center">
          <p className="text-lg text-gray-600">
            Kurumsal ihtiyaçlarınız için özel paketler
          </p>
          <Button variant="outline" className="mt-4">
            İletişime Geç
          </Button>
        </div>
      </div>
    </section>
  )
}

import { Shield, Users, Zap, Star, Globe, Lock } from 'lucide-react'

const features = [
  {
    name: 'Güvenli Platform',
    description: 'KVKK uyumlu, SSL sertifikalı ve güvenli ödeme sistemi ile korunan platform.',
    icon: Shield,
  },
  {
    name: 'Geniş Ağ',
    description: 'Türkiye genelinde 500+ yetenek ve 50+ ajans ile geniş ağ.',
    icon: Users,
  },
  {
    name: 'Hızlı Eşleştirme',
    description: 'Yapay zeka destekli algoritma ile hızlı ve doğru eşleştirme.',
    icon: Zap,
  },
  {
    name: 'Kalite Garantisi',
    description: 'Tüm yetenekler ve ajanslar özenle seçilir ve doğrulanır.',
    icon: Star,
  },
  {
    name: '7/24 Erişim',
    description: 'Dünyanın her yerinden, her zaman erişilebilir platform.',
    icon: Globe,
  },
  {
    name: 'Gizlilik Koruması',
    description: 'Kişisel verileriniz güvenle korunur ve paylaşılmaz.',
    icon: Lock,
  },
]

export default function Features() {
  return (
    <section id="features" className="py-24 sm:py-32">
      <div className="mx-auto max-w-7xl px-6 lg:px-8">
        <div className="mx-auto max-w-2xl lg:text-center">
          <h2 className="text-base font-semibold leading-7 text-brand-primary">
            Neden Castlyo?
          </h2>
          <p className="mt-2 text-3xl font-bold tracking-tight text-gray-900 sm:text-4xl">
            Profesyonel casting deneyimi için her şey
          </p>
          <p className="mt-6 text-lg leading-8 text-gray-600">
            Castlyo, yetenekler ve ajanslar arasında güvenli, hızlı ve etkili 
            bir köprü kurar. Modern teknoloji ve kullanıcı dostu arayüz ile 
            casting süreçlerinizi kolaylaştırır.
          </p>
        </div>
        <div className="mx-auto mt-16 max-w-2xl sm:mt-20 lg:mt-24 lg:max-w-none">
          <dl className="grid max-w-xl grid-cols-1 gap-x-8 gap-y-16 lg:max-w-none lg:grid-cols-3">
            {features.map((feature) => (
              <div key={feature.name} className="flex flex-col">
                <dt className="flex items-center gap-x-3 text-base font-semibold leading-7 text-gray-900">
                  <feature.icon className="h-5 w-5 flex-none text-brand-primary" aria-hidden="true" />
                  {feature.name}
                </dt>
                <dd className="mt-4 flex flex-auto flex-col text-base leading-7 text-gray-600">
                  <p className="flex-auto">{feature.description}</p>
                </dd>
              </div>
            ))}
          </dl>
        </div>
      </div>
    </section>
  )
}

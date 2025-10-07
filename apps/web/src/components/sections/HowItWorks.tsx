import { UserPlus, Search, Users, Star } from 'lucide-react'

const steps = [
  {
    id: 1,
    name: 'Profil Oluştur',
    description: 'Detaylı profil bilgilerinizi girin, yeteneklerinizi sergileyin ve portföyünüzü ekleyin.',
    icon: UserPlus,
  },
  {
    id: 2,
    name: 'Ajans Bul',
    description: 'Yapay zeka destekli arama ile size en uygun ajansları ve projeleri keşfedin.',
    icon: Search,
  },
  {
    id: 3,
    name: 'Bağlantı Kur',
    description: 'Ajanslarla güvenli bir şekilde iletişime geçin ve fırsatları değerlendirin.',
    icon: Users,
  },
  {
    id: 4,
    name: 'Başarıya Ulaş',
    description: 'Profesyonel kariyerinizi geliştirin ve hayalinizdeki projelerde yer alın.',
    icon: Star,
  },
]

export default function HowItWorks() {
  return (
    <section className="py-24 sm:py-32 bg-brand-50">
      <div className="mx-auto max-w-7xl px-6 lg:px-8">
        <div className="mx-auto max-w-2xl lg:text-center">
          <h2 className="text-base font-semibold leading-7 text-brand-primary">
            Nasıl Çalışır?
          </h2>
          <p className="mt-2 text-3xl font-bold tracking-tight text-gray-900 sm:text-4xl">
            4 Basit Adımda Başarıya Ulaşın
          </p>
          <p className="mt-6 text-lg leading-8 text-gray-600">
            Castlyo platformunda yeteneklerinizi sergilemek ve ajanslarla buluşmak 
            çok kolay. Sadece birkaç adımda profesyonel casting sürecinizi başlatın.
          </p>
        </div>
        
        <div className="mx-auto mt-16 max-w-2xl sm:mt-20 lg:mt-24 lg:max-w-none">
          <div className="grid grid-cols-1 gap-8 lg:grid-cols-4">
            {steps.map((step, stepIdx) => (
              <div key={step.name} className="relative">
                <div className="flex flex-col items-center text-center">
                  <div className="flex h-16 w-16 items-center justify-center rounded-full bg-brand-gradient-smooth text-white">
                    <step.icon className="h-8 w-8" aria-hidden="true" />
                  </div>
                  <h3 className="mt-6 text-lg font-semibold text-gray-900">
                    {step.name}
                  </h3>
                  <p className="mt-2 text-base text-gray-600">
                    {step.description}
                  </p>
                </div>
                
                {stepIdx < steps.length - 1 && (
                  <div className="absolute top-8 left-1/2 hidden h-0.5 w-full -translate-y-1/2 bg-gray-200 lg:block" />
                )}
              </div>
            ))}
          </div>
        </div>
        
        <div className="mt-16 text-center">
          <p className="text-lg text-gray-600">
            Hemen başlamak için ücretsiz hesap oluşturun
          </p>
          <div className="mt-6 flex justify-center">
            <div className="inline-flex items-center gap-2 rounded-full bg-green-100 px-4 py-2 text-sm font-medium text-green-800">
              <div className="h-2 w-2 rounded-full bg-green-600" />
              Sadece 2 dakika
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}

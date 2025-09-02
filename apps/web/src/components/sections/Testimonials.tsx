import { Star, Quote } from 'lucide-react'

const testimonials = [
  {
    content: 'Castlyo sayesinde ilk filmimde rol aldım. Platform çok profesyonel ve güvenilir.',
    author: 'Ayşe Yılmaz',
    role: 'Oyuncu',
    avatar: '/avatars/ayse.jpg',
    rating: 5,
  },
  {
    content: 'Yetenek arama sürecimiz %70 hızlandı. Castlyo gerçekten işimizi kolaylaştırıyor.',
    author: 'Mehmet Demir',
    role: 'Casting Direktörü',
    avatar: '/avatars/mehmet.jpg',
    rating: 5,
  },
  {
    content: 'Ücretsiz başladım, şimdi premium üyeyim. Kesinlikle tavsiye ederim.',
    author: 'Zeynep Kaya',
    role: 'Model',
    avatar: '/avatars/zeynep.jpg',
    rating: 5,
  },
  {
    content: 'Ajansımız için mükemmel bir platform. Kaliteli yetenekler buluyoruz.',
    author: 'Ali Özkan',
    role: 'Ajans Sahibi',
    avatar: '/avatars/ali.jpg',
    rating: 5,
  },
  {
    content: 'Kullanıcı dostu arayüz ve hızlı destek. Çok memnunum.',
    author: 'Elif Arslan',
    role: 'Müzisyen',
    avatar: '/avatars/elif.jpg',
    rating: 5,
  },
  {
    content: 'Profesyonel yaklaşım ve güvenli platform. Teşekkürler Castlyo!',
    author: 'Can Yıldız',
    role: 'Oyuncu',
    avatar: '/avatars/can.jpg',
    rating: 5,
  },
]

export default function Testimonials() {
  return (
    <section className="py-24 sm:py-32 bg-brand-50">
      <div className="mx-auto max-w-7xl px-6 lg:px-8">
        <div className="mx-auto max-w-2xl lg:text-center">
          <h2 className="text-base font-semibold leading-7 text-brand-primary">
            Kullanıcı Deneyimleri
          </h2>
          <p className="mt-2 text-3xl font-bold tracking-tight text-gray-900 sm:text-4xl">
            Müşterilerimiz ne diyor?
          </p>
          <p className="mt-6 text-lg leading-8 text-gray-600">
            Castlyo platformunda binlerce yetenek ve ajans başarıya ulaştı. 
            İşte onların deneyimleri.
          </p>
        </div>
        
        <div className="mx-auto mt-16 grid max-w-2xl grid-cols-1 grid-rows-3 gap-8 text-sm leading-6 text-gray-900 sm:mt-20 sm:grid-cols-2 xl:mx-0 xl:max-w-none xl:grid-flow-col xl:grid-cols-4">
          {testimonials.map((testimonial, testimonialIdx) => (
            <figure
              key={testimonialIdx}
              className={`rounded-2xl bg-white p-6 shadow-lg ring-1 ring-gray-900/5 ${
                testimonialIdx === 0 ? 'xl:col-span-2' : ''
              }`}
            >
              <blockquote className="text-gray-900">
                <Quote className="h-8 w-8 text-brand-primary mb-4" />
                <p className="text-base leading-7">{testimonial.content}</p>
              </blockquote>
              <figcaption className="mt-6 flex items-center gap-x-4">
                <div className="h-10 w-10 rounded-full bg-gray-50 flex items-center justify-center">
                  <span className="text-lg font-semibold text-gray-600">
                    {testimonial.author.split(' ').map(n => n[0]).join('')}
                  </span>
                </div>
                <div>
                  <div className="font-semibold">{testimonial.author}</div>
                  <div className="text-gray-600">{testimonial.role}</div>
                </div>
                <div className="ml-auto flex items-center gap-1">
                  {[...Array(testimonial.rating)].map((_, i) => (
                    <Star key={i} className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                  ))}
                </div>
              </figcaption>
            </figure>
          ))}
        </div>
        
        <div className="mt-16 text-center">
          <div className="flex items-center justify-center gap-4 text-sm text-gray-600">
            <div className="flex items-center gap-2">
              <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
              <span>4.9/5 ortalama puan</span>
            </div>
            <span>•</span>
            <span>1000+ memnun kullanıcı</span>
            <span>•</span>
            <span>%98 memnuniyet oranı</span>
          </div>
        </div>
      </div>
    </section>
  )
}

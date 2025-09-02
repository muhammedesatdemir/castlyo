import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { ArrowRight, Star, Users, Zap } from 'lucide-react'

export default function CTA() {
  return (
    <section className="relative isolate overflow-hidden bg-gray-900 py-24 sm:py-32">
      <div className="mx-auto max-w-7xl px-6 lg:px-8">
        <div className="mx-auto max-w-2xl text-center">
          <h2 className="text-3xl font-bold tracking-tight text-white sm:text-4xl">
            Kariyerinizde Büyük Adımlar Atın
          </h2>
          <p className="mx-auto mt-6 max-w-xl text-lg leading-8 text-gray-300">
            Castlyo ile yeteneklerinizi sergileyin, ajanslarla buluşun ve 
            hayalinizdeki projelerde yer alın. Hemen başlayın!
          </p>
          
          <div className="mt-10 flex items-center justify-center gap-x-6">
            <Button asChild size="lg" className="bg-brand-gradient-smooth hover:from-brand-700 hover:to-brand-300 text-white font-semibold">
              <Link href="/register">
                Ücretsiz Başla
                <ArrowRight className="ml-2 h-4 w-4" />
              </Link>
            </Button>
            
            <Button variant="outline" size="lg" className="border-white/20 text-white hover:bg-white/10">
              Demo İzle
            </Button>
          </div>
        </div>
        
        <div className="mx-auto mt-16 grid max-w-2xl grid-cols-1 gap-8 sm:mt-20 sm:max-w-none sm:grid-cols-3">
          <div className="flex flex-col items-center text-center">
            <div className="flex h-16 w-16 items-center justify-center rounded-full bg-gradient-to-r from-brand-primary to-brand-secondary">
              <Users className="h-8 w-8 text-white" />
            </div>
            <h3 className="mt-6 text-lg font-semibold text-white">500+ Yetenek</h3>
            <p className="mt-2 text-sm text-gray-400">
              Platformda aktif olarak yer alan yetenek
            </p>
          </div>
          
          <div className="flex flex-col items-center text-center">
            <div className="flex h-16 w-16 items-center justify-center rounded-full bg-gradient-to-r from-brand-primary to-brand-secondary">
              <Star className="h-8 w-8 text-white" />
            </div>
            <h3 className="mt-6 text-lg font-semibold text-white">50+ Ajans</h3>
            <p className="mt-2 text-sm text-gray-400">
              Doğrulanmış ve güvenilir ajans
            </p>
          </div>
          
          <div className="flex flex-col items-center text-center">
            <div className="flex h-16 w-16 items-center justify-center rounded-full bg-gradient-to-r from-brand-primary to-brand-secondary">
              <Zap className="h-8 w-8 text-white" />
            </div>
            <h3 className="mt-6 text-lg font-semibold text-white">%95 Başarı</h3>
            <p className="mt-2 text-sm text-gray-400">
              Başarılı eşleştirme oranı
            </p>
          </div>
        </div>
        
        <div className="mt-16 text-center">
          <p className="text-sm text-gray-400">
            Güvenli • Hızlı • Profesyonel
          </p>
          <div className="mt-4 flex items-center justify-center gap-4 text-xs text-gray-500">
            <span>SSL Şifreli</span>
            <span>•</span>
            <span>KVKK Uyumlu</span>
            <span>•</span>
            <span>7/24 Destek</span>
          </div>
        </div>
      </div>
      
      {/* Background decoration */}
      <div className="absolute left-1/2 top-0 -z-10 -translate-x-1/2 blur-3xl xl:-top-6" aria-hidden="true">
        <div
          className="aspect-[1155/678] w-[72.1875rem] bg-gradient-to-r from-brand-primary/30 to-brand-secondary/30 opacity-30"
          style={{
            clipPath:
              'polygon(74.1% 44.1%, 100% 61.6%, 97.5% 26.9%, 85.5% 0.1%, 80.7% 2%, 72.5% 32.5%, 60.2% 62.4%, 52.4% 68.1%, 47.5% 58.3%, 45.2% 34.5%, 27.5% 76.7%, 0.1% 64.9%, 17.9% 100%, 27.6% 76.8%, 76.1% 97.7%, 74.1% 44.1%)',
          }}
        />
      </div>
    </section>
  )
}

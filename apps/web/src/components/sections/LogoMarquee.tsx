import { montserratDisplay } from '@/lib/fonts'

const logos = [
  { name: 'Media Insomnia', src: '/logos/media-insomnia.svg' },
  { name: 'Gurme Yapım', src: '/logos/gurme-yapim.svg' },
  { name: 'Renda Funexagon', src: '/logos/renda-funexagon.svg' },
  { name: 'Pixel-İst', src: '/logos/pixel-ist.svg' }
]

export default function LogoMarquee() {
  return (
    <section className="section-black relative bg-[#0E0A1A] py-12 border-y border-white/5 z-0 -mt-1">
      {/* Alta doğru siyaha eriyecek köprü */}
      <div className="pointer-events-none absolute bottom-0 left-0 right-0 h-12
                      bg-gradient-to-b from-transparent to-black" />
      <div className="mx-auto max-w-6xl px-6">
        <h3 className={montserratDisplay.className + " text-center text-white/90 text-base md:text-lg font-bold tracking-wide mb-8"}>
          Güvenilen ajanslarla ortaklık
        </h3>
        
        <div className="relative overflow-hidden">
          <div className="animate-marquee flex whitespace-nowrap will-change-transform">
            {[...logos, ...logos].map((logo, i) => (
              <div 
                key={i} 
                className="mx-8 flex items-center justify-center h-12 flex-shrink-0"
              >
                <span className={montserratDisplay.className + " text-sm md:text-base font-semibold text-white/80 opacity-80 hover:opacity-100 transition-opacity duration-300"}>
                  {logo.name}
                </span>
              </div>
            ))}
          </div>
          
          {/* Gradient Overlays */}
          <div className="absolute left-0 top-0 w-24 h-full bg-gradient-to-r from-[#0E0A1A] to-transparent pointer-events-none"></div>
          <div className="absolute right-0 top-0 w-24 h-full bg-gradient-to-l from-[#0E0A1A] to-transparent pointer-events-none"></div>
        </div>
        
        <p className="text-center text-white/40 text-xs mt-6">
          * Örnek ajans isimleri *
        </p>
      </div>
    </section>
  )
}

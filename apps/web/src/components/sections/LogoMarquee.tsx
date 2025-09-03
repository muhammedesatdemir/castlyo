const logos = [
  { name: 'Maya Casting', src: '/logos/maya.svg' },
  { name: 'DMR Agency', src: '/logos/dmr.svg' },
  { name: 'Renda Casting', src: '/logos/renda.svg' },
  { name: 'TalentCo', src: '/logos/talentco.svg' },
  { name: 'ProCast', src: '/logos/procast.svg' },
  { name: 'StarLight', src: '/logos/starlight.svg' }
]

export default function LogoMarquee() {
  return (
    <section className="section-black relative bg-[#0E0A1A] py-12 border-y border-white/5 z-0 -mt-1">
      {/* Alta doğru siyaha eriyecek köprü */}
      <div className="pointer-events-none absolute bottom-0 left-0 right-0 h-12
                      bg-gradient-to-b from-transparent to-black" />
      <div className="mx-auto max-w-6xl px-6">
        <p className="text-center text-white/60 text-sm mb-8">
          Güvenilen ajanslarla ortaklık
        </p>
        
        <div className="relative overflow-hidden">
          <div className="animate-marquee flex whitespace-nowrap will-change-transform">
            {[...logos, ...logos].map((logo, i) => (
              <div 
                key={i} 
                className="mx-8 flex items-center justify-center h-12 w-32 flex-shrink-0"
              >
                <img 
                  src={logo.src} 
                  alt={logo.name}
                  className="h-8 w-auto opacity-60 hover:opacity-90 transition-opacity duration-300 filter brightness-0 invert"
                />
              </div>
            ))}
          </div>
          
          {/* Gradient Overlays */}
          <div className="absolute left-0 top-0 w-24 h-full bg-gradient-to-r from-[#0E0A1A] to-transparent pointer-events-none"></div>
          <div className="absolute right-0 top-0 w-24 h-full bg-gradient-to-l from-[#0E0A1A] to-transparent pointer-events-none"></div>
        </div>
        
        <p className="text-center text-white/40 text-xs mt-6">
          * Örnek ajans isimleri - demo amaçlıdır
        </p>
      </div>
    </section>
  )
}

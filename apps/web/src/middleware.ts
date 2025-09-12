import { withAuth } from 'next-auth/middleware'
import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

export default withAuth(
  function middleware(req: NextRequest) {
    const token = req.nextauth.token
    const { pathname } = req.nextUrl

    // Statik asset ve Next.js internal yolları erken bypass et
    if (
      pathname.startsWith('/_next') ||
      pathname.startsWith('/api/auth') ||
      /\.(?:png|jpg|jpeg|gif|svg|webp|mp4|mov|mp3|woff2|ttf)$/i.test(pathname) ||
      pathname === '/favicon.ico' ||
      pathname === '/robots.txt' ||
      pathname === '/sitemap.xml'
    ) {
      return NextResponse.next()
    }

    // API yollarını bypass et - middleware dokunmasın
    if (pathname.startsWith('/api/')) {
      return NextResponse.next()
    }

    console.log(`[Middleware] ${req.method} ${pathname} | Authenticated: ${!!token}`)

    // Kural-1: Session yoksa onboarding'e erişim engelle
    if (pathname.startsWith('/onboarding')) {
      if (!token) {
        const loginUrl = new URL('/auth', req.url)
        loginUrl.searchParams.set('next', pathname)
        console.log(`[Middleware] Redirecting unauthenticated user to login: ${loginUrl.toString()}`)
        return NextResponse.redirect(loginUrl)
      }

      // Kural-2: Session var ve onboarding tamamlanmışsa profile'a yönlendir
      // TODO: Gerçek onboarding durumu API'dan alınacak
      const onboardingCompleted = false // Bu user profile API'dan gelecek
      if (onboardingCompleted) {
        console.log(`[Middleware] Redirecting completed user to profile`)
        return NextResponse.redirect(new URL('/profile', req.url))
      }
    }

    // Kural-3: Auth sayfası açıkken session varsa ana sayfaya yönlendir
    if (pathname.startsWith('/auth') && token) {
      console.log(`[Middleware] Redirecting authenticated user to home`)
      return NextResponse.redirect(new URL('/', req.url))
    }

    // Korumalı sayfalar - auth gerekli
    const protectedPaths = ['/profile', '/settings', '/jobs', '/search']
    if (protectedPaths.some(path => pathname.startsWith(path))) {
      if (!token) {
        const loginUrl = new URL('/auth', req.url)
        loginUrl.searchParams.set('next', pathname)
        console.log(`[Middleware] Protecting ${pathname}, redirecting to login`)
        return NextResponse.redirect(loginUrl)
      }
    }

    return NextResponse.next()
  },
  {
    callbacks: {
      authorized: ({ token, req }) => {
        // Bu callback tüm istekleri geçirir, gerçek kontrol yukarıdaki middleware function'da
        return true
      },
    },
  }
)

// Middleware'in çalışacağı route'ları belirt
export const config = {
  matcher: [
    // Statik dosyaları ve bazı özel yolları hariç tut
    '/((?!_next/static|_next/image|favicon.ico|robots.txt|sitemap.xml|.*\\.(?:png|jpg|jpeg|gif|svg|webp|mp4|mov|mp3|woff2|ttf)).*)',
  ],
}

import type { NextRequest } from 'next/server';
import { NextResponse } from 'next/server';

export async function middleware(req: NextRequest) {
  const { pathname, origin } = req.nextUrl;

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

  // Sadece onboarding rotalarını koru
  if (!pathname.startsWith('/onboarding')) return NextResponse.next();

  console.log(`[Middleware] ${req.method} ${pathname} | Checking role-based access`)

  // Kullanıcının güncel rolünü backend'den al (proxy cookie'leri geçir)
  const meRes = await fetch(`${origin}/api/proxy/api/v1/users/me`, {
    headers: { cookie: req.headers.get('cookie') ?? '' },
    cache: 'no-store',
  });

  // Kullanıcı yoksa ana sayfaya
  if (!meRes.ok) {
    console.log(`[Middleware] User not authenticated, redirecting to home`)
    return NextResponse.redirect(new URL('/', req.url));
  }

  const me = (await meRes.json()) as { role: 'AGENCY' | 'TALENT' | 'ADMIN' };
  console.log(`[Middleware] User role: ${me.role}`)

  // Rol ile rota eşleşmesi
  if (pathname.startsWith('/onboarding/agency') && me.role !== 'AGENCY') {
    console.log(`[Middleware] Role mismatch: ${me.role} trying to access agency onboarding, redirecting to home`)
    return NextResponse.redirect(new URL('/', req.url));
  }
  if (pathname.startsWith('/onboarding/talent') && me.role !== 'TALENT') {
    console.log(`[Middleware] Role mismatch: ${me.role} trying to access talent onboarding, redirecting to home`)
    return NextResponse.redirect(new URL('/', req.url));
  }

  console.log(`[Middleware] Role check passed for ${me.role} accessing ${pathname}`)
  return NextResponse.next();
}

// Sadece ilgili yolları yakala
export const config = {
  matcher: ['/onboarding/:path*'],
};

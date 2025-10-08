// apps/web/src/app/api/proxy/[...path]/route.ts
import { NextRequest, NextResponse } from 'next/server';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const API_BASE = process.env.API_BASE_URL ?? process.env.API_PROXY_TARGET ?? process.env.API_INTERNAL_URL ?? process.env.INTERNAL_API_URL ?? 'http://localhost:3001';

function rewriteSetCookieForProduction(raw: string): string {
  // Cookie ad/değer + attribute'ları ayır
  const parts = raw.split(';').map(p => p.trim());
  const [nameValue, ...attrs] = parts;

  // domain/secure/samesite/path'ı normalize et
  const keep: string[] = [];
  const isProduction = process.env.NODE_ENV === 'production';

  // Her attribute'u dolaş
  for (const a of attrs) {
    const k = a.toLowerCase();

    // Production'da domain'i kaldır (host-only cookie olsun)
    if (k.startsWith('domain=')) continue;

    // Secure attribute'unu yeniden ayarlayacağız
    if (k === 'secure') continue;

    // SameSite'ı yeniden ayarlayacağız
    if (k.startsWith('samesite=')) continue;

    // Path, HttpOnly, MaxAge gibi diğer attribute'ları koru
    keep.push(a);
  }

  // Minimum güvenli default'lar
  if (!keep.some(p => p.toLowerCase().startsWith('path='))) {
    keep.push('Path=/');
  }
  
  // Production'da Secure + SameSite=None (cross-origin için), development'ta SameSite=Lax
  if (isProduction) {
    // Render.com gibi proxy arkasında çalışırken SameSite=None gerekebilir
    keep.push('SameSite=Lax'); // Lax ile başlayalım, gerekirse None'a çevirebiliriz
    keep.push('Secure');
  } else {
    keep.push('SameSite=Lax');
  }

  return [nameValue, ...keep].join('; ');
}

async function proxy(req: NextRequest, params: { path: string[] }) {
  const segs = params.path || [];
  let upstreamPath = '/' + segs.join('/');
  
  // Backward compatibility: /api/proxy/health -> /api/proxy/api/v1/health
  if (upstreamPath === '/health') {
    upstreamPath = '/api/v1/health';
  }
  
  // If path doesn't start with /api/v1, add it
  if (!upstreamPath.startsWith('/api/v1')) {
    upstreamPath = '/api/v1' + upstreamPath;
  }

  const target = `${API_BASE}${upstreamPath}${req.nextUrl.search}`;

  const headers = new Headers(req.headers);
  headers.delete('host');
  headers.delete('connection');
  headers.set('accept', 'application/json');

  const init: RequestInit = {
    method: req.method,
    headers,
    redirect: 'manual',
    // EN ÖNEMLİ KISIM: Body'yi **stream** olarak aynen ilet
    body: ['GET','HEAD'].includes(req.method) ? undefined : req.body,
    // Node fetch için stream gönderirken şart:
    // @ts-ignore
    duplex: 'half',
  };

  const res = await fetch(target, init);

  // Response body'yi akıt
  const body = res.body;
  const outHeaders = new Headers(res.headers);

  // Tarayıcıyı bozacak header'ları temizle
  outHeaders.delete('content-length');
  outHeaders.delete('content-encoding');
  outHeaders.delete('transfer-encoding');

  // *** CRITICAL: Set-Cookie'leri al, yeniden yaz, geri ekle ***
  // Node runtime'da getSetCookie varsa kullan
  // yoksa get('set-cookie') tek string dönebilir.
  const setCookieValues =
    (typeof (res.headers as any).getSetCookie === 'function'
      ? (res.headers as any).getSetCookie()
      : null) as string[] | null
    ?? (res.headers.get('set-cookie') ? [res.headers.get('set-cookie') as string] : []);

  outHeaders.delete('set-cookie');
  for (const raw of setCookieValues) {
    outHeaders.append('set-cookie', rewriteSetCookieForProduction(raw));
  }

  return new NextResponse(body, {
    status: res.status,
    headers: outHeaders,
  });
}

export async function GET(req: NextRequest, { params }: { params: { path: string[] } }) {
  return proxy(req, params);
}
export async function POST(req: NextRequest, { params }: { params: { path: string[] } }) {
  return proxy(req, params);
}
export async function PUT(req: NextRequest, { params }: { params: { path: string[] } }) {
  return proxy(req, params);
}
export async function PATCH(req: NextRequest, { params }: { params: { path: string[] } }) {
  return proxy(req, params);
}
export async function DELETE(req: NextRequest, { params }: { params: { path: string[] } }) {
  return proxy(req, params);
}
export async function OPTIONS(req: NextRequest, { params }: { params: { path: string[] } }) {
  return proxy(req, params);
}
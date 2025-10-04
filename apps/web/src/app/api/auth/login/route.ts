import { NextRequest, NextResponse } from 'next/server';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

function rewriteSetCookieForLocalhost(raw: string) {
  const parts = raw.split(';').map(p => p.trim());
  const [nv, ...attrs] = parts;
  const keep: string[] = [];
  for (const a of attrs) {
    const k = a.toLowerCase();
    if (k.startsWith('domain=')) continue;
    if (k === 'secure') continue;
    if (k.startsWith('samesite=')) continue;
    if (k.startsWith('path=')) { keep.push(a); continue; }
    keep.push(a);
  }
  if (!keep.some(p => p.toLowerCase().startsWith('path='))) keep.push('Path=/');
  keep.push('SameSite=Lax');
  return [nv, ...keep].join('; ');
}

export async function POST(req: NextRequest) {
  const body = await req.text(); // ham gövde
  const api = process.env.INTERNAL_API_URL ?? 'http://castlyo-api:3001';

  const res = await fetch(`${api}/api/v1/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body,
    redirect: 'manual',
  });

  const headers = new Headers(res.headers);
  headers.delete('content-length');
  headers.delete('content-encoding');
  headers.delete('transfer-encoding');

  // Set-Cookie'leri yeniden yaz ve ekle
  const setCookies =
    (typeof (res.headers as any).getSetCookie === 'function'
      ? (res.headers as any).getSetCookie()
      : null) ?? (headers.get('set-cookie') ? [headers.get('set-cookie') as string] : []);

  headers.delete('set-cookie');
  for (const sc of setCookies) {
    headers.append('set-cookie', rewriteSetCookieForLocalhost(sc!));
  }

  // body'yi proxyle
  return new NextResponse(res.body, { status: res.status, headers });
}
// apps/web/src/app/api/proxy/[...path]/route.ts
import { NextResponse } from 'next/server';

export const runtime = 'nodejs'; // Edge değil! Body stream için şart.

// Use internal API URL for Docker container communication
const API_BASE = process.env.API_INTERNAL_URL || process.env.INTERNAL_API_URL || 'http://api:3001';

async function proxy(req: Request, { params }: { params: { path: string[] } }) {
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

  const url = new URL(API_BASE + upstreamPath);
  // Query string'i de aynen taşı
  const original = new URL(req.url);
  original.searchParams.forEach((v, k) => url.searchParams.append(k, v));

  // Body'yi güvenle yeniden oluştur
  const hasBody = !['GET','HEAD'].includes(req.method.toUpperCase());
  const body = hasBody ? Buffer.from(await req.arrayBuffer()) : undefined;

  // Problem çıkaran header'ları at
  const headers = new Headers(req.headers);
  ['host','content-length'].forEach(h => headers.delete(h));

  try {
    const res = await fetch(url.toString(), {
      method: req.method,
      headers,
      body,
      credentials: 'include',
    });

    // Yanıtı aynen döndür
    const respHeaders = new Headers(res.headers);
    return new NextResponse(res.body, { status: res.status, headers: respHeaders });
  } catch (error) {
    console.error('[proxy]', { targetUrl: url.toString(), error: error.message });
    return new NextResponse(
      JSON.stringify({ error: 'Proxy request failed', message: error.message }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
}

export { proxy as GET, proxy as POST, proxy as PUT, proxy as PATCH, proxy as DELETE, proxy as OPTIONS }
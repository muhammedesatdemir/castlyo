// apps/web/src/app/api/proxy/[...path]/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';

export const runtime = 'nodejs'; // Edge değil! Body stream için şart.

// Use internal API URL for Docker container communication
const API_BASE = process.env.API_INTERNAL_URL || process.env.INTERNAL_API_URL || 'http://api:3001';

async function proxy(req: NextRequest, { params }: { params: { path: string[] } }) {
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

  // Orijinal header'ları al
  const headers = new Headers(req.headers);

  // Body'yi güvenle yeniden oluştur
  const hasBody = !['GET','HEAD'].includes(req.method.toUpperCase());
  let body: any = undefined;
  
  if (hasBody) {
    const contentType = req.headers.get('content-type') || '';
    
    if (contentType.includes('application/json')) {
      // 🔑 ÖNEMLİ: JSON'u okuyup tekrar JSON string olarak gönderiyoruz
      const jsonBody = await req.json();
      body = JSON.stringify(jsonBody);
      headers.set('content-type', 'application/json');
    } else if (contentType.startsWith('multipart/form-data')) {
      // Form data için arrayBuffer kullan
      body = Buffer.from(await req.arrayBuffer());
    } else {
      // Diğer durumlar için arrayBuffer
      body = Buffer.from(await req.arrayBuffer());
    }
  }
  
  // KRİTİK: Authorization header'ını asla override etme
  // Sadece gelen header'ı logla ve koru
  const auth = headers.get("authorization");
  if (auth) {
    console.log('[PROXY]', req.method, auth.substring(0, 40) + '...');
  } else {
    console.log('[PROXY]', req.method, 'No Authorization header');
  }

  // 3) Cookie'leri de forward et (JWT cookie authentication için)
  const cookie = headers.get("cookie");
  if (cookie) {
    headers.set("cookie", cookie);
    console.log('[proxy] Forwarding cookies:', cookie.substring(0, 100) + '...');
  }

  // Problem çıkaran header'ları at
  ['host','content-length','x-user-id','x_user_id'].forEach(h => headers.delete(h));

  try {
    const upstreamRes = await fetch(url.toString(), {
      method: req.method,
      headers,
      body,
      credentials: 'include',
      redirect: 'manual', // Redirect'leri manuel handle et
    });

    // Cevabı HİÇ parse etmeden, status ve body'yi aynen geçir
    const respHeaders = new Headers(upstreamRes.headers);
    return new NextResponse(upstreamRes.body, { 
      status: upstreamRes.status, 
      headers: respHeaders 
    });
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    console.error('[proxy]', { targetUrl: url.toString(), error: errorMessage });
    return new NextResponse(
      JSON.stringify({ error: 'Proxy request failed', message: errorMessage }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
}

export async function GET(req: NextRequest, { params }: { params: { path: string[] } }) {
  return proxy(req, { params });
}

export async function POST(req: NextRequest, { params }: { params: { path: string[] } }) {
  return proxy(req, { params });
}

export async function PUT(req: NextRequest, { params }: { params: { path: string[] } }) {
  return proxy(req, { params });
}

export async function PATCH(req: NextRequest, { params }: { params: { path: string[] } }) {
  return proxy(req, { params });
}

export async function DELETE(req: NextRequest, { params }: { params: { path: string[] } }) {
  return proxy(req, { params });
}

export async function OPTIONS(req: NextRequest, { params }: { params: { path: string[] } }) {
  return proxy(req, { params });
}
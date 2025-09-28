import { getServerSession } from "next-auth";
import { NextRequest, NextResponse } from "next/server";
import { authOptions } from "@/lib/auth";

const API_BASE = process.env.INTERNAL_API_URL || 'http://castlyo-api:3001';

function join(base: string, tail: string) {
  return `${base.replace(/\/$/, '')}/${tail.replace(/^\//, '')}`;
}

async function handler(req: NextRequest, { params }: { params: Promise<{ path: string[] }> }) {
  const resolvedParams = await params;
  const target = join(API_BASE, `api/v1/${resolvedParams.path.join('/')}`);
  const session = await getServerSession(authOptions);
  
  const incoming = new Headers(req.headers);
  const out = new Headers();

  // Hop-by-hop olmayan tüm headerları geçir
  const skip = new Set(['connection','keep-alive','transfer-encoding','upgrade','host','cookie']);
  incoming.forEach((v, k) => { if (!skip.has(k.toLowerCase())) out.set(k, v); });
  if (!out.has('accept')) out.set('accept', 'application/json');

  // Token varsa Authorization header ekle
  const accessToken = (session as any)?.accessToken;
  const path = resolvedParams.path.join("/");
  const isPublicEndpoint = path === 'health' || path.startsWith('auth/') || path.startsWith('search/');
  
  if (accessToken) {
    out.set('Authorization', `Bearer ${accessToken}`);
  } else if (!isPublicEndpoint) {
    return NextResponse.json({ error: "NO_ACCESS_TOKEN" }, { status: 401 });
  }

  let body: BodyInit | undefined;
  if (!['GET','HEAD'].includes(req.method)) {
    const ct = incoming.get('content-type') || '';
    if (ct.includes('application/json')) {
      body = JSON.stringify(await req.json());
      out.set('content-type', 'application/json');
    } else {
      body = Buffer.from(await req.arrayBuffer());
    }
  }

  try {
    const resp = await fetch(target, { method: req.method, headers: out, body, redirect: 'manual' });
    const ct = resp.headers.get('content-type') || '';
    
    // JSON ise direkt geçir
    if (ct.includes('application/json')) {
      const data = await resp.json();
      return NextResponse.json(data, { status: resp.status });
    }
    
    // JSON değilse hata gövdesini JSON'a sar
    const text = await resp.text();
    return NextResponse.json(
      { message: text.slice(0, 2000), statusCode: resp.status, proxied: true },
      { status: resp.status }
    );
  } catch (error: any) {
    return NextResponse.json(
      { error: "PROXY_REQUEST_FAILED", detail: error.message },
      { status: 500 }
    );
  }
}

export const GET = handler; export const POST = handler;
export const PUT = handler; export const PATCH = handler; export const DELETE = handler;
import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import store from "@/lib/mock-store";
import type { ApiResult } from "@/lib/api-types";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const verifySchema = z.object({ token: z.string().min(1, "Token gerekli") });

// Basit IP-bazlı rate limit (verify için)
const RATE_LIMIT_WINDOW_MS = 60_000
const RATE_LIMIT_MAX = Number(process.env.RATE_LIMIT_MAX ?? 30)
const rateMap = new Map<string, { count: number; ts: number }>()

function ipKey(req: NextRequest): string {
  const fwd = req.headers.get('x-forwarded-for')?.split(',')[0]?.trim()
  const cf = req.headers.get('cf-connecting-ip')?.trim()
  const ip = fwd || cf || (req as any).ip || 'unknown'
  return ip
}

export async function POST(req: NextRequest) {
  try {
    // Rate limit
    const key = ipKey(req)
    const now = Date.now()
    const rec = rateMap.get(key)
    if (!rec || now - rec.ts > RATE_LIMIT_WINDOW_MS) {
      rateMap.set(key, { count: 1, ts: now })
    } else {
      rec.count += 1
      rateMap.set(key, rec)
      if (rec.count > RATE_LIMIT_MAX) {
        const retryAfterSec = Math.ceil((RATE_LIMIT_WINDOW_MS - (now - rec.ts)) / 1000)
        return NextResponse.json(
          { success: false, message: 'Çok fazla istek. Lütfen daha sonra tekrar deneyin.' },
          { status: 429, headers: { 'Retry-After': String(retryAfterSec) } }
        )
      }
    }

    const body = await req.json();
    const parsed = verifySchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { ok: false, error: "Geçersiz istek", issues: parsed.error.flatten() },
        { status: 400 }
      );
    }

    const useMock = (process.env.USE_MOCK_VERIFICATION ?? "true").toLowerCase() === "true";

    if (useMock) {
      // Doğrudan mock-store üzerinden doğrulama yap
      const consumed = store.consumeVerificationToken(parsed.data.token);
      if (!consumed.ok) {
        const reasonMap: Record<string, string> = {
          not_found: "Geçersiz veya bulunamadı",
          used: "Bu doğrulama bağlantısı zaten kullanılmış",
          expired: "Doğrulama bağlantısının süresi dolmuş",
        };
        const status = consumed.reason === 'used' ? 409 : 400
        return NextResponse.json<ApiResult>(
          { success: false, ok: false, message: reasonMap[consumed.reason] ?? "Doğrulama başarısız" },
          { status }
        );
      }

      // Kullanıcıyı ID ile bul ve emailVerified=true yap
      const user = Array.from(store.users.values()).find((u) => u.id === consumed.userId);
      if (user) {
        user.emailVerified = true;
        store.users.set(user.email, user);
      }

      return NextResponse.json<ApiResult>(
        { success: true, ok: true, message: "E-posta doğrulandı", data: { userId: consumed.userId, emailVerified: true } },
        { status: 200 }
      );
    }

    // Gerçek API'ye proxy
    const apiBase = process.env.API_URL ?? process.env.NEXT_PUBLIC_API_URL ?? "";
    const res = await fetch(`${apiBase}/v1/auth/verify`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(parsed.data),
      cache: "no-store",
    });

    const data = await res.json().catch(() => ({}));
    return NextResponse.json<ApiResult>(data, { status: res.status });
  } catch (e) {
    return NextResponse.json<ApiResult>({ success: false, message: "Sunucu hatası" }, { status: 500 });
  }
}

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const token = searchParams.get("token");
  if (!token) {
    return NextResponse.json({ ok: false, error: "Token parametresi gerekli" }, { status: 400 });
  }
  return POST(
    new NextRequest(req.url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ token }),
    })
  );
}

export async function OPTIONS() {
  const origin = process.env.WEB_ORIGIN || '*'
  return new Response(null, {
    status: 204,
    headers: {
      "Access-Control-Allow-Origin": origin,
      "Access-Control-Allow-Methods": "POST, GET, OPTIONS",
      "Access-Control-Allow-Headers": "Content-Type, Authorization",
      "Cache-Control": "no-store",
    },
  });
}

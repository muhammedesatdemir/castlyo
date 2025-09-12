// GET/PATCH /api/profile/me
import { NextResponse } from "next/server";
import { headers } from "next/headers";

export async function GET() {
  const apiBase = process.env.API_URL ?? process.env.NEXT_PUBLIC_API_URL ?? "";
  const hdrs = headers();
  const cookie = hdrs.get("cookie") ?? "";

  const res = await fetch(`${apiBase}/v1/profile/me`, {
    method: "GET",
    headers: { cookie, Accept: "application/json" },
    cache: "no-store",
  });

  if (!res.ok) return NextResponse.json({ profile: null }, { status: 200 });
  const data = await res.json().catch(() => ({ profile: null }));
  return NextResponse.json(data);
}

export async function PATCH(req: Request) {
  const apiBase = process.env.API_URL ?? process.env.NEXT_PUBLIC_API_URL ?? "";
  const hdrs = headers();
  const cookie = hdrs.get("cookie") ?? "";
  const body = await req.json().catch(() => ({}));

  const res = await fetch(`${apiBase}/v1/profile/me`, {
    method: "PATCH",
    headers: { cookie, "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });

  if (!res.ok) return NextResponse.json({ profile: null }, { status: 200 });
  const data = await res.json().catch(() => ({ profile: null }));
  return NextResponse.json(data);
}



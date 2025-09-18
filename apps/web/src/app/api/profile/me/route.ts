// apps/web/src/app/api/profile/me/route.ts
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

// DEV için pratik: prod'da gerçek session'dan email al
function getEmailFromHeaders(req: Request) {
  return req.headers.get("x-user-email") ?? "merve@example.com";
}

export async function GET(req: Request) {
  const email = getEmailFromHeaders(req);
  if (!email) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

  const user = await prisma.user.upsert({
    where: { email },
    update: {},
    create: { email },
    include: { talentProfile: true },
  });

  const p = user.talentProfile;

  return NextResponse.json({
    firstName: p?.firstName ?? null,
    lastName:  p?.lastName  ?? null,
    email:     user.email,
    phone:     p?.phone ?? null,
    role:      user.role ?? "TALENT",
    status:    p?.status ?? "Aktif",
    lastLogin: p?.lastLogin ?? null,
    company:   p?.company ?? null,
    position:  p?.position ?? null,
    profilePhotoUrl: p?.profilePhotoUrl ?? null,
    professional: {
      bio:         p?.bio ?? "",
      experience:  p?.experience ?? "",
      specialties: (p?.specialties as string[]) ?? [],
    },
    personal: {
      city:      p?.city ?? "",
      birthDate: p?.birthDate ?? "",
      gender:    p?.gender ?? "",
      heightCm:  p?.heightCm ?? null,
      weightKg:  p?.weightKg ?? null,
    },
    activities: (p?.activities as any[]) ?? [],
  });
}

export async function PUT(req: Request) {
  const email = getEmailFromHeaders(req);
  if (!email) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

  const body = await req.json();
  const user = await prisma.user.upsert({ where: { email }, update: {}, create: { email } });

  const prof = body || {};
  const professional = prof.professional || {};
  const personal = prof.personal || {};

  await prisma.talentProfile.upsert({
    where: { userId: user.id },
    create: {
      userId: user.id,
      firstName: prof.firstName ?? null,
      lastName:  prof.lastName  ?? null,
      phone:     prof.phone ?? null,
      company:   prof.company ?? null,
      position:  prof.position ?? null,
      status:    prof.status ?? "Aktif",
      lastLogin: prof.lastLogin ?? null,
      profilePhotoUrl: prof.profilePhotoUrl ?? null,

      bio:         professional.bio ?? null,
      experience:  professional.experience ?? null,
      specialties: professional.specialties ?? [],

      city:      personal.city ?? null,
      birthDate: personal.birthDate ?? null,
      gender:    personal.gender ?? null,
      heightCm:  personal.heightCm ?? null,
      weightKg:  personal.weightKg ?? null,

      activities: prof.activities ?? [],
    },
    update: {
      firstName: prof.firstName ?? null,
      lastName:  prof.lastName  ?? null,
      phone:     prof.phone ?? null,
      company:   prof.company ?? null,
      position:  prof.position ?? null,
      status:    prof.status ?? "Aktif",
      lastLogin: prof.lastLogin ?? null,
      profilePhotoUrl: prof.profilePhotoUrl ?? null,

      bio:         professional.bio ?? null,
      experience:  professional.experience ?? null,
      specialties: professional.specialties ?? [],

      city:      personal.city ?? null,
      birthDate: personal.birthDate ?? null,
      gender:    personal.gender ?? null,
      heightCm:  personal.heightCm ?? null,
      weightKg:  personal.weightKg ?? null,

      activities: prof.activities ?? [],
    },
  });

  return NextResponse.json({ ok: true });
}

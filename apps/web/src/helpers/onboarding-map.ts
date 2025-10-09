// --- helpers/onboarding-map.ts ---
type ApiUser = {
  email: string;
  first_name?: string | null;
  last_name?: string | null;
  phone?: string | null; // +905xx...
};

type ApiTalentProfile = {
  first_name?: string | null;
  last_name?: string | null;
  phone?: string | null;      // +905xx...
  city?: string | null;
  birth_date?: string | null; // "2003-02-11"
  gender?: "MALE" | "FEMALE" | "OTHER" | null;
  height_cm?: number | null;
  weight_kg?: number | null;
  photo_url?: string | null;
  bio?: string | null;
  experience?: string | null;
  specialties?: string[] | null;
  guardian?: {
    fullName?: string | null;
    name?: string | null;
    phone?: string | null;
    email?: string | null;
    relation?: string | null;
    consent?: boolean | null;
    consentAccepted?: boolean | null;
  } | null;
};

export type UiTalent = {
  firstName: string;
  lastName: string;
  phoneCountry: string; // "+90"
  phoneDigits: string;  // "5335535355"
  city: string;
  birthDate: string;    // "11.02.2003"
  gender: "" | "MALE" | "FEMALE" | "OTHER";
  height: string;       // "183"
  weight: string;       // "80"
  photoUrl?: string | null;
  email: string;
  bio: string;
  experience: string;
  specialties: string[];
  // Guardian fields
  parentName: string;
  parentPhone: string;
  guardianRelation: "" | "Anne" | "Baba" | "Vasi" | "Diğer";
  guardianEmail: string;
  guardianConsent: boolean;
};

function pick<T>(...vals: Array<T | null | undefined | "">) {
  for (const v of vals) if (v !== undefined && v !== null && v !== "") return v as T;
  return undefined;
}

function splitTRPhone(e164?: string | null) {
  if (!e164) return { country: "+90", digits: "" };
  const only = e164.replace(/[^\d+0-9]/g, "");
  const digits = only.replace(/^\+?90/, "");
  return { country: "+90", digits };
}

function toTRUiDate(iso?: string | null) {
  if (!iso) return "";
  const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(iso);
  return m ? `${m[3]}.${m[2]}.${m[1]}` : "";
}

// UI phone format: "+90 5xx xxx xx xx" -> E164: "+905xxxxxxxxx"
export function formatTRPhoneBlocks(raw10: string) {
  const d = raw10.replace(/\D/g, "").slice(0, 10);
  const p: string[] = [];
  if (d.length > 0) p.push(d.slice(0, 3));
  if (d.length > 3) p.push(d.slice(3, 6));
  if (d.length > 6) p.push(d.slice(6, 8));
  if (d.length > 8) p.push(d.slice(8, 10));
  return p.join(" ");
}

export function mapToUi(user: any, profile?: any): UiTalent {
  const u = user ?? {};
  const p = profile ?? {};

  // İsimler: snake/camel + olası nested varyasyonlar
  const first = pick<string>(
    p.first_name, p.firstName, p.name?.first, p.personal?.first_name,
    u.first_name, u.firstName, u.name?.first
  ) ?? "";

  const last = pick<string>(
    p.last_name, p.lastName, p.name?.last, p.personal?.last_name,
    u.last_name, u.lastName, u.name?.last
  ) ?? "";

  // Telefon: farklı alan adlarına tolerans
  const phoneE164 = pick<string>(
    p.phone_e164, p.phone, p.contact?.phone, u.phone_e164, u.phone
  ) ?? "";
  const { country, digits } = splitTRPhone(phoneE164);

  const city = pick<string>(p.city, p.location?.city, u.city) ?? "";
  const birth = pick<string>(p.birth_date, p.birthDate, p.personal?.birth_date) ?? "";
  const gender = pick<string>(p.gender, p.personal?.gender) ?? "";

  const height = pick<number>(p.height_cm, p.height, p.body?.height_cm);
  const weight = pick<number>(p.weight_kg, p.weight, p.body?.weight_kg);

  const photoUrl = pick<string>(p.photo_url, p.profile_photo_url, p.avatar_url) ?? null;

  // Guardian data
  const gObj = p.guardian ?? null;
  const gPhoneTen = splitTRPhone(gObj?.phone ?? "").digits.slice(0, 10);
  const gPhoneFmt = gPhoneTen ? `+90 ${formatTRPhoneBlocks(gPhoneTen)}` : "";
  const gConsent = !!(gObj?.consent ?? gObj?.consentAccepted);

  return {
    firstName: first,
    lastName: last,
    email: u.email ?? "",
    phoneCountry: country,
    phoneDigits: digits,
    city,
    birthDate: toTRUiDate(birth),
    gender: (gender as UiTalent["gender"]) || "",
    height: height ? String(height) : "",
    weight: weight ? String(weight) : "",
    photoUrl,
    bio: pick<string>(p.bio, p.description) ?? "",
    experience: pick<string>(p.experience, p.work_experience) ?? "",
    specialties: Array.isArray(p.specialties) ? p.specialties : [],
    // Guardian fields
    parentName: pick<string>(gObj?.fullName, gObj?.name, gObj?.full_name) ?? "",
    parentPhone: gPhoneFmt,
    guardianRelation: (gObj?.relation as any) ?? "",
    guardianEmail: gObj?.email ?? "",
    guardianConsent: gConsent,
  };
}

export async function fetchCombined() {
  const [userRes, profRes] = await Promise.all([
    fetch("/api/proxy/api/v1/users/me", { credentials: "include" }),
    fetch("/api/proxy/api/v1/profiles/talent/me", { credentials: "include" }),
  ]);

  if (!userRes.ok) throw new Error("Kullanıcı bilgisi alınamadı");
  
  // profil yoksa 404 gelebilir – sorun değil
  const user: ApiUser = await userRes.json();
  let profile: ApiTalentProfile | null = null;
  
  if (profRes.ok) {
    profile = await profRes.json();
  } else if (profRes.status === 404) {
    // Profil henüz oluşturulmamış - bu normal
    console.debug('[OnboardingMap] Profile not found (404) - user has no profile yet');
    profile = null;
  } else {
    // Gerçek hata durumu
    console.error('[OnboardingMap] Profile fetch error:', profRes.status, profRes.statusText);
    throw new Error(`Profil yüklenemedi: ${profRes.status} ${profRes.statusText}`);
  }

  return mapToUi(user, profile);
}

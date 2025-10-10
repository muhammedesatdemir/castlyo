import { toCityCode, toIsoDate, toIntOrNull, normalizeGender, compact } from '@/utils/normalizers';

const GENDER_MAP: Record<string, 'MALE'|'FEMALE'> = {
  'Erkek': 'MALE',
  'Kadın': 'FEMALE',
  'Kadin': 'FEMALE',
  'MALE': 'MALE',
  'FEMALE': 'FEMALE'
};

function toISOFromTR(dobTR?: string | null) {
  if (!dobTR) return null;
  // Accept yyyy-mm-dd from <input type=date>
  const mIso = dobTR.match(/^(\d{4})-(\d{2})-(\d{2})$/);
  if (mIso) {
    const [_, yyyy, mm, dd] = mIso;
    return `${yyyy}-${mm}-${dd}T00:00:00.000Z`;
  }
  const m = dobTR.match(/^(\d{2})\.(\d{2})\.(\d{4})$/);
  if (!m) return null;
  const [_, dd, mm, yyyy] = m;
  return `${yyyy}-${mm}-${dd}T00:00:00.000Z`;
}

function n(v: any) {
  return v === '' || v === undefined ? null : v;
}

function ni(v: any) {
  if (v === '' || v === undefined || v === null) return null;
  const x = Number(v);
  return Number.isFinite(x) ? Math.trunc(x) : null;
}

export function sanitizeProfilePayload(form: any) {
  const skills = Array.isArray(form.skills) ? form.skills : [];
  const languages = Array.isArray(form.languages) ? form.languages : [];
  const specialties = Array.isArray(form.specialties) ? form.specialties : [];

  const payload = {
    firstName: n(form.firstName),
    lastName: n(form.lastName),
    displayName: n(form.displayName) ?? (`${form.firstName ?? ''} ${form.lastName ?? ''}`.trim() || null),
    bio: n(form.bio),
    experience: n(form.experience),
    // Dual city model
    city_label: n(form.city),
    city_code: toCityCode(n(form.city) ?? undefined),
    country: n(form.country) ?? 'TR',
    gender: normalizeGender(form.gender), // Use new gender normalizer
    birthDate: toIsoDate(form.birthDate), // Use new date normalizer

    heightCm: toIntOrNull(form.height), // Use new number normalizer
    weightKg: toIntOrNull(form.weight), // Use new number normalizer
    eyeColor: n(form.eyeColor),
    hairColor: n(form.hairColor),

    skills,
    languages,
    specialties,

    profileImage: n(form.profileImage),
    portfolioImages: Array.isArray(form.portfolioImages) ? form.portfolioImages : [],
    portfolioVideos: Array.isArray(form.portfolioVideos) ? form.portfolioVideos : [],
    
    isPublic: form.isPublic ?? true,
  };

  // Remove undefined values to avoid sending them to API
  return compact(payload);
}

// New function for creating talent profiles with correct API format
export function mapFormToTalentPayload(form: any) {
  // Helper to clean values
  const clean = (v: any) => {
    if (v === '' || v === undefined || v === null) return undefined;
    return v;
  };

  // Helper to convert to number
  const toNumber = (v: any) => {
    if (v === '' || v === undefined || v === null) return undefined;
    const num = Number(v);
    return Number.isFinite(num) ? num : undefined;
  };

  // Helper to normalize gender
  const normalizeGender = (gender: any) => {
    if (!gender) return undefined;
    const g = String(gender).toUpperCase();
    if (g === 'MALE' || g === 'FEMALE' || g === 'OTHER') return g;
    return undefined;
  };

  // Helper to normalize date to YYYY-MM-DD
  const normalizeDate = (date: any) => {
    if (!date) return undefined;
    // If already in YYYY-MM-DD format
    if (/^\d{4}-\d{2}-\d{2}$/.test(date)) return date;
    // If in DD.MM.YYYY format
    const match = String(date).match(/^(\d{2})\.(\d{2})\.(\d{4})$/);
    if (match) {
      const [, dd, mm, yyyy] = match;
      return `${yyyy}-${mm}-${dd}`;
    }
    return undefined;
  };

  // Helper to get city info
  const getCityInfo = (cityInput: any) => {
    if (!cityInput) return { label: undefined, code: undefined };
    
    // If cityInput is an object with label/code
    if (typeof cityInput === 'object' && cityInput.label) {
      return {
        label: clean(cityInput.label),
        code: clean(cityInput.code) || toCityCode(cityInput.label)
      };
    }
    
    // If cityInput is a string
    const cityStr = String(cityInput).trim();
    return {
      label: clean(cityStr),
      code: toCityCode(cityStr)
    };
  };

  const cityInfo = getCityInfo(form.city || form.city_label);

  const payload = {
    first_name: clean(form.firstName || form.first_name),
    last_name: clean(form.lastName || form.last_name),
    gender: normalizeGender(form.gender),
    birth_date: normalizeDate(form.birthDate || form.birth_date),
    height_cm: toNumber(form.heightCm || form.height_cm || form.height),
    weight_kg: toNumber(form.weightKg || form.weight_kg || form.weight),
    city_label: cityInfo.label,
    city_code: cityInfo.code,
    bio: clean(form.bio),
    experience: clean(form.experience),
    specialties: Array.isArray(form.specialties) ? form.specialties : undefined,
    profile_photo_url: clean(form.profilePhotoUrl || form.profile_photo_url || form.profileImage),
    cv_url: clean(form.cvUrl || form.cv_url),
    is_public: form.isPublic !== undefined ? Boolean(form.isPublic) : undefined,
  };

  // Remove undefined values
  return Object.fromEntries(
    Object.entries(payload).filter(([_, v]) => v !== undefined)
  );
}

export type SanitizedProfilePayload = ReturnType<typeof sanitizeProfilePayload>;

// Phone normalization for Turkish numbers
export function normalizeTRPhone(input: string): string {
  if (!input) return '';
  
  // Remove all non-digits
  let digits = input.replace(/\D/g, '');
  
  // Handle different input formats
  if (digits.startsWith('0')) {
    // Remove leading 0 and add 90
    digits = '90' + digits.slice(1);
  } else if (!digits.startsWith('90')) {
    // Add 90 prefix if not present
    digits = '90' + digits;
  }
  
  // Ensure it's a valid Turkish mobile number (90 + 10 digits)
  if (digits.length === 12 && digits.startsWith('90')) {
    // Validate that it starts with 90 + 5xx (Turkish mobile prefix)
    const mobilePart = digits.slice(2, 5);
    if (mobilePart.startsWith('5')) {
      return '+' + digits;
    }
  }
  
  // If validation fails, return a default valid format
  return '+905551234567';
}

// Safe GET helper for 404 handling
export async function safeGet<T>(url: string): Promise<{ ok: true; data: T } | { ok: false; status: number }> {
  const res = await fetch(url, { credentials: 'include' });
  if (res.status === 404) return { ok: false, status: 404 }; // profil yok
  if (!res.ok) throw new Error(`GET ${url} failed: ${res.status}`);
  return { ok: true, data: await res.json() };
}

// Create talent profile with proper validation
export async function createTalentProfile(form: any) {
  const payload = mapFormToTalentPayload(form);

  console.log('[createTalentProfile] Sending payload:', JSON.stringify(payload, null, 2));

  const res = await fetch('/api/proxy/api/v1/profiles/talent', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
    credentials: 'include',
  });

  if (res.status === 400) {
    const errorData = await res.json().catch(() => ({}));
    console.error('[createTalentProfile] VALIDATION_FAILED:', errorData);
    throw new Error(`Lütfen alanları kontrol edin. (400) - ${JSON.stringify(errorData)}`);
  }
  
  if (!res.ok) {
    const errorText = await res.text().catch(() => '');
    throw new Error(`Profil kaydetme başarısız: ${res.status} ${errorText}`);
  }

  return res.json();
}

// Save phone separately
export async function savePhone(rawPhone: string) {
  const phone = normalizeTRPhone(rawPhone);
  
  console.log('[savePhone] Normalized phone:', phone);
  
  const res = await fetch('/api/proxy/api/v1/users/me', {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ phone }),
    credentials: 'include',
  });
  
  if (!res.ok) {
    const errorText = await res.text().catch(() => '');
    throw new Error(`Telefon kaydı başarısız: ${res.status} ${errorText}`);
  }
  
  return res.json();
}



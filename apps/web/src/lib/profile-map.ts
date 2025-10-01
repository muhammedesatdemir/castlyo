const GENDER_MAP: Record<string, 'MALE'|'FEMALE'|'OTHER'> = {
  'Erkek': 'MALE',
  'Kadın': 'FEMALE',
  'Kadin': 'FEMALE',
  'Diğer': 'OTHER',
  'Diger': 'OTHER',
  'MALE': 'MALE',
  'FEMALE': 'FEMALE',
  'OTHER': 'OTHER'
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

  return {
    firstName: n(form.firstName),
    lastName: n(form.lastName),
    displayName: n(form.displayName) ?? `${form.firstName ?? ''} ${form.lastName ?? ''}`.trim() || null,
    bio: n(form.bio),
    experience: n(form.experience),
    city: n(form.city),
    country: n(form.country) ?? 'TR',
    gender: form.gender ? GENDER_MAP[form.gender] ?? null : null,
    dateOfBirth: toISOFromTR(form.birthDate),

    height: ni(form.height),
    weight: ni(form.weight),
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
}

export type SanitizedProfilePayload = ReturnType<typeof sanitizeProfilePayload>;



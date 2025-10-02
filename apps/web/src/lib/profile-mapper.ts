// Note: date-fns might not be available, so we'll use native Date methods

// Normalize function to convert empty strings to undefined
const norm = (v?: string | null) => {
  const s = (v ?? '').trim();
  return s === '' ? undefined : s;
};

// Gender mapping from Turkish to backend enum
const genderMap: Record<string, "FEMALE" | "MALE" | "OTHER"> = {
  "Kadın": "FEMALE",
  "Kadin": "FEMALE", 
  "Erkek": "MALE",
  "Diğer": "OTHER",
  "Diger": "OTHER",
  "MALE": "MALE",
  "FEMALE": "FEMALE",
  "OTHER": "OTHER"
};

// Skills mapping from Turkish to backend enum codes
const skillMap: Record<string, string> = {
  "Oyunculuk": "ACTING",
  "Tiyatro": "THEATER", 
  "Dans": "DANCE",
  "Modellik": "MODELING",
  "Dublaj": "VOICE_OVER",
  "Müzik": "MUSIC",
  "Muzik": "MUSIC"
};

// Reverse mapping from enum codes to Turkish labels
const reverseSkillMap: Record<string, string> = {
  "ACTING": "Oyunculuk",
  "THEATER": "Tiyatro",
  "DANCE": "Dans",
  "MODELING": "Modellik",
  "VOICE_OVER": "Dublaj",
  "MUSIC": "Müzik"
};

// Convert Turkish date format (dd.mm.yyyy) to ISO (yyyy-mm-dd)
function toISODate(dateStr: string): string | undefined {
  if (!dateStr) return undefined;
  
  // If already in ISO format, return as is
  if (/^\d{4}-\d{2}-\d{2}$/.test(dateStr)) {
    return dateStr;
  }
  
  // Convert dd.mm.yyyy to yyyy-mm-dd
  const match = dateStr.match(/^(\d{2})\.(\d{2})\.(\d{4})$/);
  if (match) {
    const [, day, month, year] = match;
    return `${year}-${month.padStart(2, '0')}-${day.padStart(2, '0')}`;
  }
  
  // Try to parse as Date and format as ISO
  try {
    const date = new Date(dateStr);
    if (!isNaN(date.getTime())) {
      return date.toISOString().split('T')[0];
    }
  } catch {
    // Ignore parsing errors
  }
  
  return undefined;
}

// Convert form data to API payload format for updates
export function toUpdatePayload(form: any) {
  const isoBirth = toISODate(form.birthDate || form.birth || form.dateOfBirth);
  
  return {
    displayName: norm(form.displayName),
    firstName: norm(form.firstName),
    lastName: norm(form.lastName),
    city: norm(form.city),
    country: norm(form.country),
    bio: norm(form.bio),
    headline: norm(form.headline),

    height: form.height ?? undefined,
    weight: form.weight ?? undefined,

    skills: (form.skills ?? []).filter(Boolean),
    languages: (form.languages ?? []).filter(Boolean),
    specialties: (form.specialties ?? []).filter(Boolean),

    profileImage: norm(form.profileImage),
    resumeUrl: norm(form.resumeUrl),

    birthDate: isoBirth,
    gender: genderMap[form.gender] || undefined,

    isPublic: form.isPublic ?? undefined,
  };
}

// Convert form data to API payload format
export function mapFormToApi(form: any) {
  const isoBirth = toISODate(form.birthDate || form.birth || form.dateOfBirth);
  
  const payload: any = {
    firstName: norm(form.firstName),
    lastName: norm(form.lastName),
    displayName: norm(`${form.firstName || ""} ${form.lastName || ""}`.trim()),
    city: norm(form.city),
    country: "TR",
    gender: genderMap[form.gender] || undefined,
    birthDate: isoBirth,
    height: form.height ? Number(form.height) : undefined,
    weight: form.weight ? Number(form.weight) : undefined,
    bio: norm(form.bio),
    headline: norm(form.headline),
    experience: norm(form.experience || form.exp),
    skills: (form.skills || []).map((s: string) => skillMap[s] || s).filter(Boolean),
    languages: form.languages || [],
    specialties: (form.specialties || []).map((s: string) => skillMap[s] || s).filter(Boolean),
    profileImage: norm(form.profileImage || form.profilePhotoUrl),
    resumeUrl: norm(form.resumeUrl),
  };

  // Remove undefined values
  return Object.fromEntries(
    Object.entries(payload).filter(([_, value]) => value !== undefined)
  );
}

// Convert API response specialties to Turkish labels for UI display
export function mapApiSpecialtiesToUI(specialties: string[]): string[] {
  return (specialties || []).map(s => reverseSkillMap[s] || s).filter(Boolean);
}

// Convert UI specialties to API enum values
export function mapUISpecialtiesToApi(specialties: string[]): string[] {
  return (specialties || []).map(s => skillMap[s] || s).filter(Boolean);
}

// Helper to create public URL from S3 key
export function createPublicUrl(key: string): string {
  const baseUrl = process.env.NEXT_PUBLIC_S3_PUBLIC_URL || 'http://localhost:9000';
  const bucket = process.env.NEXT_PUBLIC_S3_BUCKET || 'castlyo-dev';
  return `${baseUrl}/${bucket}/${key}`;
}

// Helper to extract key from full URL
export function extractKeyFromUrl(url: string): string | null {
  if (!url) return null;
  
  try {
    const urlObj = new URL(url);
    const pathParts = urlObj.pathname.split('/');
    // Remove empty parts and bucket name
    const keyParts = pathParts.filter(Boolean).slice(1);
    return keyParts.join('/');
  } catch {
    return null;
  }
}

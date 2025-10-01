// Note: date-fns might not be available, so we'll use native Date methods

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

// Convert form data to API payload format
export function mapFormToApi(form: any) {
  const isoBirth = toISODate(form.birthDate || form.birth || form.dateOfBirth);
  
  const payload: any = {
    firstName: form.firstName?.trim() || undefined,
    lastName: form.lastName?.trim() || undefined,
    displayName: `${form.firstName || ""} ${form.lastName || ""}`.trim() || undefined,
    city: form.city?.trim() || undefined,
    country: "TR",
    gender: genderMap[form.gender] || undefined,
    birthDate: isoBirth,
    height: form.height ? Number(form.height) : undefined,
    weight: form.weight ? Number(form.weight) : undefined,
    bio: form.bio?.trim() || undefined,
    headline: form.headline?.trim() || undefined,
    experience: form.experience?.trim() || form.exp?.trim() || undefined,
    skills: (form.skills || []).map((s: string) => skillMap[s] || s).filter(Boolean),
    languages: form.languages || [],
    specialties: (form.specialties || []).map((s: string) => skillMap[s] || s).filter(Boolean),
    profileImage: form.profileImage || form.profilePhotoUrl || undefined,
    resumeUrl: form.cvUrl || form.resumeUrl || undefined,
  };

  // Remove undefined values
  return Object.fromEntries(
    Object.entries(payload).filter(([_, value]) => value !== undefined)
  );
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

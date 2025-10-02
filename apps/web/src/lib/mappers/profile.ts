// Profile data mapping between API (snake_case) and UI (camelCase)

// Helper to remove undefined values from objects
function removeUndefined<T extends Record<string, any>>(obj: T): T {
  return Object.fromEntries(
    Object.entries(obj).filter(([, v]) => v !== undefined)
  ) as T;
}

// Helper to normalize empty strings to undefined (don't send empty values to API)
const norm = (v?: string | null) => {
  const s = (v ?? '').trim();
  return s === '' ? undefined : s;
};

// Gender mapping from UI to API enum values
const genderToApi: Record<string, "MALE" | "FEMALE" | "OTHER"> = {
  "male": "MALE",
  "erkek": "MALE", 
  "MALE": "MALE",
  "female": "FEMALE",
  "kadın": "FEMALE",
  "kadin": "FEMALE",
  "FEMALE": "FEMALE",
  "other": "OTHER",
  "diğer": "OTHER",
  "diger": "OTHER",
  "OTHER": "OTHER"
};

// Gender mapping from API to UI values
const genderFromApi: Record<string, "male" | "female" | "other"> = {
  "MALE": "male",
  "FEMALE": "female", 
  "OTHER": "other"
};

// Skills mapping from Turkish to backend enum codes
const skillsToApi: Record<string, string> = {
  "Oyunculuk": "ACTING",
  "Tiyatro": "THEATER", 
  "Dans": "DANCE",
  "Modellik": "MODELING",
  "Dublaj": "VOICE_OVER",
  "Müzik": "MUSIC",
  "Muzik": "MUSIC"
};

// Reverse mapping from enum codes to Turkish labels
const skillsFromApi: Record<string, string> = {
  "ACTING": "Oyunculuk",
  "THEATER": "Tiyatro",
  "DANCE": "Dans",
  "MODELING": "Modellik",
  "VOICE_OVER": "Dublaj",
  "MUSIC": "Müzik"
};

/**
 * Convert API response (snake_case) to UI format (camelCase)
 */
export function apiToUi(apiData: any): Record<string, any> {
  if (!apiData) return {};

  // Handle both direct fields and nested data structures
  const data = apiData?.data ?? apiData;
  
  const gender = data?.gender ? genderFromApi[data.gender.toUpperCase()] || null : null;
  
  return {
    firstName: data?.firstName ?? data?.first_name ?? '',
    lastName: data?.lastName ?? data?.last_name ?? '',
    phone: data?.phone ?? '',
    city: data?.city ?? '',
    birthDate: data?.birthDate ?? data?.birth_date ?? '',                 // "YYYY-MM-DD"
    gender: data?.gender ? genderFromApi[data.gender.toUpperCase()] || null : gender,  // Handle both camelCase and snake_case
    heightCm: data?.heightCm ?? data?.height_cm ?? null,
    weightKg: data?.weightKg ?? data?.weight_kg ?? null,
    bio: data?.bio ?? '',
    experience: data?.experience ?? '',
    specialties: (data?.specialties || []).map((s: string) => skillsFromApi[s] || s),
    profileImage: data?.profileImage ?? data?.profile_image ?? null,
    profilePhotoUrl: data?.profileImage ?? data?.profile_image ?? null,      // alias for compatibility
    cvUrl: data?.resumeUrl ?? data?.cv_url ?? null,
    resumeUrl: data?.resumeUrl ?? data?.resume_url ?? null,
    isPublic: data?.is_public ?? false,
    email: data?.email ?? undefined,                   // Include email if available
    // Handle nested personal data if it exists (prioritize nested over flat)
    ...(data?.personal && {
      birthDate: data.personal.birthDate ?? data.personal.birth_date ?? data?.birthDate ?? data?.birth_date ?? '',
      gender: data.personal.gender ? genderFromApi[data.personal.gender.toUpperCase()] || null : gender,
      heightCm: data.personal.heightCm ?? data.personal.height_cm ?? data?.heightCm ?? data?.height_cm ?? null,
      weightKg: data.personal.weightKg ?? data.personal.weight_kg ?? data?.weightKg ?? data?.weight_kg ?? null,
    }),
    // Handle nested professional data if it exists (prioritize nested over flat)
    ...(data?.professional && {
      bio: data.professional.bio ?? data?.bio ?? '',
      experience: data.professional.experience ?? data?.experience ?? '',
      specialties: (data.professional.specialties || data?.specialties || [])
        .map((s: string) => skillsFromApi[s] || s),
    })
  };
}

/**
 * Convert UI form data (camelCase) to API payload (snake_case)
 */
export function uiToApi(uiData: any): Record<string, any> {
  if (!uiData) return {};

  const gender = uiData?.gender ? genderToApi[uiData.gender.toLowerCase()] || undefined : undefined;
  
  const payload: Record<string, any> = removeUndefined({
    first_name: norm(uiData?.firstName) || undefined,
    last_name: norm(uiData?.lastName) || undefined,
    phone: norm(uiData?.phone) || undefined,
    city: norm(uiData?.city) || undefined,
    birth_date: norm(uiData?.birthDate) || undefined,     // Only send if not empty
    gender: gender,                                        // Only send if defined
    height_cm: (typeof uiData?.heightCm === 'number' && uiData.heightCm > 0) ? Number(uiData.heightCm) : undefined,
    weight_kg: (typeof uiData?.weightKg === 'number' && uiData.weightKg > 0) ? Number(uiData.weightKg) : undefined,
    bio: norm(uiData?.bio) || undefined,
    experience: norm(uiData?.experience) || undefined,
    specialties: (uiData?.specialties || [])
      .map((s: string) => skillsToApi[s] || s)
      .filter(Boolean),
    profile_image: norm(uiData?.profileImage || uiData?.profilePhotoUrl) || undefined,
    resume_url: norm(uiData?.cvUrl || uiData?.resumeUrl) || undefined,
    is_public: uiData?.isPublic ?? undefined,
  });

  return payload;
}

/**
 * Convert form data specifically for step-based updates
 * This ensures only the relevant fields for each step are included
 */
export function uiToApiStep(uiData: any, step: 'account' | 'personal' | 'professional' | 'all' = 'all'): Record<string, any> {
  const fullPayload = uiToApi(uiData);
  
  if (step === 'account') {
    return removeUndefined({
      first_name: fullPayload.first_name,
      last_name: fullPayload.last_name,
      phone: fullPayload.phone,
      profile_image: fullPayload.profile_image,
    });
  }
  
  if (step === 'personal') {
    return removeUndefined({
      city: fullPayload.city,
      birth_date: fullPayload.birth_date,
      gender: fullPayload.gender,
      height_cm: fullPayload.height_cm,
      weight_kg: fullPayload.weight_kg,
    });
  }
  
  if (step === 'professional') {
    return removeUndefined({
      bio: fullPayload.bio,
      experience: fullPayload.experience,
      specialties: fullPayload.specialties,
      resume_url: fullPayload.resume_url,
    });
  }
  
  return fullPayload;
}

/**
 * Validate date format and convert to YYYY-MM-DD if needed
 */
export function normalizeDateForApi(dateStr?: string): string | null {
  if (!dateStr) return null;
  
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
  
  return null;
}

/**
 * Validate gender value for API
 */
export function normalizeGenderForApi(gender?: string): "MALE" | "FEMALE" | "OTHER" | null {
  if (!gender) return null;
  return genderToApi[gender.toLowerCase()] || null;
}

/**
 * Convert profile form UI data to API payload (specifically for profile save)
 * This ensures height_cm and weight_kg are properly included
 */
export function profileFormUiToApi(f: {
  firstName?: string;
  lastName?: string;
  city?: string;
  birthDate?: string;    // UI: "YYYY-MM-DD" (already ISO format)
  gender?: "MALE" | "FEMALE" | "OTHER" | "";
  height?: string | number; // UI input
  weight?: string | number; // UI input
  bio?: string;
  experience?: string;
  specialties?: string[];
  cvUrl?: string | null;
  profilePhotoUrl?: string | null;
}) {
  // Helper to normalize empty strings to undefined
  const norm = (v?: string | null) =>
    (v !== undefined && v !== null && String(v).trim() !== "") ? String(v).trim() : undefined;

  // Helper to convert to integer
  const toInt = (v: any) => {
    if (v === undefined || v === null || v === "") return undefined;
    const n = parseInt(String(v).replace(/[^\d-]/g, ""), 10);
    return Number.isFinite(n) ? n : undefined;
  };

  return removeUndefined({
    first_name: norm(f.firstName),
    last_name:  norm(f.lastName),
    city:       norm(f.city),
    birth_date: norm(f.birthDate), // Already in YYYY-MM-DD format
    gender:     f.gender || undefined,
    height_cm:  toInt(f.height),     // <-- CRITICAL: Map height to height_cm
    weight_kg:  toInt(f.weight),     // <-- CRITICAL: Map weight to weight_kg
    bio:         norm(f.bio),
    experience:  norm(f.experience),
    specialties: (f.specialties && f.specialties.length) ? f.specialties : undefined,
    resume_url:  norm(f.cvUrl ?? undefined),
    profile_image: norm(f.profilePhotoUrl ?? undefined),
  });
}

// Export legacy functions for backward compatibility
export { uiToApi as mapFormToApi, apiToUi as mapApiToForm };

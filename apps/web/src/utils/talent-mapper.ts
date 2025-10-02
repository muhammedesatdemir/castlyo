// apps/web/src/utils/talent-mapper.ts

// --- kod tiplerini serbest bırak ---
type SpecialtyCode =
  | 'ACTING' | 'THEATRE' | 'MODELING' | 'DANCE' | 'VOICE_OVER' | 'MUSIC'
  | string;

// TR karakterleri slug'a çevir (müzisyen -> muzisyen, voice over -> voice_over)
const slugifyTr = (s: string) =>
  s
    .toLocaleLowerCase('tr')
    .normalize('NFD').replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, '_')
    .replace(/^_|_$/g, '');

// Türkçe/İngilizce eşanlamlar → kanonik kod
const SPECIALTY_SYNONYMS: Record<string, SpecialtyCode> = {
  // oyuncu / tiyatro
  oyuncu: 'ACTING',
  oyunculuk: 'ACTING',
  acting: 'ACTING',
  tiyatro: 'THEATRE',
  tiyatrocu: 'THEATRE',
  theatre: 'THEATRE',
  theater: 'THEATRE',

  // model
  model: 'MODELING',
  modellik: 'MODELING',
  modeling: 'MODELING',
  modelling: 'MODELING',

  // dans
  dans: 'DANCE',
  dansci: 'DANCE',
  dansçı: 'DANCE',
  dancer: 'DANCE',
  dance: 'DANCE',

  // dublaj / seslendirme
  dublaj: 'VOICE_OVER',
  'dublaj_sanatcisi': 'VOICE_OVER',
  'dublaj-sanatcisi': 'VOICE_OVER',
  seslendirme: 'VOICE_OVER',
  'voice_over': 'VOICE_OVER',
  'voice-over': 'VOICE_OVER',
  'voice over': 'VOICE_OVER',

  // müzik
  muzik: 'MUSIC',
  müzik: 'MUSIC',
  muzisyen: 'MUSIC',
  müzisyen: 'MUSIC',
  music: 'MUSIC',
  musician: 'MUSIC',
};

// Kartta görüntülenecek TR etiketleri
export const SPECIALTY_LABEL_TR: Record<SpecialtyCode, string> = {
  ACTING: 'Oyunculuk',
  THEATRE: 'Tiyatro',
  MODELING: 'Modellik',
  DANCE: 'Dans',
  VOICE_OVER: 'Dublaj',
  MUSIC: 'Müzik',
};

// Yardımcı: gelen item → kanonik kod
const toCode = (s: any): SpecialtyCode | null => {
  if (!s) return null;
  if (typeof s === 'string') {
    const key = slugifyTr(s);
    return SPECIALTY_SYNONYMS[key] ?? s.toUpperCase().replace(/\s+/g, '_');
  }
  if (s.code) return s.code as SpecialtyCode;
  if (s.name) {
    const key = slugifyTr(String(s.name));
    return SPECIALTY_SYNONYMS[key] ?? null;
  }
  return null;
};

// --- helpers ---
const coalesce = <T>(...vals: (T | undefined | null)[]): T | undefined =>
  vals.find(v => v !== undefined && v !== null);

const toAbsolute = (url?: string | null) => {
  if (!url) return '';
  try {
    // zaten absolute ise dokunma
    if (/^https?:\/\//i.test(url)) return url;
    const base = process.env.NEXT_PUBLIC_S3_PUBLIC_URL || 'http://localhost:9000';
    return `${base.replace(/\/+$/,'')}/${url.replace(/^\/+/, '')}`;
  } catch {
    return '';
  }
};

// API tipinde hem camelCase hem snake_case ve olası nested user alanları
export type TalentApi = {
  id?: string;
  userId?: string;
  user_id?: string;
  displayName?: string | null;
  display_name?: string | null;
  firstName?: string | null;
  first_name?: string | null;
  lastName?: string | null;
  last_name?: string | null;
  user?: {
    firstName?: string | null;
    first_name?: string | null;
    lastName?: string | null;
    last_name?: string | null;
  };
  city?: string | null;
  profileImage?: string | null;
  profile_image?: string | null;
  photo_url?: string | null;
  specialties?: Array<string | { code?: string; name?: string; label?: string; slug?: string }> | null;
  skills?: Array<string | { code?: string; name?: string; label?: string; slug?: string }> | null;
  createdAt?: string; updatedAt?: string;
};

export type TalentCard = {
  id: string;
  name: string;
  firstName: string;
  lastName: string;
  city?: string;
  imageUrl: string;
  tags: string[];            // TR etiketler
  specialtyCodes: SpecialtyCode[]; // filtre bununla çalışacak
  isMe?: boolean;
};

export const normalizeList = (payload: any): TalentApi[] => {
  if (Array.isArray(payload)) return payload as TalentApi[];
  if (Array.isArray(payload?.items)) return payload.items as TalentApi[];
  if (Array.isArray(payload?.data))  return payload.data as TalentApi[];
  if (Array.isArray(payload?.hits))  return payload.hits as TalentApi[];
  return [];
};

export const toCard = (x: TalentApi): TalentCard => {
  // ad/soyad (camelCase, snake_case, nested user hepsi destekli)
  const fn = coalesce(x.firstName, x.first_name, x.user?.firstName, x.user?.first_name) ?? '';
  const ln = coalesce(x.lastName,  x.last_name,  x.user?.lastName,  x.user?.last_name)  ?? '';
  const display = coalesce(x.displayName, x.display_name) ?? '';

  // nullish + logical karışımı için parantez şart
  const name = ((display && display.trim()) || [fn, ln].filter(Boolean).join(' ').trim()) || '—';

  // görsel
  const rawImg = coalesce(x.profileImage, x.profile_image, x.photo_url) ?? '';
  const imageUrl = toAbsolute(rawImg) || '/images/avatar-placeholder.svg';

  // specialties/skills -> normalize edilmiş kodlar ve TR etiketler
  const rawSpecs = (x.specialties ?? x.skills ?? []) as NonNullable<TalentApi['specialties']>;
  const specialtyCodes = rawSpecs
    .map(toCode)
    .filter(Boolean) as SpecialtyCode[];

  const tags = specialtyCodes.map(c => SPECIALTY_LABEL_TR[c] ?? String(c));

  return {
    id: (x.id || x.userId || x.user_id || crypto.randomUUID()) as string,
    name,
    firstName: fn,
    lastName: ln,
    city: x.city ?? undefined,
    imageUrl,
    tags,
    specialtyCodes,
  };
};
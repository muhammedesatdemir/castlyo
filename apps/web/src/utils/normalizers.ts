import { TURKIYE_CITIES, CityCode } from '@/data/turkiye-cities';

export function slugifyTR(s?: string): string {
  if (!s) return '';
  return s
    .trim()
    .toLowerCase()
    .replace(/ğ/g,'g').replace(/ü/g,'u').replace(/ş/g,'s')
    .replace(/ı/g,'i').replace(/ö/g,'o').replace(/ç/g,'c')
    .replace(/[^a-z0-9]+/g,'');
}

export function toCityCode(label?: string): CityCode | undefined {
  const slug = slugifyTR(label);
  if (!slug) return undefined;
  const hit = TURKIYE_CITIES.find(c => c.slug === slug);
  return hit?.code;
}

export function toIsoDate(dmy?: string): string | undefined {
  if (!dmy) return undefined;
  const m = dmy.match(/^(\d{2})\.(\d{2})\.(\d{4})$/);
  if (!m) return undefined;
  const [, dd, mm, yyyy] = m;
  return `${yyyy}-${mm}-${dd}`;
}

export function toIntOrNull(v: unknown): number | null {
  if (v === '' || v === undefined || v === null) return null;
  const n = Number(v);
  return Number.isFinite(n) ? n : null;
}

export function normalizePhoneE164(v?: string): string | undefined {
  if (!v) return undefined;
  const digits = v.replace(/[^\d+]/g, '');
  if (digits.startsWith('+')) return digits;
  // Türkiye için basit kural: "0" ile başlıyorsa +90'a çevir
  if (digits.startsWith('0')) return `+90${digits.slice(1)}`;
  // 10-11 hane girildiyse TR varsay
  if (/^\d{10,11}$/.test(digits)) return `+90${digits.slice(-10)}`;
  return undefined;
}

export type SkillEnum = 'ACTING'|'THEATER'|'MUSIC'|'DANCE'|'MODELING'|'DUBBING';
export function mapSkills(labels: string[]): SkillEnum[] {
  const map: Record<string, SkillEnum> = {
    'oyunculuk':'ACTING',
    'tiyatro':'THEATER',
    'müzik':'MUSIC','muzik':'MUSIC',
    'dans':'DANCE',
    'modellik':'MODELING',
    'dublaj':'DUBBING',
  };
  return (labels||[])
    .map(l => map[l.trim().toLowerCase()])
    .filter(Boolean) as SkillEnum[];
}

export function compact<T extends Record<string, any>>(obj: T): Partial<T> {
  return Object.fromEntries(Object.entries(obj).filter(([,v]) => v !== undefined)) as Partial<T>;
}

export type Gender = 'MALE'|'FEMALE';

export function normalizeGender(value?: string): Gender | undefined {
  if (!value) return undefined;
  const normalized = value.trim().toUpperCase();
  if (normalized === 'MALE' || normalized === 'FEMALE') {
    return normalized as Gender;
  }
  // Turkish mappings
  if (normalized === 'ERKEK' || normalized === 'M') return 'MALE';
  if (normalized === 'KADIN' || normalized === 'K' || normalized === 'F') return 'FEMALE';
  return undefined;
}

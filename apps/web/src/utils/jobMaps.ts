export const JOB_TYPE_LABELS: Record<string, string> = {
  FILM: 'Film',
  TV_SERIES: 'Dizi',
  COMMERCIAL: 'Reklam',
  THEATER: 'Tiyatro',
  MUSIC_VIDEO: 'Müzik Videosu',
  DOCUMENTARY: 'Belgesel',
  SHORT_FILM: 'Kısa Film',
  FASHION: 'Moda',
  PHOTO_SHOOT: 'Fotoğraf Çekimi',
  OTHER: 'Diğer',
};

export function jobTypeToLabel(code?: string | null) {
  if (!code) return 'Diğer';
  return JOB_TYPE_LABELS[code] ?? 'Diğer';
}

export function toDisplayDate(v?: string | null) {
  if (!v) return 'Tarih belirtilmemiş';
  const d = new Date(v);
  return isNaN(d.getTime())
    ? 'Tarih belirtilmemiş'
    : d.toLocaleDateString('tr-TR', { day: '2-digit', month: '2-digit', year: 'numeric' });
}

// Keep the old functions for backward compatibility
export const JOB_TYPE_OPTIONS = [
  { value: 'FILM',          label: 'Film' },
  { value: 'TV_SERIES',     label: 'Dizi' },
  { value: 'COMMERCIAL',    label: 'Reklam' },
  { value: 'THEATER',       label: 'Tiyatro' },
  { value: 'MUSIC_VIDEO',   label: 'Müzik Videosu' },
  { value: 'DOCUMENTARY',   label: 'Belgesel' },
  { value: 'SHORT_FILM',    label: 'Kısa Film' },
  { value: 'FASHION',       label: 'Moda' },
  { value: 'PHOTO_SHOOT',   label: 'Fotoğraf Çekimi' },
  { value: 'OTHER',         label: 'Diğer' },
];

export const statusToBadge = (s?: string) => {
  switch (s) {
    case 'OPEN':
    case 'PUBLISHED': return { text: 'Yayında',  tone: 'bg-green-600/20 text-green-400 border-green-600/40' };
    case 'CLOSED':    return { text: 'Kapandı',  tone: 'bg-zinc-600/20 text-zinc-300 border-zinc-600/40' };
    case 'DRAFT':
    default:          return { text: 'Taslak',   tone: 'bg-amber-900/20 text-amber-300 border-amber-900/40' };
  }
};

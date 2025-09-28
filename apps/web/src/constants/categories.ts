export type SkillSlug = 'tiyatro'|'oyunculuk'|'modellik'|'dans'|'dublaj'|'muzik';

export const CATEGORIES = [
  { slug: 'tiyatro',   profileLabel: 'Tiyatro',    filterLabel: 'Tiyatrocu',      icon: 'Theater' },
  { slug: 'oyunculuk', profileLabel: 'Oyunculuk',  filterLabel: 'Oyuncu',         icon: 'User' },
  { slug: 'modellik',  profileLabel: 'Modellik',   filterLabel: 'Model',          icon: 'Camera' },
  { slug: 'dans',      profileLabel: 'Dans',       filterLabel: 'Dansçı',         icon: 'Music2' },
  { slug: 'dublaj',    profileLabel: 'Dublaj',     filterLabel: 'Dublaj Sanatçısı', icon: 'Mic' },
  { slug: 'muzik',     profileLabel: 'Müzik',      filterLabel: 'Müzisyen',       icon: 'Music' },
] as const;

export const ALL_OPTION = { slug: 'all', label: 'Tümü' } as const;

// Türkçe karakter normalize + eşleme
export const normalizeSkill = (s: string): SkillSlug | null => {
  const map: Record<string, SkillSlug> = {
    tiyatro:'tiyatro', tiyatrocu:'tiyatro',
    oyunculuk:'oyunculuk', oyuncu:'oyunculuk',
    modellik:'modellik', model:'modellik',
    dans:'dans','dansçı':'dans', dansci:'dans',
    dublaj:'dublaj','dublaj sanatçısı':'dublaj','dublaj sanatcisi':'dublaj', dublajci:'dublaj',
    muzik:'muzik','müzik':'muzik','müzisyen':'muzik', muzisyen:'muzik',
  };
  const key = s.toLowerCase()
    .replaceAll('ı','i').replaceAll('ğ','g').replaceAll('ş','s')
    .replaceAll('ö','o').replaceAll('ç','c').replaceAll('ü','u').trim();
  return map[key] ?? null;
};

// Yardımcılar:
export const getFilterLabel = (slug: SkillSlug) => CATEGORIES.find(c => c.slug === slug)!.filterLabel;
export const getProfileLabel = (slug: SkillSlug) => CATEGORIES.find(c => c.slug === slug)!.profileLabel;

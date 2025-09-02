// Gender options
export const GENDER_OPTIONS = [
  { value: 'MALE', label: 'Erkek' },
  { value: 'FEMALE', label: 'Kadın' },
  { value: 'OTHER', label: 'Diğer' },
] as const;

// Experience levels
export const EXPERIENCE_LEVELS = [
  { value: 'BEGINNER', label: 'Yeni Başlayan' },
  { value: 'AMATEUR', label: 'Amatör' },
  { value: 'SEMI_PRO', label: 'Yarı Profesyonel' },
  { value: 'PROFESSIONAL', label: 'Profesyonel' },
] as const;

// Talent specialties
export const TALENT_SPECIALTIES = [
  { value: 'ACTOR', label: 'Oyuncu' },
  { value: 'MODEL', label: 'Model' },
  { value: 'MUSICIAN', label: 'Müzisyen' },
  { value: 'DANCER', label: 'Dansçı' },
  { value: 'PRESENTER', label: 'Sunucu' },
  { value: 'VOICE_ACTOR', label: 'Seslendirmen' },
  { value: 'INFLUENCER', label: 'Influencer' },
  { value: 'PHOTOGRAPHER', label: 'Fotoğrafçı' },
  { value: 'VIDEOGRAPHER', label: 'Videograf' },
  { value: 'COMEDIAN', label: 'Komedyen' },
  { value: 'MAGICIAN', label: 'Sihirbaz' },
  { value: 'ACROBAT', label: 'Akrobat' },
  { value: 'OTHER', label: 'Diğer' },
] as const;

// Agency specialties
export const AGENCY_SPECIALTIES = [
  { value: 'CASTING', label: 'Casting Ajansı' },
  { value: 'MODELING', label: 'Model Ajansı' },
  { value: 'MUSIC', label: 'Müzik Ajansı' },
  { value: 'PRODUCTION', label: 'Prodüksiyon Şirketi' },
  { value: 'ADVERTISING', label: 'Reklam Ajansı' },
  { value: 'TALENT_MANAGEMENT', label: 'Yetenek Yönetimi' },
  { value: 'EVENT_MANAGEMENT', label: 'Etkinlik Yönetimi' },
  { value: 'TV_FILM', label: 'TV & Film' },
  { value: 'COMMERCIAL', label: 'Ticari Reklam' },
  { value: 'FASHION', label: 'Moda' },
  { value: 'DIGITAL_CONTENT', label: 'Dijital İçerik' },
  { value: 'OTHER', label: 'Diğer' },
] as const;

// Skills for talents
export const TALENT_SKILLS = [
  // Acting
  { category: 'Oyunculuk', value: 'DRAMA_ACTING', label: 'Drama Oyunculuğu' },
  { category: 'Oyunculuk', value: 'COMEDY_ACTING', label: 'Komedi Oyunculuğu' },
  { category: 'Oyunculuk', value: 'IMPROVISATION', label: 'Doğaçlama' },
  { category: 'Oyunculuk', value: 'STAGE_ACTING', label: 'Tiyatro Oyunculuğu' },
  { category: 'Oyunculuk', value: 'SCREEN_ACTING', label: 'Ekran Oyunculuğu' },
  
  // Music
  { category: 'Müzik', value: 'SINGING', label: 'Vokal' },
  { category: 'Müzik', value: 'PIANO', label: 'Piyano' },
  { category: 'Müzik', value: 'GUITAR', label: 'Gitar' },
  { category: 'Müzik', value: 'DRUMS', label: 'Davul' },
  { category: 'Müzik', value: 'VIOLIN', label: 'Keman' },
  { category: 'Müzik', value: 'COMPOSING', label: 'Beste' },
  
  // Dance
  { category: 'Dans', value: 'BALLET', label: 'Bale' },
  { category: 'Dans', value: 'MODERN_DANCE', label: 'Modern Dans' },
  { category: 'Dans', value: 'JAZZ_DANCE', label: 'Jazz Dans' },
  { category: 'Dans', value: 'HIP_HOP', label: 'Hip Hop' },
  { category: 'Dans', value: 'FOLK_DANCE', label: 'Halk Oyunları' },
  { category: 'Dans', value: 'LATIN_DANCE', label: 'Latin Dansları' },
  
  // Sports & Physical
  { category: 'Spor', value: 'MARTIAL_ARTS', label: 'Dövüş Sanatları' },
  { category: 'Spor', value: 'SWIMMING', label: 'Yüzme' },
  { category: 'Spor', value: 'GYMNASTICS', label: 'Jimnastik' },
  { category: 'Spor', value: 'HORSEBACK_RIDING', label: 'Binicilik' },
  { category: 'Spor', value: 'PARKOUR', label: 'Parkur' },
  
  // Other Skills
  { category: 'Diğer', value: 'MAGIC', label: 'Sihirbazlık' },
  { category: 'Diğer', value: 'JUGGLING', label: 'Hokkabazlık' },
  { category: 'Diğer', value: 'FIRE_PERFORMANCE', label: 'Ateş Gösterisi' },
  { category: 'Diğer', value: 'MAKEUP_ARTISTRY', label: 'Makyaj Sanatı' },
  { category: 'Diğer', value: 'PHOTOGRAPHY', label: 'Fotoğrafçılık' },
] as const;

// Languages
export const LANGUAGES = [
  { value: 'TR', label: 'Türkçe' },
  { value: 'EN', label: 'İngilizce' },
  { value: 'DE', label: 'Almanca' },
  { value: 'FR', label: 'Fransızca' },
  { value: 'ES', label: 'İspanyolca' },
  { value: 'IT', label: 'İtalyanca' },
  { value: 'RU', label: 'Rusça' },
  { value: 'AR', label: 'Arapça' },
  { value: 'JA', label: 'Japonca' },
  { value: 'KO', label: 'Korece' },
  { value: 'ZH', label: 'Çince' },
  { value: 'OTHER', label: 'Diğer' },
] as const;

// Turkish cities
export const TURKISH_CITIES = [
  'Adana', 'Adıyaman', 'Afyonkarahisar', 'Ağrı', 'Amasya', 'Ankara', 'Antalya',
  'Artvin', 'Aydın', 'Balıkesir', 'Bilecik', 'Bingöl', 'Bitlis', 'Bolu',
  'Burdur', 'Bursa', 'Çanakkale', 'Çankırı', 'Çorum', 'Denizli', 'Diyarbakır',
  'Edirne', 'Elazığ', 'Erzincan', 'Erzurum', 'Eskişehir', 'Gaziantep', 'Giresun',
  'Gümüşhane', 'Hakkâri', 'Hatay', 'Isparta', 'Mersin', 'İstanbul', 'İzmir',
  'Kars', 'Kastamonu', 'Kayseri', 'Kırklareli', 'Kırşehir', 'Kocaeli', 'Konya',
  'Kütahya', 'Malatya', 'Manisa', 'Kahramanmaraş', 'Mardin', 'Muğla', 'Muş',
  'Nevşehir', 'Niğde', 'Ordu', 'Rize', 'Sakarya', 'Samsun', 'Siirt', 'Sinop',
  'Sivas', 'Tekirdağ', 'Tokat', 'Trabzon', 'Tunceli', 'Şanlıurfa', 'Uşak',
  'Van', 'Yozgat', 'Zonguldak', 'Aksaray', 'Bayburt', 'Karaman', 'Kırıkkale',
  'Batman', 'Şırnak', 'Bartın', 'Ardahan', 'Iğdır', 'Yalova', 'Karabük', 'Kilis',
  'Osmaniye', 'Düzce'
].map(city => ({ value: city, label: city }));

// Eye colors
export const EYE_COLORS = [
  { value: 'BROWN', label: 'Kahverengi' },
  { value: 'BLUE', label: 'Mavi' },
  { value: 'GREEN', label: 'Yeşil' },
  { value: 'HAZEL', label: 'Ela' },
  { value: 'GRAY', label: 'Gri' },
  { value: 'AMBER', label: 'Amber' },
  { value: 'OTHER', label: 'Diğer' },
] as const;

// Hair colors
export const HAIR_COLORS = [
  { value: 'BLACK', label: 'Siyah' },
  { value: 'BROWN', label: 'Kahverengi' },
  { value: 'BLONDE', label: 'Sarı' },
  { value: 'RED', label: 'Kızıl' },
  { value: 'GRAY', label: 'Gri' },
  { value: 'WHITE', label: 'Beyaz' },
  { value: 'AUBURN', label: 'Kestane' },
  { value: 'OTHER', label: 'Diğer' },
] as const;

// Job categories
export const JOB_CATEGORIES = [
  { value: 'FILM', label: 'Film' },
  { value: 'TV_SERIES', label: 'Dizi' },
  { value: 'COMMERCIAL', label: 'Reklam' },
  { value: 'THEATER', label: 'Tiyatro' },
  { value: 'MUSIC_VIDEO', label: 'Müzik Videosu' },
  { value: 'DOCUMENTARY', label: 'Belgesel' },
  { value: 'SHORT_FILM', label: 'Kısa Film' },
  { value: 'FASHION', label: 'Moda' },
  { value: 'PHOTO_SHOOT', label: 'Fotoğraf Çekimi' },
  { value: 'OTHER', label: 'Diğer' },
] as const;

// Talent types for jobs
export const JOB_TALENT_TYPES = [
  { value: 'ACTOR', label: 'Oyuncu' },
  { value: 'MODEL', label: 'Model' },
  { value: 'MUSICIAN', label: 'Müzisyen' },
  { value: 'DANCER', label: 'Dansçı' },
  { value: 'PRESENTER', label: 'Sunucu' },
  { value: 'VOICE_ACTOR', label: 'Seslendirmen' },
  { value: 'INFLUENCER', label: 'Influencer' },
  { value: 'OTHER', label: 'Diğer' },
] as const;

// Application statuses
export const APPLICATION_STATUSES = [
  { value: 'PENDING', label: 'Beklemede', color: 'gray' },
  { value: 'REVIEWED', label: 'İncelendi', color: 'blue' },
  { value: 'SHORTLISTED', label: 'Ön Seçim', color: 'yellow' },
  { value: 'ACCEPTED', label: 'Kabul Edildi', color: 'green' },
  { value: 'REJECTED', label: 'Reddedildi', color: 'red' },
] as const;

// Job statuses
export const JOB_STATUSES = [
  { value: 'DRAFT', label: 'Taslak', color: 'gray' },
  { value: 'ACTIVE', label: 'Aktif', color: 'green' },
  { value: 'CLOSED', label: 'Kapandı', color: 'red' },
  { value: 'CANCELLED', label: 'İptal Edildi', color: 'red' },
] as const;

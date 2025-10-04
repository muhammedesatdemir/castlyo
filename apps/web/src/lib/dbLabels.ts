export function jobTypeDbCodeToTRLabel(code?: string | null): string {
  if (!code) return "Diğer";
  const key = String(code).trim().toUpperCase().replace(/[-\s]+/g, "_");
  const map: Record<string, string> = {
    FILM: "Film",
    TV_SERIES: "Dizi",
    COMMERCIAL: "Reklam",
    THEATER: "Tiyatro",
    MUSIC_VIDEO: "Müzik Videosu",
    DOCUMENTARY: "Belgesel",
    SHORT_FILM: "Kısa Film",
    FASHION: "Moda",
    PHOTO_SHOOT: "Fotoğraf Çekimi",
    OTHER: "Diğer",
  };
  return map[key] ?? key.split("_").map(w => w[0] + w.slice(1).toLowerCase()).join(" ");
}
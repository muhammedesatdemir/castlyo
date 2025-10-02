// Discover/Explore hedefinizi tek yerden yönetmek için:
export const DISCOVER_ROUTE = "/discover";

// StickyCta'nın beklediği imza: named export olarak fonksiyon
export function getTalentHref(skill?: string): string {
  return skill ? `/?skill=${skill}#discover` : '/?skill=tum#discover';
}
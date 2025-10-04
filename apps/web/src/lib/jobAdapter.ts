// apps/web/src/lib/jobAdapter.ts
export type JobApi = {
  id: string;
  title: string;
  description?: string;
  job_type?: string;
  city?: string;
  salary_min?: number | null;
  salary_max?: number | null;
  currency?: string | null;
  application_deadline?: string | null; // ISO
  status?: string | null;
  agency?: { company_name?: string; city?: string; website?: string } | null;
};

export type JobView = {
  id: string;
  title: string;
  description: string;
  typeLabel: string;            // "Film", "Dizi" …
  city: string;
  budgetMin?: number;
  budgetMax?: number;
  currency?: string;
  deadlineLabel?: string;       // "22.02.2026"
  status?: string;              // sadece rozet için
  agencyName?: string;
  agencyCity?: string;
  agencyWebsite?: string;
};

const jobTypeMap: Record<string, string> = {
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

export function jobTypeToLabel(t?: string) {
  if (!t) return "Diğer";
  return jobTypeMap[t] ?? "Diğer";
}

export function toTRDate(iso?: string | null) {
  if (!iso) return undefined;
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return undefined;
  return d.toLocaleDateString("tr-TR", { day: "2-digit", month: "2-digit", year: "numeric" });
}

export function adaptJob(j: JobApi): JobView {
  return {
    id: j.id,
    title: j.title,
    description: j.description ?? "",
    typeLabel: jobTypeToLabel(j.job_type),
    city: j.city ?? "",
    budgetMin: j.salary_min ?? undefined,
    budgetMax: j.salary_max ?? undefined,
    currency: j.currency ?? undefined,
    deadlineLabel: toTRDate(j.application_deadline),
    status: j.status ?? undefined,
    agencyName: j.agency?.company_name ?? undefined,
    agencyCity: j.agency?.city ?? undefined,
    agencyWebsite: j.agency?.website ?? undefined,
  };
}

// Money formatting utility
export const fmtMoney = (n?: number) =>
  n == null ? "" : new Intl.NumberFormat("tr-TR").format(n);

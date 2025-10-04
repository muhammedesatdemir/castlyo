import React, { useMemo, useState, useEffect } from 'react';
import { X, BadgeCheck, Globe } from 'lucide-react';
import { fmtMoney } from '../../lib/jobAdapter';
import styles from './JobDetailsModal.module.css';

// DB kod -> TR etiket
const jobTypeDbCodeToTRLabel = (code?: string | null) => {
  if (!code) return "";
  const key = String(code).trim().toUpperCase().replace(/[-\s]+/g, "_");
  const map: Record<string,string> = {
    FILM:"Film", TV_SERIES:"Dizi", COMMERCIAL:"Reklam", THEATER:"Tiyatro",
    MUSIC_VIDEO:"Müzik Videosu", DOCUMENTARY:"Belgesel", SHORT_FILM:"Kısa Film",
    FASHION:"Moda", PHOTO_SHOOT:"Fotoğraf Çekimi", OTHER:"Diğer"
  };
  return map[key] ?? "";
};

// API cevaplarını normalize et (camelCase/snake_case farkı kapansın)
type JobRaw = any;
type JobView = {
  title: string;
  description?: string;
  jobType?: string | null;
  city?: string | null;
  salaryMin?: number | null;
  salaryMax?: number | null;
  ageMin?: number | null;
  ageMax?: number | null;
  currency?: string | null;
  applicationDeadline?: string | null;
  status?: string | null;
  agency?: { company_name?: string; city?: string; website?: string } | null;
};

const normalizeJob = (r: JobRaw): JobView => ({
  title: r?.title ?? "",
  description: r?.description ?? r?.desc ?? "",
  jobType: r?.job_type ?? r?.jobType ?? r?.type ?? null,
  city: r?.city ?? r?.location?.city ?? null,
  salaryMin: r?.salary_min ?? r?.salaryMin ?? r?.budget_min ?? r?.minBudget ?? null,
  salaryMax: r?.salary_max ?? r?.salaryMax ?? r?.budget_max ?? r?.maxBudget ?? null,
  ageMin: r?.age_min ?? r?.ageMin ?? r?.min_age ?? null,
  ageMax: r?.age_max ?? r?.ageMax ?? r?.max_age ?? null,
  currency: r?.currency ?? r?.budget_currency ?? null,
  applicationDeadline:
    r?.application_deadline ?? r?.applicationDeadline ?? r?.expires_at ?? r?.deadline ?? null,
  status: r?.status ?? r?.state ?? null,
  agency: r?.agency ?? r?.agency_profile ?? r?.agencyProfile ?? null,
});

type Props = {
  jobId: string;
  onClose: () => void;
  currentUser?: { id: string; role: 'AGENCY' | 'TALENT' | 'ADMIN'; agencyProfileId?: string | null };
  onSaved?: (updated: JobView) => void; // listeyi yenilemek için opsiyonel callback
};

export default function JobDetailsModal({ jobId, onClose, currentUser, onSaved }: Props) {
  const [view, setView] = React.useState<JobView | null>(null);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);

  React.useEffect(() => {
    let alive = true;
    (async () => {
      try {
        setLoading(true);
        const res = await fetch(`/api/proxy/api/v1/jobs/${jobId}`, {
          cache: "no-store",
          credentials: "include",              // 🔴 cookie/oturum gitsin
          headers: { Accept: "application/json" },
        });
        if (!res.ok) throw new Error(`GET /jobs/${jobId} ${res.status}`);
        const payload = await res.json();
        const raw = payload?.data ?? payload; // {data:{...}} ya da direkt obje
        const v = normalizeJob(raw);
        if (alive) {
          setView(v);
          console.log("[JDM] raw:", raw);     // ➜ Network/Console'da gör
          console.log("[JDM] norm:", v);      // ➜ jobType/salaryMin vb.
        }
      } catch (e: any) {
        if (alive) setError(e?.message ?? "Fetch error");
      } finally {
        if (alive) setLoading(false);
      }
    })();
    return () => { alive = false; };
  }, [jobId]);

  // Check if user is owner for status badge display
  const isOwner = useMemo(() => {
    if (!view) return false;
    if (currentUser?.role !== 'AGENCY') return false;
    // For now, we'll assume ownership based on user role since we don't have agency_id in JobView
    return currentUser?.role === 'AGENCY';
  }, [view, currentUser]);

  if (loading) return (
    <div className="fixed inset-0 z-[70] grid place-items-center bg-black/60">
      <div className="w-full max-w-3xl rounded-2xl bg-[#0f1115] p-6 text-white">
        <div className="p-6 text-sm text-neutral-400">Yükleniyor…</div>
      </div>
    </div>
  );
  
  if (error) return (
    <div className="fixed inset-0 z-[70] grid place-items-center bg-black/60">
      <div className="w-full max-w-3xl rounded-2xl bg-[#0f1115] p-6 text-white">
        <div className="p-6 text-sm text-red-400">Hata: {error}</div>
      </div>
    </div>
  );
  
  if (!view) return (
    <div className="fixed inset-0 z-[70] grid place-items-center bg-black/60">
      <div className="w-full max-w-3xl rounded-2xl bg-[#0f1115] p-6 text-white">
        <div className="p-6 text-sm text-neutral-400">Kayıt bulunamadı.</div>
      </div>
    </div>
  );

  return (
    <div className="fixed inset-0 z-[70] grid place-items-center bg-black/60" onClick={onClose}>
      <div className={`${styles.theme} job-modal w-full max-w-3xl rounded-2xl bg-[#0f1115] p-6 text-white shadow-2xl`} onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <h2 className="text-2xl font-semibold">İlan Detayı</h2>
            {/* Durum alanını formdan kaldırdık; sadece sahibi görsün */}
            {isOwner && view.status && (
              <span className={`px-2 py-1 rounded-full text-xs border ${
                view.status === 'OPEN' || view.status === 'PUBLISHED' 
                  ? 'bg-green-600/20 text-green-400 border-green-600/40'
                  : view.status === 'CLOSED'
                  ? 'bg-zinc-600/20 text-zinc-300 border-zinc-600/40'
                  : 'bg-amber-900/20 text-amber-300 border-amber-900/40'
              }`}>
                {view.status === 'OPEN' || view.status === 'PUBLISHED' ? 'Yayında' :
                 view.status === 'CLOSED' ? 'Kapandı' : 'Taslak'}
              </span>
            )}
          </div>
          <button onClick={onClose} className="rounded-xl p-2 hover:bg-white/10" aria-label="Kapat">
            <X />
          </button>
        </div>

        {/* Üst kısım: Başlık + Ajans */}
        <div className="mt-4 flex flex-col gap-2">
          <input
            className="w-full rounded-md border border-neutral-700 bg-neutral-900 px-3 py-2 text-neutral-200 text-xl font-medium"
            value={view.title}
            readOnly
          />

          <div className="flex items-center gap-2 text-sm text-neutral-300">
            <span className="font-medium">{view.agency?.company_name ?? 'Ajans'}</span>
            {view.agency?.website ? (
              <a className="ml-1 inline-flex items-center gap-1 underline underline-offset-2" href={view.agency.website} target="_blank">
                <Globe className="h-4 w-4" /> Web
              </a>
            ) : null}
            {view.agency?.city ? <span className="opacity-80">• {view.agency.city}</span> : null}
          </div>
        </div>

        {/* İçerik */}
        <div className="mt-6 grid grid-cols-1 gap-4 md:grid-cols-2">
          <div className="md:col-span-2">
            <label className="mb-1 block text-sm text-neutral-300">Açıklama</label>
            <textarea
              className="w-full rounded-md border border-neutral-700 bg-neutral-900 px-3 py-2 text-neutral-200 min-h-[120px]"
              value={view.description ?? ""}
              readOnly
            />
          </div>

          {/* Tür */}
          <div>
            <label className="mb-1 block text-sm text-neutral-300">Tür</label>
            <input
              value={jobTypeDbCodeToTRLabel(view.jobType)}
              readOnly
              className="w-full rounded-md border border-neutral-700 bg-neutral-900 px-3 py-2 text-neutral-200"
            />
          </div>

          {/* Şehir */}
          <div>
            <label className="mb-1 block text-sm text-neutral-300">Şehir</label>
            <input
              value={view.city ?? ""}
              readOnly
              className="w-full rounded-md border border-neutral-700 bg-neutral-900 px-3 py-2 text-neutral-200"
            />
          </div>

          {/* Bitiş Tarihi * */}
          <div>
            <label className="mb-1 block text-sm text-neutral-300">Bitiş Tarihi *</label>
            <input
              value={
                view.applicationDeadline
                  ? new Date(view.applicationDeadline).toLocaleDateString("tr-TR", { day:"2-digit", month:"2-digit", year:"numeric" })
                  : ""
              }
              readOnly
              className="w-full rounded-md border border-neutral-700 bg-neutral-900 px-3 py-2 text-neutral-200"
            />
            {!view.applicationDeadline && (
              <p className="mt-1 text-xs text-neutral-400">
                Format: DD.MM.YYYY (örn: 22.02.2026)
              </p>
            )}
          </div>

          {/* Bütçe (min / max) */}
          <div>
            <label className="mb-1 block text-sm text-neutral-300">Bütçe (min / max)</label>
            <div className="grid grid-cols-2 gap-3">
              <input
                value={view.salaryMin ?? ""}
                readOnly
                className="w-full rounded-md border border-neutral-700 bg-neutral-900 px-3 py-2 text-neutral-200"
              />
              <input
                value={view.salaryMax ?? ""}
                readOnly
                className="w-full rounded-md border border-neutral-700 bg-neutral-900 px-3 py-2 text-neutral-200"
              />
            </div>
          </div>

          {/* Para Birimi (sol) + Yaş (min/max) (sağ) */}
          <div className="mt-4 grid grid-cols-2 gap-3">
            {/* Sol: Para Birimi */}
            <div>
              <label className="mb-1 block text-sm text-neutral-300">Para Birimi</label>
              <input
                value={view.currency ?? "TRY"}
                readOnly
                className="w-full rounded-md border border-neutral-700 bg-neutral-900 px-3 py-2 text-neutral-200"
              />
            </div>

            {/* Sağ: Yaş (min / max) */}
            <div>
              <label className="mb-1 block text-sm text-neutral-300">Yaş (min / max)</label>
              <div className="grid grid-cols-2 gap-3">
                <input
                  value={view.ageMin ?? ""}
                  readOnly
                  className="w-full rounded-md border border-neutral-700 bg-neutral-900 px-3 py-2 text-neutral-200"
                />
                <input
                  value={view.ageMax ?? ""}
                  readOnly
                  className="w-full rounded-md border border-neutral-700 bg-neutral-900 px-3 py-2 text-neutral-200"
                />
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="mt-6 flex items-center justify-between">
          <div className="text-sm text-neutral-400">
            {view.status === 'PUBLISHED' ? 'Yayında' : 'Taslak'}
          </div>
          <button onClick={onClose} className="rounded-xl bg-neutral-800 px-4 py-2">Kapat</button>
        </div>
      </div>
    </div>
  );
}
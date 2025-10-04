"use client";

import * as React from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
// Removed unused UI component imports - using custom styled elements
import { useRouter } from "next/navigation";
import { toast } from "@/components/ui/toast";

const JobSchema = z.object({
  title: z.string().min(4, "Başlık en az 4 karakter olmalı"),
  description: z.string().min(20, "Açıklama en az 20 karakter olmalı"),
  city: z.string().min(2, "Şehir gerekli"),
  jobType: z.enum(["Film", "Dizi", "Reklam", "Tiyatro", "Müzik Videosu", "Belgesel", "Kısa Film", "Moda", "Fotoğraf Çekimi", "Diğer"]).default("Diğer"),
  ageMin: z.coerce.number().int().min(1).max(120).optional(),
  ageMax: z.coerce.number().int().min(1).max(120).optional(),
  budgetMin: z.coerce.number().int().min(0).optional(),
  budgetMax: z.coerce.number().int().min(0).optional(),
  maxApplications: z.coerce.number().int().min(1).max(10000).optional(),
  expiresAt: z.string()
    .min(1, "Bitiş tarihi gerekli")
    .refine((val) => {
      // Accept DD.MM.YYYY or YYYY-MM-DD format
      return /^\d{2}\.\d{2}\.\d{4}$/.test(val) || /^\d{4}-\d{2}-\d{2}$/.test(val);
    }, "Geçerli tarih formatı giriniz (DD.MM.YYYY veya YYYY-MM-DD)"), // DD.MM.YYYY or YYYY-MM-DD
});

export type JobFormValues = z.infer<typeof JobSchema>;

// UI'deki dropdown metinlerini backend enumlarına çeviren harita
const CATEGORY_MAP: Record<string, string> = {
  "Film": "FILM",
  "Dizi": "TV_SERIES", 
  "Reklam": "COMMERCIAL",
  "Tiyatro": "THEATER",
  "Müzik Videosu": "MUSIC_VIDEO",
  "Belgesel": "DOCUMENTARY",
  "Kısa Film": "SHORT_FILM",
  "Moda": "FASHION",
  "Fotoğraf Çekimi": "PHOTO_SHOOT",
  "Diğer": "OTHER",
};

const TALENT_TYPE_DEFAULT = "ACTOR"; // UI'de seçtirmiyorsak şimdilik güvenli varsayılan

// dd.MM.yyyy -> ISO (handles both DD.MM.YYYY and YYYY-MM-DD formats)
const toISOFromTR = (str?: string) => {
  if (!str) return null;
  
  // Handle YYYY-MM-DD format (from date input)
  if (/^\d{4}-\d{2}-\d{2}$/.test(str)) {
    return new Date(str + 'T23:59:59.000Z').toISOString();
  }
  
  // Handle DD.MM.YYYY format (Turkish format)
  const [dd, mm, yyyy] = str.split('.');
  if (!dd || !mm || !yyyy) return null;
  return new Date(Number(yyyy), Number(mm) - 1, Number(dd), 23, 59, 59).toISOString();
};

// TR etiket -> API enum
const mapJobType = (label: string) => ({
  'Film': 'FILM',
  'Dizi': 'TV_SERIES',
  'Reklam': 'COMMERCIAL',
  'Tiyatro': 'THEATER',
  'Müzik Videosu': 'MUSIC_VIDEO',
  'Belgesel': 'DOCUMENTARY',
  'Kısa Film': 'SHORT_FILM',
  'Moda': 'FASHION',
  'Fotoğraf Çekimi': 'PHOTO_SHOOT',
  'Diğer': 'OTHER',
}[label] ?? 'OTHER');

export function JobCreateSheet({
  canPostJobs,
  isAgency,
  onRequireAgencyOnboarding,
}: {
  canPostJobs: boolean;
  isAgency: boolean;
  onRequireAgencyOnboarding: () => void;
}) {
  const [open, setOpen] = React.useState(false);
  const router = useRouter();

  const form = useForm<JobFormValues>({
    resolver: zodResolver(JobSchema),
    defaultValues: {
      title: "",
      description: "",
      city: "",
      jobType: "Diğer",
      ageMin: undefined,
      ageMax: undefined,
      budgetMin: undefined,
      budgetMax: undefined,
      maxApplications: 100,
      expiresAt: "",
    },
  });

  const submit = async (values: JobFormValues) => {
    try {
      const payload = {
        title: values.title.trim(),
        description: values.description.trim(),
        city: values.city.trim(),
        job_type: mapJobType(values.jobType),       // <-- enum'a çevir
        age_min: values.ageMin ? Number(values.ageMin) : null,
        age_max: values.ageMax ? Number(values.ageMax) : null,
        salary_min: values.budgetMin ? Number(values.budgetMin) : null,
        salary_max: values.budgetMax ? Number(values.budgetMax) : null,
        currency: 'TRY',
        application_deadline: toISOFromTR(values.expiresAt), // <-- ISO string
        max_applications: values.maxApplications ? Number(values.maxApplications) : null,
        // istersen budget_range da doldur
        budget_range: values.budgetMin && values.budgetMax
          ? `₺${Math.round(values.budgetMin/1000)}-${Math.round(values.budgetMax/1000)}k`
          : undefined,
      };

      // Debug: payload'ı kontrol et
      console.log('Job creation payload:', payload);

      // basit client doğrulama
      if (!payload.title || !payload.description || !payload.city || !payload.job_type || !payload.application_deadline) {
        toast?.error?.("Zorunlu alanlar eksik: başlık, açıklama, şehir, tür ve bitiş tarihi.");
        return;
      }

      const res = await fetch("/api/proxy/api/v1/jobs", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        const err = await res.json().catch(() => null);
        const msg = Array.isArray(err?.message) ? err.message.join("\n") : (err?.message || "İlan oluşturulamadı");
        throw new Error(msg);
      }

      toast.success("İlan oluşturuldu");
      setOpen(false);
      form.reset();
      // listeyi tazele
      router.refresh();
    } catch (e: any) {
      toast.error(e.message || "İlan oluşturulamadı");
    }
  };

  const handleButtonClick = () => {
    if (!isAgency) {
      toast.info("İlan verebilmek için ajans hesabı ile giriş yapmalısınız.");
      return;
    }
    if (!canPostJobs) {
      onRequireAgencyOnboarding();
      return;
    }
    setOpen(true);
  };

  return (
    <div className="job-create-sheet">
      <button
        type="button"
        onClick={handleButtonClick}
        className="ml-auto inline-flex items-center rounded-lg
                   bg-[#962901] text-[#F6E6C3]
                   px-4 py-2 text-sm font-medium
                   hover:opacity-90 disabled:opacity-50"
        data-test="post-job-btn"
      >
        İlan Ver
      </button>

      {/* Custom styled modal */}
      {open && (
        <div className="fixed inset-0 z-50 flex items-start justify-end bg-black/60">
          <div className="h-full w-full max-w-lg overflow-y-auto bg-[#0B0F1A] text-[#F6E6C3] border border-[#F6E6C3]/20 shadow-2xl">
            <div className="flex items-center justify-between p-6 border-b border-[#F6E6C3]/20">
              <h2 className="text-xl font-semibold text-[#F6E6C3]">Yeni İlan</h2>
              <button
                onClick={() => setOpen(false)}
                className="rounded-md px-2 py-1 text-[#F6E6C3] hover:bg-[#F6E6C3]/10"
              >
                Kapat
              </button>
            </div>
            <div className="p-6">
              <form
                onSubmit={form.handleSubmit(submit)}
                className="jobs-form space-y-4"
              >
                <div className="space-y-1">
                  <label className="text-sm text-[#962901]">Başlık *</label>
                  <input 
                    {...form.register("title")} 
                    placeholder="Örn: Dizi Oyuncusu (İzmir)"
                    className="mt-1 w-full rounded-md border bg-transparent px-3 py-2
                               text-[#F6E6C3] placeholder-[#F6E6C3]/60
                               border-[#F6E6C3]/30 focus:outline-none focus:ring-2 focus:ring-[#F6E6C3]/40
                               !text-[#F6E6C3] caret-[#F6E6C3]"
                  />
                  {form.formState.errors.title && (
                    <p className="text-xs text-red-400">{form.formState.errors.title.message}</p>
                  )}
                </div>

                <div className="space-y-1">
                  <label className="text-sm text-[#962901]">Açıklama *</label>
                  <textarea 
                    rows={4} 
                    {...form.register("description")} 
                    placeholder="İşin kapsamı, beklentiler, çekim tarihleri..."
                    className="mt-1 w-full rounded-md border bg-transparent px-3 py-2
                               text-[#F6E6C3] placeholder-[#F6E6C3]/60
                               border-[#F6E6C3]/30 focus:outline-none focus:ring-2 focus:ring-[#F6E6C3]/40
                               !text-[#F6E6C3] caret-[#F6E6C3]"
                  />
                  {form.formState.errors.description && (
                    <p className="text-xs text-red-400">{form.formState.errors.description.message}</p>
                  )}
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <label className="text-sm text-[#962901]">Şehir *</label>
                    <input 
                      {...form.register("city")} 
                      placeholder="İzmir"
                      className="mt-1 w-full rounded-md border bg-transparent px-3 py-2
                                 text-[#F6E6C3] placeholder-[#F6E6C3]/60
                                 border-[#F6E6C3]/30 focus:outline-none focus:ring-2 focus:ring-[#F6E6C3]/40
                                 !text-[#F6E6C3] caret-[#F6E6C3]"
                    />
                    {form.formState.errors.city && (
                      <p className="text-xs text-red-400">{form.formState.errors.city.message}</p>
                    )}
                  </div>
                  <div className="space-y-1">
                    <label className="text-sm text-[#962901]">Tür</label>
                    <select
                      className="mt-1 w-full rounded-md border bg-[#0B0F1A] px-3 py-2
                                 text-[#F6E6C3]
                                 border-[#F6E6C3]/30 focus:outline-none focus:ring-2 focus:ring-[#F6E6C3]/40
                                 !text-[#F6E6C3] caret-[#F6E6C3]"
                      {...form.register("jobType")}
                    >
                      <option value="Film" className="bg-[#0B0F1A] text-[#F6E6C3]">Film</option>
                      <option value="Dizi" className="bg-[#0B0F1A] text-[#F6E6C3]">Dizi</option>
                      <option value="Reklam" className="bg-[#0B0F1A] text-[#F6E6C3]">Reklam</option>
                      <option value="Tiyatro" className="bg-[#0B0F1A] text-[#F6E6C3]">Tiyatro</option>
                      <option value="Müzik Videosu" className="bg-[#0B0F1A] text-[#F6E6C3]">Müzik Videosu</option>
                      <option value="Belgesel" className="bg-[#0B0F1A] text-[#F6E6C3]">Belgesel</option>
                      <option value="Kısa Film" className="bg-[#0B0F1A] text-[#F6E6C3]">Kısa Film</option>
                      <option value="Moda" className="bg-[#0B0F1A] text-[#F6E6C3]">Moda</option>
                      <option value="Fotoğraf Çekimi" className="bg-[#0B0F1A] text-[#F6E6C3]">Fotoğraf Çekimi</option>
                      <option value="Diğer" className="bg-[#0B0F1A] text-[#F6E6C3]">Diğer</option>
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <label className="text-sm text-[#962901]">Yaş (min)</label>
                    <input 
                      type="number" 
                      {...form.register("ageMin")} 
                      placeholder="18"
                      className="mt-1 w-full rounded-md border bg-transparent px-3 py-2
                                 text-[#F6E6C3] placeholder-[#F6E6C3]/60
                                 border-[#F6E6C3]/30 focus:outline-none focus:ring-2 focus:ring-[#F6E6C3]/40
                                 !text-[#F6E6C3] caret-[#F6E6C3]"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-sm text-[#962901]">Yaş (max)</label>
                    <input 
                      type="number" 
                      {...form.register("ageMax")} 
                      placeholder="35"
                      className="mt-1 w-full rounded-md border bg-transparent px-3 py-2
                                 text-[#F6E6C3] placeholder-[#F6E6C3]/60
                                 border-[#F6E6C3]/30 focus:outline-none focus:ring-2 focus:ring-[#F6E6C3]/40
                                 !text-[#F6E6C3] caret-[#F6E6C3]"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <label className="text-sm text-[#962901]">Bütçe (min)</label>
                    <input 
                      type="number" 
                      {...form.register("budgetMin")} 
                      placeholder="8000"
                      className="mt-1 w-full rounded-md border bg-transparent px-3 py-2
                                 text-[#F6E6C3] placeholder-[#F6E6C3]/60
                                 border-[#F6E6C3]/30 focus:outline-none focus:ring-2 focus:ring-[#F6E6C3]/40
                                 !text-[#F6E6C3] caret-[#F6E6C3]"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-sm text-[#962901]">Bütçe (max)</label>
                    <input 
                      type="number" 
                      {...form.register("budgetMax")} 
                      placeholder="15000"
                      className="mt-1 w-full rounded-md border bg-transparent px-3 py-2
                                 text-[#F6E6C3] placeholder-[#F6E6C3]/60
                                 border-[#F6E6C3]/30 focus:outline-none focus:ring-2 focus:ring-[#F6E6C3]/40
                                 !text-[#F6E6C3] caret-[#F6E6C3]"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <label className="text-sm text-[#962901]">Maks. Başvuru</label>
                    <input 
                      type="number" 
                      {...form.register("maxApplications")} 
                      placeholder="100"
                      className="mt-1 w-full rounded-md border bg-transparent px-3 py-2
                                 text-[#F6E6C3] placeholder-[#F6E6C3]/60
                                 border-[#F6E6C3]/30 focus:outline-none focus:ring-2 focus:ring-[#F6E6C3]/40
                                 !text-[#F6E6C3] caret-[#F6E6C3]"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-sm text-[#962901]">Bitiş Tarihi *</label>
                    <input 
                      type="text" 
                      {...form.register("expiresAt")}
                      placeholder="22.02.2026"
                      className="mt-1 w-full rounded-md border bg-transparent px-3 py-2
                                 text-[#F6E6C3] placeholder-[#F6E6C3]/60
                                 border-[#F6E6C3]/30 focus:outline-none focus:ring-2 focus:ring-[#F6E6C3]/40
                                 !text-[#F6E6C3] caret-[#F6E6C3]"
                    />
                    <p className="text-xs text-[#F6E6C3]/60">Format: DD.MM.YYYY (örn: 22.02.2026)</p>
                    {form.formState.errors.expiresAt && (
                      <p className="text-xs text-red-400">{form.formState.errors.expiresAt.message}</p>
                    )}
                  </div>
                </div>

                <div className="flex justify-end gap-3 pt-4">
                  <button 
                    type="button" 
                    onClick={() => setOpen(false)}
                    className="inline-flex items-center rounded-lg border border-[#F6E6C3]/30 text-[#F6E6C3] hover:bg-[#F6E6C3]/10 px-4 py-2 text-sm"
                  >
                    İptal
                  </button>
                  <button 
                    type="submit" 
                    disabled={form.formState.isSubmitting}
                    className="inline-flex items-center rounded-lg
                               bg-[#F6E6C3] text-[#0B0F1A]
                               px-4 py-2 text-sm font-medium
                               hover:opacity-90 disabled:opacity-50"
                  >
                    {form.formState.isSubmitting ? "Kaydediliyor…" : "İlanı Oluştur"}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

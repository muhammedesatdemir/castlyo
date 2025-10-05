'use client';

import * as React from 'react';
import useSWR from 'swr';
import { Badge } from '@/components/ui/badge';
import { X } from 'lucide-react';

// Basit telefon formatlayıcı
function formatPhone(raw?: string | null) {
  if (!raw) return null;
  const digits = raw.replace(/\D/g, '');
  // ör: 10–11 haneli TR numaralar için basit bir görünüm
  if (digits.length === 10) return digits.replace(/(\d{3})(\d{3})(\d{4})/, '($1) $2 $3');
  if (digits.length === 11) return digits.replace(/(\d)(\d{3})(\d{3})(\d{4})/, '$1 ($2) $3 $4');
  return raw; // tanıyamazsa olduğu gibi göster
}

// CV / Özgeçmiş satırlarını metinden temizler
function stripCvLines(input?: string | null) {
  if (!input) return input ?? null;
  // satır bazlı: "CV: ..." ile başlayan satırları at
  const cleaned = input
    .split(/\r?\n/)
    .filter(line => !/^\s*CV\s*:/i.test(line))
    .join('\n')
    // olası serbest geçen "CV: undefined" kalıntılarını da temizle
    .replace(/CV\s*:\s*undefined/gi, '')
    // aşırı boş satırları toparla
    .replace(/\n{3,}/g, '\n\n')
    .trim();
  return cleaned.length ? cleaned : null;
}

const GENDER_TR: Record<string, string> = {
  MALE: 'Erkek',
  FEMALE: 'Kadın',
};

const SPECIALTY_TR: Record<string, string> = {
  ACTING: 'Oyuncu',
  THEATER: 'Tiyatrocu',
  MODELING: 'Model',
  DANCE: 'Dansçı',
  DANCER: 'Dansçı',
  VOICE_OVER: 'Dublaj Sanatçısı',
  DUBBING: 'Dublaj Sanatçısı',
  MUSICIAN: 'Müzisyen',
};

const fetcher = async (url: string) => {
  const r = await fetch(url, { credentials: 'include' });
  if (!r.ok) {
    const err: any = new Error('fetch failed');
    err.status = r.status;
    err.body = await r.text().catch(() => '');
    throw err;
  }
  return r.json();
};

// {data:{...}} | {...} | []   -> tek obje ya da null
function norm(x: any) {
  if (!x) return null;
  if (Array.isArray(x)) return x[0] ?? null;
  return x.data ?? x;
}

function ageFrom(b?: string | null) {
  if (!b) return null;
  const d = new Date(b);
  if (Number.isNaN(+d)) return null;
  return new Date(Date.now() - d.getTime()).getUTCFullYear() - 1970;
}

export function ApplicantDetailsDialog({
  jobId,
  applicationId,
  trigger,
}: {
  jobId: string;
  applicationId: string;
  trigger: React.ReactNode;
}) {
  const [open, setOpen] = React.useState(false);
  const url = open ? `/api/proxy/api/v1/jobs/${jobId}/applications/${applicationId}` : null;

  const { data, error, isLoading } = useSWR(url, fetcher, { revalidateOnFocus: false });

  const core = React.useMemo(() => norm(data), [data]); // tek obje ya da null

  // Hem talent_profiles alanları, hem de listede gördüğümüz "core" alanları destekle
  const displayName =
    core?.displayName ??
    core?.display_name ??
    ([core?.first_name ?? core?.firstName, core?.last_name ?? core?.lastName].filter(Boolean).join(' ') ||
    core?.talentDisplayName ||
    [core?.talentFirstName, core?.talentLastName].filter(Boolean).join(' ') ||
    'İsimsiz Başvuru');

  const profileImg = core?.profile_image ?? core?.profileImage ?? core?.talentProfileImage ?? null;
  const city = core?.city ?? core?.talentCity ?? null;
  const country = core?.country ?? null;
  const bio = core?.bio ?? null;
  const experience = core?.experience ?? core?.talentExperience ?? null;
  const age = ageFrom(core?.birth_date ?? core?.birthDate);
  const gender = core?.gender ?? null;
  const height = core?.height_cm ?? null;
  const weight = core?.weight_kg ?? null;

  const specialties: string[] = core?.specialties ?? core?.talentSpecialties ?? [];
  const skills: string[] = core?.skills ?? [];
  const languages: string[] = core?.languages ?? [];

  // İletişim bilgileri
  const email =
    core?.applicantEmail ??
    core?.email ??
    null;

  const phoneRaw =
    core?.applicantPhone ??
    core?.phone ??
    null;

  const phone = formatPhone(phoneRaw);

  const genderTr = gender ? (GENDER_TR[String(gender).toUpperCase()] ?? null) : null;
  const specialtiesTr = Array.isArray(specialties)
    ? specialties.map(s => SPECIALTY_TR[String(s).toUpperCase()] ?? s)
    : [];

  const bioClean = stripCvLines(bio);
  const experienceClean = stripCvLines(experience);

  // Tanılama
  console.debug('[ApplicantDetails] url:', url, 'status:', (error as any)?.status, 'core:', core);

  // Eğer core null ise (örn. [] geldiyse) kullanıcıya net mesaj verelim
  const notFound = !isLoading && !error && !core;

  return (
    <>
      <div onClick={() => setOpen(true)}>
        {trigger}
      </div>

      {open && (
        <div className="fixed inset-0 z-[70] grid place-items-center bg-black/60" onClick={() => setOpen(false)}>
          <div className="w-full max-w-xl rounded-2xl bg-[#0f1115] p-6 text-white shadow-2xl" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-semibold">Başvuran Detayı</h2>
              <button onClick={() => setOpen(false)} className="rounded-xl p-2 hover:bg-white/10" aria-label="Kapat">
                <X className="h-5 w-5" />
              </button>
            </div>

            {isLoading && (
              <div className="space-y-2">
                {Array.from({ length: 6 }).map((_, i) => (
                  <div key={i} className="h-5 rounded bg-neutral-700 animate-pulse" />
                ))}
              </div>
            )}

            {error && (
              <div className="text-sm text-red-400">
                Detay yüklenemedi{(error as any)?.status ? ` (${(error as any).status})` : ''}.
              </div>
            )}

            {notFound && (
              <div className="text-sm text-neutral-300">
                Kayıt bulunamadı.
              </div>
            )}

            {!isLoading && !error && core && (
              <div className="space-y-4">
                {/* Header container */}
                <div className="flex items-start justify-between gap-6">
                  {/* SOL: Avatar + İsim + (şehir • yaş • cinsiyet) */}
                  <div className="flex items-start gap-3">
                    {profileImg ? (
                      <img src={profileImg} alt={displayName} className="h-16 w-16 rounded-md object-cover" />
                    ) : (<div className="h-16 w-16 rounded-md bg-neutral-700" />)}
                    <div>
                      <div className="text-xl font-semibold">{displayName}</div>
                      <div className="text-sm text-white/80">
                        {city && city}
                        {age != null && (city ? ` • ${age} yaş` : `${age} yaş`)}
                        {genderTr && ` • ${genderTr}`}
                      </div>
                    </div>
                  </div>

                </div>

                <div className="border-t border-neutral-700" />

                {/* CONTENT GRID */}
                <div className="mt-4 md:grid md:grid-cols-[1fr_280px] md:gap-8">
                  {/* SOL SÜTUN */}
                  <div className="space-y-6">
                    {/* Hakkında */}
                    {bioClean && (
                      <section className="space-y-2">
                        <h3 className="text-[15px] font-semibold">Hakkında</h3>
                        <p className="text-sm leading-6 text-white/90 whitespace-pre-wrap">{bioClean}</p>
                      </section>
                    )}

                    {/* Deneyimler */}
                    {experienceClean && (
                      <section className="space-y-2">
                        <h3 className="text-[15px] font-semibold">Deneyimler</h3>
                        <p className="text-sm leading-6 text-white/90 whitespace-pre-wrap">{experienceClean}</p>
                      </section>
                    )}

                    {/* Uzmanlık */}
                    {specialtiesTr.length > 0 && (
                      <section className="space-y-2">
                        <h3 className="text-[15px] font-semibold">Uzmanlık</h3>
                        <div className="flex flex-wrap gap-2">
                          {specialtiesTr.map(s => (
                            <span key={s} className="rounded-full bg-white/10 px-3 py-1 text-xs text-white/90">
                              {s}
                            </span>
                          ))}
                        </div>
                      </section>
                    )}

                    {/* Yetenekler */}
                    {skills.length > 0 && (
                      <section className="space-y-2">
                        <h3 className="text-[15px] font-semibold">Yetenekler</h3>
                        <div className="flex flex-wrap gap-2">
                          {skills.map(s => (
                            <span key={s} className="rounded-full bg-white/10 px-3 py-1 text-xs text-white/90">
                              {s}
                            </span>
                          ))}
                        </div>
                      </section>
                    )}

                    {/* Diller */}
                    {languages.length > 0 && (
                      <section className="space-y-2">
                        <h3 className="text-[15px] font-semibold">Diller</h3>
                        <div className="flex flex-wrap gap-2">
                          {languages.map(l => (
                            <span key={l} className="rounded-full bg-white/10 px-3 py-1 text-xs text-white/90">
                              {l}
                            </span>
                          ))}
                        </div>
                      </section>
                    )}

                    {/* Boy-Kilo */}
                    {(height || weight) && (
                      <section className="space-y-2">
                        <h3 className="text-[15px] font-semibold">Ölçüler</h3>
                        <p className="text-sm leading-6 text-white/90">
                          {height ? `Boy: ${height} cm` : null}
                          {height && weight ? ' • ' : null}
                          {weight ? `Kilo: ${weight} kg` : null}
                        </p>
                      </section>
                    )}
                  </div>

                  {/* SAĞ SÜTUN – İLETİŞİM */}
                  {(email || phone) && (
                    <aside className="mt-6 md:mt-0">
                      <div className="rounded-xl border border-white/10 bg-white/5 px-4 py-3 shadow-sm">
                        <div className="text-sm font-semibold text-center mb-2">İletişim</div>
                        <div className="space-y-2 text-sm">
                          {email && (
                            <div>
                              <div className="text-white/80 mb-0.5">E-posta</div>
                              <a className="text-white underline break-all" href={`mailto:${email}`}>{email}</a>
                            </div>
                          )}
                          {phone && (
                            <div>
                              <div className="text-white/80 mb-0.5">Telefon</div>
                              <a className="text-white underline" href={`tel:${phoneRaw || ''}`}>{phone}</a>
                            </div>
                          )}
                        </div>
                      </div>
                    </aside>
                  )}
                </div>

              </div>
            )}
          </div>
        </div>
      )}
    </>
  );
}
/* eslint-disable @next/next/no-img-element */
"use client";

import * as React from "react";
import { useSession } from "next-auth/react";
import type { Profile } from "./page";
import { apiFetch } from "@/lib/api";
// upload helpers are dynamically imported to avoid tree-shaking/SSR issues
import { profileFormUiToApi } from '@/lib/mappers/profile';
import { toE164TR, splitE164TR } from '@/utils/phone';
// Gender utilities removed - using direct API enum values
import { ddmmyyyyToISO, isoToDDMMYYYY } from '@/utils/date';
import { toInt } from '@/utils/num';
import { ProfileHeader } from "@/components/ProfileAvatar";
import { toast } from "@/components/ui/toast";

/* ---------- shared helpers ---------- */
const SPECIALTY_OPTIONS = ["Oyunculuk", "Tiyatro", "Modellik", "Müzik", "Dans", "Dublaj"];
const uniq = (xs?: string[] | null) => Array.from(new Set(xs ?? []));
const digits = (s: string) => (s ?? "").replace(/\D+/g, "");
const toTitleTR = (s: string) =>
  (s ?? "")
    .toLocaleLowerCase("tr-TR")
    .split(/\s+/)
    .filter(Boolean)
    .map((w) => w.charAt(0).toLocaleUpperCase("tr-TR") + w.slice(1))
    .join(" ");
const formatTRPhone = (raw10: string) => {
  const d = digits(raw10).slice(0, 10);
  const p: string[] = [];
  if (d.length > 0) p.push(d.slice(0, 3));
  if (d.length > 3) p.push(d.slice(3, 6));
  if (d.length > 6) p.push(d.slice(6, 8));
  if (d.length > 8) p.push(d.slice(8, 10));
  return p.join(" ");
};

// Convert Turkish phone digits to E.164 format (using imported function)
const toAbsoluteUrl = (u?: string | null) => {
  if (!u) return null;
  try {
    if (/^https?:\/\//i.test(u)) return u;
    if (typeof window !== "undefined") return new URL(u, window.location.origin).href;
    return u;
  } catch {
    return u;
  }
};
const extractAnyUrl = (text?: string | null) => {
  if (!text) return null;
  const m = text.match(/(https?:\/\/\S+|\/[^\s)]+)/i);
  return m?.[1] ?? null;
};
const stripCvLines = (text?: string | null) =>
  (text ?? "")
    .split(/\r?\n/)
    .filter((l) => !/^CV:\s*/i.test(l.trim()))
    .join("\n")
    .trim();
const filenameFromUrl = (u?: string | null) => {
  if (!u) return "";
  try {
    const abs = toAbsoluteUrl(u) ?? u;
    const path = abs.split("?")[0].split("#")[0];
    const name = path.split("/").pop() ?? "";
    return decodeURIComponent(name);
  } catch {
    return "";
  }
};
const translateRole = (r?: string | null) =>
  ((r ?? "").toUpperCase() === "TALENT" ? "YETENEK" : r ?? "");
const isMinorByDate = (iso?: string) => {
  if (!iso) return false;
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return false;
  const now = new Date();
  const age =
    now.getFullYear() -
    d.getFullYear() -
    (now < new Date(now.getFullYear(), d.getMonth(), d.getDate()) ? 1 : 0);
  return age < 18;
};

/* numeric helpers (UField dışı) */
const numericOnly = (e: React.FormEvent<HTMLInputElement>) => {
  e.currentTarget.value = e.currentTarget.value.replace(/\D+/g, "");
};
const blockNonDigitKeys = (e: React.KeyboardEvent<HTMLInputElement>) => {
  const allowed = ["Backspace", "Delete", "ArrowLeft", "ArrowRight", "Tab", "Home", "End"];
  if (allowed.includes(e.key)) return;
  if (!/^\d$/.test(e.key)) e.preventDefault();
};

/* ---------- UField: her zaman controlled + memo ---------- */
const UField = React.memo(function UField({
  label,
  type = "text",
  inputRef,
  disabled = false,
  placeholder,
  value,
  onValueChange,
  onBlur,
  onChange,
  min,
  max,
  readOnly,
  description,
  error,
}: {
  label: string;
  type?: string;
  inputRef: React.RefObject<HTMLInputElement>;
  disabled?: boolean;
  placeholder?: string;
  value?: string | number;
  onValueChange?: (v: string) => void;
  onBlur?: (e: React.FormEvent<HTMLInputElement>) => void;
  onChange?: (e: React.FormEvent<HTMLInputElement>) => void;
  min?: number;
  max?: number;
  readOnly?: boolean;
  description?: string;
  error?: string;
}) {
  // Safe value binding - always use form state, never data directly
  const controlledValue = value == null ? "" : String(value);
  return (
    <div>
      <div className="text-sm font-medium text-slate-700 mb-1">{label}</div>
      <input
        ref={inputRef}
        type={type}
        placeholder={placeholder || " "}
        autoComplete="off"
        disabled={disabled}
        readOnly={readOnly}
        value={controlledValue}
        onBlur={onBlur}
        onChange={(e) => {
          onChange?.(e);
          onValueChange?.(e.currentTarget.value);
        }}
        onInput={type === "number" ? numericOnly : undefined}
        onKeyDown={type === "number" ? blockNonDigitKeys : undefined}
        inputMode={type === "number" ? "numeric" : undefined}
        pattern={type === "number" ? "[0-9]*" : undefined}
        min={min}
        max={max}
        className={`w-full rounded-lg px-3 py-2 ring-1 bg-white ${
          disabled || readOnly ? "ring-neutral-200/70 bg-slate-50 cursor-not-allowed text-slate-800" : "ring-neutral-300 focus:outline-none focus:ring-2"
        }`}
      />
      {/* yardımcı yazılar için sabit yükseklik */}
      <div className="mt-1 min-h-[16px] leading-4">
        {/* hata varsa hata, yoksa açıklama */}
        {error ? (
          <p className="text-xs text-red-600">{error}</p>
        ) : description ? (
          <p className="text-xs text-slate-500">{description}</p>
        ) : null}
      </div>
    </div>
  );
});

/* ---------- tipler ---------- */
type ApiGender = 'MALE' | 'FEMALE';

type Form = {
  firstName: string;
  lastName: string;
  city: string;
  gender?: ApiGender;
  birthDate?: string;          // 'YYYY-MM-DD' (ISO-10)
  heightCm?: string;
  weightKg?: string;
  phoneDigits: string;
  bio: string;
  experience: string;
  resumeUrl: string | null;
  cvRemoved: boolean;
};

type GuardianState = {
  fullName: string;
  relation: "Anne" | "Baba" | "Vasi" | "Diğer" | "";
  phoneDigits: string; // +90 hariç 10 hane
  email: string;
  consent?: boolean;
};

export default function ProfileClient({
  initialProfile,
  theme,
  onSaved,
  onDemandRefetch,
  isValidating = false,
}: {
  initialProfile: Profile;
  theme: { light: string; dark: string; black: string };
  onSaved?: (fresh: Profile) => void;
  onDemandRefetch?: () => Promise<void>;
  isValidating?: boolean;
}) {
  const { data: session } = useSession();

  /* ---------- editing state ---------- */
  const [editing, setEditing] = React.useState(false);

  const handleEdit = () => {
    setEditing(true);
    setTimeout(() => firstNameRef.current?.focus(), 0);
  };
  const handleCancel = () => {
    setEditing(false);
    // Formu eski haline döndür
    setForm({
      firstName: defaults.firstName,
      lastName: defaults.lastName,
      city: defaults.city,
      gender: defaults.gender as ApiGender | undefined,
      birthDate: defaults.birth || undefined,
      heightCm: defaults.height ? String(defaults.height) : undefined,
      weightKg: defaults.weight ? String(defaults.weight) : undefined,
      phoneDigits: digits(defaults.phoneFmt).slice(-10),
      bio: defaults.bio,
      experience: defaults.exp,
      resumeUrl: cvUrl,
      cvRemoved: false,
    });
    setPhotoUrl(initialProfile.profilePhotoUrl ?? null);
  };

  /* ---------- header state ---------- */
  const [photoUrl, setPhotoUrl] = React.useState(initialProfile.profilePhotoUrl ?? null);
  const [status, setStatus] = React.useState(initialProfile.status ?? "Aktif");
  const [role] = React.useState((initialProfile.role as any) ?? "TALENT");
  const [selectedSpecs, setSelectedSpecs] = React.useState<string[]>(
    uniq(initialProfile.professional?.specialties) || [],
  );
  const [cvUrl, setCvUrl] = React.useState<string | null>(
    initialProfile.professional?.cvUrl ??
      extractAnyUrl(initialProfile.professional?.experience) ??
      null,
  );
  const [cvUploading, setCvUploading] = React.useState(false);

  /* ---------- refs ---------- */
  const firstNameRef = React.useRef<HTMLInputElement>(null);
  const lastNameRef = React.useRef<HTMLInputElement>(null);
  const emailRef = React.useRef<HTMLInputElement>(null);
  const cityRef = React.useRef<HTMLInputElement>(null);
  const genderRef = React.useRef<HTMLSelectElement>(null);
  const birthRef = React.useRef<HTMLInputElement>(null);
  const heightRef = React.useRef<HTMLInputElement>(null);
  const weightRef = React.useRef<HTMLInputElement>(null);

  /* ---------- guardian ---------- */
  const [isMinor, setIsMinor] = React.useState(isMinorByDate(initialProfile.personal?.birthDate || undefined));
  const initialGuardianPhoneDigits = digits(initialProfile.personal?.guardian?.phone ?? "").slice(
    -10,
  );
  const [guardian, setGuardian] = React.useState<GuardianState>({
    fullName: initialProfile.personal?.guardian?.fullName ?? "",
    relation: (initialProfile.personal?.guardian?.relation as any) ?? "",
    phoneDigits: initialGuardianPhoneDigits,
    email: (initialProfile.personal?.guardian?.email as any) ?? "",
    consent:
      typeof initialProfile.personal?.guardian?.consent === "boolean"
        ? (initialProfile.personal?.guardian?.consent as boolean)
        : typeof initialProfile.personal?.guardian?.consentAccepted === "boolean"
        ? (initialProfile.personal?.guardian?.consentAccepted as boolean)
        : undefined,
  });

  // Update guardian state when profile data changes
  React.useEffect(() => {
    const guardianData = initialProfile.personal?.guardian;
    if (guardianData) {
      const phoneDigits = digits(guardianData.phone ?? "").slice(-10);
      setGuardian({
        fullName: guardianData.fullName ?? "",
        relation: (guardianData.relation as any) ?? "",
        phoneDigits: phoneDigits,
        email: (guardianData.email as any) ?? "",
        consent:
          typeof guardianData.consent === "boolean"
            ? guardianData.consent
            : typeof guardianData.consentAccepted === "boolean"
            ? guardianData.consentAccepted
            : undefined,
      });
    }
  }, [initialProfile.personal?.guardian]);

  /* ---------- defaults ---------- */
  const initialDigitsFromDb = (() => {
    const d = digits(initialProfile.phone ?? "");
    return d.length >= 10 ? d.slice(-10) : d;
  })();

  const [saving, setSaving] = React.useState(false);
  const [msg, setMsg] = React.useState<string | null>(null);

  const defaults = React.useMemo(
    () => ({
      firstName: toTitleTR(initialProfile.firstName ?? ""),
      lastName: toTitleTR(initialProfile.lastName ?? ""),
      email: initialProfile.email ?? "",
      city: toTitleTR(initialProfile.personal?.city ?? ""),
      gender: initialProfile.personal?.gender as 'MALE' | 'FEMALE' | undefined,
      birth: initialProfile.personal?.birthDate ?? "",
      height: initialProfile.personal?.heightCm ?? "",
      weight: initialProfile.personal?.weightKg ?? "",
      phoneFmt: formatTRPhone(initialDigitsFromDb),
      bio: initialProfile.professional?.bio ?? "",
      exp: stripCvLines(initialProfile.professional?.experience),
    }),
    [initialProfile, initialDigitsFromDb],
  );

  /* ---------- form (tek kaynak, controlled) ---------- */
  const [form, setForm] = React.useState<Form>({
    firstName: defaults.firstName,
    lastName: defaults.lastName,
    city: defaults.city,
    gender: defaults.gender as ApiGender | undefined,
    birthDate: defaults.birth || undefined,
    heightCm: defaults.height ? String(defaults.height) : undefined,
    weightKg: defaults.weight ? String(defaults.weight) : undefined,
    phoneDigits: digits(defaults.phoneFmt).slice(-10),
    bio: defaults.bio,
    experience: defaults.exp,
    resumeUrl: cvUrl,
    cvRemoved: false,
  });

  // defaults değişirse (ör. rehydrate) formu bir kez senkronla
  React.useEffect(() => {
    // CRITICAL: Don't reset form if data is undefined during revalidation
    if (!initialProfile) {
      console.debug('[ProfileClient] Skipping form update - no profile data');
      return;
    }

    console.debug('[ProfileClient] Updating form with new data:', {
      firstName: defaults.firstName,
      lastName: defaults.lastName,
      city: defaults.city,
      gender: defaults.gender,
      birth: defaults.birth,
      height: defaults.height,
      weight: defaults.weight,
      bio: defaults.bio,
      exp: defaults.exp,
    });
    
    setForm({
      firstName: toTitleTR(defaults.firstName),
      lastName: toTitleTR(defaults.lastName),
      city: toTitleTR(defaults.city),
      gender: defaults.gender as ApiGender | undefined,
      birthDate: defaults.birth || undefined,
      heightCm: defaults.height ? String(defaults.height) : undefined,
      weightKg: defaults.weight ? String(defaults.weight) : undefined,
      phoneDigits: digits(defaults.phoneFmt).slice(-10),
      bio: defaults.bio,
      experience: defaults.exp,
      resumeUrl: cvUrl,
      cvRemoved: false,
    });
    
    // Specialty chips'leri de güncelle
    const specialties = uniq(initialProfile.professional?.specialties) || [];
    // Eğer API'den gelen specialties boşsa, varsayılan olarak bazı örnekler ekle
    if (specialties.length === 0 && initialProfile.professional?.bio) {
      // Eğer bio varsa, içinden specialty çıkarmaya çalış
      const bioText = initialProfile.professional.bio.toLowerCase();
      const detectedSpecs = SPECIALTY_OPTIONS.filter(opt => 
        bioText.includes(opt.toLowerCase())
      );
      setSelectedSpecs(detectedSpecs);
    } else {
      setSelectedSpecs(specialties);
    }
  }, [defaults, initialProfile]);

  // Update form when initialProfile changes (after refetch)
  React.useEffect(() => {
    // CRITICAL: Don't reset form if data is undefined during revalidation
    if (!initialProfile) {
      console.debug('[ProfileClient] Skipping form update - no profile data');
      return;
    }

    console.debug('[ProfileClient] Initial profile changed, updating form:', {
      gender: initialProfile.personal?.gender,
      birthDate: initialProfile.personal?.birthDate,
    });
    
    setForm(f => ({
      ...f,
      gender: initialProfile.personal?.gender as ApiGender | undefined,
      birthDate: initialProfile.personal?.birthDate || undefined,
      heightCm: initialProfile.personal?.heightCm?.toString() ?? undefined,
      weightKg: initialProfile.personal?.weightKg?.toString() ?? undefined,
    }));
  }, [initialProfile]);

  /* başlık bilgileri (gereksiz bağımlılık yok) */
  const displayName = React.useMemo(() => {
    const n = `${form.firstName} ${form.lastName}`.trim();
    return n || "Ad Soyad";
  }, [form.firstName, form.lastName]);

  const initials = React.useMemo(() => {
    const f = (form.firstName || "").charAt(0);
    const l = (form.lastName || "").charAt(0);
    return ((f + l) || "YP").toUpperCase();
  }, [form.firstName, form.lastName]);

  /* fotoğraf */
  async function handlePhotoChange(file?: File) {
    if (!file) return;
    try {
      const mod: any = await import("@/lib/upload");
      const { fileUrl } = await mod.uploadWithPresigned(file, 'avatar');
      
      // API already returns the full public URL
      setPhotoUrl(fileUrl);
      setMsg("Fotoğraf yüklendi.");
      toast.success('Fotoğraf yüklendi');
    } catch (e: any) {
      let errorMsg = 'Bilinmeyen hata';
      if (e?.body) {
        try {
          const parsed = JSON.parse(e.body);
          errorMsg = parsed.message || parsed.error || e.body;
        } catch {
          errorMsg = e.body;
        }
      } else if (e?.message) {
        errorMsg = e.message;
      }
      setMsg("Fotoğraf yüklenemedi.");
      toast.error(`Fotoğraf yüklenemedi: ${errorMsg}`);
    }
  }
  function removePhoto() {
    if (!editing) return;
    setPhotoUrl(null);
    setMsg("Fotoğraf kaldırıldı.");
  }

  /* CV */
  async function handleCvSelect(file?: File) {
    if (!file) return;
    if (file.size > 5 * 1024 * 1024) {
      setMsg("CV yüklenemedi: Dosya boyutu 5 MB'ı aşamaz.");
      toast.error('CV yüklenemedi', "Dosya boyutu 5 MB'ı aşamaz.");
      return;
    }
    setCvUploading(true);
    try {
      const mod: any = await import("@/lib/upload");
      const { fileUrl } = await mod.uploadWithPresigned(file, 'cv');
      
      // API already returns the full public URL
      setCvUrl(fileUrl);
      setForm(prev => ({ ...prev, resumeUrl: fileUrl, cvRemoved: false }));
      setMsg("CV yüklendi.");
      toast.success('CV yüklendi');
    } catch (e: any) {
      let errorMsg = 'Bilinmeyen hata';
      if (e?.body) {
        try {
          const parsed = JSON.parse(e.body);
          errorMsg = parsed.message || parsed.error || e.body;
        } catch {
          errorMsg = e.body;
        }
      } else if (e?.message) {
        errorMsg = e.message;
      }
      setMsg("CV yüklenemedi.");
      toast.error(`CV yüklenemedi: ${errorMsg}`);
    } finally {
      setCvUploading(false);
    }
  }

  /* doğrulama */
  function validateGuardian(): string | null {
    if (!isMinor) return null;
    if (!guardian.fullName.trim()) return "Veli/Vasi adı zorunludur.";
    if (!guardian.relation) return "Yakınlık seçiniz.";
    if (guardian.phoneDigits.length !== 10) return "Veli/Vasi telefon +90 hariç 10 hane olmalı.";
    return null;
  }

  // Birleşik user+talent verisini Profile tipine dönüştür
  function mapCombinedToProfile(input: any): Profile {
    const data = input || {};
    
    // Use the new mapper to convert API data to UI format
    const { apiToUi } = require('@/lib/mappers/profile');
    const uiData = apiToUi(data);
    
    const guardian = data.guardian || data.personal?.guardian || null;
    
    return {
      firstName: uiData.firstName || '',
      lastName: uiData.lastName || '',
      email: uiData.email || data.email || '',
      phone: uiData.phone || '',
      role: data.role || null,
      status: data.status || null,
      company: data.company || null,
      profilePhotoUrl: uiData.profilePhotoUrl || null,
      professional: {
        specialties: uiData.specialties || [],
        bio: uiData.bio || '',
        experience: uiData.experience || '',
        cvUrl: uiData.cvUrl || null,
      },
      personal: {
        city: uiData.city || '',
        birthDate: uiData.birthDate || null,
        gender: uiData.gender === 'male' ? 'MALE' : uiData.gender === 'female' ? 'FEMALE' : uiData.gender === 'other' ? 'OTHER' : '', // Convert UI format to form format
        heightCm: uiData.heightCm || undefined,
        weightKg: uiData.weightKg || undefined,
        guardian: guardian
          ? {
              fullName: guardian.fullName || guardian.name || '',
              relation: guardian.relation || '',
              phone: guardian.phone || guardian.mobile || '',
              email: guardian.email || '',
              consent: guardian.consent || guardian.consentAccepted || false,
              consentAccepted: undefined,
            }
          : null,
      },
    } as Profile;
  }

  /* kaydet */
  async function handleSave() {
    if (saving) return;
    setSaving(true);
    setMsg(null);
    try {
      const gErr = validateGuardian();
      if (gErr) {
        setMsg(gErr);
        setSaving(false);
        return;
      }

      // Validation: firstName and lastName are required
      if (!form.firstName?.trim() || !form.lastName?.trim()) {
        setMsg("Ad ve Soyad zorunludur.");
        setSaving(false);
        return;
      }

      // Import the new API functions
      const { createTalentProfile, savePhone } = await import('@/lib/profile-map');

      // Prepare form data for the new mapper
      const formData = {
        firstName: form.firstName?.trim(),
        lastName: form.lastName?.trim(),
        city: form.city?.trim(),
        birthDate: form.birthDate, // Already in YYYY-MM-DD format
        gender: form.gender, // Keep as MALE/FEMALE (API format)
        heightCm: form.heightCm, // Pass as heightCm
        weightKg: form.weightKg, // Pass as weightKg
        bio: form.bio?.trim(),
        experience: form.experience?.trim(),
        specialties: selectedSpecs?.length ? selectedSpecs : [],
        profilePhotoUrl: photoUrl,
        cvUrl: form.resumeUrl,
      };

      console.log('[ProfileSave] Form data:', formData);

      // 1) Create/update profile using the new API
      const profileResult = await createTalentProfile(formData);

      // 2) Save phone data separately (if provided)
      if (form.phoneDigits && form.phoneDigits.length === 10) {
        try {
          await savePhone(form.phoneDigits);
        } catch (phoneError) {
          console.warn('Phone update failed, but profile was saved:', phoneError);
        }
      }

      // 3) Optimistic update and show success
      // Update the profile data immediately to prevent form clearing
      const updatedProfile = mapCombinedToProfile({
        ...initialProfile,
        firstName: form.firstName,
        lastName: form.lastName,
        personal: {
          ...initialProfile.personal,
          city: form.city,
          birthDate: form.birthDate,
          gender: form.gender,
          heightCm: form.heightCm ? Number(form.heightCm) : undefined,
          weightKg: form.weightKg ? Number(form.weightKg) : undefined,
        },
        professional: {
          ...initialProfile.professional,
          bio: form.bio,
          experience: form.experience,
          cvUrl: form.resumeUrl,
          specialties: selectedSpecs,
        },
        phone: form.phoneDigits ? `+90${form.phoneDigits}` : initialProfile.phone,
        profilePhotoUrl: photoUrl,
      });

      // Call onSaved with the updated profile for optimistic update
      onSaved?.(updatedProfile);
      
      toast.success('Profil başarıyla kaydedildi');
      setEditing(false);
      setMsg("Profil başarıyla kaydedildi.");
    } catch (error) {
      console.error('Profile save error:', error);
      let errorMsg = "Kaydetme sırasında hata oluştu.";
      
      // Handle different types of errors
      const errorMessage = String((error as any)?.message || '');
      
      if (errorMessage.includes('(401)')) {
        errorMsg = "Oturum süresi dolmuş. Lütfen tekrar giriş yapın.";
      } else if (errorMessage.includes('(404)')) {
        errorMsg = "Profil bulunamadı. Onboarding'i tamamlayın.";
      } else if (errorMessage.includes('(400)') || errorMessage.includes('VALIDATION_FAILED')) {
        errorMsg = "Lütfen alanları kontrol edin. " + errorMessage;
      } else if (errorMessage.includes('(500)') || errorMessage.includes('(502)') || errorMessage.includes('(503)')) {
        errorMsg = "Sunucu hatası. Lütfen daha sonra tekrar deneyin.";
      } else if ((error as any)?.body) {
        try {
          const parsed = JSON.parse((error as any).body);
          errorMsg = parsed.message || parsed.error || (error as any).body;
        } catch {
          errorMsg = (error as any).body;
        }
      } else if ((error as any)?.message) {
        errorMsg = (error as any).message;
      }
      
      setMsg(errorMsg);
      toast.error(`Profil kaydedilemedi: ${errorMsg}`);
    } finally {
      setSaving(false);
    }
  }


  /* ---------- UI ---------- */
  const toggleSpec = (name: string) =>
    setSelectedSpecs((prev) => (prev.includes(name) ? prev.filter((x) => x !== name) : [...prev, name]));
  const chips = selectedSpecs.slice(0, 6);

  return (
    <>
      {/* Üst profil özeti */}
      <section className="-mt-2 rounded-2xl bg-white border border-neutral-200/70 shadow-sm p-6 md:p-8">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-6">
          <div className="flex items-center gap-6">
            {/* avatar */}
            <ProfileHeader
              photoUrl={photoUrl}
              initials={initials}
              editing={editing}
              onChangePhoto={handlePhotoChange}
              onRemovePhoto={removePhoto}
            />

            <div>
              <h1 className="text-2xl md:text-3xl font-extrabold tracking-tight text-neutral-900">
                {displayName}
              </h1>
              <p className="opacity-80 mt-1 text-sm">
                {translateRole(role)}
                {initialProfile.company ? ` • ${initialProfile.company}` : ""}
              </p>

              {chips.length > 0 && (
                <div className="mt-2 flex flex-wrap gap-2">
                  {chips.map((c) => (
                    <span
                      key={c}
                      className="px-2.5 py-1 text-xs rounded-full"
                      style={{ border: `1px solid ${theme.dark}`, color: theme.dark, background: "#fff" }}
                    >
                      {c}
                    </span>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>

        {msg && (
          <div className="mt-4 text-sm px-3 py-2 rounded-lg ring-1 ring-yellow-500/30 bg-yellow-50 text-yellow-800">
            {msg}
          </div>
        )}
      </section>

      {/* grid */}
      <section className="mt-6 grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* sol */}
        <div className="lg:col-span-2 rounded-2xl bg-white border border-neutral-200/70 p-6">
          <h2 className="text-lg font-semibold mb-4">Kişisel Bilgiler</h2>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <UField
              label="Ad"
              inputRef={firstNameRef}
              disabled={!editing || saving || isValidating}
              value={form.firstName ?? ''}
              onValueChange={(v) => setForm((f) => ({ ...f, firstName: v }))}
              onBlur={() => setForm((f) => ({ ...f, firstName: toTitleTR(f.firstName) }))}
            />
            <UField
              label="Soyad"
              inputRef={lastNameRef}
              disabled={!editing || saving || isValidating}
              value={form.lastName ?? ''}
              onValueChange={(v) => setForm((f) => ({ ...f, lastName: v }))}
              onBlur={() => setForm((f) => ({ ...f, lastName: toTitleTR(f.lastName) }))}
            />

            <UField
              label="E-posta"
              inputRef={emailRef}
              disabled
              readOnly
              type="email"
              value={session?.user?.email ?? defaults.email}
              description="Bu alan giriş e-postanızdır; değiştirilemez."
            />

            {/* Telefon */}
            <div>
              <div className="text-sm font-medium text-slate-700 mb-1">Telefon</div>
              <div
                className={`flex rounded-lg ring-1 ${
                  editing ? "ring-neutral-300" : "ring-neutral-200/70"
                } bg-white`}
              >
                <span className="select-none px-3 py-2 bg-neutral-50 text-neutral-700 rounded-l-lg border-r border-neutral-200/70">
                  +90
                </span>
                <input
                  disabled={!editing || saving || isValidating}
                  inputMode="numeric"
                  pattern="[0-9]*"
                  placeholder="5xx xxx xx xx"
                  value={formatTRPhone(form.phoneDigits)}
                  onChange={(e) => {
                    const val = e.currentTarget.value;
                    const onlyDigits = digits(val).slice(0, 10);
                    setForm((f) => ({ ...f, phoneDigits: onlyDigits }));
                  }}
                  onKeyDown={blockNonDigitKeys}
                  className="flex-1 rounded-r-lg px-3 py-2 outline-none"
                />
              </div>
            </div>

            <UField
              label="Şehir"
              inputRef={cityRef}
              disabled={!editing || saving || isValidating}
              value={form.city ?? ''}
              onValueChange={(v) => setForm((f) => ({ ...f, city: v }))}
              onBlur={() => setForm((f) => ({ ...f, city: toTitleTR(f.city) }))}
            />

            {/* Cinsiyet */}
            <div>
              <div className="text-sm font-medium text-slate-700 mb-1">Cinsiyet</div>
              <select
                ref={genderRef}
                value={form.gender ?? ''}
                onChange={(e) =>
                  setForm(f => ({ ...f, gender: (e.target.value || undefined) as ApiGender | undefined }))
                }
                disabled={!editing || saving || isValidating}
                className={`w-full rounded-lg px-3 py-2 ring-1 bg-white ${
                  editing && !saving && !isValidating ? "ring-neutral-300 focus:outline-none focus:ring-2" : "ring-neutral-200/70"
                }`}
              >
                <option value="">Seçin</option>
                <option value="MALE">Erkek</option>
                <option value="FEMALE">Kadın</option>
              </select>
            </div>

            <UField
              label="Doğum Tarihi"
              inputRef={birthRef}
              disabled={!editing || saving || isValidating}
              type="date"
              value={form.birthDate ?? ''}
              onValueChange={(v) => {
                setForm(f => ({ ...f, birthDate: v || undefined }));
                setIsMinor(isMinorByDate(v));
              }}
              description="Doğum tarihinizi seçiniz."
            />
            <UField
              label="Boy (cm)"
              inputRef={heightRef}
              disabled={!editing || saving || isValidating}
              type="number"
              value={form.heightCm ?? ''}
              onValueChange={(v) => setForm((f) => ({ ...f, heightCm: v.replace(/\D+/g, "") }))}
              min={100}
              max={250}
            />
            <UField
              label="Kilo (kg)"
              inputRef={weightRef}
              disabled={!editing || saving || isValidating}
              type="number"
              value={form.weightKg ?? ''}
              onValueChange={(v) => setForm((f) => ({ ...f, weightKg: v.replace(/\D+/g, "") }))}
              min={20}
              max={250}
            />
          </div>

          {/* 18 yaş altı */}
          {isMinor && (
            <div
              className="guardian-card mt-6 rounded-xl p-4 ring-1"
              style={{ backgroundColor: "#fff7ed", borderColor: "#fdba74" }}
            >
              <div className="guardian-title mb-2">18 yaş altı — Veli/Vasi Bilgileri (Zorunlu)</div>
              <p className="guardian-desc mb-4">
                18 yaş altı kullanıcılarımız için ebeveyn/yasal vasi bilgileri zorunludur.
              </p>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <div className="text-sm font-medium text-slate-700 mb-1">Veli/Vasi Ad Soyad</div>
                  <input
                    type="text"
                    value={guardian.fullName}
                    placeholder=" "
                    onChange={(e) => {
                      const val = e.currentTarget.value;
                      setGuardian((p) => ({ ...p, fullName: val }));
                    }}
                    onBlur={(e) => {
                      const val = toTitleTR(e.currentTarget.value);
                      setGuardian((p) => ({ ...p, fullName: val }));
                    }}
                    disabled={!editing}
                    className={`w-full rounded-lg px-3 py-2 ring-1 bg-white ${
                      editing ? "ring-neutral-300 focus:outline-none focus:ring-2" : "ring-neutral-200/70"
                    }`}
                  />
                </div>

                <div>
                  <div className="text-sm font-medium text-slate-700 mb-1">Yakınlık</div>
                  <select
                    value={guardian.relation}
                    onChange={(e) => {
                      const val = (e.currentTarget.value || "") as any;
                      setGuardian((p) => ({ ...p, relation: val }));
                    }}
                    disabled={!editing}
                    className={`w-full rounded-lg px-3 py-2 ring-1 bg-white ${
                      editing ? "ring-neutral-300 focus:outline-none focus:ring-2" : "ring-neutral-200/70"
                    }`}
                  >
                    <option value="">Seçiniz</option>
                    <option value="Anne">Anne</option>
                    <option value="Baba">Baba</option>
                    <option value="Vasi">Vasi</option>
                    <option value="Diğer">Diğer</option>
                  </select>
                </div>

                <div>
                  <div className="text-sm font-medium text-slate-700 mb-1">Veli/Vasi Telefon</div>
                  <div
                    className={`flex rounded-lg ring-1 ${
                      editing ? "ring-neutral-300" : "ring-neutral-200/70"
                    } bg-white`}
                  >
                    <span className="select-none px-3 py-2 bg-neutral-50 text-neutral-700 rounded-l-lg border-r border-neutral-200/70">
                      +90
                    </span>
                    <input
                      value={formatTRPhone(guardian.phoneDigits)}
                      onChange={(e) => {
                        const d = digits(e.currentTarget.value).slice(0, 10);
                        setGuardian((p) => ({ ...p, phoneDigits: d }));
                      }}
                      inputMode="numeric"
                      pattern="[0-9]*"
                      placeholder="5xx xxx xx xx"
                      disabled={!editing}
                      className="flex-1 rounded-r-lg px-3 py-2 outline-none"
                    />
                  </div>
                </div>

                <div>
                  <div className="text-sm font-medium text-slate-700 mb-1">Veli/Vasi E-posta (opsiyonel)</div>
                  <input
                    type="email"
                    value={guardian.email}
                    placeholder=" "
                    onChange={(e) => {
                      const val = e.currentTarget.value;
                      setGuardian((p) => ({ ...p, email: val }));
                    }}
                    onBlur={(e) => {
                      const val = e.currentTarget.value.trim();
                      setGuardian((p) => ({ ...p, email: val }));
                    }}
                    disabled={!editing}
                    className={`w-full rounded-lg px-3 py-2 ring-1 bg-white ${
                      editing ? "ring-neutral-300 focus:outline-none focus:ring-2" : "ring-neutral-200/70"
                    }`}
                  />
                </div>
              </div>
            </div>
          )}

          <div className="my-6 h-px bg-neutral-200/70" />

          <div>
            <div className="text-sm font-medium text-slate-700 mb-1">Biyografi</div>
            <textarea
              disabled={!editing || saving || isValidating}
              value={form.bio ?? ''}
              placeholder=" "
              onChange={(e) => {
                const val = e.currentTarget.value; // event pooling'e takılmamak için önce al
                setForm((f) => ({ ...f, bio: val }));
              }}
              className={`w-full rounded-lg px-3 py-2 ring-1 bg-white min-h-[80px] ${
                editing && !saving && !isValidating ? "ring-neutral-300 focus:outline-none focus:ring-2" : "ring-neutral-200/70"
              }`}
            />
          </div>

          <div className="mt-4">
            <div className="text-sm font-medium text-slate-700 mb-1">Deneyim</div>
            <textarea
              disabled={!editing || saving || isValidating}
              value={form.experience ?? ''}
              placeholder=" "
              onChange={(e) => {
                const val = e.currentTarget.value; // event pooling'e takılmamak için önce al
                setForm((f) => ({ ...f, experience: val }));
              }}
              className={`w-full rounded-lg px-3 py-2 ring-1 bg-white min-h-[80px] ${
                editing && !saving && !isValidating ? "ring-neutral-300 focus:outline-none focus:ring-2" : "ring-neutral-200/70"
              }`}
            />
            <div className="mt-3 flex flex-wrap items-center gap-3">
              <label
                className={`cursor-pointer rounded-lg px-3 py-2 text-sm ring-1 ring-neutral-300 bg-white ${
                  !editing || cvUploading || saving || isValidating ? "opacity-60 pointer-events-none" : ""
                }`}
              >
                PDF Ekle (≤ 5 MB)
                <input
                  type="file"
                  accept="application/pdf"
                  className="hidden"
                  onChange={(e) => handleCvSelect(e.target.files?.[0] ?? undefined)}
                />
              </label>
              {form.resumeUrl && (
                <div className="mt-2">
                  <a
                    href={toAbsoluteUrl(form.resumeUrl) ?? "#"}
                    target="_blank"
                    rel="noopener noreferrer"
                    onClick={(e) => e.stopPropagation()}
                    className="text-blue-600 underline text-sm"
                    download
                  >
                    CV'yi görüntüle/indir
                  </a>
                  {editing && (
                    <button
                      type="button"
                      className="text-sm underline ml-3 text-red-600"
                      onClick={() => {
                        setCvUrl(null);
                        setForm((f) => ({ ...f, resumeUrl: null, cvRemoved: true, experience: stripCvLines(f.experience) }));
                      }}
                    >
                      Kaldır
                    </button>
                  )}
                </div>
              )}
            </div>
          </div>

          {/* Uzmanlık */}
          <div className="mt-6">
            <div className="text-lg font-semibold mb-2">Uzmanlık Alanları</div>
            {!editing ? (
              <div className="profile-specialties flex flex-wrap gap-2">
                {selectedSpecs.length === 0 ? (
                  <span className="text-sm opacity-70">Seçim yok.</span>
                ) : (
                  selectedSpecs.map((s) => (
                    <span key={s} className="px-2.5 py-1 text-xs rounded-full ring-1 ring-neutral-300">
                      {s}
                    </span>
                  ))
                )}
              </div>
            ) : (
              <div className="grid grid-cols-2 md:grid-cols-3 gap-y-2">
                {SPECIALTY_OPTIONS.map((opt) => {
                  const id = `spec-${opt}`;
                  const checked = selectedSpecs.includes(opt);
                  return (
                    <label key={opt} htmlFor={id} className="inline-flex items-center gap-2 cursor-pointer">
                      <input
                        id={id}
                        type="checkbox"
                        className="peer size-4"
                        checked={checked}
                        onChange={() => setSelectedSpecs((prev) => (prev.includes(opt) ? prev.filter((x) => x !== opt) : [...prev, opt]))}
                      />
                      <span className="chip-checkbox-label text-sm px-3 py-1 rounded-full border border-slate-200 bg-white">{opt}</span>
                    </label>
                  );
                })}
              </div>
            )}
          </div>
        </div>

        {/* sağ aksiyon kutusu */}
        <div className="space-y-6">
          <div className="rounded-2xl text-white p-6" style={{ backgroundColor: theme.dark }}>
            <div className="text-lg font-semibold">Profilini güçlendir</div>
            <p className="text-sm/6 opacity-90 mt-1">
              Biyografi ve deneyim alanlarını doldurarak seçilme şansını artır.
            </p>
            {isMinor && (
              <div className="mt-3 text-sm bg-white/10 rounded-md px-3 py-2">
                18 yaş altı kullanıcılar için <b>veli/vasi bilgileri</b> zorunludur.
              </div>
            )}

            {!editing ? (
              <button
                type="button"
                className="mt-4 rounded-xl bg-white text-neutral-900 px-3 py-2 text-sm"
                onClick={handleEdit}
              >
                Hemen Düzenle
              </button>
            ) : (
              <div className="mt-4 flex items-center gap-2">
                <button
                  type="button"
                  className="rounded-xl bg-white text-neutral-900 px-3 py-2 text-sm"
                  onClick={handleSave}
                  disabled={saving || isValidating}
                >
                  {saving ? "Kaydediliyor..." : isValidating ? "Doğrulanıyor..." : "Kaydet"}
                </button>
                <button
                  type="button"
                  className="rounded-xl px-3 py-2 text-sm bg-transparent ring-1 ring-white/70 text-white"
                  onClick={handleCancel}
                >
                  İptal
                </button>
              </div>
            )}
          </div>
        </div>
      </section>
    </>
  );
}

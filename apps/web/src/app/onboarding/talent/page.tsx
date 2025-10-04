"use client";

import React, { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ArrowLeft, ArrowRight, Check } from "lucide-react";
import { AuthGuard } from "@/components/auth/AuthGuard";
import RoleRequired from "@/components/auth/RoleRequired";
import AvatarInput from "@/components/AvatarInput";
import { DISCOVER_ROUTE } from "@/lib/routes";
import { guardApiUser } from "@/lib/api-guard";

/* ------------------------------------------------------------------ */
/* Tema / sabitler                                                     */
/* ------------------------------------------------------------------ */

const BRAND_PRIMARY = "#962901";
const BRAND_CREAM = "#F6E6C3";


const STEPS = [
  { id: 1, title: "Gizlilik Güvencesi", description: "Verileriniz nasıl korunuyor?" },
  { id: 2, title: "Hesap Bilgileri", description: "Temel bilgilerinizi tamamlayın" },
  { id: 3, title: "Kişisel Bilgiler", description: "Profil bilgilerinizi girin" },
  { id: 4, title: "Profesyonel Bilgiler", description: "Yetenek bilgilerinizi ekleyin" },
  { id: 5, title: "Tamamlandı", description: "Profiliniz hazır!" },
] as const;

/* ------------------------------------------------------------------ */
/* Tipler                                                              */
/* ------------------------------------------------------------------ */

type FormData = {
  // Step 2 - Account
  firstName: string;
  lastName: string;
  phone: string; // UI: "+90 5xx xxx xx xx"
  profilePhotoUrl: string | null;

  // Step 3 - Personal
  dateOfBirth: string; // YYYY-MM-DD
  gender: "" | "MALE" | "FEMALE" | "OTHER";
  city: string;
  height: string;
  weight: string;
  eyeColor: string;
  hairColor: string;

  // Minor / Guardian
  parentName: string;
  parentPhone: string; // UI: "+90 5xx xxx xx xx"
  guardianRelation: "" | "Anne" | "Baba" | "Vasi" | "Diğer";
  guardianEmail: string;
  guardianConsent: boolean;

  // Step 4 - Professional
  bio: string;
  experience: string;
  skills: string[];
  languages: string[];
  specialties: string[];
};

/* ------------------------------------------------------------------ */
/* Yardımcılar                                                         */
/* ------------------------------------------------------------------ */

const toTitleTR = (s: string) =>
  (s ?? "")
    .toLocaleLowerCase("tr-TR")
    .split(/\s+/)
    .filter(Boolean)
    .map((w) => w.charAt(0).toLocaleUpperCase("tr-TR") + w.slice(1))
    .join(" ");

const digits = (s: string) => (s ?? "").replace(/\D+/g, "");

/** UI içinde +90 yazsa da 10 haneli yerel kısmı döndürür */
const onlyLocal10 = (s: string) => {
  const d = digits(s);
  return d.startsWith("90") ? d.slice(2) : d;
};

const formatTRPhoneBlocks = (raw10: string) => {
  const d = digits(raw10).slice(0, 10);
  const p: string[] = [];
  if (d.length > 0) p.push(d.slice(0, 3));
  if (d.length > 3) p.push(d.slice(3, 6));
  if (d.length > 6) p.push(d.slice(6, 8));
  if (d.length > 8) p.push(d.slice(8, 10));
  return p.join(" ");
};

/** Sunucuya gönderilecek E.164 (+90XXXXXXXXXX) */
const toE164TR = (raw10: string) => {
  const d = digits(raw10).slice(0, 10);
  return d ? `+90${d}` : "";
};

const stripCvLines = (text: string) =>
  (text ?? "")
    .split(/\r?\n/)
    .filter((l) => !/^CV:\s*/i.test(l.trim()))
    .join("\n")
    .trim();

const filenameFromUrl = (u?: string | null) => {
  if (!u) return "";
  try {
    const path = u.split("?")[0].split("#")[0];
    const name = path.split("/").pop() ?? "";
    return decodeURIComponent(name);
  } catch {
    return "";
  }
};

const normalizeGender = (g: any): "" | "MALE" | "FEMALE" => {
  const v = (g ?? "").toString().trim().toLowerCase();
  if (["erkek", "e", "m", "male", "man", "bay"].includes(v)) return "MALE";
  if (["kadın", "kadin", "k", "f", "female", "woman", "bayan"].includes(v)) return "FEMALE";
  return "";
};

const getAge = (isoDate: string) => {
  if (!isoDate) return NaN;
  const dob = new Date(isoDate + "T00:00:00");
  if (isNaN(dob.getTime())) return NaN;
  const today = new Date();
  let age = today.getFullYear() - dob.getFullYear();
  const m = today.getMonth() - dob.getMonth();
  if (m < 0 || (m === 0 && today.getDate() < dob.getDate())) age--;
  return age;
};

/* Derin birleştirme: update içerisindeki değerler baz alınır, undefined göndermez. */
function deepMerge<T extends Record<string, any>>(base: T, update: Partial<T>): T {
  const out: any = Array.isArray(base) ? [...(base as any)] : { ...base };
  for (const key of Object.keys(update)) {
    const u = (update as any)[key];
    const b = (base as any)?.[key];
    if (u === undefined) continue;
    if (u && typeof u === "object" && !Array.isArray(u) && b && typeof b === "object" && !Array.isArray(b)) {
      out[key] = deepMerge(b, u);
    } else {
      out[key] = u;
    }
  }
  return out;
}

/* Sadece API’nin kabul etmesi muhtemel alanları bırak */
function pickProfileShape(src: any) {
  const clean: any = {};
  if ("firstName" in src) clean.firstName = src.firstName;
  if ("lastName" in src) clean.lastName = src.lastName;
  if ("phone" in src) clean.phone = src.phone;
  if ("profilePhotoUrl" in src) clean.profilePhotoUrl = src.profilePhotoUrl;
  if ("personal" in src) clean.personal = src.personal;
  if ("professional" in src) clean.professional = src.professional;
  if ("isPublic" in src) clean.isPublic = src.isPublic;
  if ("is_public" in src) clean.is_public = src.is_public;
  return clean;
}

/* ------------------------------------------------------------------ */
/* Ana içerik                                                          */
/* ------------------------------------------------------------------ */

function TalentOnboardingContent() {
  const router = useRouter();

  const [currentStep, setCurrentStep] = useState(1);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);

  // Guard: Check session sync on page load
  useEffect(() => {
    guardApiUser().catch((e) => {
      console.warn(e.message);
      // Optionally show toast: "Oturum yenilendi, lütfen tekrar deneyin."
    });
  }, []);

  const [cvUrl, setCvUrl] = useState<string | null>(null);
  const [cvUploading, setCvUploading] = useState(false);

  const [formData, setFormData] = useState<FormData | null>(null);
  const initializedRef = React.useRef(false);

  // Safe form data for controlled inputs - prevents undefined errors
  const safeFormData = formData ?? {
    // Step 2
    firstName: "",
    lastName: "",
    phone: "",
    profilePhotoUrl: null,
    // Step 3
    dateOfBirth: "",
    gender: "",
    city: "",
    height: "",
    weight: "",
    eyeColor: "",
    hairColor: "",
    // Minor / Guardian
    parentName: "",
    parentPhone: "",
    guardianRelation: "",
    guardianEmail: "",
    guardianConsent: false,
    // Step 4
    bio: "",
    experience: "",
    skills: [],
    languages: [],
    specialties: [],
  };


  useEffect(() => {
    let alive = true;
    (async () => {
      try {
        const { fetchCombined } = await import('@/helpers/onboarding-map');
        const ui = await fetchCombined();
        if (!alive || initializedRef.current) return;
        
        // Map UI data to form structure
        const newFormData = {
          // Step 2 - Account
          firstName: ui.firstName,
          lastName: ui.lastName,
          phone: ui.phoneCountry + " " + (await import('@/helpers/onboarding-map')).formatTRPhoneBlocks(ui.phoneDigits),
          profilePhotoUrl: ui.photoUrl ?? null,
          
          // Step 3 - Personal
          dateOfBirth: ui.birthDate ? ui.birthDate.split('.').reverse().join('-') : "",
          gender: ui.gender,
          city: ui.city,
          height: ui.height,
          weight: ui.weight,
          eyeColor: "",
          hairColor: "",
          
          // Guardian data
          parentName: ui.parentName,
          parentPhone: ui.parentPhone,
          guardianRelation: ui.guardianRelation,
          guardianEmail: ui.guardianEmail,
          guardianConsent: ui.guardianConsent,
          
          // Step 4 - Professional
          bio: ui.bio,
          experience: stripCvLines(ui.experience),
          skills: [],
          languages: [],
          specialties: ui.specialties,
        };

        setFormData(newFormData); // << Yalnızca ilk kez doldur
        initializedRef.current = true;
        
        // Extract CV URL from experience
        const m = (ui.experience ?? "").match(/(https?:\/\/\S+\.pdf)/i);
        setCvUrl(m?.[1] ?? null);

        console.log("[ONBOARDING] Loaded profile data:", {
          firstName: newFormData.firstName,
          lastName: newFormData.lastName,
          phone: newFormData.phone,
          city: newFormData.city,
          birthDate: newFormData.dateOfBirth,
          gender: newFormData.gender,
          heightCm: newFormData.height,
          weightKg: newFormData.weight,
          bio: newFormData.bio,
          specialties: newFormData.specialties
        });
      } catch (error) {
        console.error("[ONBOARDING] Profile load error:", error);
        // Hata durumunda boş form ile devam et
      } finally {
        if (alive) setLoading(false);
      }
    })();
    return () => { alive = false; };
  }, []);

  /* -------------------------------------------------------------- */
  /* Minor kontrolü                                                 */
  /* -------------------------------------------------------------- */

  const age = useMemo(() => getAge(safeFormData.dateOfBirth), [safeFormData.dateOfBirth]);
  const isMinor = useMemo(() => Number.isFinite(age) && age < 18, [age]);

  /* -------------------------------------------------------------- */
  /* Input yardımcıları                                              */
  /* -------------------------------------------------------------- */

  const onBlurTitleCase = (key: "firstName" | "lastName" | "city") => {
    setFormData((d) => ({ ...(d ?? safeFormData), [key]: toTitleTR(safeFormData[key] as string) }));
  };

  // User phone (UI)
  const phoneDigits = useMemo(() => onlyLocal10(safeFormData.phone).slice(0, 10), [safeFormData.phone]);
  const phoneBlocks = useMemo(() => formatTRPhoneBlocks(phoneDigits), [phoneDigits]);

  const onPhoneInput = (val: string) => {
    const d = digits(val).slice(0, 10);
    const fmt = formatTRPhoneBlocks(d);
    setFormData((f) => ({ ...(f ?? safeFormData), phone: d ? `+90 ${fmt}` : "" }));
  };

  // Guardian phone (UI)
  const parentPhoneDigits = useMemo(
    () => onlyLocal10(safeFormData.parentPhone).slice(0, 10),
    [safeFormData.parentPhone]
  );
  const parentPhoneBlocks = useMemo(
    () => formatTRPhoneBlocks(parentPhoneDigits),
    [parentPhoneDigits]
  );

  const onParentPhoneInput = (val: string) => {
    const d = digits(val).slice(0, 10);
    const fmt = formatTRPhoneBlocks(d);
    setFormData((f) => ({ ...(f ?? safeFormData), parentPhone: d ? `+90 ${fmt}` : "" }));
  };

  /* -------------------------------------------------------------- */
  /* KISMİ (STEP-BAZLI) KAYDETME                                    */
  /* -------------------------------------------------------------- */

  type Scope = "account" | "personal" | "professional";
  const addIf = (obj: Record<string, any>, key: string, value: any) => {
    if (
      value !== undefined &&
      value !== null &&
      !(typeof value === "string" && value.trim() === "") &&
      !(Array.isArray(value) && value.length === 0)
    ) {
      obj[key] = value;
    }
  };

  async function upsertProfile(payload: any) {
    const headers = { "Content-Type": "application/json" };

    // 1) Kullanıcı temel bilgileri varsa önce /users/me PATCH et
    const userPatch: Record<string, any> = {};
    for (const k of ["firstName", "lastName", "phone", "profilePhotoUrl"]) {
      if (payload[k] !== undefined) userPatch[k] = payload[k];
    }
    if (Object.keys(userPatch).length) {
      const r = await fetch("/api/proxy/api/v1/users/me", {
        method: "PATCH",
        headers,
        body: JSON.stringify(userPatch),
        credentials: 'include',
      });
      if (!r.ok) return false;
    }

    // 2) Talent profil alanları varsa profile uçları üzerinden gönder
    const talentPayload: Record<string, any> = {};
    for (const k of ["personal", "professional"]) {
      if (payload[k] !== undefined) talentPayload[k] = payload[k];
    }
    if (Object.keys(talentPayload).length) {
      // Use the new secure profile API
      const { saveMyProfile } = await import('@/features/profile/api');
      await saveMyProfile(talentPayload);
    }

    return true;
  }

  async function saveToServer(scope?: Scope): Promise<boolean> {
    setSaving(true);
    setMsg(null);

    // CV varsa Deneyim'e tek satır ekle
    let experienceToSave = stripCvLines(safeFormData.experience);
    if (cvUrl && !experienceToSave.includes(cvUrl)) {
      experienceToSave = `${experienceToSave ? experienceToSave + "\n\n" : ""}CV: ${cvUrl}`;
    }

    try {
      // Use the new mapper to create properly formatted payload
      const { uiToApiStep } = await import('@/lib/mappers/profile');
      
      // Prepare form data for mapper
      const mapperInput = {
        firstName: safeFormData.firstName.trim(),
        lastName: safeFormData.lastName.trim(),
        phone: toE164TR(phoneDigits), // Convert phone to E.164 format
        profilePhotoUrl: safeFormData.profilePhotoUrl,
        city: safeFormData.city.trim(),
        birthDate: safeFormData.dateOfBirth, // Already in YYYY-MM-DD format
        gender: safeFormData.gender === 'MALE' ? 'male' : safeFormData.gender === 'FEMALE' ? 'female' : safeFormData.gender === 'OTHER' ? 'other' : null, // Convert form format to UI format for mapper
        heightCm: safeFormData.height ? Number(safeFormData.height) : null,
        weightKg: safeFormData.weight ? Number(safeFormData.weight) : null,
        bio: safeFormData.bio.trim(),
        experience: experienceToSave.trim(),
        specialties: safeFormData.specialties,
        cvUrl: cvUrl,
      };

      console.log("[ONBOARDING] Mapper input:", mapperInput);

      let apiPayload: any = {};
      
      if (!scope || scope === "account") {
        apiPayload = { ...apiPayload, ...uiToApiStep(mapperInput, 'account') };
      }

      if (!scope || scope === "personal") {
        apiPayload = { ...apiPayload, ...uiToApiStep(mapperInput, 'personal') };
        
        // Handle guardian data for minors
        const parentTen = parentPhoneDigits;
        if (
          isMinor ||
          safeFormData.parentName.trim() ||
          parentTen ||
          safeFormData.guardianRelation ||
          safeFormData.guardianEmail ||
          safeFormData.guardianConsent
        ) {
          const guardian: Record<string, any> = {};
          if (safeFormData.parentName.trim()) guardian.fullName = safeFormData.parentName.trim();
          if (safeFormData.guardianRelation) guardian.relation = safeFormData.guardianRelation;
          if (parentTen) guardian.phone = toE164TR(parentTen);
          if (safeFormData.guardianEmail.trim()) guardian.email = safeFormData.guardianEmail.trim();
          if (safeFormData.guardianConsent) {
            guardian.consent = true;
            guardian.consentAccepted = true;
          }
          if (Object.keys(guardian).length) {
            apiPayload.guardian = guardian;
          }
        }
      }

      if (!scope || scope === "professional") {
        apiPayload = { ...apiPayload, ...uiToApiStep(mapperInput, 'professional') };
      }

      if (Object.keys(apiPayload).length === 0) return true;

      console.log('[ONBOARDING] Sending payload:', JSON.stringify(apiPayload, null, 2));

      // Use PATCH method for partial updates
      const r = await fetch('/api/proxy/api/v1/profiles/talent/me', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(apiPayload),
        credentials: 'include',
      });
      
      if (!r.ok) {
        const errorText = await r.text();
        console.error('[ONBOARDING] Save error:', r.status, errorText);
        
        let errorMsg = `Kaydetme hatası (${r.status})`;
        if (r.status === 401) {
          errorMsg = "Oturum süresi dolmuş. Lütfen tekrar giriş yapın.";
        } else if (r.status === 400 || r.status === 422) {
          errorMsg = "Lütfen alanları kontrol edin.";
        } else if (r.status === 404) {
          errorMsg = "Profil bulunamadı. Onboarding'i tamamlayın.";
        } else if (r.status >= 500) {
          errorMsg = "Sunucu hatası. Lütfen daha sonra tekrar deneyin.";
        }
        
        setMsg(errorMsg);
        return false;
      }
      
      setMsg("Başarıyla kaydedildi");
      
      // Update form state with the saved data to prevent form clearing
      try {
        const { fetchCombined } = await import('@/helpers/onboarding-map');
        const updatedUiData = await fetchCombined();
        
        // Convert back to form format
        const updatedFormData = {
          // Step 2 - Account
          firstName: updatedUiData.firstName,
          lastName: updatedUiData.lastName,
          phone: updatedUiData.phoneCountry + " " + (await import('@/helpers/onboarding-map')).formatTRPhoneBlocks(updatedUiData.phoneDigits),
          profilePhotoUrl: updatedUiData.photoUrl ?? null,
          
          // Step 3 - Personal
          dateOfBirth: updatedUiData.birthDate ? updatedUiData.birthDate.split('.').reverse().join('-') : "",
          gender: updatedUiData.gender,
          city: updatedUiData.city,
          height: updatedUiData.height,
          weight: updatedUiData.weight,
          eyeColor: "",
          hairColor: "",
          
          // Guardian data
          parentName: updatedUiData.parentName,
          parentPhone: updatedUiData.parentPhone,
          guardianRelation: updatedUiData.guardianRelation,
          guardianEmail: updatedUiData.guardianEmail,
          guardianConsent: updatedUiData.guardianConsent,
          
          // Step 4 - Professional
          bio: updatedUiData.bio,
          experience: stripCvLines(updatedUiData.experience),
          skills: [],
          languages: [],
          specialties: updatedUiData.specialties,
        };
        
        setFormData(updatedFormData);
      } catch (error) {
        console.warn("Failed to refresh form data after save:", error);
        // Continue anyway - the save was successful
      }
      
      return true;
    } catch (error) {
      console.error('[ONBOARDING] Save exception:', error);
      setMsg("Kaydetme sırasında hata oluştu");
      return false;
    } finally {
      setSaving(false);
    }
  }

  /* -------------------------------------------------------------- */
  /* Validasyon                                                     */
  /* -------------------------------------------------------------- */

  const validateCurrentStep = (): string | null => {
    if (currentStep === 2) {
      if (!safeFormData.firstName.trim()) return "Lütfen adınızı girin.";
      if (!safeFormData.lastName.trim()) return "Lütfen soyadınızı girin.";
      const d = onlyLocal10(safeFormData.phone);
      if (d.length !== 10) return "Telefon numarası +90 dışında 10 haneli olmalıdır.";
    }

    if (currentStep === 3) {
      if (!safeFormData.dateOfBirth) return "Doğum tarihi zorunludur.";
      if (!["MALE", "FEMALE", "OTHER"].includes(safeFormData.gender)) return "Cinsiyet seçiniz.";
      if (!safeFormData.city.trim()) return "Şehir zorunludur.";
      if (!/^\d+$/.test(safeFormData.height) || Number(safeFormData.height) <= 0)
        return "Boy (cm) sadece sayı olmalıdır.";
      if (!/^\d+$/.test(safeFormData.weight) || Number(safeFormData.weight) <= 0)
        return "Kilo (kg) sadece sayı olmalıdır.";

      if (isMinor) {
        if (!safeFormData.parentName.trim())
          return "18 yaş altı için ebeveyn/vasi adı soyadı zorunludur.";
        const pd = onlyLocal10(safeFormData.parentPhone);
        if (pd.length !== 10)
          return "Ebeveyn/vasi telefon numarası +90 dışında 10 haneli olmalıdır.";
        if (!safeFormData.guardianRelation) return "Yakınlık seçiniz.";
        if (
          safeFormData.guardianEmail &&
          !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(safeFormData.guardianEmail)
        )
          return "Geçerli bir e-posta giriniz.";
        if (!safeFormData.guardianConsent)
          return "Yasal veli/vasi onayı olmadan devam edemezsiniz.";
      }
    }

    if (currentStep === 4) {
      if (!safeFormData.bio.trim()) return "Biyografi zorunludur.";
      if (!safeFormData.experience.trim() && !cvUrl)
        return "Deneyim metni boşsa bir CV yükleyin veya metin girin.";
      if (safeFormData.specialties.length === 0)
        return "En az bir uzmanlık alanı seçin.";
    }
    return null;
  };

  /* -------------------------------------------------------------- */
  /* Adım geçişleri / bitir                                          */
  /* -------------------------------------------------------------- */

  const handleNext = async () => {
    const err = validateCurrentStep();
    if (err) {
      setMsg(err);
      return;
    }

    let ok = true;
    if (currentStep === 2) ok = await saveToServer("account");
    if (currentStep === 3) ok = await saveToServer("personal");
    if (currentStep === 4) ok = await saveToServer("professional");

    if (!ok) return;

    if (currentStep < STEPS.length) {
      setCurrentStep((s) => s + 1);
      setMsg(null);
    }
  };

  const handlePrevious = async () => {
    if (currentStep === 1) {
      router.push("/");
      return;
    }
    let ok = true;
    if (currentStep === 2) ok = await saveToServer("account");
    if (currentStep === 3) ok = await saveToServer("personal");
    if (currentStep === 4) ok = await saveToServer("professional");
    if (!ok) return;

    setCurrentStep((s) => Math.max(1, s - 1));
  };

  const publishProfile = async (): Promise<boolean> => {
    // Discover için asıl kritik bayrak
    const ok = await upsertProfile({ isPublic: true, is_public: true });
    if (!ok) {
      setMsg("Profil yayınlama hatası");
      return false;
    }
    // Onboarding complete başarısızsa uyarı ver ama akışı durdurma
    try {
      const c = await fetch("/api/proxy/api/v1/users/onboarding-complete", { 
        method: "PATCH",
        credentials: 'include'
      });
      if (!c.ok) {
        console.warn("Onboarding complete failed:", c.status, await c.text());
        setMsg("Onboarding servisi yanıtsız (devam ediliyor).");
      } else {
        console.log("Onboarding completed successfully");
      }
    } catch (error) {
      console.error("Onboarding complete error:", error);
      setMsg("Onboarding servisine erişilemedi (devam ediliyor).");
    }
    return true;
  };

  const handleSubmit = async () => {
    const okSave = await saveToServer("professional");
    if (!okSave) return;

    const okPub = await publishProfile();
    if (!okPub) return;

    router.push('/?skill=tum#discover');
  };

  /* -------------------------------------------------------------- */
  /* Fotoğraf değişimi                                               */
  /* -------------------------------------------------------------- */

  function handleAvatarChange(url?: string | null) {
    setFormData((d) => ({ ...(d ?? safeFormData), profilePhotoUrl: url || null }));
  }

  /* -------------------------------------------------------------- */
  /* Step içerikleri                                                 */
  /* -------------------------------------------------------------- */

  const SPECIALTY_OPTIONS = ["Oyunculuk", "Tiyatro", "Modellik", "Müzik", "Dans", "Dublaj"];

  const toggleSpecialty = (name: string) =>
    setFormData((f) => {
      const current = f ?? safeFormData;
      const has = current.specialties.includes(name);
      return { ...current, specialties: has ? current.specialties.filter((x) => x !== name) : [...current.specialties, name] };
    });

  function renderStep1() {
    return (
      <div className="space-y-4">
        <h2 className="text-xl font-semibold">Gizlilik ve Güvenlik</h2>
        <p className="opacity-80">
          Castlyo olarak kişisel verilerinizi yalnızca başvurularınızı değerlendirmek ve size uygun
          fırsatları sunabilmek için işleriz. Dilediğiniz an profilinizdeki verileri silebilir veya
          düzenleyebilirsiniz.
        </p>
      </div>
    );
  }

  function renderStep2() {
    return (
      <div data-wizard-step="2" className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className="text-xs opacity-80">Ad</label>
          <Input
            value={safeFormData.firstName}
            onChange={(e) => setFormData(p => ({ ...(p ?? safeFormData), firstName: e.target.value }))}
            onBlur={() => onBlurTitleCase("firstName")}
            placeholder="Ad"
          />
        </div>
        <div>
          <label className="text-xs opacity-80">Soyad</label>
          <Input
            value={safeFormData.lastName}
            onChange={(e) => setFormData(p => ({ ...(p ?? safeFormData), lastName: e.target.value }))}
            onBlur={() => onBlurTitleCase("lastName")}
            placeholder="Soyad"
          />
        </div>

        <div className="md:col-span-2">
          <label className="text-xs opacity-80">Telefon</label>
          <div className="flex gap-2 items-center">
            <span className="px-3 py-2 rounded-md bg-white/90 text-black ring-1 ring-neutral-300 select-none">
              +90
            </span>
            <Input
              value={phoneBlocks}
              onChange={(e) => onPhoneInput(e.target.value)}
              placeholder="5xx xxx xx xx"
            />
          </div>
        </div>

        <div className="md:col-span-2">
          <AvatarInput value={safeFormData.profilePhotoUrl} onChange={handleAvatarChange} />
        </div>
      </div>
    );
  }

  function renderStep3() {
    return (
      <div data-wizard-step="3" className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className="text-xs opacity-80">Doğum Tarihi</label>
          <Input
            type="date"
            value={safeFormData.dateOfBirth}
            onChange={(e) => setFormData(p => ({ ...(p ?? safeFormData), dateOfBirth: e.target.value }))}
          />
          <div className="text-[11px] opacity-70 mt-1">{Number.isFinite(age) ? `Yaş: ${age}` : ""}</div>
        </div>

        <div data-field="gender">
          <label className="text-xs opacity-80">Cinsiyet</label>
          <select
            className="w-full rounded-md px-3 py-2 bg-white/90 text-black ring-1 ring-neutral-300"
            value={safeFormData.gender}
            onChange={(e) => setFormData(p => ({ ...(p ?? safeFormData), gender: e.target.value as FormData["gender"] }))}
          >
            <option value="">Seçiniz</option>
            <option value="MALE">Erkek</option>
            <option value="FEMALE">Kadın</option>
            <option value="OTHER">Diğer</option>
          </select>
        </div>

        <div>
          <label className="text-xs opacity-80">Şehir</label>
          <Input
            value={safeFormData.city}
            onChange={(e) => setFormData(p => ({ ...(p ?? safeFormData), city: e.target.value }))}
            onBlur={() => onBlurTitleCase("city")}
          />
        </div>

        <div>
          <label className="text-xs opacity-80">Boy (cm)</label>
          <Input
            inputMode="numeric"
            pattern="[0-9]*"
            value={safeFormData.height}
            onChange={(e) => setFormData(p => ({ ...(p ?? safeFormData), height: e.target.value.replace(/\D+/g, "") }))}
          />
        </div>

        <div>
          <label className="text-xs opacity-80">Kilo (kg)</label>
          <Input
            inputMode="numeric"
            pattern="[0-9]*"
            value={safeFormData.weight}
            onChange={(e) => setFormData(p => ({ ...(p ?? safeFormData), weight: e.target.value.replace(/\D+/g, "") }))}
          />
        </div>

        {isMinor && (
          <div className="md:col-span-2">
            <div className="rounded-xl p-4 ring-1 ring-orange-400/30 bg-orange-500/5">
              <div className="font-medium mb-3">
                Bu profil <span className="font-semibold">18 yaş altı</span>. Lütfen aşağıdaki veli/vasi
                bilgilerini doldurun.
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="text-xs opacity-80">Veli/Vasi Adı Soyadı</label>
                  <Input
                    value={safeFormData.parentName}
                    onChange={(e) => setFormData(p => ({ ...(p ?? safeFormData), parentName: e.target.value }))}
                    placeholder="Ad Soyad"
                  />
                </div>

                <div>
                  <label className="text-xs opacity-80">Veli/Vasi Telefonu</label>
                  <div className="flex gap-2 items-center">
                    <span className="px-3 py-2 rounded-md bg-white/90 text-black ring-1 ring-neutral-300 select-none">
                      +90
                    </span>
                    <Input
                      value={parentPhoneBlocks}
                      onChange={(e) => onParentPhoneInput(e.target.value)}
                      placeholder="5xx xxx xx xx"
                    />
                  </div>
                  <div className="text-[11px] opacity-70 mt-1">
                    Sunucuya şu formatta kaydedilir: {parentPhoneDigits ? `+90${parentPhoneDigits}` : "-"}
                  </div>
                </div>

                <div>
                  <label className="text-xs opacity-80">Yakınlık</label>
                  <select
                    className="w-full rounded-md px-3 py-2 bg-white/90 text-black ring-1 ring-neutral-300"
                    value={safeFormData.guardianRelation}
                    onChange={(e) =>
                      setFormData(p => ({ ...(p ?? safeFormData), guardianRelation: e.target.value as FormData["guardianRelation"] }))
                    }
                  >
                    <option value="">Seçiniz</option>
                    <option value="Anne">Anne</option>
                    <option value="Baba">Baba</option>
                    <option value="Vasi">Vasi</option>
                    <option value="Diğer">Diğer</option>
                  </select>
                </div>

                <div>
                  <label className="text-xs opacity-80">Veli/Vasi E-posta (opsiyonel)</label>
                  <Input
                    type="email"
                    value={safeFormData.guardianEmail}
                    onChange={(e) => setFormData(p => ({ ...(p ?? safeFormData), guardianEmail: e.target.value }))}
                    placeholder="ornek@eposta.com"
                  />
                </div>

                <label className="md:col-span-2 flex items-center gap-3 text-sm">
                  <input
                    type="checkbox"
                    checked={safeFormData.guardianConsent}
                    onChange={(e) => setFormData(p => ({ ...(p ?? safeFormData), guardianConsent: e.target.checked }))}
                  />
                  <span>Yasal veli/vasi olarak onay veriyorum.</span>
                </label>
              </div>
            </div>
          </div>
        )}
      </div>
    );
  }

  function renderStep4() {
    return (
      <div className="space-y-6">
        <div>
          <label className="text-xs opacity-80">Biyografi</label>
          <textarea
            className="w-full rounded-md bg-white/90 text-black ring-1 ring-neutral-300 px-3 py-2 min-h-[120px]"
            value={safeFormData.bio}
            onChange={(e) => setFormData(p => ({ ...(p ?? safeFormData), bio: e.target.value }))}
            placeholder="Kendini kısaca tanıt…"
          />
        </div>

        <div>
          <label className="text-xs opacity-80">Deneyim</label>
          <textarea
            className="w-full rounded-md bg-white/90 text-black ring-1 ring-neutral-300 px-3 py-2 min-h-[140px]"
            value={safeFormData.experience}
            onChange={(e) => setFormData(p => ({ ...(p ?? safeFormData), experience: e.target.value }))}
            placeholder="Sahne/ekran deneyimleri, eğitim vb."
          />
        </div>

        <div>
          <label className="text-xs opacity-80 block mb-2">Uzmanlıklar</label>
          <div className="flex flex-wrap gap-2">
            {["Oyunculuk", "Tiyatro", "Modellik", "Müzik", "Dans", "Dublaj"].map((s) => {
              const active = safeFormData.specialties.includes(s);
              return (
                <button
                  type="button"
                  key={s}
                  onClick={() => toggleSpecialty(s)}
                  className={`chip px-3 py-1.5 rounded-full ring-1 text-sm ${
                    active
                      ? "bg-green-500/10 text-green-700 ring-green-500/30"
                      : "bg-white/70 text-neutral-700 ring-neutral-300"
                  }`}
                >
                  <span className="chip-label">{s}</span>
                </button>
              );
            })}
          </div>
        </div>

        <div className="rounded-xl p-4 ring-1 ring-neutral-300 bg-white/70 text-neutral-800">
          <div className="flex items-center justify-between gap-3">
            <div>
              <div className="text-sm font-medium">CV</div>
              <div className="text-xs opacity-70">
                {cvUrl ? (
                  <>
                    Yüklü: <span className="font-medium">{filenameFromUrl(cvUrl)}</span>
                  </>
                ) : (
                  "Yüklenmiş CV yok"
                )}
              </div>
            </div>
            <label className="inline-flex items-center gap-2 px-3 py-2 rounded-lg ring-1 ring-neutral-300 cursor-pointer hover:bg-neutral-50">
              <input
                type="file"
                accept="application/pdf"
                className="hidden"
                onChange={async (e) => {
                  const f = e.target.files?.[0];
                  if (!f) return;
                  if (f.size > 5 * 1024 * 1024) {
                    setMsg("CV yüklenemedi: Dosya boyutu 5 MB'ı aşamaz.");
                    return;
                  }
                  setCvUploading(true);
                  try {
                    // Get current user profile ID - use talent_profile_id
                    const userRes = await fetch("/api/proxy/api/v1/users/me", { credentials: "include" });
                    if (!userRes.ok) throw new Error("Kullanıcı bilgisi alınamadı");
                    const user = await userRes.json();
                    
                    // Get correct profile ID - talent_profile_id is what we need
                    const profileId = user.talent_profile_id;
                    if (!profileId) throw new Error("Talent profil ID bulunamadı. Lütfen önce profilinizi oluşturun.");

                    // Use new presigned upload with profile fallbacks
                    const { uploadFileWithPresigned, saveProfileCV } = await import('@/lib/upload-presigned');
                    
                    const fileUrl = await uploadFileWithPresigned(f, profileId, "cv", "documents");
                    await saveProfileCV(fileUrl);
                    
                    setCvUrl(fileUrl);
                    setMsg("CV yüklendi.");
                  } catch (err) {
                    console.error("CV upload error:", err);
                    setMsg(`CV yüklenemedi: ${err instanceof Error ? err.message : "Bilinmeyen hata"}`);
                  } finally {
                    setCvUploading(false);
                  }
                }}
              />
              <span>{cvUploading ? "Yükleniyor…" : "CV Yükle"}</span>
            </label>
          </div>
        </div>
      </div>
    );
  }

  function renderStep5() {
    return (
      <div className="text-center space-y-4">
        <div className="mx-auto w-16 h-16 grid place-items-center rounded-full bg-green-500/10 ring-1 ring-green-500/30 text-green-700">
          <Check className="w-8 h-8" />
        </div>
        <h3 className="text-xl font-semibold">Harika! Başvurun hazır.</h3>
        <p className="opacity-80">
          "Yetenekleri ve Fırsatları Keşfet" bölümüne giderek size uygun projelere göz atabilirsiniz.
        </p>
        <div className="pt-2">
          <Button 
            className="text-white" 
            style={{ backgroundColor: BRAND_PRIMARY }} 
            onClick={handleSubmit}
            disabled={saving}
          >
            {saving ? "Yönlendiriliyor..." : "Bitir ve Keşfet'e Git"}
          </Button>
        </div>
      </div>
    );
  }

  function renderStepContent() {
    if (loading) return <div>Yükleniyor…</div>;
    switch (currentStep) {
      case 1:
        return renderStep1();
      case 2:
        return renderStep2();
      case 3:
        return renderStep3();
      case 4:
        return renderStep4();
      default:
        return renderStep5();
    }
  }

  /* -------------------------------------------------------------- */
  /* Render                                                          */
  /* -------------------------------------------------------------- */

  return (
    <div
      className="min-h-screen"
      style={{
        background: "radial-gradient(1200px 600px at 50% 0%, rgba(150,41,1,0.55) 0%, rgba(0,0,0,1) 60%)",
        color: BRAND_CREAM,
      }}
    >
      <div className="max-w-5xl mx-auto px-4 py-10">
        {/* Stepper */}
        <div className="mb-10">
          <div className="flex items-center justify-between max-w-xl mx-auto mb-4">
            {STEPS.map((s, i) => {
              const active = currentStep === s.id;
              const passed = currentStep > s.id;
              return (
                <div key={s.id} className="flex-1 flex items-center">
                  <div
                    className={`w-8 h-8 rounded-full grid place-items-center text-sm font-semibold ring-1`}
                    style={{
                      backgroundColor: active ? BRAND_PRIMARY : passed ? "#22c55e" : "transparent",
                      color: active || passed ? "#fff" : BRAND_CREAM,
                      borderColor: "rgba(255,255,255,0.2)",
                    }}
                  >
                    {passed ? <Check className="w-4 h-4" /> : s.id}
                  </div>
                  {i < STEPS.length - 1 && (
                    <div className="flex-1 h-px mx-2" style={{ background: "rgba(255,255,255,0.2)" }} />
                  )}
                </div>
              );
            })}
          </div>

          <div className="text-center">
            <h3 className="text-lg font-semibold">{STEPS[currentStep - 1]?.title}</h3>
            <p className="text-sm opacity-80">{STEPS[currentStep - 1]?.description}</p>
          </div>
        </div>

        {/* Form Content */}
        <div className="max-w-2xl mx-auto">
          <div
            className="backdrop-blur-lg rounded-2xl border p-8 shadow-2xl"
            style={{
              borderColor: "rgba(255,255,255,0.1)",
              background: "rgba(255,255,255,0.05)",
              color: BRAND_CREAM,
            }}
          >
            {renderStepContent()}

            {/* Navigation Buttons */}
            {currentStep < 5 && (
              <div
                className="flex justify-between mt-8 pt-6"
                style={{ borderTop: "1px solid rgba(255,255,255,0.1)" }}
              >
                <Button
                  variant="outline"
                  onClick={handlePrevious}
                  style={{
                    borderColor: "rgba(255,255,255,0.2)",
                    backgroundColor: "transparent",
                    color: BRAND_CREAM,
                  }}
                >
                  <ArrowLeft className="w-4 h-4 mr-2" />
                  {currentStep === 1 ? "Ana Sayfa" : "Önceki"}
                </Button>

                <Button
                  onClick={handleNext}
                  className="text-white"
                  style={{ backgroundColor: BRAND_PRIMARY }}
                  disabled={saving}
                >
                  {saving ? "Kaydediliyor..." : "Sonraki"}
                  <ArrowRight className="w-4 h-4 ml-2" />
                </Button>
              </div>
            )}


            {msg && (
              <div className="mt-3 text-sm" style={{ color: BRAND_CREAM }}>
                {msg}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Default export – AuthGuard                                         */
/* ------------------------------------------------------------------ */

export default function TalentOnboarding() {
  return (
    <AuthGuard checkOnboardingCompleted={true}>
      <RoleRequired required="TALENT">
        <TalentOnboardingContent />
      </RoleRequired>
    </AuthGuard>
  );
}

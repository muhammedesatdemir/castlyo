"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ArrowLeft, ArrowRight, Check } from "lucide-react";
import { AuthGuard } from "@/components/auth/AuthGuard";
import RoleRequired from "@/components/auth/RoleRequired";
import AvatarInput from "@/components/AvatarInput";
import { DISCOVER_ROUTE } from "@/lib/routes";

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

  const [cvUrl, setCvUrl] = useState<string | null>(null);
  const [cvUploading, setCvUploading] = useState(false);

  const [formData, setFormData] = useState<FormData>({
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
  });

  /* -------------------------------------------------------------- */
  /* Prefill                                                        */
  /* -------------------------------------------------------------- */

  const loadProfile = async () => {
    try {
      // Fetch both user and profile data to get complete information
      const [userRes, profileRes] = await Promise.all([
        fetch("/api/proxy/api/v1/users/me", { 
          cache: "no-store",
          credentials: 'include'
        }),
        fetch("/api/proxy/api/v1/profiles/talent/me", { 
          cache: "no-store",
          credentials: 'include'
        })
      ]);

      if (!userRes.ok && userRes.status === 401) {
        router.push('/auth/login?next=/onboarding/talent');
        throw new Error('Oturum açmanız gerekiyor.');
      }

      // Get user data (for basic info like name, email, phone)
      const userData = userRes.ok ? await userRes.json() : {};
      
      // Get profile data (for personal/professional info)
      let profileData = {};
      if (profileRes.ok) {
        const profileRaw = await profileRes.json();
        profileData = profileRaw && typeof profileRaw === 'object' && !Array.isArray(profileRaw) ? profileRaw : {};
      }

      // Merge user and profile data with proper priority
      const combinedData = {
        // User data takes priority for identity fields
        first_name: (userData as any)?.first_name || (profileData as any)?.first_name || '',
        last_name: (userData as any)?.last_name || (profileData as any)?.last_name || '',
        email: (userData as any)?.email || (profileData as any)?.email || '',
        phone: (userData as any)?.phone || (profileData as any)?.phone || '',
        // Profile data takes priority for personal/professional fields
        ...profileData,
        // Ensure user identity fields are not overwritten by empty profile values
        ...((userData as any)?.first_name && { first_name: (userData as any).first_name }),
        ...((userData as any)?.last_name && { last_name: (userData as any).last_name }),
        ...((userData as any)?.email && { email: (userData as any).email }),
        ...((userData as any)?.phone && { phone: (userData as any).phone }),
      };

      // Use the new mapper to convert API data to UI format
      const { apiToUi } = await import('@/lib/mappers/profile');
      const uiData = apiToUi(combinedData);

      console.log("[ONBOARDING] Combined API data:", combinedData);
      console.log("[ONBOARDING] Mapped UI data:", uiData);

      // Format phone numbers for UI display
      const userTen = onlyLocal10(uiData.phone ?? "").slice(0, 10);
      const phoneFmt = userTen ? `+90 ${formatTRPhoneBlocks(userTen)}` : "";

      // Handle guardian data if exists
      const gObj = combinedData?.guardian ?? null;
      const gPhoneTen = onlyLocal10(gObj?.phone ?? "").slice(0, 10);
      const gPhoneFmt = gPhoneTen ? `+90 ${formatTRPhoneBlocks(gPhoneTen)}` : "";
      const gConsent = !!(gObj?.consent ?? gObj?.consentAccepted);

      // Map UI data to form structure with proper gender conversion
      const newFormData = {
        // Step 2 - Account (from user data primarily)
        firstName: uiData.firstName || "",
        lastName: uiData.lastName || "",
        phone: phoneFmt,
        profilePhotoUrl: uiData.profilePhotoUrl || null,
        
        // Step 3 - Personal (from profile data primarily)
        dateOfBirth: uiData.birthDate || "", // Already in YYYY-MM-DD format
        gender: uiData.gender === 'male' ? 'MALE' : uiData.gender === 'female' ? 'FEMALE' : uiData.gender === 'other' ? 'OTHER' : "" as FormData["gender"], // Convert UI format to form format
        city: uiData.city || "",
        height: uiData.heightCm ? String(uiData.heightCm) : "",
        weight: uiData.weightKg ? String(uiData.weightKg) : "",
        eyeColor: "",
        hairColor: "",
        
        // Guardian data
        parentName: gObj?.fullName ?? gObj?.name ?? "",
        parentPhone: gPhoneFmt,
        guardianRelation: (gObj?.relation as any) ?? "",
        guardianEmail: gObj?.email ?? "",
        guardianConsent: gConsent,
        
        // Step 4 - Professional
        bio: uiData.bio || "",
        experience: stripCvLines(uiData.experience || ""),
        skills: [],
        languages: [],
        specialties: Array.isArray(uiData.specialties) ? uiData.specialties : [],
      };

      setFormData((prev) => ({
        ...prev,
        ...newFormData
      }));

      // Extract CV URL from experience or direct field
      const m = (uiData.experience ?? "").match(/(https?:\/\/\S+\.pdf)/i);
      setCvUrl(m?.[1] ?? uiData.cvUrl ?? null);

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
      setLoading(false);
    }
  };

  useEffect(() => {
    let mounted = true;
    loadProfile();
    const onPageShow = (e: PageTransitionEvent) => {
      if ((e as any).persisted && mounted) loadProfile();
    };
    window.addEventListener("pageshow", onPageShow as any);
    return () => {
      mounted = false;
      window.removeEventListener("pageshow", onPageShow as any);
    };
  }, []);

  /* -------------------------------------------------------------- */
  /* Minor kontrolü                                                 */
  /* -------------------------------------------------------------- */

  const age = useMemo(() => getAge(formData.dateOfBirth), [formData.dateOfBirth]);
  const isMinor = useMemo(() => Number.isFinite(age) && age < 18, [age]);

  /* -------------------------------------------------------------- */
  /* Input yardımcıları                                              */
  /* -------------------------------------------------------------- */

  const onBlurTitleCase = (key: "firstName" | "lastName" | "city") => {
    setFormData((d) => ({ ...d, [key]: toTitleTR(d[key] as string) }));
  };

  // User phone (UI)
  const phoneDigits = useMemo(() => onlyLocal10(formData.phone).slice(0, 10), [formData.phone]);
  const phoneBlocks = useMemo(() => formatTRPhoneBlocks(phoneDigits), [phoneDigits]);

  const onPhoneInput = (val: string) => {
    const d = digits(val).slice(0, 10);
    const fmt = formatTRPhoneBlocks(d);
    setFormData((f) => ({ ...f, phone: d ? `+90 ${fmt}` : "" }));
  };

  // Guardian phone (UI)
  const parentPhoneDigits = useMemo(
    () => onlyLocal10(formData.parentPhone).slice(0, 10),
    [formData.parentPhone]
  );
  const parentPhoneBlocks = useMemo(
    () => formatTRPhoneBlocks(parentPhoneDigits),
    [parentPhoneDigits]
  );

  const onParentPhoneInput = (val: string) => {
    const d = digits(val).slice(0, 10);
    const fmt = formatTRPhoneBlocks(d);
    setFormData((f) => ({ ...f, parentPhone: d ? `+90 ${fmt}` : "" }));
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
      const r = await fetch('/api/proxy/api/v1/profiles/talent/me', {
        method: 'PUT',
        headers,
        body: JSON.stringify(talentPayload),
        credentials: 'include',
      });
      if (!r.ok) return false;
    }

    return true;
  }

  async function saveToServer(scope?: Scope): Promise<boolean> {
    setSaving(true);
    setMsg(null);

    // CV varsa Deneyim'e tek satır ekle
    let experienceToSave = stripCvLines(formData.experience);
    if (cvUrl && !experienceToSave.includes(cvUrl)) {
      experienceToSave = `${experienceToSave ? experienceToSave + "\n\n" : ""}CV: ${cvUrl}`;
    }

    try {
      // Use the new mapper to create properly formatted payload
      const { uiToApiStep } = await import('@/lib/mappers/profile');
      
      // Prepare form data for mapper
      const mapperInput = {
        firstName: formData.firstName.trim(),
        lastName: formData.lastName.trim(),
        phone: toE164TR(phoneDigits), // Convert phone to E.164 format
        profilePhotoUrl: formData.profilePhotoUrl,
        city: formData.city.trim(),
        birthDate: formData.dateOfBirth, // Already in YYYY-MM-DD format
        gender: formData.gender === 'MALE' ? 'male' : formData.gender === 'FEMALE' ? 'female' : formData.gender === 'OTHER' ? 'other' : null, // Convert form format to UI format for mapper
        heightCm: formData.height ? Number(formData.height) : null,
        weightKg: formData.weight ? Number(formData.weight) : null,
        bio: formData.bio.trim(),
        experience: experienceToSave.trim(),
        specialties: formData.specialties,
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
          formData.parentName.trim() ||
          parentTen ||
          formData.guardianRelation ||
          formData.guardianEmail ||
          formData.guardianConsent
        ) {
          const guardian: Record<string, any> = {};
          if (formData.parentName.trim()) guardian.fullName = formData.parentName.trim();
          if (formData.guardianRelation) guardian.relation = formData.guardianRelation;
          if (parentTen) guardian.phone = toE164TR(parentTen);
          if (formData.guardianEmail.trim()) guardian.email = formData.guardianEmail.trim();
          if (formData.guardianConsent) {
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
        setMsg(`Kaydetme hatası (${r.status})`);
        return false;
      }
      
      setMsg("Kaydedildi");
      return true;
    } catch (error) {
      console.error('[ONBOARDING] Save exception:', error);
      setMsg("Kaydetme hatası");
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
      if (!formData.firstName.trim()) return "Lütfen adınızı girin.";
      if (!formData.lastName.trim()) return "Lütfen soyadınızı girin.";
      const d = onlyLocal10(formData.phone);
      if (d.length !== 10) return "Telefon numarası +90 dışında 10 haneli olmalıdır.";
    }

    if (currentStep === 3) {
      if (!formData.dateOfBirth) return "Doğum tarihi zorunludur.";
      if (!["MALE", "FEMALE", "OTHER"].includes(formData.gender)) return "Cinsiyet seçiniz.";
      if (!formData.city.trim()) return "Şehir zorunludur.";
      if (!/^\d+$/.test(formData.height) || Number(formData.height) <= 0)
        return "Boy (cm) sadece sayı olmalıdır.";
      if (!/^\d+$/.test(formData.weight) || Number(formData.weight) <= 0)
        return "Kilo (kg) sadece sayı olmalıdır.";

      if (isMinor) {
        if (!formData.parentName.trim())
          return "18 yaş altı için ebeveyn/vasi adı soyadı zorunludur.";
        const pd = onlyLocal10(formData.parentPhone);
        if (pd.length !== 10)
          return "Ebeveyn/vasi telefon numarası +90 dışında 10 haneli olmalıdır.";
        if (!formData.guardianRelation) return "Yakınlık seçiniz.";
        if (
          formData.guardianEmail &&
          !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.guardianEmail)
        )
          return "Geçerli bir e-posta giriniz.";
        if (!formData.guardianConsent)
          return "Yasal veli/vasi onayı olmadan devam edemezsiniz.";
      }
    }

    if (currentStep === 4) {
      if (!formData.bio.trim()) return "Biyografi zorunludur.";
      if (!formData.experience.trim() && !cvUrl)
        return "Deneyim metni boşsa bir CV yükleyin veya metin girin.";
      if (formData.specialties.length === 0)
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
    setFormData((d) => ({ ...d, profilePhotoUrl: url || null }));
  }

  /* -------------------------------------------------------------- */
  /* Step içerikleri                                                 */
  /* -------------------------------------------------------------- */

  const SPECIALTY_OPTIONS = ["Oyunculuk", "Tiyatro", "Modellik", "Müzik", "Dans", "Dublaj"];

  const toggleSpecialty = (name: string) =>
    setFormData((f) => {
      const has = f.specialties.includes(name);
      return { ...f, specialties: has ? f.specialties.filter((x) => x !== name) : [...f.specialties, name] };
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
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className="text-xs opacity-80">Ad</label>
          <Input
            value={formData.firstName}
            onChange={(e) => setFormData({ ...formData, firstName: e.target.value })}
            onBlur={() => onBlurTitleCase("firstName")}
            placeholder="Ad"
          />
        </div>
        <div>
          <label className="text-xs opacity-80">Soyad</label>
          <Input
            value={formData.lastName}
            onChange={(e) => setFormData({ ...formData, lastName: e.target.value })}
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
          <div className="text-[11px] opacity-70 mt-1">
            Sunucuya şu formatta kaydedilir: {phoneDigits ? `+90${phoneDigits}` : "-"}
          </div>
        </div>

        <div className="md:col-span-2">
          <label className="text-xs opacity-80 block mb-2">Profil Fotoğrafı</label>
          <AvatarInput value={formData.profilePhotoUrl} onChange={handleAvatarChange} />
        </div>
      </div>
    );
  }

  function renderStep3() {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className="text-xs opacity-80">Doğum Tarihi</label>
          <Input
            type="date"
            value={formData.dateOfBirth}
            onChange={(e) => setFormData({ ...formData, dateOfBirth: e.target.value })}
          />
          <div className="text-[11px] opacity-70 mt-1">{Number.isFinite(age) ? `Yaş: ${age}` : ""}</div>
        </div>

        <div>
          <label className="text-xs opacity-80">Cinsiyet</label>
          <select
            className="w-full rounded-md px-3 py-2 bg-white/90 text-black ring-1 ring-neutral-300"
            value={formData.gender}
            onChange={(e) => setFormData({ ...formData, gender: e.target.value as FormData["gender"] })}
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
            value={formData.city}
            onChange={(e) => setFormData({ ...formData, city: e.target.value })}
            onBlur={() => onBlurTitleCase("city")}
          />
        </div>

        <div>
          <label className="text-xs opacity-80">Boy (cm)</label>
          <Input
            inputMode="numeric"
            pattern="[0-9]*"
            value={formData.height}
            onChange={(e) => setFormData({ ...formData, height: e.target.value.replace(/\D+/g, "") })}
          />
        </div>

        <div>
          <label className="text-xs opacity-80">Kilo (kg)</label>
          <Input
            inputMode="numeric"
            pattern="[0-9]*"
            value={formData.weight}
            onChange={(e) => setFormData({ ...formData, weight: e.target.value.replace(/\D+/g, "") })}
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
                    value={formData.parentName}
                    onChange={(e) => setFormData({ ...formData, parentName: e.target.value })}
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
                    value={formData.guardianRelation}
                    onChange={(e) =>
                      setFormData({ ...formData, guardianRelation: e.target.value as FormData["guardianRelation"] })
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
                    value={formData.guardianEmail}
                    onChange={(e) => setFormData({ ...formData, guardianEmail: e.target.value })}
                    placeholder="ornek@eposta.com"
                  />
                </div>

                <label className="md:col-span-2 flex items-center gap-3 text-sm">
                  <input
                    type="checkbox"
                    checked={formData.guardianConsent}
                    onChange={(e) => setFormData({ ...formData, guardianConsent: e.target.checked })}
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
            value={formData.bio}
            onChange={(e) => setFormData({ ...formData, bio: e.target.value })}
            placeholder="Kendini kısaca tanıt…"
          />
        </div>

        <div>
          <label className="text-xs opacity-80">Deneyim</label>
          <textarea
            className="w-full rounded-md bg-white/90 text-black ring-1 ring-neutral-300 px-3 py-2 min-h-[140px]"
            value={formData.experience}
            onChange={(e) => setFormData({ ...formData, experience: e.target.value })}
            placeholder="Sahne/ekran deneyimleri, eğitim vb."
          />
        </div>

        <div>
          <label className="text-xs opacity-80 block mb-2">Uzmanlıklar</label>
          <div className="flex flex-wrap gap-2">
            {["Oyunculuk", "Tiyatro", "Modellik", "Müzik", "Dans", "Dublaj"].map((s) => {
              const active = formData.specialties.includes(s);
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
                    // Use presigned helper to ensure correct request format
                    const mod = await import('@/lib/upload');
                    const { fileUrl } = await mod.uploadWithPresigned(f, 'cv');
                    
                    // API already returns the full public URL
                    setCvUrl(fileUrl);
                    setMsg("CV yüklendi.");
                  } catch {
                    setMsg("CV yüklenemedi.");
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

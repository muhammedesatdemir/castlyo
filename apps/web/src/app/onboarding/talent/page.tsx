"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ArrowLeft, ArrowRight, Check } from "lucide-react";
import { AuthGuard } from "@/components/auth/AuthGuard";
import AvatarInput from "@/components/AvatarInput";

// ---- Tema renkleri ----
const BRAND_PRIMARY = "#962901"; // ana koyu
const BRAND_CREAM = "#F6E6C3";   // açık (metin rengi)

const STEPS = [
  { id: 1, title: "Gizlilik Güvencesi", description: "Verileriniz nasıl korunuyor?" },
  { id: 2, title: "Hesap Bilgileri", description: "Temel bilgilerinizi tamamlayın" },
  { id: 3, title: "Kişisel Bilgiler", description: "Profil bilgilerinizi girin" },
  { id: 4, title: "Profesyonel Bilgiler", description: "Yetenek bilgilerinizi ekleyin" },
  { id: 5, title: "Tamamlandı", description: "Profiliniz hazır!" },
];

type FormData = {
  // Step 2 - Account
  firstName: string;
  lastName: string;
  phone: string; // "+90 535 535 35 35"
  profilePhotoUrl: string | null;

  // Step 3 - Personal
  dateOfBirth: string;
  gender: string; // "MALE" | "FEMALE"
  city: string;
  height: string;
  weight: string;
  eyeColor: string;
  hairColor: string;

  // Step 4 - Professional
  bio: string;
  experience: string;
  skills: string[];
  languages: string[];
  specialties: string[];
};

// ---- Yardımcılar ----
const toTitleTR = (s: string) =>
  (s ?? "")
    .toLocaleLowerCase("tr-TR")
    .split(/\s+/)
    .filter(Boolean)
    .map((w) => w.charAt(0).toLocaleUpperCase("tr-TR") + w.slice(1))
    .join(" ");

const digits = (s: string) => (s ?? "").replace(/\D+/g, "");

/** Kullanıcı state’inde +90 bulunsa bile UI tarafında sadece yerel 10 haneyi işler */
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

// Türkçe/İngilizce/birden çok varyantı normalize et
const normalizeGender = (g: any): "" | "MALE" | "FEMALE" => {
  const v = (g ?? "").toString().trim().toLowerCase();
  if (["erkek", "e", "m", "male", "man", "bay"].includes(v)) return "MALE";
  if (["kadın", "kadin", "k", "f", "female", "woman", "bayan"].includes(v)) return "FEMALE";
  if (v === "male") return "MALE";
  if (v === "female") return "FEMALE";
  return "";
};

function TalentOnboardingContent() {
  const router = useRouter();
  const [currentStep, setCurrentStep] = useState(1);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);

  // CV (opsiyonel)
  const [cvUrl, setCvUrl] = useState<string | null>(null);
  const [cvUploading, setCvUploading] = useState(false);

  const [formData, setFormData] = useState<FormData>({
    // Step 2
    firstName: "",
    lastName: "",
    phone: "", // "+90 5xx xxx xx xx"
    profilePhotoUrl: null,
    // Step 3
    dateOfBirth: "",
    gender: "",
    city: "",
    height: "",
    weight: "",
    eyeColor: "",
    hairColor: "",
    // Step 4
    bio: "",
    experience: "",
    skills: [],
    languages: [],
    specialties: [],
  });

  // ---------- Prefill fonksiyonu (geri dönüşte/odak değişiminde yeniden çağrılır) ----------
  const loadProfile = async () => {
    try {
      const res = await fetch("/api/profile/me", { cache: "no-store" });
      const p = await res.json();

      // Telefonu son 10 hane üzerinden yeniden formatla (905 hatasını önler)
      const ten = onlyLocal10(p.phone ?? "").slice(0, 10);
      const phoneFmt = ten ? `+90 ${formatTRPhoneBlocks(ten)}` : "";

      // gender farklı path'lerden gelebilir → tek yerden normalize et
      const rawGender = p?.personal?.gender ?? p?.gender ?? "";

      setFormData((prev) => ({
        ...prev,
        firstName: p.firstName ?? "",
        lastName: p.lastName ?? "",
        phone: phoneFmt,
        profilePhotoUrl: p.profilePhotoUrl ?? null,
        dateOfBirth: p.personal?.birthDate ?? "",
        gender: normalizeGender(rawGender),
        city: p.personal?.city ?? "",
        height: p.personal?.heightCm ? String(p.personal.heightCm) : "",
        weight: p.personal?.weightKg ? String(p.personal.weightKg) : "",
        bio: p.professional?.bio ?? "",
        experience: stripCvLines(p.professional?.experience ?? ""),
        specialties: Array.isArray(p.professional?.specialties) ? p.professional.specialties : [],
      }));

      // deneyim metninden PDF linkini yakalamayı dene
      const m = (p.professional?.experience ?? "").match(/(https?:\/\/\S+\.pdf)/i);
      setCvUrl(m?.[1] ?? p.professional?.cvUrl ?? null);
    } catch {
      // sessiz
    } finally {
      setLoading(false);
    }
  };

  // ---------- Prefill + görünürlük/odak geri geldiğinde tazele ----------
  useEffect(() => {
    let mounted = true;

    loadProfile();

    const onFocus = () => mounted && loadProfile();
    const onVisible = () => {
      if (document.visibilityState === "visible" && mounted) loadProfile();
    };
    const onPageShow = (e: PageTransitionEvent) => {
      // bfcache'den dönüldüyse
      if ((e as any).persisted && mounted) loadProfile();
    };

    window.addEventListener("focus", onFocus);
    document.addEventListener("visibilitychange", onVisible);
    window.addEventListener("pageshow", onPageShow as any);

    return () => {
      mounted = false;
      window.removeEventListener("focus", onFocus);
      document.removeEventListener("visibilitychange", onVisible);
      window.removeEventListener("pageshow", onPageShow as any);
    };
  }, []);

  // ---------- tek noktadan save (PUT /api/profile/me) ----------
  async function saveToServer() {
    setSaving(true);
    setMsg(null);

    // CV varsa Deneyim metnine "CV: ..." satırı olarak ekle (çiftlemeyi önle)
    let experienceToSave = stripCvLines(formData.experience);
    if (cvUrl && !experienceToSave.includes(cvUrl)) {
      experienceToSave = `${experienceToSave ? experienceToSave + "\n\n" : ""}CV: ${cvUrl}`;
    }

    try {
      // Kişisel alanları DOLU olanlarla sınırlı gönder → boşlarla ezme!
      const personal: Record<string, any> = {};
      if (formData.city.trim()) personal.city = formData.city.trim();
      if (formData.dateOfBirth) personal.birthDate = formData.dateOfBirth;
      if (formData.gender) personal.gender = normalizeGender(formData.gender);
      if (formData.height) personal.heightCm = Number(formData.height);
      if (formData.weight) personal.weightKg = Number(formData.weight);

      const professional: Record<string, any> = {
        bio: formData.bio || "",
        experience: experienceToSave || "",
        specialties: formData.specialties || [],
      };

      const payload: Record<string, any> = {
        firstName: formData.firstName || null,
        lastName: formData.lastName || null,
        phone: formData.phone || null,
        profilePhotoUrl: formData.profilePhotoUrl || null,
        professional,
      };

      if (Object.keys(personal).length > 0) payload.personal = personal;

      const res = await fetch("/api/profile/me", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (!res.ok) throw new Error("save_failed");
      setMsg("Kaydedildi");
      router.refresh();
    } catch {
      setMsg("Kaydetme hatası");
    } finally {
      setSaving(false);
    }
  }

  // ---------- Validasyon (UI bloklama) ----------
  const validateCurrentStep = (): string | null => {
    if (currentStep === 2) {
      if (!formData.firstName.trim()) return "Lütfen adınızı girin.";
      if (!formData.lastName.trim()) return "Lütfen soyadınızı girin.";
      const d = onlyLocal10(formData.phone);
      if (d.length !== 10) return "Telefon numarası +90 dışında 10 haneli olmalıdır.";
    }
    if (currentStep === 3) {
      if (!formData.dateOfBirth) return "Doğum tarihi zorunludur.";
      if (!["MALE", "FEMALE"].includes(formData.gender)) return "Cinsiyet seçiniz.";
      if (!formData.city.trim()) return "Şehir zorunludur.";
      if (!/^\d+$/.test(formData.height) || Number(formData.height) <= 0) return "Boy (cm) sadece sayı olmalıdır.";
      if (!/^\d+$/.test(formData.weight) || Number(formData.weight) <= 0) return "Kilo (kg) sadece sayı olmalıdır.";
    }
    if (currentStep === 4) {
      if (!formData.bio.trim()) return "Biyografi zorunludur.";
      if (!formData.experience.trim() && !cvUrl) return "Deneyim metni boşsa bir CV yükleyin veya metin girin.";
      if (formData.specialties.length === 0) return "En az bir uzmanlık alanı seçin.";
    }
    return null;
  };

  // ---------- Adım geçişleri ----------
  const handleNext = async () => {
    const err = validateCurrentStep();
    if (err) {
      setMsg(err);
      return;
    }
    if ([2, 3, 4].includes(currentStep)) {
      await saveToServer();
    }
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
    if ([2, 3, 4].includes(currentStep)) {
      await saveToServer();
    }
    setCurrentStep((s) => Math.max(1, s - 1));
  };

  const handleSubmit = async () => {
    await saveToServer();
    try {
      await fetch("/api/onboarding/talent/complete", { method: "POST" });
    } finally {
      router.push("/profile");
    }
  };

  // ---------- Fotoğraf değişimi ----------
  function handleAvatarChange(url?: string | null) {
    setFormData((d) => ({ ...d, profilePhotoUrl: url || null }));
  }

  // ---------- İsim/soyisim/şehir normalize ----------
  const onBlurTitleCase = (key: "firstName" | "lastName" | "city") => {
    setFormData((d) => ({ ...d, [key]: toTitleTR(d[key] as string) }));
  };

  // ---------- Telefon: +90 sabit + sağ taraf 10 hane ----------
  const phoneDigits = useMemo(() => onlyLocal10(formData.phone).slice(0, 10), [formData.phone]);
  const phoneBlocks = useMemo(() => formatTRPhoneBlocks(phoneDigits), [phoneDigits]);

  const onPhoneInput = (val: string) => {
    const d = digits(val).slice(0, 10);
    const fmt = formatTRPhoneBlocks(d);
    setFormData((f) => ({ ...f, phone: d ? `+90 ${fmt}` : "" }));
  };

  const blockNonDigitKeys = (e: React.KeyboardEvent<HTMLInputElement>) => {
    const allowed = ["Backspace", "Delete", "ArrowLeft", "ArrowRight", "Tab", "Home", "End"];
    if (allowed.includes(e.key)) return;
    if (!/^\d$/.test(e.key)) e.preventDefault();
  };

  // ---------- CV yükleme (opsiyonel) ----------
  async function handleCvSelect(file?: File) {
    if (!file) return;
    if (file.type !== "application/pdf") {
      setMsg("Sadece PDF dosyası yüklenebilir.");
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      setMsg("CV yüklenemedi: Dosya boyutu 5 MB'ı aşamaz.");
      return;
    }
    setCvUploading(true);
    try {
      const fd = new FormData();
      fd.append("file", file);
      const up = await fetch("/api/upload", { method: "POST", body: fd });
      if (!up.ok) throw new Error("upload failed");
      const data = await up.json(); // { url }
      const url = data.url as string;
      setCvUrl(url);
      // Deneyim metnine ekle (varsa önceki CV satırlarını temizle)
      setFormData((f) => {
        const clean = stripCvLines(f.experience);
        const withCv = `${clean ? clean + "\n\n" : ""}CV: ${url}`;
        return { ...f, experience: withCv };
      });
      setMsg("CV yüklendi.");
    } catch {
      setMsg("CV yüklenemedi.");
    } finally {
      setCvUploading(false);
    }
  }

  function removeCv() {
    setCvUrl(null);
    setFormData((f) => ({ ...f, experience: stripCvLines(f.experience) }));
  }

  // ---------- UI ----------
  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-black via-neutral-900 to-black grid place-items-center">
        <div className="text-white/70">Yükleniyor…</div>
      </div>
    );
  }

  const renderStepContent = () => {
    switch (currentStep) {
      case 1:
        return (
          <div className="space-y-6 text-center" style={{ color: BRAND_CREAM }}>
            <div className="w-20 h-20 rounded-full flex items-center justify-center mx-auto"
                 style={{ backgroundColor: `${BRAND_PRIMARY}22` }}>
              <div className="text-4xl">🔒</div>
            </div>

            <h2 className="text-2xl font-bold">Verileriniz Güvende</h2>

            <p className="text-lg opacity-80">
              Castlyo'da gizliliğiniz bizim önceliğimizdir. İşte size verdiğimiz güvenceler:
            </p>

            <div className="grid gap-6 text-left">
              <div className="rounded-xl p-6 ring-1" style={{ backgroundColor: "#16a34a22", borderColor: "#16a34a33" }}>
                <div className="flex items-start gap-4">
                  <div className="w-12 h-12 rounded-lg grid place-items-center" style={{ backgroundColor: "#16a34a22" }}>
                    <span className="text-2xl">✋</span>
                  </div>
                  <div className="text-green-200">
                    <h3 className="text-lg font-semibold mb-2">Bilgilerin Sadece Onayınla Paylaşılır</h3>
                    <p className="opacity-80">E-posta ve telefon numaranız hiçbir zaman otomatik olarak paylaşılmaz. Her ajansla iletişim için ayrı onayınız alınır.</p>
                  </div>
                </div>
              </div>

              <div className="rounded-xl p-6 ring-1" style={{ backgroundColor: "#3b82f622", borderColor: "#3b82f633" }}>
                <div className="flex items-start gap-4">
                  <div className="w-12 h-12 rounded-lg grid place-items-center" style={{ backgroundColor: "#3b82f622" }}>
                    <span className="text-2xl">👁️</span>
                  </div>
                  <div className="text-blue-200">
                    <h3 className="text-lg font-semibold mb-2">Ajanslar Seni Platform İçinden Görür</h3>
                    <p className="opacity-80">Profilin herkese açık ama iletişim bilgilerin gizli. Ajanslar sadece yeteneklerini, deneyimini ve portföyünü görür.</p>
                  </div>
                </div>
              </div>

              <div className="rounded-xl p-6 ring-1" style={{ backgroundColor: "#8b5cf622", borderColor: "#8b5cf633" }}>
                <div className="flex items-start gap-4">
                  <div className="w-12 h-12 rounded-lg grid place-items-center" style={{ backgroundColor: "#8b5cf622" }}>
                    <span className="text-2xl">⚙️</span>
                  </div>
                  <div className="text-purple-200">
                    <h3 className="text-lg font-semibold mb-2">İstediğin Zaman Onayını Geri Çekebilirsin</h3>
                    <p className="opacity-80">Ayarlar menüsünden izinleri yönetebilir, istediğin zaman ajanslarla paylaşımı durdurabilirsin.</p>
                  </div>
                </div>
              </div>
            </div>

            <div className="rounded-lg p-4 mt-6 ring-1" style={{ backgroundColor: "#eab30822", borderColor: "#eab30833" }}>
              <p className="text-sm text-yellow-200">
                <strong>📋 KVKK Uyumu:</strong> Tüm işlemlerimiz 6698 sayılı Kişisel Verilerin Korunması Kanunu'na uygun olarak gerçekleştirilir.
              </p>
            </div>
          </div>
        );

      case 2:
        return (
          <div className="space-y-4" style={{ color: BRAND_CREAM }}>
            <h2 className="text-2xl font-bold">Hesap Bilgileri</h2>

            {/* AvatarInput içeriğini krem renge çekiyoruz */}
            <div className="[&_*]:!text-[color:var(--cream)] mb-6" style={{ ["--cream" as any]: BRAND_CREAM }}>
              <AvatarInput
                label="Profil Fotoğrafı"
                value={formData.profilePhotoUrl ?? ""}
                onChange={(url) => handleAvatarChange(url)}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium mb-2">Ad</label>
                <Input
                  value={formData.firstName}
                  onChange={(e) => setFormData({ ...formData, firstName: e.target.value })}
                  onBlur={() => onBlurTitleCase("firstName")}
                  className="bg-white/10 border-white/20 placeholder:text-[color:var(--cream)]/60"
                  style={{ color: BRAND_CREAM }}
                  placeholder="Adınız"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">Soyad</label>
                <Input
                  value={formData.lastName}
                  onChange={(e) => setFormData({ ...formData, lastName: e.target.value })}
                  onBlur={() => onBlurTitleCase("lastName")}
                  className="bg-white/10 border-white/20 placeholder:text-[color:var(--cream)]/60"
                  style={{ color: BRAND_CREAM }}
                  placeholder="Soyadınız"
                  required
                />
              </div>
            </div>

            {/* Telefon: +90 sabit + 10 hane (905 bug fix) */}
            <div>
              <label className="block text-sm font-medium mb-2">Telefon Numarası</label>
              <div className="flex rounded-lg overflow-hidden ring-1 ring-white/20">
                <span className="select-none px-3 py-2 bg-white/10" style={{ color: BRAND_CREAM }}>+90</span>
                <input
                  value={phoneBlocks}
                  onChange={(e) => onPhoneInput(e.target.value)}
                  onKeyDown={blockNonDigitKeys}
                  inputMode="numeric"
                  pattern="[0-9]*"
                  placeholder="5xx xxx xx xx"
                  className="flex-1 bg-white/10 px-3 py-2 outline-none"
                  style={{ color: BRAND_CREAM }}
                />
              </div>
              {/* form state tam numarayı şu biçimde tutuyor: "+90 535 535 35 35" */}
              <input type="hidden" value={formData.phone} readOnly />
            </div>

            <div className="rounded-lg p-4 mt-6 ring-1" style={{ backgroundColor: `${BRAND_CREAM}14`, borderColor: `${BRAND_CREAM}33`, color: BRAND_CREAM }}>
              <p className="text-sm">
                <strong>🔒 Gizlilik:</strong> Bu bilgiler sadece profilinizin tamamlanması için gereklidir. İletişim bilgileriniz sadece onayınızla paylaşılır.
              </p>
            </div>
          </div>
        );

      case 3:
        return (
          <div className="space-y-4" style={{ color: BRAND_CREAM }}>
            <h2 className="text-2xl font-bold">Kişisel Bilgiler</h2>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium mb-2">Doğum Tarihi</label>
                <Input
                  type="date"
                  value={formData.dateOfBirth}
                  onChange={(e) => setFormData({ ...formData, dateOfBirth: e.target.value })}
                  className="bg-white/10 border-white/20"
                  style={{ color: BRAND_CREAM }}
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">Cinsiyet</label>
                <select
                  value={formData.gender}
                  onChange={(e) => setFormData({ ...formData, gender: e.target.value })}
                  className="w-full rounded-lg bg-black/40 border border-[color:var(--cream)]/20 px-3 py-2"
                  style={{ color: BRAND_CREAM }}
                >
                  <option value="" className="bg-black" style={{ color: BRAND_CREAM }}>Seçin</option>
                  <option value="MALE" className="bg-black" style={{ color: BRAND_CREAM }}>Erkek</option>
                  <option value="FEMALE" className="bg-black" style={{ color: BRAND_CREAM }}>Kadın</option>
                </select>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">Şehir</label>
              <Input
                value={formData.city}
                onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                onBlur={() => onBlurTitleCase("city")}
                className="bg-white/10 border-white/20 placeholder:text-[color:var(--cream)]/60"
                style={{ color: BRAND_CREAM }}
                placeholder="İstanbul"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium mb-2">Boy (cm)</label>
                <Input
                  type="number"
                  inputMode="numeric"
                  value={formData.height}
                  onChange={(e) => setFormData({ ...formData, height: e.target.value.replace(/\D+/g, "") })}
                  onKeyDown={blockNonDigitKeys}
                  className="bg-white/10 border-white/20 placeholder:text-[color:var(--cream)]/60"
                  style={{ color: BRAND_CREAM }}
                  placeholder="175"
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">Kilo (kg)</label>
                <Input
                  type="number"
                  inputMode="numeric"
                  value={formData.weight}
                  onChange={(e) => setFormData({ ...formData, weight: e.target.value.replace(/\D+/g, "") })}
                  onKeyDown={blockNonDigitKeys}
                  className="bg-white/10 border-white/20 placeholder:text-[color:var(--cream)]/60"
                  style={{ color: BRAND_CREAM }}
                  placeholder="70"
                />
              </div>
            </div>
          </div>
        );

      case 4:
        return (
          <div className="space-y-4" style={{ color: BRAND_CREAM }}>
            <h2 className="text-2xl font-bold">Profesyonel Bilgiler</h2>

            <div>
              <label className="block text-sm font-medium mb-2">Biyografi</label>
              <textarea
                value={formData.bio}
                onChange={(e) => setFormData({ ...formData, bio: e.target.value })}
                className="w-full rounded-lg bg-white/10 border border-white/20 px-3 py-2 min-h-[100px] placeholder:text-[color:var(--cream)]/60"
                style={{ color: BRAND_CREAM }}
                placeholder="Kendinizden bahsedin..."
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">Deneyim</label>
              <textarea
                value={formData.experience}
                onChange={(e) => setFormData({ ...formData, experience: e.target.value })}
                className="w-full rounded-lg bg-white/10 border border-white/20 px-3 py-2 min-h-[100px] placeholder:text-[color:var(--cream)]/60"
                style={{ color: BRAND_CREAM }}
                placeholder="Profesyonel deneyimlerinizi yazın..."
              />
              {/* CV (opsiyonel) */}
              <div className="mt-3 flex flex-wrap items-center gap-3">
                <label
                  className={`cursor-pointer rounded-lg px-3 py-2 text-sm ring-1 ring-white/20 bg-white/10 ${cvUploading ? "opacity-60 pointer-events-none" : ""}`}
                  style={{ color: BRAND_CREAM }}
                  title="PDF yükle"
                >
                  PDF Ekle (≤ 5 MB)
                  <input
                    type="file"
                    accept="application/pdf"
                    className="hidden"
                    onChange={(e) => handleCvSelect(e.target.files?.[0] ?? undefined)}
                  />
                </label>

                {cvUrl && (
                  <>
                    <a href={cvUrl} target="_blank" rel="noreferrer" className="text-sm underline"
                       style={{ color: BRAND_CREAM }}>
                      {filenameFromUrl(cvUrl) || "CV.pdf"}
                    </a>
                    <button type="button" className="text-sm underline opacity-80" onClick={removeCv}
                            style={{ color: BRAND_CREAM }}>
                      Kaldır
                    </button>
                  </>
                )}
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">Uzmanlık Alanları</label>
              <div className="grid grid-cols-2 gap-2">
                {["Oyunculuk", "Modellik", "Müzik", "Dans", "Dublaj", "Tiyatro"].map((specialty) => (
                  <label key={specialty} className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      checked={formData.specialties.includes(specialty)}
                      onChange={(e) => {
                        if (e.target.checked) {
                          setFormData({ ...formData, specialties: [...formData.specialties, specialty] });
                        } else {
                          setFormData({ ...formData, specialties: formData.specialties.filter((s) => s !== specialty) });
                        }
                      }}
                      className="rounded border-white/20 bg-white/10"
                    />
                    <span className="text-sm" style={{ color: BRAND_CREAM }}>{specialty}</span>
                  </label>
                ))}
              </div>
            </div>
          </div>
        );

      case 5:
        return (
          <div className="text-center space-y-6">
            <div className="w-20 h-20 rounded-full flex items-center justify-center mx-auto" style={{ backgroundColor: BRAND_PRIMARY }}>
              <Check className="w-10 h-10 text-white" />
            </div>

            <h2 className="text-3xl font-bold" style={{ color: BRAND_CREAM }}>Tebrikler! 🎉</h2>

            <p className="text-lg opacity-80" style={{ color: BRAND_CREAM }}>
              Profiliniz başarıyla oluşturuldu. Artık casting fırsatlarını keşfetmeye başlayabilirsiniz!
            </p>

            <div className="rounded-lg p-4" style={{ backgroundColor: "#22c55e22", border: "1px solid #22c55e55" }}>
              <p className="text-sm text-green-200">
                <strong>🔒 Gizlilik Güvencesi:</strong> Profiliniz oluşturuldu ancak iletişim bilgileriniz sadece onayınızla ajanslarla
                paylaşılacak. Platform dışında hiçbir şekilde paylaşılmaz.
              </p>
            </div>

            <Button
              onClick={handleSubmit}
              className="w-full text-white font-semibold py-3"
              style={{ backgroundColor: BRAND_PRIMARY }}
            >
              Profilime Git
            </Button>
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-black via-neutral-900 to-black">
      <div className="container mx-auto px-4 py-8">
        {/* Progress Bar */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-4">
            {STEPS.map((step) => (
              <div key={step.id} className={`flex items-center ${step.id < STEPS.length ? "flex-1" : ""}`}>
                <div
                  className="w-10 h-10 rounded-full flex items-center justify-center text-sm font-semibold"
                  style={{
                    backgroundColor:
                      step.id === currentStep
                        ? BRAND_PRIMARY
                        : step.id < currentStep
                        ? "#22c55e"
                        : "rgba(255,255,255,0.08)",
                    color: "#fff",
                  }}
                >
                  {step.id < currentStep ? <Check className="w-5 h-5" /> : step.id}
                </div>

                {step.id < STEPS.length && (
                  <div
                    className="flex-1 h-1 mx-4"
                    style={{ backgroundColor: step.id < currentStep ? "#22c55e" : "rgba(255,255,255,0.1)" }}
                  />
                )}
              </div>
            ))}
          </div>

          <div className="text-center" style={{ color: BRAND_CREAM }}>
            <h3 className="text-lg font-semibold">{STEPS[currentStep - 1]?.title}</h3>
            <p className="text-sm opacity-80">{STEPS[currentStep - 1]?.description}</p>
          </div>
        </div>

        {/* Form Content */}
        <div className="max-w-2xl mx-auto">
          <div
            className="backdrop-blur-lg rounded-2xl border p-8 shadow-2xl"
            style={{ borderColor: "rgba(255,255,255,0.1)", background: "rgba(255,255,255,0.05)", color: BRAND_CREAM }}
          >
            {renderStepContent()}

            {/* Navigation Buttons */}
            {currentStep < 5 && (
              <div className="flex justify-between mt-8 pt-6" style={{ borderTop: "1px solid rgba(255,255,255,0.1)" }}>
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
                >
                  Sonraki
                  <ArrowRight className="w-4 h-4 ml-2" />
                </Button>
              </div>
            )}

            {msg && <div className="mt-3 text-sm" style={{ color: BRAND_CREAM }}>{msg}</div>}
          </div>
        </div>
      </div>
    </div>
  );
}

export default function TalentOnboarding() {
  return (
    <AuthGuard checkOnboardingCompleted={true}>
      <TalentOnboardingContent />
    </AuthGuard>
  );
}

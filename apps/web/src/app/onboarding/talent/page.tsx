"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ArrowLeft, ArrowRight, Check } from "lucide-react";
import { AuthGuard } from "@/components/auth/AuthGuard";
import AvatarInput from "@/components/AvatarInput";

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
  phone: string;
  profilePhotoUrl: string | null;

  // Step 3 - Personal
  dateOfBirth: string;
  gender: string;
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

function TalentOnboardingContent() {
  const router = useRouter();
  const [currentStep, setCurrentStep] = useState(1);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);

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
    // Step 4
    bio: "",
    experience: "",
    skills: [],
    languages: [],
    specialties: [],
  });

  // ---------- Prefill: aynı API ----------
  useEffect(() => {
    (async () => {
      try {
        const res = await fetch("/api/profile/me", { cache: "no-store" });
        const p = await res.json();

        setFormData((prev) => ({
          ...prev,
          firstName: p.firstName ?? "",
          lastName: p.lastName ?? "",
          phone: p.phone ?? "",
          profilePhotoUrl: p.profilePhotoUrl ?? null,
          dateOfBirth: p.personal?.birthDate ?? "",
          gender: p.personal?.gender ?? "",
          city: p.personal?.city ?? "",
          height: p.personal?.heightCm ? String(p.personal.heightCm) : "",
          weight: p.personal?.weightKg ? String(p.personal.weightKg) : "",
          bio: p.professional?.bio ?? "",
          experience: p.professional?.experience ?? "",
          specialties: Array.isArray(p.professional?.specialties) ? p.professional.specialties : [],
        }));
      } catch (e) {
        // sessizce geç
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  // ---------- tek noktadan save (PUT /api/profile/me) ----------
  async function saveToServer() {
    setSaving(true);
    setMsg(null);
    try {
      const payload = {
        firstName: formData.firstName || null,
        lastName: formData.lastName || null,
        phone: formData.phone || null,
        profilePhotoUrl: formData.profilePhotoUrl || null,
        professional: {
          bio: formData.bio || "",
          experience: formData.experience || "",
          specialties: formData.specialties || [],
        },
        personal: {
          city: formData.city || "",
          birthDate: formData.dateOfBirth || "",
          gender: formData.gender || "",
          heightCm: formData.height ? Number(formData.height) : null,
          weightKg: formData.weight ? Number(formData.weight) : null,
        },
      };

      const res = await fetch("/api/profile/me", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (!res.ok) throw new Error("save_failed");
      setMsg("Kaydedildi");
      // Profil sayfası da aynı kaynağı okuyor → yenile
      router.refresh();
    } catch (e) {
      setMsg("Kaydetme hatası");
    } finally {
      setSaving(false);
    }
  }

  // ---------- Adım geçişleri: 2/3/4'te autosave ----------
  const handleNext = async () => {
    if ([2, 3, 4].includes(currentStep)) {
      await saveToServer();
    }
    if (currentStep < STEPS.length) {
      setCurrentStep((s) => s + 1);
    }
  };

  const handlePrevious = async () => {
    // geri giderken kaydetmek istemezsen bu çağrıyı kaldırabilirsin
    if ([2, 3, 4].includes(currentStep)) {
      await saveToServer();
    }
    if (currentStep > 1) {
      setCurrentStep((s) => s - 1);
    }
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
    // İstersen değiştiği anda server'a yaz:
    // void saveToServer();
  }

  // ---------- UI (hiç değiştirmedik) ----------
  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-black grid place-items-center">
        <div className="text-white/70">Yükleniyor…</div>
      </div>
    );
  }

  const renderStepContent = () => {
    switch (currentStep) {
      case 1:
        return (
          <div className="space-y-6 text-center">
            <div className="w-20 h-20 bg-green-500/20 rounded-full flex items-center justify-center mx-auto">
              <div className="text-4xl">🔒</div>
            </div>

            <h2 className="text-2xl font-bold text-white mb-4">Verileriniz Güvende</h2>

            <p className="text-white/70 text-lg mb-8">
              Castlyo'da gizliliğiniz bizim önceliğimizdir. İşte size verdiğimiz güvenceler:
            </p>

            <div className="grid gap-6 text-left">
              <div className="bg-green-500/10 border border-green-500/20 rounded-xl p-6">
                <div className="flex items-start space-x-4">
                  <div className="w-12 h-12 bg-green-500/20 rounded-lg flex items-center justify-center flex-shrink-0">
                    <span className="text-2xl">✋</span>
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold text-green-200 mb-2">Bilgilerin Sadece Onayınla Paylaşılır</h3>
                    <p className="text-green-200/80">E-posta ve telefon numaranız hiçbir zaman otomatik olarak paylaşılmaz. Her ajansla iletişim için ayrı onayınız alınır.</p>
                  </div>
                </div>
              </div>

              <div className="bg-blue-500/10 border border-blue-500/20 rounded-xl p-6">
                <div className="flex items-start space-x-4">
                  <div className="w-12 h-12 bg-blue-500/20 rounded-lg flex items-center justify-center flex-shrink-0">
                    <span className="text-2xl">👁️</span>
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold text-blue-200 mb-2">Ajanslar Seni Platform İçinden Görür</h3>
                    <p className="text-blue-200/80">Profilin herkese açık ama iletişim bilgilerin gizli. Ajanslar sadece yeteneklerini, deneyimini ve portföyünü görür.</p>
                  </div>
                </div>
              </div>

              <div className="bg-purple-500/10 border border-purple-500/20 rounded-xl p-6">
                <div className="flex items-start space-x-4">
                  <div className="w-12 h-12 bg-purple-500/20 rounded-lg flex items-center justify-center flex-shrink-0">
                    <span className="text-2xl">⚙️</span>
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold text-purple-200 mb-2">İstediğin Zaman Onayını Geri Çekebilirsin</h3>
                    <p className="text-purple-200/80">Ayarlar menüsünden izinleri yönetebilir, istediğin zaman ajanslarla paylaşımı durdurabilirsin.</p>
                  </div>
                </div>
              </div>
            </div>

            <div className="bg-yellow-500/10 border border-yellow-500/20 rounded-lg p-4 mt-6">
              <p className="text-sm text-yellow-200"><strong>📋 KVKK Uyumu:</strong> Tüm işlemlerimiz 6698 sayılı Kişisel Verilerin Korunması Kanunu'na uygun olarak gerçekleştirilir.</p>
            </div>
          </div>
        );

      case 2:
        return (
          <div className="space-y-4">
            <h2 className="text-2xl font-bold text-white mb-6">Hesap Bilgileri</h2>

            <div className="mb-6">
              <AvatarInput
                label="Profil Fotoğrafı"
                value={formData.profilePhotoUrl ?? ""}
                onChange={(url) => handleAvatarChange(url)}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-white/90 mb-2">Ad</label>
                <Input
                  value={formData.firstName}
                  onChange={(e) => setFormData({ ...formData, firstName: e.target.value })}
                  className="bg-white/10 border-white/20 text-white placeholder:text-white/50"
                  placeholder="Adınız"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-white/90 mb-2">Soyad</label>
                <Input
                  value={formData.lastName}
                  onChange={(e) => setFormData({ ...formData, lastName: e.target.value })}
                  className="bg-white/10 border-white/20 text-white placeholder:text-white/50"
                  placeholder="Soyadınız"
                  required
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-white/90 mb-2">Telefon Numarası</label>
              <Input
                type="tel"
                value={formData.phone}
                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                className="bg-white/10 border-white/20 text-white placeholder:text-white/50"
                placeholder="+90 5XX XXX XX XX"
              />
            </div>

            <div className="bg-blue-500/10 border border-blue-500/20 rounded-lg p-4 mt-6">
              <p className="text-sm text-blue-200"><strong>🔒 Gizlilik:</strong> Bu bilgiler sadece profilinizin tamamlanması için gereklidir. İletişim bilgileriniz sadece onayınızla paylaşılır.</p>
            </div>
          </div>
        );

      case 3:
        return (
          <div className="space-y-4">
            <h2 className="text-2xl font-bold text-white mb-6">Kişisel Bilgiler</h2>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-white/90 mb-2">Doğum Tarihi</label>
                <Input
                  type="date"
                  value={formData.dateOfBirth}
                  onChange={(e) => setFormData({ ...formData, dateOfBirth: e.target.value })}
                  className="bg-white/10 border-white/20 text-white"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-white/90 mb-2">Cinsiyet</label>
                <select
                  value={formData.gender}
                  onChange={(e) => setFormData({ ...formData, gender: e.target.value })}
                  className="w-full rounded-lg bg-white/10 border border-white/20 text-white px-3 py-2"
                >
                  <option value="">Seçin</option>
                  <option value="MALE">Erkek</option>
                  <option value="FEMALE">Kadın</option>
                  <option value="OTHER">Diğer</option>
                </select>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-white/90 mb-2">Şehir</label>
              <Input
                value={formData.city}
                onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                className="bg-white/10 border-white/20 text-white placeholder:text-white/50"
                placeholder="İstanbul"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-white/90 mb-2">Boy (cm)</label>
                <Input
                  type="number"
                  value={formData.height}
                  onChange={(e) => setFormData({ ...formData, height: e.target.value })}
                  className="bg-white/10 border-white/20 text-white placeholder:text-white/50"
                  placeholder="175"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-white/90 mb-2">Kilo (kg)</label>
                <Input
                  type="number"
                  value={formData.weight}
                  onChange={(e) => setFormData({ ...formData, weight: e.target.value })}
                  className="bg-white/10 border-white/20 text-white placeholder:text-white/50"
                  placeholder="70"
                />
              </div>
            </div>
          </div>
        );

      case 4:
        return (
          <div className="space-y-4">
            <h2 className="text-2xl font-bold text-white mb-6">Profesyonel Bilgiler</h2>

            <div>
              <label className="block text-sm font-medium text-white/90 mb-2">Biyografi</label>
              <textarea
                value={formData.bio}
                onChange={(e) => setFormData({ ...formData, bio: e.target.value })}
                className="w-full rounded-lg bg-white/10 border border-white/20 text-white placeholder:text-white/50 px-3 py-2 min-h-[100px]"
                placeholder="Kendinizden bahsedin..."
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-white/90 mb-2">Deneyim</label>
              <textarea
                value={formData.experience}
                onChange={(e) => setFormData({ ...formData, experience: e.target.value })}
                className="w-full rounded-lg bg-white/10 border border-white/20 text-white placeholder:text-white/50 px-3 py-2 min-h-[100px]"
                placeholder="Profesyonel deneyimlerinizi yazın..."
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-white/90 mb-2">Uzmanlık Alanları</label>
              <div className="grid grid-cols-2 gap-2">
                {["Oyunculuk", "Modellik", "Müzik", "Dans", "Dublaj", "Tiyatro"].map((specialty) => (
                  <label key={specialty} className="flex items-center space-x-2">
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
                    <span className="text-white/80 text-sm">{specialty}</span>
                  </label>
                ))}
              </div>
            </div>
          </div>
        );

      case 5:
        return (
          <div className="text-center space-y-6">
            <div className="w-20 h-20 bg-green-500 rounded-full flex items-center justify-center mx-auto">
              <Check className="w-10 h-10 text-white" />
            </div>

            <h2 className="text-3xl font-bold text-white">Tebrikler! 🎉</h2>

            <p className="text-white/80 text-lg">
              Profiliniz başarıyla oluşturuldu. Artık casting fırsatlarını keşfetmeye başlayabilirsiniz!
            </p>

            <div className="bg-green-500/10 border border-green-500/20 rounded-lg p-4">
              <p className="text-sm text-green-200">
                <strong>🔒 Gizlilik Güvencesi:</strong> Profiliniz oluşturuldu ancak iletişim bilgileriniz sadece onayınızla ajanslarla
                paylaşılacak. Platform dışında hiçbir şekilde paylaşılmaz.
              </p>
            </div>

            <Button
              onClick={handleSubmit}
              className="w-full bg-brand-primary hover:bg-brand-primary/90 text-white font-semibold py-3"
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
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-black">
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <Button variant="ghost" onClick={() => router.back()} className="text-white/70 hover:text-white p-0 h-auto">
            <ArrowLeft className="w-4 h-4 mr-2" />
            Geri Dön
          </Button>

          <div className="text-center">
            <h1 className="text-2xl font-bold text-white">Yetenek Profili Oluştur</h1>
            <p className="text-white/70">
              Adım {currentStep} / {STEPS.length}
            </p>
          </div>

          <div className="w-20" />
        </div>

        {/* Progress Bar */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-4">
            {STEPS.map((step) => (
              <div key={step.id} className={`flex items-center ${step.id < STEPS.length ? "flex-1" : ""}`}>
                <div
                  className={`w-10 h-10 rounded-full flex items-center justify-center text-sm font-semibold ${
                    step.id === currentStep
                      ? "bg-brand-primary text-white"
                      : step.id < currentStep
                      ? "bg-green-500 text-white"
                      : "bg-white/10 text-white/50"
                  }`}
                >
                  {step.id < currentStep ? <Check className="w-5 h-5" /> : step.id}
                </div>

                {step.id < STEPS.length && (
                  <div className={`flex-1 h-1 mx-4 ${step.id < currentStep ? "bg-green-500" : "bg-white/10"}`} />
                )}
              </div>
            ))}
          </div>

          <div className="text-center">
            <h3 className="text-lg font-semibold text-white">{STEPS[currentStep - 1]?.title}</h3>
            <p className="text-white/70 text-sm">{STEPS[currentStep - 1]?.description}</p>
          </div>
        </div>

        {/* Form Content */}
        <div className="max-w-2xl mx-auto">
          <div className="bg-white/5 backdrop-blur-lg rounded-2xl border border-white/10 p-8 shadow-2xl">
            {renderStepContent()}

            {/* Navigation Buttons */}
            {currentStep < 5 && (
              <div className="flex justify-between mt-8 pt-6 border-t border-white/10">
                <Button
                  variant="outline"
                  onClick={handlePrevious}
                  disabled={currentStep === 1}
                  className="border-white/20 text-white hover:bg-white/10"
                >
                  <ArrowLeft className="w-4 h-4 mr-2" />
                  Önceki
                </Button>

                <Button onClick={handleNext} className="bg-brand-primary hover:bg-brand-primary/90 text-white">
                  Sonraki
                  <ArrowRight className="w-4 h-4 ml-2" />
                </Button>
              </div>
            )}

            {msg && <div className="mt-3 text-sm text-white/80">{msg}</div>}
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

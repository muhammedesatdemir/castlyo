'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { ArrowLeft, ArrowRight, Check } from 'lucide-react'
import { AuthGuard } from '@/components/auth/AuthGuard'
import RoleRequired from '@/components/auth/RoleRequired'
import { step1Schema, step2Schema, step3Schema, normalize, Step1, Step2, Step3 } from '@/lib/schemas/agency-onboarding'
import { z } from 'zod'
import '@/styles/onboarding-agency.css'

const STEPS = [
  { id: 1, title: 'Şirket Bilgileri', description: 'Temel şirket bilgilerinizi girin' },
  { id: 2, title: 'İletişim Bilgileri', description: 'İletişim detaylarını tamamlayın' },
  { id: 3, title: 'Belge Yükleme', description: 'Kimlik doğrulama belgesi yükleyin' },
  { id: 4, title: 'Tamamlandı', description: 'Hesabınız aktif!' }
]

type FormData = Step1 & Step2 & Step3

const initial: FormData = {
  agencyName: "",
  companyName: "",
  taxNumber: "",
  about: "",
  website: "",
  contactName: "",
  contactEmail: "",
  contactPhone: "",
  address: "",
  country: "",
  city: "",
  specialties: [] as string[],
  verificationDocKey: "",
}

function AgencyOnboardingContent() {
  const router = useRouter()
  const [step, setStep] = useState<1|2|3>(1)
  const [form, setForm] = useState<FormData>(initial)
  const [errors, setErrors] = useState<Record<string, string[]>>({})
  const [saving, setSaving] = useState(false)
  const [serverError, setServerError] = useState<string|undefined>(undefined)
  const [documentFile, setDocumentFile] = useState<File | null>(null)
  const [uploading, setUploading] = useState(false)
  const [banner, setBanner] = useState<{type:"error"|"success", text:string}|null>(null)

  // 1) PREFILL: kayıtlı veriyi çek ve formu doldur
  useEffect(() => {
    (async () => {
      try {
        const res = await fetch("/api/proxy/api/v1/profiles/agency/me", { credentials: "include" });
        if (!res.ok) return;
        const data = await res.json();
        // API alan adları sizin servisle birebir olmalı:
        setForm(prev => ({
          ...prev,
          agencyName: data.agencyName ?? "",
          companyName: data.companyName ?? "",
          taxNumber: data.taxNumber ?? "",
          about: data.about ?? "",
          website: data.website ?? "",
          contactName: data.contactName ?? "",
          contactEmail: data.contactEmail ?? "",
          contactPhone: data.contactPhone ?? "",
          address: data.address ?? "",
          country: data.country ?? "",
          city: data.city ?? "",
          specialties: Array.isArray(data.specialties) ? data.specialties : [],
          verificationDocKey: data.verificationDocKey ?? "",
        }));
      } catch {}
    })();
  }, []);

  // Clean function to filter undefined values
  function clean<T extends Record<string, any>>(obj: T) {
    return Object.fromEntries(Object.entries(obj).filter(([, v]) => v !== undefined)) as Partial<T>;
  }

  // 2) tek noktadan kaydet
  const saveStep = async (payload: Partial<FormData>) => {
    setSaving(true);
    setServerError(undefined);
    try {
      const res = await fetch("/api/proxy/api/v1/profiles/agency/me", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify(clean(payload as any)),
      });
      if (!res.ok) {
        const txt = await res.text().catch(() => "");
        throw new Error(txt || `Save failed: ${res.status}`);
      }
      return true;
    } catch (e: any) {
      setServerError(e?.message || "Kaydetme hatası");
      return false;
    } finally {
      setSaving(false);
    }
  };

  // 3) "Sonraki" butonu → doğrula → kaydet → adım ilerlet
  const handleNext = async () => {
    setBanner(null);

    const schema = [step1Schema, step2Schema, step3Schema][step - 1];
    const parsed = schema.safeParse(form);

    if (!parsed.success) {
      const fe = parsed.error.flatten().fieldErrors;
      setErrors(fe);
      const count = Object.values(fe).flat().length;
      setBanner({
        type: 'error',
        text: `Bu adımda ${count} eksik/hatalı alan var. Zorunlu alanları doldurmadan ilerleyemezsiniz.`,
      });
      return;                 // <<< ilerlemeyi BLOKLA
    }

    // kayıt olmadan ilerleme yok
    let ok = false;
    if (step === 1) {
      const step1Data = parsed.data as Step1;
      ok = await saveStep({
        agencyName: step1Data.agencyName,
        companyName: step1Data.companyName,
        taxNumber: step1Data.taxNumber,
        about: step1Data.about ?? "",
        website: step1Data.website ?? "",
      });
    } else if (step === 2) {
      const step2Data = parsed.data as Step2;
      ok = await saveStep({
        contactName: step2Data.contactName,
        contactEmail: step2Data.contactEmail,
        contactPhone: step2Data.contactPhone,
        address: step2Data.address,
        country: step2Data.country,
        city: step2Data.city,
      });
    } else if (step === 3) {
      const step3Data = parsed.data as Step3;
      ok = await saveStep({
        specialties: step3Data.specialties,
        verificationDocKey: step3Data.verificationDocKey ?? "",
      });
    }

    if (!ok) {
      setBanner({ type: 'error', text: 'Kaydetme başarısız. Lütfen tekrar deneyin.' });
      return;                 // <<< yine BLOK
    }

    if (step === 3) {
      // başarı: /jobs'a gönder
      router.push("/jobs");
    } else {
      setStep((s) => (s + 1) as 1|2|3);    // sadece başarılıysa ilerle
    }
  }

  const handlePrevious = () => {
    if (step > 1) {
      setStep((s) => (s === 2 ? 1 : 2))
    }
  }

  // file input'tan sonra çağrılacak
  const uploadVerification = async (file: File) => {
    if (!file) return setBanner({ type: 'error', text: 'Lütfen bir PDF dosyası seçin.' });

    const isPdf = file.type === 'application/pdf' || file.name.toLowerCase().endsWith('.pdf');
    if (!isPdf) return setBanner({ type: 'error', text: 'Sadece PDF yükleyebilirsiniz.' });

    try {
      // 1) Presign al
      const res = await fetch('/api/proxy/api/v1/upload/presigned-url', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          fileName: file.name,
          fileType: file.type || 'application/pdf',
          folder: 'documents', // backend enum'a uygun değer
        }),
      });

      const presign = await res.json();
      if (!res.ok) {
        console.error('presign error', presign);
        setBanner({ type: 'error', text: presign?.message || 'Ön imza alınamadı.' });
        return;
      }

      // 2) Yükleme türünü otomatik tespit et
      let uploadOk = false;

      // a) PUT presign (classic)
      if (presign.putUrl) {
        const putUrl = presign.putUrl;
        const putRes = await fetch(putUrl, {
          method: 'PUT',
          headers: { 'content-type': file.type || 'application/pdf' },
          body: file,
        });
        uploadOk = putRes.ok;
        if (!uploadOk) {
          console.error('PUT upload failed', putRes.status, await putRes.text());
        }
      }
      // b) POST policy (S3 form upload)
      else if ((presign.url || presign.uploadUrl) && presign.fields) {
        const postUrl = presign.url ?? presign.uploadUrl; // <- backend 'uploadUrl' veriyorsa onu kullan
        const form = new FormData();
        Object.entries(presign.fields).forEach(([k, v]) => form.append(k, String(v)));
        form.append('file', file);
        const postRes = await fetch(postUrl, { method: 'POST', body: form });
        uploadOk = postRes.ok;
        if (!uploadOk) {
          console.error('POST upload failed', postRes.status, await postRes.text());
        }
      }

      if (!uploadOk) {
        setBanner({ type: 'error', text: 'Dosya S3\'e yüklenemedi.' });
        return;
      }

      // 3) DB'ye anahtarı kaydet
      const key = presign.key || presign.fields?.key; // ikisinden biri gelir
      setForm(prev => ({ ...prev, verificationDocKey: key }));
      await saveStep({ verificationDocKey: key });
      setBanner({ type: 'success', text: 'Belge başarıyla yüklendi.' });
    } catch (e: any) {
      setBanner({ type: 'error', text: e?.message ?? 'Belge yüklenemedi.' });
    }
  }

  const renderStepContent = () => {
    switch (step) {
      case 1:
        return (
          <div className="space-y-4">
            <h2 className="text-2xl font-bold text-white mb-6">Şirket Bilgileri</h2>
            
            <div>
              <label className="block text-sm font-medium text-white/90 mb-2">
                Şirket Adı *
              </label>
              <Input
                value={form.agencyName}
                onChange={(e) => setForm({ ...form, agencyName: e.target.value })}
                className="bg-white/10 border-white/20 text-white placeholder:text-white/50"
                placeholder="ABC Casting Ajansı Ltd. Şti."
                required
              />
              {errors.agencyName?.[0] && <p className="text-red-400 text-sm mt-1">{errors.agencyName[0]}</p>}
            </div>
            
            <div>
              <label className="block text-sm font-medium text-white/90 mb-2">
                Ticari Ünvan *
              </label>
              <Input
                value={form.companyName}
                onChange={(e) => setForm({ ...form, companyName: e.target.value })}
                className="bg-white/10 border-white/20 text-white placeholder:text-white/50"
                placeholder="ABC Casting"
                required
              />
              {errors.companyName?.[0] && <p className="text-red-400 text-sm mt-1">{errors.companyName[0]}</p>}
            </div>
            
            <div>
              <label className="block text-sm font-medium text-white/90 mb-2">
                Vergi Numarası *
              </label>
              <Input
                value={form.taxNumber}
                onChange={(e) => setForm({ ...form, taxNumber: e.target.value })}
                className="bg-white/10 border-white/20 text-white placeholder:text-white/50"
                placeholder="1234567890"
                required
              />
              {errors.taxNumber?.[0] && <p className="text-red-400 text-sm mt-1">{errors.taxNumber[0]}</p>}
            </div>
            
            <div>
              <label className="block text-sm font-medium text-white/90 mb-2">
                Şirket Açıklaması
              </label>
              <textarea
                value={form.about}
                onChange={(e) => setForm({ ...form, about: e.target.value })}
                className="w-full rounded-lg bg-white/10 border border-white/20 text-white placeholder:text-white/50 px-3 py-2 min-h-[100px]"
                placeholder="Şirketiniz hakkında bilgi verin..."
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-white/90 mb-2">
                Website
              </label>
              <Input
                type="url"
                value={form.website}
                onChange={(e) => setForm({ ...form, website: e.target.value })}
                className="bg-white/10 border-white/20 text-white placeholder:text-white/50"
                placeholder="https://www.abccasting.com"
              />
              {errors.website?.[0] && <p className="text-red-400 text-sm mt-1">{errors.website[0]}</p>}
            </div>
          </div>
        )
      
      case 2:
        return (
          <div className="space-y-4">
            <h2 className="text-2xl font-bold text-white mb-6">İletişim Bilgileri</h2>
            
            <div>
              <label className="block text-sm font-medium text-white/90 mb-2">
                İletişim Sorumlusu *
              </label>
              <Input
                value={form.contactName}
                onChange={(e) => setForm({ ...form, contactName: e.target.value })}
                className="bg-white/10 border-white/20 text-white placeholder:text-white/50"
                placeholder="Ahmet Yılmaz"
                required
              />
              {errors.contactName?.[0] && <p className="text-red-400 text-sm mt-1">{errors.contactName[0]}</p>}
            </div>
            
            <div>
              <label className="block text-sm font-medium text-white/90 mb-2">
                İletişim E-postası *
              </label>
              <Input
                type="email"
                value={form.contactEmail}
                onChange={(e) => setForm({ ...form, contactEmail: e.target.value })}
                className="bg-white/10 border-white/20 text-white placeholder:text-white/50"
                placeholder="info@abccasting.com"
                required
              />
              {errors.contactEmail?.[0] && <p className="text-red-400 text-sm mt-1">{errors.contactEmail[0]}</p>}
            </div>
            
            <div>
              <label className="block text-sm font-medium text-white/90 mb-2">
                İletişim Telefonu *
              </label>
              <Input
                type="tel"
                value={form.contactPhone}
                onChange={(e) => setForm({ ...form, contactPhone: e.target.value })}
                className="bg-white/10 border-white/20 text-white placeholder:text-white/50"
                placeholder="+90 212 XXX XX XX"
                required
              />
              {errors.contactPhone?.[0] && <p className="text-red-400 text-sm mt-1">{errors.contactPhone[0]}</p>}
            </div>
            
            <div>
              <label className="block text-sm font-medium text-white/90 mb-2">
                Adres *
              </label>
              <textarea
                value={form.address}
                onChange={(e) => setForm({ ...form, address: e.target.value })}
                className="w-full rounded-lg bg-white/10 border border-white/20 text-white placeholder:text-white/50 px-3 py-2 min-h-[80px]"
                placeholder="Şirket adresinizi girin..."
                required
              />
              {errors.address?.[0] && <p className="text-red-400 text-sm mt-1">{errors.address[0]}</p>}
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-white/90 mb-2">
                  Ülke *
                </label>
                <Input
                  value={form.country}
                  onChange={(e) => setForm({ ...form, country: e.target.value })}
                  className="bg-white/10 border-white/20 text-white placeholder:text-white/50"
                  placeholder="Türkiye"
                  required
                />
                {errors.country?.[0] && <p className="text-red-400 text-sm mt-1">{errors.country[0]}</p>}
              </div>
              <div>
                <label className="block text-sm font-medium text-white/90 mb-2">
                  Şehir *
                </label>
                <Input
                  value={form.city}
                  onChange={(e) => setForm({ ...form, city: e.target.value })}
                  className="bg-white/10 border-white/20 text-white placeholder:text-white/50"
                  placeholder="İstanbul"
                  required
                />
                {errors.city?.[0] && <p className="text-red-400 text-sm mt-1">{errors.city[0]}</p>}
              </div>
            </div>
            
            <div className="bg-blue-500/10 border border-blue-500/20 rounded-lg p-4 mt-6">
              <p className="text-sm text-blue-200">
                <strong>🔒 Gizlilik:</strong> Bu iletişim bilgileri sadece doğrulanmış ajanslar için 
                platform içinde kullanılır ve üçüncü taraflarla paylaşılmaz.
              </p>
            </div>
          </div>
        )
      
      case 3:
        return (
          <div className="space-y-6">
            <h2 className="text-2xl font-bold text-white mb-6">Belge Yükleme</h2>
            
            {/* Specialties */}
            <div>
              <label className="block text-sm font-medium text-white/90 mb-3">
                Hangi alanlarda çalışıyorsunuz? *
              </label>
              <div className="grid grid-cols-2 gap-3">
                {[
                  'Film', 'Dizi', 'Reklam', 'Moda', 
                  'Tiyatro', 'Müzik Videosu', 'Katalog', 'Editorial'
                ].map((specialty) => (
                  <label key={specialty} className="flex items-center space-x-2">
                    <input
                      type="checkbox"
                      className="peer rounded border-white/20 bg-white/10"
                      checked={form.specialties.includes(specialty)}
                      onChange={(e) => {
                        if (e.target.checked) {
                          setForm({
                            ...form,
                            specialties: [...form.specialties, specialty] as string[]
                          })
                        } else {
                          setForm({
                            ...form,
                            specialties: form.specialties.filter(s => s !== specialty) as string[]
                          })
                        }
                      }}
                    />
                    <span className="chip-checkbox-label text-white/80 text-sm px-3 py-1 rounded-full border border-white/20 bg-white/10">{specialty}</span>
                  </label>
                ))}
              </div>
              {errors.specialties?.[0] && <p className="text-red-400 text-sm mt-1">{errors.specialties[0]}</p>}
            </div>

            {/* Single Document Upload */}
            <div className="border-t border-white/10 pt-6">
              <h3 className="text-lg font-semibold text-white mb-4">Kimlik Doğrulama</h3>
              
              <div className="bg-blue-500/10 border border-blue-500/20 rounded-lg p-6">
                <h4 className="text-blue-200 font-medium mb-2">📄 Doğrulama Belgesi</h4>
                <p className="text-blue-200/80 text-sm mb-4">
                  Kimliğinizi doğrulamak için tek bir belge (ör. vergi levhası) yüklemeniz yeterlidir. 
                  Belgeniz arşivlenecek, hesabınız hemen aktif olacaktır.
                </p>
                <div className="border-2 border-dashed border-blue-500/30 rounded-lg p-6 text-center">
                  <div className="text-blue-300 mb-2">📁</div>
                  <p className="text-blue-200 text-sm mb-3">PDF dosyasını sürükleyin veya seçin</p>
                  <input 
                    type="file" 
                    accept=".pdf,application/pdf" 
                    className="mt-2 text-xs text-blue-200"
                    onChange={(e) => {
                      const file = e.target.files?.[0];
                      if (file) {
                        setDocumentFile(file);
                        setUploading(true);
                        uploadVerification(file).finally(() => setUploading(false));
                      }
                    }}
                  />
                  {uploading && (
                    <p className="text-yellow-200 text-sm mt-2">
                      ⏳ Dosya yükleniyor...
                    </p>
                  )}
                  {form.verificationDocKey && !uploading && (
                    <p className="text-green-200 text-sm mt-2">
                      ✓ Dosya yüklendi: {documentFile?.name}
                    </p>
                  )}
                </div>
              </div>
            </div>
          </div>
        )
      
      default:
        return null
    }
  }

  return (
    <div className="onboarding-agency min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-black">
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          {step > 1 ? (
            <Button
              variant="ghost"
              onClick={() => router.back()}
              className="text-white/70 hover:text-white p-0 h-auto"
            >
              <ArrowLeft className="w-4 h-4 mr-2" />
              Geri Dön
            </Button>
          ) : (
            <div className="w-20"> {/* Spacer for Step 1 */}</div>
          )}
          
          <div className="text-center">
            <h1 className="text-2xl font-bold text-white">Ajans Profili Oluştur</h1>
            <p className="text-white/70">Adım {step} / 3</p>
          </div>
          
          <div className="w-20"> {/* Spacer */}</div>
        </div>

        {/* Progress Bar */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-4">
            {[1, 2, 3].map((stepNum) => (
              <div
                key={stepNum}
                className={`flex items-center ${stepNum < 3 ? 'flex-1' : ''}`}
              >
                <div
                  className={`w-10 h-10 rounded-full flex items-center justify-center text-sm font-semibold ${
                    stepNum === step
                      ? 'bg-brand-primary text-white'
                      : stepNum < step
                      ? 'bg-green-500 text-white'
                      : 'bg-white/10 text-white/50'
                  }`}
                >
                  {stepNum < step ? <Check className="w-5 h-5" /> : stepNum}
                </div>
                
                {stepNum < 3 && (
                  <div
                    className={`flex-1 h-1 mx-4 ${
                      stepNum < step ? 'bg-green-500' : 'bg-white/10'
                    }`}
                  />
                )}
              </div>
            ))}
          </div>
          
          <div className="text-center">
            <h3 className="text-lg font-semibold text-white">
              {step === 1 && 'Şirket Bilgileri'}
              {step === 2 && 'İletişim Bilgileri'}
              {step === 3 && 'Belge Yükleme'}
            </h3>
            <p className="text-white/70 text-sm">
              {step === 1 && 'Temel şirket bilgilerinizi girin'}
              {step === 2 && 'İletişim detaylarını tamamlayın'}
              {step === 3 && 'Kimlik doğrulama belgesi yükleyin'}
            </p>
          </div>
        </div>

        {/* Form Content */}
        <div className="max-w-2xl mx-auto">
          <div className="bg-white/5 backdrop-blur-lg rounded-2xl border border-white/10 p-8 shadow-2xl">
            {/* Banner Display */}
            {banner && (
              <div
                className={
                  banner.type === "error"
                    ? "mb-3 rounded-md border border-red-400 bg-red-50 px-3 py-2 text-red-700"
                    : "mb-3 rounded-md border border-emerald-400 bg-emerald-50 px-3 py-2 text-emerald-700"
                }
              >
                {banner.text}
              </div>
            )}

            {/* Server Error Display */}
            {serverError && (
              <div className="bg-red-500/10 border border-red-500/20 rounded-lg p-4 mb-6">
                <p className="text-red-200 text-sm">
                  <strong>Hata:</strong> {serverError}
                </p>
              </div>
            )}
            
            {renderStepContent()}
            
            {/* Navigation Buttons */}
            <div className="mt-6 flex items-center justify-end gap-3">
              {step > 1 && (
                <Button
                  type="button"
                  variant="outline"
                  onClick={handlePrevious}
                  disabled={saving}
                  className="border-white/20 text-white hover:bg-white/10 min-h-[40px] px-4"
                >
                  <ArrowLeft className="w-4 h-4 mr-2" />
                  Önceki
                </Button>
              )}
              <Button
                type="button"
                onClick={handleNext}
                disabled={saving}
                className="bg-brand-primary hover:bg-brand-primary/90 text-white min-h-[40px] px-4 disabled:opacity-50"
              >
                {saving ? "Kaydediliyor…" : step === 3 ? "Bitir" : "Sonraki"}
                <ArrowRight className="w-4 h-4 ml-2" />
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default function AgencyOnboarding() {
  return (
    <AuthGuard checkOnboardingCompleted={true}>
      <RoleRequired required="AGENCY">
        <AgencyOnboardingContent />
      </RoleRequired>
    </AuthGuard>
  )
}

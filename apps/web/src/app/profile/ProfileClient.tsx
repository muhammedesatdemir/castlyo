"use client";

import * as React from "react";
import { useRouter } from "next/navigation";

type Profile = {
  firstName?: string;
  lastName?: string;
  email?: string;
  phone?: string;
  role?: string;
  status?: string;
  lastLogin?: string;
  company?: string | null;
  position?: string | null;
  profilePhotoUrl?: string | null;
  professional?: { specialties?: string[]; bio?: string; experience?: string };
  personal?: { city?: string; birthDate?: string; gender?: string; heightCm?: number; weightKg?: number };
  activities?: { id: string; icon?: string; text: string; when: string }[];
};

export default function ProfileClient(props: {
  initialProfile: Profile;
  theme: { light: string; dark: string; black: string };
}) {
  const { initialProfile, theme } = props;
  const router = useRouter();

  // yalnızca başlık/rozet & chip’ler için hafif state
  const [photoUrl, setPhotoUrl] = React.useState(initialProfile.profilePhotoUrl ?? null);
  const [status, setStatus] = React.useState(initialProfile.status ?? "Aktif");
  const [role] = React.useState(initialProfile.role ?? "Yetenek");
  const chips = (initialProfile.professional?.specialties ?? []).slice(0, 4);

  // --- Uncontrolled refs (odak asla kaybolmaz) ---
  const firstNameRef = React.useRef<HTMLInputElement>(null);
  const lastNameRef  = React.useRef<HTMLInputElement>(null);
  const emailRef     = React.useRef<HTMLInputElement>(null);
  const phoneRef     = React.useRef<HTMLInputElement>(null);

  const cityRef      = React.useRef<HTMLInputElement>(null);
  const genderRef    = React.useRef<HTMLInputElement>(null);
  const birthRef     = React.useRef<HTMLInputElement>(null);
  const heightRef    = React.useRef<HTMLInputElement>(null);
  const weightRef    = React.useRef<HTMLInputElement>(null);

  const bioRef       = React.useRef<HTMLTextAreaElement>(null);
  const expRef       = React.useRef<HTMLTextAreaElement>(null);

  // ilk değerleri doldur
  React.useEffect(() => {
    if (firstNameRef.current) firstNameRef.current.value = initialProfile.firstName ?? "";
    if (lastNameRef.current)  lastNameRef.current.value  = initialProfile.lastName ?? "";
    if (emailRef.current)     emailRef.current.value     = initialProfile.email ?? "";
    if (phoneRef.current)     phoneRef.current.value     = initialProfile.phone ?? "";

    if (cityRef.current)      cityRef.current.value      = initialProfile.personal?.city ?? "";
    if (genderRef.current)    genderRef.current.value    = initialProfile.personal?.gender ?? "";
    if (birthRef.current)     birthRef.current.value     = initialProfile.personal?.birthDate ?? "";

    if (heightRef.current)    heightRef.current.value    = (initialProfile.personal?.heightCm ?? "") as any;
    if (weightRef.current)    weightRef.current.value    = (initialProfile.personal?.weightKg ?? "") as any;

    if (bioRef.current)       bioRef.current.value       = initialProfile.professional?.bio ?? "";
    if (expRef.current)       expRef.current.value       = initialProfile.professional?.experience ?? "";
  }, [initialProfile]);

  const [editing, setEditing] = React.useState(true); // ekranda zaten düzenleme açık gibi, açık başlayalım
  const [saving, setSaving]   = React.useState(false);
  const [msg, setMsg]         = React.useState<string | null>(null);

  // başlıktaki isim göstermesi için “canlı” ama uncontrolled kalalım:
  const displayName = React.useMemo(() => {
    const f = firstNameRef.current?.value ?? initialProfile.firstName ?? "";
    const l = lastNameRef.current?.value ?? initialProfile.lastName ?? "";
    const n = `${f} ${l}`.trim();
    return n || "Ad Soyad";
  }, [initialProfile.firstName, initialProfile.lastName, // ilk mount
      // ref değişince de güncelleyelim
      photoUrl, status, editing]); // cheap invalidation (başlık tekrar render olur)

  const initials = React.useMemo(() => {
    const f = firstNameRef.current?.value?.[0] ?? initialProfile.firstName?.[0] ?? "";
    const l = lastNameRef.current?.value?.[0]  ?? initialProfile.lastName?.[0]  ?? "";
    return ((f + l) || "YP").toUpperCase();
  }, [initialProfile.firstName, initialProfile.lastName, editing, photoUrl]);

  async function handlePhotoChange(file?: File) {
    if (!file) return;
    try {
      const fd = new FormData();
      fd.append("file", file);
      const up = await fetch("/api/upload", { method: "POST", body: fd });
      if (!up.ok) throw new Error("upload failed");
      const data = await up.json(); // { url }
      setPhotoUrl(data.url ?? photoUrl);
      setMsg("Fotoğraf yüklendi.");
    } catch {
      setMsg("Fotoğraf yüklenemedi.");
    }
  }

  async function handleSave() {
    if (saving) return;
    setSaving(true);
    setMsg(null);
    try {
      const payload: Profile = {
        firstName: firstNameRef.current?.value ?? "",
        lastName : lastNameRef.current?.value ?? "",
        email    : emailRef.current?.value ?? "",
        phone    : phoneRef.current?.value ?? "",
        role,
        status,
        profilePhotoUrl: photoUrl ?? undefined,
        professional: {
          bio       : bioRef.current?.value ?? "",
          experience: expRef.current?.value ?? "",
          specialties: initialProfile.professional?.specialties ?? [],
        },
        personal: {
          city    : cityRef.current?.value ?? "",
          gender  : genderRef.current?.value ?? "",
          birthDate: birthRef.current?.value ?? "",
          heightCm: heightRef.current?.value ? Number(heightRef.current.value) : undefined,
          weightKg: weightRef.current?.value ? Number(weightRef.current.value) : undefined,
        },
      };

      const res = await fetch("/api/profile/me", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      if (!res.ok) throw new Error("save failed");

      setMsg("Profil kaydedildi.");
      setEditing(false);
      router.refresh(); // SSR verilerini tazele (UI uncontrolled olduğu için odak bozulmaz)
    } catch {
      setMsg("Kaydetme sırasında hata oluştu.");
    } finally {
      setSaving(false);
    }
  }

  function handleCancel() {
    // formu ilk değerlere geri döndür
    setEditing(false);
    setMsg(null);
    if (firstNameRef.current) firstNameRef.current.value = initialProfile.firstName ?? "";
    if (lastNameRef.current)  lastNameRef.current.value  = initialProfile.lastName ?? "";
    if (emailRef.current)     emailRef.current.value     = initialProfile.email ?? "";
    if (phoneRef.current)     phoneRef.current.value     = initialProfile.phone ?? "";
    if (cityRef.current)      cityRef.current.value      = initialProfile.personal?.city ?? "";
    if (genderRef.current)    genderRef.current.value    = initialProfile.personal?.gender ?? "";
    if (birthRef.current)     birthRef.current.value     = initialProfile.personal?.birthDate ?? "";
    if (heightRef.current)    heightRef.current.value    = (initialProfile.personal?.heightCm ?? "") as any;
    if (weightRef.current)    weightRef.current.value    = (initialProfile.personal?.weightKg ?? "") as any;
    if (bioRef.current)       bioRef.current.value       = initialProfile.professional?.bio ?? "";
    if (expRef.current)       expRef.current.value       = initialProfile.professional?.experience ?? "";
    setPhotoUrl(initialProfile.profilePhotoUrl ?? null);
    setStatus(initialProfile.status ?? "Aktif");
  }

  // küçük yardımcı input (uncontrolled)
  function UField({
    label, type = "text", inputRef, disabled = false, placeholder,
  }: {
    label: string;
    type?: string;
    inputRef: React.RefObject<HTMLInputElement>;
    disabled?: boolean;
    placeholder?: string;
  }) {
    return (
      <div>
        <div className="text-xs opacity-70 mb-1">{label}</div>
        <input
          ref={inputRef}
          type={type}
          placeholder={placeholder}
          disabled={disabled}
          className={`w-full rounded-lg px-3 py-2 ring-1 bg-white ${
            disabled ? "ring-neutral-200/70" : "ring-neutral-300 focus:outline-none focus:ring-2"
          }`}
          style={!disabled ? { borderColor: theme.dark } : undefined}
        />
      </div>
    );
  }

  function KV({ label, children }: { label: string; children: React.ReactNode }) {
    return (
      <div className="flex items-center justify-between gap-4 py-2">
        <span className="text-sm opacity-70">{label}</span>
        <span className="text-sm font-medium">{children}</span>
      </div>
    );
  }

  function Badge({ children, positive }: { children: React.ReactNode; positive?: boolean }) {
    const cls = positive
      ? "bg-green-500/10 text-green-700 ring-green-500/30"
      : "bg-yellow-500/10 text-yellow-700 ring-yellow-500/30";
    return <span className={`px-2 py-0.5 rounded-full text-xs ring-1 ${cls}`}>{children}</span>;
  }

  return (
    <>
      {/* Profil Özeti */}
      <section className="-mt-2 rounded-2xl bg-white border border-neutral-200/70 shadow-sm p-6 md:p-8">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-6">
          <div className="flex items-center gap-4">
            <div className="relative h-20 w-20 rounded-2xl overflow-hidden ring-1 ring-neutral-200/70">
              {photoUrl ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={photoUrl} alt={displayName} className="h-full w-full object-cover" />
              ) : (
                <div className="h-full w-full grid place-items-center text-xl font-bold text-white" style={{ backgroundColor: theme.dark }}>
                  {initials}
                </div>
              )}

              {/* Fotoğraf yükleme */}
              <label
                className="absolute -bottom-3 left-1/2 -translate-x-1/2 text-xs bg-white rounded-full px-2 py-1 shadow cursor-pointer ring-1 ring-neutral-200"
                style={{ color: theme.dark }}
              >
                Fotoğraf Ekle
                <input type="file" accept="image/*" className="hidden"
                  onChange={(e) => handlePhotoChange(e.target.files?.[0] ?? undefined)} />
              </label>
            </div>

            <div>
              <h1 className="text-2xl md:text-3xl font-extrabold tracking-tight text-neutral-900">
                {displayName}
              </h1>
              <p className="opacity-80 mt-1 text-sm">
                {(initialProfile.position || role) ?? "Yetenek"}{initialProfile.company ? ` • ${initialProfile.company}` : ""}
              </p>
              {chips.length > 0 && (
                <div className="mt-2 flex flex-wrap gap-2">
                  {chips.map((c) => (
                    <span key={c} className="px-2.5 py-1 text-xs rounded-full"
                          style={{ border: `1px solid ${theme.dark}`, color: theme.dark, background: "#fff" }}>{c}</span>
                  ))}
                </div>
              )}
            </div>
          </div>

          <div className="flex items-center gap-2">
            {editing ? (
              <>
                <button className="rounded-xl px-3 py-2 text-sm text-white"
                        style={{ backgroundColor: theme.dark }} onClick={handleSave} disabled={saving}>
                  {saving ? "Kaydediliyor..." : "Kaydet"}
                </button>
                <button className="rounded-xl px-3 py-2 text-sm"
                        style={{ border: `1px solid ${theme.black}`, color: theme.black }} onClick={handleCancel}>
                  İptal
                </button>
              </>
            ) : (
              <button className="rounded-xl px-3 py-2 text-sm"
                      style={{ border: `1px solid ${theme.dark}`, color: theme.dark }}
                      onClick={() => setEditing(true)}>
                Hemen Düzenle
              </button>
            )}
            <Badge positive={(status ?? "").toLowerCase() === "aktif"}>{status ?? "—"}</Badge>
          </div>
        </div>

        {msg && <div className="mt-4 text-sm opacity-80">{msg}</div>}
      </section>

      {/* Grid */}
      <section className="mt-6 grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Sol: Kişisel Bilgiler */}
        <div className="lg:col-span-2 rounded-2xl bg-white border border-neutral-200/70 p-6">
          <h2 className="text-lg font-semibold mb-4">Kişisel Bilgiler</h2>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <UField label="Ad"          inputRef={firstNameRef} disabled={!editing} />
            <UField label="Soyad"       inputRef={lastNameRef}  disabled={!editing} />
            <UField label="E-posta"     inputRef={emailRef}     disabled={!editing} type="email" />
            <UField label="Telefon"     inputRef={phoneRef}     disabled={!editing} />
            <UField label="Şehir"       inputRef={cityRef}      disabled={!editing} />
            <UField label="Cinsiyet"    inputRef={genderRef}    disabled={!editing} />
            <UField label="Doğum Tarihi" inputRef={birthRef}    disabled={!editing} type="date" />

            <div className="grid grid-cols-2 gap-4">
              <UField label="Boy (cm)"  inputRef={heightRef} disabled={!editing} type="number" />
              <UField label="Kilo (kg)" inputRef={weightRef} disabled={!editing} type="number" />
            </div>
          </div>

          <div className="my-6 h-px bg-neutral-200/70" />
          <div>
            <div className="text-xs opacity-70 mb-1">Biyografi</div>
            <textarea ref={bioRef} disabled={!editing}
              className={`w-full rounded-lg px-3 py-2 ring-1 bg-white min-h-[80px] ${editing ? "ring-neutral-300 focus:outline-none focus:ring-2" : "ring-neutral-200/70"}`} />
          </div>
          <div className="mt-4">
            <div className="text-xs opacity-70 mb-1">Deneyim</div>
            <textarea ref={expRef} disabled={!editing}
              className={`w-full rounded-lg px-3 py-2 ring-1 bg-white min-h-[80px] ${editing ? "ring-neutral-300 focus:outline-none focus:ring-2" : "ring-neutral-200/70"}`} />
          </div>
        </div>

        {/* Sağ: Hesap & Aktiviteler */}
        <div className="space-y-6">
          <div className="rounded-2xl bg-white border border-neutral-200/70 p-6">
            <h3 className="text-base font-semibold mb-4">Hesap Durumu</h3>
            <KV label="Durum"><Badge positive={(status ?? "").toLowerCase() === "aktif"}>{status ?? "—"}</Badge></KV>
            <KV label="Rol">{role ?? "Yetenek"}</KV>
            <KV label="Son Giriş">{initialProfile.lastLogin ?? "—"}</KV>
          </div>

          <div className="rounded-2xl bg-white border border-neutral-200/70 p-6">
            <h3 className="text-base font-semibold mb-4">Son Aktiviteler</h3>
            <ul className="space-y-3">
              {(initialProfile.activities ?? []).map((a) => (
                <li key={a.id} className="flex items-start gap-3">
                  <span className="mt-0.5">{a.icon ?? "•"}</span>
                  <div>
                    <div className="text-sm">{a.text}</div>
                    <div className="text-xs opacity-70">{a.when}</div>
                  </div>
                </li>
              ))}
              {(initialProfile.activities ?? []).length === 0 && <div className="text-sm opacity-70">Kayıt yok.</div>}
            </ul>
          </div>

          <div className="rounded-2xl text-white p-6" style={{ backgroundColor: theme.dark }}>
            <div className="text-lg font-semibold">Profilini güçlendir</div>
            <p className="text-sm/6 opacity-90 mt-1">Biyografi ve deneyim alanlarını doldurarak seçilme şansını artır.</p>
            {!editing && (
              <button className="mt-4 rounded-xl bg-white text-neutral-900 px-3 py-2 text-sm" onClick={() => setEditing(true)}>
                Hemen Düzenle
              </button>
            )}
          </div>
        </div>
      </section>
    </>
  );
}

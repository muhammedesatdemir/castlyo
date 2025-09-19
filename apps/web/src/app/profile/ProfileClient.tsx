"use client";

import * as React from "react";
import { useSession } from "next-auth/react";
import { GENDER_OPTIONS } from "@/lib/constants";

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
  professional?: {
    specialties?: string[];
    bio?: string;
    experience?: string;
    cvUrl?: string | null;
  };
  personal?: {
    city?: string;
    birthDate?: string;
    gender?: string; // "Kadın" | "Erkek" | ""
    heightCm?: number;
    weightKg?: number;
  };
};

const SPECIALTY_OPTIONS = [
  "Oyunculuk",
  "Tiyatro",
  "Modellik",
  "Müzik",
  "Dans",
  "Dublaj",
];

// ---- helpers ----
const uniq = (xs?: string[] | null) => Array.from(new Set(xs ?? []));

const toTitleTR = (s: string) =>
  (s ?? "")
    .toLocaleLowerCase("tr-TR")
    .split(/\s+/)
    .filter(Boolean)
    .map((w) => w.charAt(0).toLocaleUpperCase("tr-TR") + w.slice(1))
    .join(" ");

const digits = (s: string) => (s ?? "").replace(/\D+/g, "");

const formatTRPhone = (raw10: string) => {
  const d = digits(raw10).slice(0, 10);
  const p: string[] = [];
  if (d.length > 0) p.push(d.slice(0, 3));
  if (d.length > 3) p.push(d.slice(3, 6));
  if (d.length > 6) p.push(d.slice(6, 8));
  if (d.length > 8) p.push(d.slice(8, 10));
  return p.join(" ");
};

// Tek normalize: UI ve API'de enum ("MALE" | "FEMALE" | "") kullan
const normalizeGender = (g?: string): "MALE" | "FEMALE" | "" => {
  const v = (g ?? "").toString().trim().toLowerCase();

  if (["erkek", "e", "m", "male", "man", "bay"].includes(v)) return "MALE";
  if (["kadın", "kadin", "k", "f", "female", "woman", "bayan"].includes(v)) return "FEMALE";

  return "";
};


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

// metinden ilk url’i (http(s) veya /uploads/…) bul
const extractAnyUrl = (text?: string | null) => {
  if (!text) return null;
  const m = text.match(/(https?:\/\/\S+|\/[^\s)]+)/i);
  return m?.[1] ?? null;
};

// deneyim metninden “CV: …” satırlarını kaldır
const stripCvLines = (text?: string | null) =>
  (text ?? "").split(/\r?\n/).filter((l) => !/^CV:\s*/i.test(l.trim())).join("\n").trim();

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

const translateRole = (r?: string | null) => {
  const key = (r ?? "").toUpperCase();
  if (key === "TALENT") return "YETENEK";
  return r ?? "";
};

export default function ProfileClient(props: {
  initialProfile: Profile;
  theme: { light: string; dark: string; black: string };
  onSaved?: (fresh: Profile) => void;
  onDemandRefetch?: () => Promise<void>;
}) {
  const { initialProfile, theme, onSaved, onDemandRefetch } = props;
  const { data: session } = useSession();

  // ---------- Header state ----------
  const [photoUrl, setPhotoUrl] = React.useState(initialProfile.profilePhotoUrl ?? null);
  const [status, setStatus] = React.useState(initialProfile.status ?? "Aktif");
  const [role] = React.useState(initialProfile.role ?? "TALENT");

  // specialties (chip ve checkboxlar aynı state’i kullanır)
  const [selectedSpecs, setSelectedSpecs] = React.useState<string[]>(
    uniq(initialProfile.professional?.specialties)
  );

  // ---------- Refs ----------
  const firstNameRef = React.useRef<HTMLInputElement>(null);
  const lastNameRef = React.useRef<HTMLInputElement>(null);
  const emailRef = React.useRef<HTMLInputElement>(null); // kilitli
  const cityRef = React.useRef<HTMLInputElement>(null);
  const genderRef = React.useRef<HTMLSelectElement>(null);
  const birthRef = React.useRef<HTMLInputElement>(null);
  const heightRef = React.useRef<HTMLInputElement>(null);
  const weightRef = React.useRef<HTMLInputElement>(null);
  const phoneDigitsRef = React.useRef<HTMLInputElement>(null);

  const bioRef = React.useRef<HTMLTextAreaElement>(null);
  const expRef = React.useRef<HTMLTextAreaElement>(null);

  // CV
  const [cvUrl, setCvUrl] = React.useState<string | null>(
    initialProfile.professional?.cvUrl ??
      extractAnyUrl(initialProfile.professional?.experience) ??
      null
  );
  const [cvUploading, setCvUploading] = React.useState(false);

  // ---------- Defaults ----------
  const initialDigitsFromDb = (() => {
    const d = digits(initialProfile.phone ?? "");
    return d.length >= 10 ? d.slice(-10) : d;
  })();

  const [editing, setEditing] = React.useState(false);
  const [saving, setSaving] = React.useState(false);
  const [msg, setMsg] = React.useState<string | null>(null);

  const defaults = React.useMemo(
    () => ({
      firstName: toTitleTR(initialProfile.firstName ?? ""),
      lastName: toTitleTR(initialProfile.lastName ?? ""),
      email: initialProfile.email ?? "",
      city: toTitleTR(initialProfile.personal?.city ?? ""),
      gender: normalizeGender(initialProfile.personal?.gender),
      birth: initialProfile.personal?.birthDate ?? "",
      height: initialProfile.personal?.heightCm ?? "",
      weight: initialProfile.personal?.weightKg ?? "",
      phoneFmt: formatTRPhone(initialDigitsFromDb),
      bio: initialProfile.professional?.bio ?? "",
      exp: stripCvLines(initialProfile.professional?.experience), // CV satırı gizlendi
    }),
    [initialProfile, initialDigitsFromDb]
  );

  // Session mailini kilitli inputa yaz
  React.useEffect(() => {
    const mail = session?.user?.email;
    if (mail && emailRef.current) emailRef.current.value = mail;
  }, [session?.user?.email]);

  const displayName = React.useMemo(() => {
    const f = firstNameRef.current?.value ?? defaults.firstName;
    const l = lastNameRef.current?.value ?? defaults.lastName;
    const n = `${f} ${l}`.trim();
    return n || "Ad Soyad";
  }, [defaults.firstName, defaults.lastName, photoUrl, status, editing]);

  const initials = React.useMemo(() => {
    const f = (firstNameRef.current?.value ?? defaults.firstName)?.[0] ?? "";
    const l = (lastNameRef.current?.value ?? defaults.lastName)?.[0] ?? "";
    return ((f + l) || "YP").toUpperCase();
  }, [defaults.firstName, defaults.lastName, editing, photoUrl]);

  // ---------- Normalizasyon ----------
  const normalizeNameRef = (ref: React.RefObject<HTMLInputElement>) => {
    if (ref.current) ref.current.value = toTitleTR(ref.current.value);
  };
  const numericOnly = (e: React.FormEvent<HTMLInputElement>) => {
    const el = e.currentTarget;
    el.value = el.value.replace(/\D+/g, "");
  };
  const blockNonDigitKeys = (e: React.KeyboardEvent<HTMLInputElement>) => {
    const allowed = ["Backspace", "Delete", "ArrowLeft", "ArrowRight", "Tab"];
    if (allowed.includes(e.key)) return;
    if (!/^\d$/.test(e.key)) e.preventDefault();
  };
  const onPhoneInput = (e: React.FormEvent<HTMLInputElement>) => {
    const el = e.currentTarget;
    const d = digits(el.value).slice(0, 10);
    el.value = formatTRPhone(d);
  };

  // ---------- Fotoğraf ----------
  const fileInputRef = React.useRef<HTMLInputElement>(null);
  async function handlePhotoChange(file?: File) {
    if (!editing || !file) return;
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
  function removePhoto() {
    if (!editing) return;
    setPhotoUrl(null);
    setMsg("Fotoğraf kaldırıldı.");
  }

  // ---------- CV ----------
  async function handleCvSelect(file?: File) {
    if (!file) return;
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
      setCvUrl(toAbsoluteUrl(data.url) ?? null);
      setMsg("CV yüklendi.");
    } catch {
      setMsg("CV yüklenemedi.");
    } finally {
      setCvUploading(false);
    }
  }

  // ---------- Kaydet ----------
  async function handleSave() {
    if (saving) return;
    setSaving(true);
    setMsg(null);
    try {
      normalizeNameRef(firstNameRef);
      normalizeNameRef(lastNameRef);
      normalizeNameRef(cityRef);

      const phoneDigits = digits(phoneDigitsRef.current?.value ?? "").slice(0, 10);
      const phoneFmt = formatTRPhone(phoneDigits);
      const phoneFinal = phoneDigits ? `+90 ${phoneFmt}` : "";

      // CV linkini mutlaklaştır ve Deneyim içine ek (backend cvUrl desteklemese de DB’de kalsın)
      const cvAbs = toAbsoluteUrl(cvUrl);
      let experienceToSave = expRef.current?.value ?? "";
      if (cvAbs && !experienceToSave.includes(cvAbs)) {
        experienceToSave = `${experienceToSave.trim()}\n\nCV: ${cvAbs}`.trim();
      }

      const payload: Profile = {
        firstName: firstNameRef.current?.value ?? "",
        lastName: lastNameRef.current?.value ?? "",
        // email kilitli olduğundan payload'a yazmıyoruz
        phone: phoneFinal,
        role,
        status,
        profilePhotoUrl: photoUrl ?? null,
        professional: {
          bio: (bioRef.current?.value ?? "").trim(),
          experience: experienceToSave,
          specialties: selectedSpecs, // <-- güncel seçimler
          cvUrl: cvAbs ?? undefined,
        },
        personal: {
          city: cityRef.current?.value ?? "",
          gender: genderRef.current?.value ?? "",
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

      const fresh: Profile = await fetch("/api/profile/me", { cache: "no-store" }).then((r) =>
        r.json()
      );

      // rehydrate
      if (firstNameRef.current) firstNameRef.current.value = toTitleTR(fresh.firstName ?? "");
      if (lastNameRef.current) lastNameRef.current.value = toTitleTR(fresh.lastName ?? "");
      if (emailRef.current) emailRef.current.value = session?.user?.email ?? fresh.email ?? defaults.email;
      if (cityRef.current) cityRef.current.value = toTitleTR(fresh.personal?.city ?? "");
      if (genderRef.current) genderRef.current.value = normalizeGender(fresh.personal?.gender);
      if (birthRef.current) birthRef.current.value = fresh.personal?.birthDate ?? "";
      if (heightRef.current) heightRef.current.value = (fresh.personal?.heightCm ?? "") as any;
      if (weightRef.current) weightRef.current.value = (fresh.personal?.weightKg ?? "") as any;
      if (phoneDigitsRef.current) {
        const d = digits(fresh.phone ?? "").slice(-10);
        phoneDigitsRef.current.value = formatTRPhone(d);
      }
      if (bioRef.current) bioRef.current.value = fresh.professional?.bio ?? "";
      if (expRef.current) expRef.current.value = stripCvLines(fresh.professional?.experience);

      setSelectedSpecs(uniq(fresh.professional?.specialties));
      const freshCv = fresh.professional?.cvUrl ?? extractAnyUrl(fresh.professional?.experience) ?? null;
      setCvUrl(toAbsoluteUrl(freshCv));

      setPhotoUrl(fresh.profilePhotoUrl ?? null);
      setStatus(fresh.status ?? "Aktif");

      onSaved?.(fresh);
      await onDemandRefetch?.();

      setMsg("Profil kaydedildi.");
      setEditing(false);
    } catch {
      setMsg("Kaydetme sırasında hata oluştu.");
    } finally {
      setSaving(false);
    }
  }

  function handleCancel() {
    setEditing(false);
    setMsg(null);
    if (firstNameRef.current) firstNameRef.current.value = defaults.firstName;
    if (lastNameRef.current) lastNameRef.current.value = defaults.lastName;
    if (emailRef.current) emailRef.current.value = session?.user?.email ?? defaults.email;
    if (cityRef.current) cityRef.current.value = defaults.city;
    if (genderRef.current) genderRef.current.value = defaults.gender;
    if (birthRef.current) birthRef.current.value = defaults.birth;
    if (heightRef.current) heightRef.current.value = (defaults.height as any);
    if (weightRef.current) weightRef.current.value = (defaults.weight as any);
    if (phoneDigitsRef.current) phoneDigitsRef.current.value = defaults.phoneFmt;
    if (bioRef.current) bioRef.current.value = defaults.bio;
    if (expRef.current) expRef.current.value = defaults.exp;
    setPhotoUrl(initialProfile.profilePhotoUrl ?? null);
    setStatus(initialProfile.status ?? "Aktif");
    setCvUrl(
      toAbsoluteUrl(
        initialProfile.professional?.cvUrl ?? extractAnyUrl(initialProfile.professional?.experience) ?? null
      )
    );
    setSelectedSpecs(uniq(initialProfile.professional?.specialties));
  }

  // ---------- Small UI helpers ----------
  function UField({
    label,
    type = "text",
    inputRef,
    disabled = false,
    placeholder,
    defaultValue,
    onBlur,
    min,
    max,
    readOnly,
  }: {
    label: string;
    type?: string;
    inputRef: React.RefObject<HTMLInputElement>;
    disabled?: boolean;
    placeholder?: string;
    defaultValue?: string | number;
    onBlur?: () => void;
    min?: number;
    max?: number;
    readOnly?: boolean;
  }) {
    return (
      <div>
        <div className="text-xs opacity-70 mb-1">{label}</div>
        <input
          ref={inputRef}
          type={type}
          placeholder={placeholder}
          disabled={disabled}
          readOnly={readOnly}
          defaultValue={defaultValue}
          onBlur={onBlur}
          onInput={type === "number" ? numericOnly : undefined}
          onKeyDown={type === "number" ? blockNonDigitKeys : undefined}
          inputMode={type === "number" ? "numeric" : undefined}
          pattern={type === "number" ? "[0-9]*" : undefined}
          min={min}
          max={max}
          className={`w-full rounded-lg px-3 py-2 ring-1 bg-white ${
            disabled ? "ring-neutral-200/70" : "ring-neutral-300 focus:outline-none focus:ring-2"
          }`}
        />
      </div>
    );
  }

  function Badge({ children, positive }: { children: React.ReactNode; positive?: boolean }) {
    const cls = positive
      ? "bg-green-500/10 text-green-700 ring-green-500/30"
      : "bg-yellow-500/10 text-yellow-700 ring-yellow-500/30";
    return <span className={`px-2 py-0.5 rounded-full text-xs ring-1 ${cls}`}>{children}</span>;
  }

  // checkbox handler
  const toggleSpec = (name: string) =>
    setSelectedSpecs((prev) => (prev.includes(name) ? prev.filter((x) => x !== name) : [...prev, name]));

  // üstteki rozetler: seçili specialties
  const chips = selectedSpecs.slice(0, 6);

  return (
    <>
      {/* Üst profil özeti */}
      <section className="-mt-2 rounded-2xl bg-white border border-neutral-200/70 shadow-sm p-6 md:p-8">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-6">
          <div className="flex items-center gap-4">
            {/* Avatar + alt butonlar */}
            <div className="flex flex-col items-center">
              <div className="h-20 w-20 rounded-2xl overflow-hidden ring-1 ring-neutral-200/70">
                {photoUrl ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={photoUrl} alt={displayName} className="h-full w-full object-cover" />
                ) : (
                  <div
                    className="h-full w-full grid place-items-center text-xl font-bold text-white"
                    style={{ backgroundColor: theme.dark }}
                  >
                    {initials}
                  </div>
                )}
              </div>

              {editing && (
                <>
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={(e) => handlePhotoChange(e.target.files?.[0] ?? undefined)}
                  />
                  {/* w-36 => iki buton yan yana, taşıma yok */}
                  <div className="mt-2 grid grid-cols-2 gap-2 w-36">
                    <button
                      type="button"
                      className="text-xs rounded-md px-0 py-1 bg-white/90 ring-1 ring-neutral-300 whitespace-nowrap"
                      onClick={() => fileInputRef.current?.click()}
                    >
                      Değiştir
                    </button>
                    <button
                      type="button"
                      className="text-xs rounded-md px-0 py-1 bg-white/90 ring-1 ring-neutral-300 disabled:opacity-50"
                      onClick={removePhoto}
                      disabled={!photoUrl}
                    >
                      Kaldır
                    </button>
                  </div>
                </>
              )}
            </div>

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

          <div className="flex items-center gap-2">
            <Badge positive={(status ?? "").toLowerCase() === "aktif"}>{status ?? "—"}</Badge>
          </div>
        </div>

        {msg && <div className="mt-4 text-sm opacity-80">{msg}</div>}
      </section>

      {/* Grid */}
      <section className="mt-6 grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Sol: Kişisel & Profesyonel Bilgiler */}
        <div className="lg:col-span-2 rounded-2xl bg-white border border-neutral-200/70 p-6">
          <h2 className="text-lg font-semibold mb-4">Kişisel Bilgiler</h2>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <UField
              label="Ad"
              inputRef={firstNameRef}
              disabled={!editing}
              defaultValue={defaults.firstName}
              onBlur={() => normalizeNameRef(firstNameRef)}
            />
            <UField
              label="Soyad"
              inputRef={lastNameRef}
              disabled={!editing}
              defaultValue={defaults.lastName}
              onBlur={() => normalizeNameRef(lastNameRef)}
            />
            <UField
              label="E-posta"
              inputRef={emailRef}
              disabled
              readOnly
              type="email"
              defaultValue={session?.user?.email ?? defaults.email}
            />

            {/* Telefon */}
            <div>
              <div className="text-xs opacity-70 mb-1">Telefon</div>
              <div className={`flex rounded-lg ring-1 ${editing ? "ring-neutral-300" : "ring-neutral-200/70"} bg-white`}>
                <span className="select-none px-3 py-2 bg-neutral-50 text-neutral-700 rounded-l-lg border-r border-neutral-200/70">
                  +90
                </span>
                <input
                  ref={phoneDigitsRef}
                  disabled={!editing}
                  inputMode="numeric"
                  pattern="[0-9]*"
                  placeholder="5xx xxx xx xx"
                  defaultValue={defaults.phoneFmt}
                  onInput={onPhoneInput}
                  onKeyDown={blockNonDigitKeys}
                  className="flex-1 rounded-r-lg px-3 py-2 outline-none"
                />
              </div>
            </div>

            <UField
              label="Şehir"
              inputRef={cityRef}
              disabled={!editing}
              defaultValue={defaults.city}
              onBlur={() => normalizeNameRef(cityRef)}
            />

            {/* Cinsiyet */}
            <div>
              <div className="text-xs opacity-70 mb-1">Cinsiyet</div>
              <select
                ref={genderRef}
                defaultValue={defaults.gender}
                disabled={!editing}
                className={`w-full rounded-lg px-3 py-2 ring-1 bg-white ${editing ? "ring-neutral-300 focus:outline-none focus:ring-2" : "ring-neutral-200/70"}`}
              >
                <option value=""></option>
                {GENDER_OPTIONS.map((opt) => (
                  <option key={opt.value} value={opt.value}>{opt.label}</option>
                ))}
              </select>
            </div>

            <UField label="Doğum Tarihi" inputRef={birthRef} disabled={!editing} type="date" defaultValue={defaults.birth} />
            <UField label="Boy (cm)" inputRef={heightRef} disabled={!editing} type="number" defaultValue={defaults.height} min={0} max={300} />
            <UField label="Kilo (kg)" inputRef={weightRef} disabled={!editing} type="number" defaultValue={defaults.weight} min={0} max={400} />
          </div>

          <div className="my-6 h-px bg-neutral-200/70" />
          <div>
            <div className="text-xs opacity-70 mb-1">Biyografi</div>
            <textarea
              ref={bioRef}
              disabled={!editing}
              defaultValue={defaults.bio}
              className={`w-full rounded-lg px-3 py-2 ring-1 bg-white min-h-[80px] ${editing ? "ring-neutral-300 focus:outline-none focus:ring-2" : "ring-neutral-200/70"}`}
            />
          </div>

          <div className="mt-4">
            <div className="text-xs opacity-70 mb-1">Deneyim</div>
            <textarea
              ref={expRef}
              disabled={!editing}
              defaultValue={defaults.exp}
              className={`w-full rounded-lg px-3 py-2 ring-1 bg-white min-h-[80px] ${editing ? "ring-neutral-300 focus:outline-none focus:ring-2" : "ring-neutral-200/70"}`}
            />

            {/* CV (PDF ≤ 5 MB) */}
            <div className="mt-3 flex flex-wrap items-center gap-3">
              <label
                className={`cursor-pointer rounded-lg px-3 py-2 text-sm ring-1 ring-neutral-300 bg-white ${!editing || cvUploading ? "opacity-60 pointer-events-none" : ""}`}
                title="PDF yükle"
              >
                PDF Ekle (≤ 5 MB)
                <input type="file" accept="application/pdf" className="hidden" onChange={(e) => handleCvSelect(e.target.files?.[0] ?? undefined)} />
              </label>

              {cvUrl && (
                <>
                  <a href={toAbsoluteUrl(cvUrl) ?? "#"} target="_blank" rel="noreferrer" className="text-sm underline" download>
                    {filenameFromUrl(cvUrl) || "CV.pdf"}
                  </a>
                  <button type="button" className="text-sm underline" onClick={() => setCvUrl(null)} disabled={!editing}>
                    Kaldır
                  </button>
                </>
              )}
            </div>
          </div>

          {/* Uzmanlık Alanları */}
          <div className="mt-6">
            <div className="text-lg font-semibold mb-2">Uzmanlık Alanları</div>

            {!editing ? (
              <div className="flex flex-wrap gap-2">
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
                      <input id={id} type="checkbox" className="size-4" checked={checked} onChange={() => toggleSpec(opt)} />
                      <span className="text-sm">{opt}</span>
                    </label>
                  );
                })}
              </div>
            )}
          </div>
        </div>

        {/* Sağ: Turuncu CTA + Eylemler */}
        <div className="space-y-6">
          <div className="rounded-2xl text-white p-6" style={{ backgroundColor: theme.dark }}>
            <div className="text-lg font-semibold">Profilini güçlendir</div>
            <p className="text-sm/6 opacity-90 mt-1">Biyografi ve deneyim alanlarını doldurarak seçilme şansını artır.</p>

            {msg && <div className="mt-3 text-sm bg-white/10 rounded-md px-3 py-2">{msg}</div>}

            {!editing ? (
              <button
                className="mt-4 rounded-xl bg-white text-neutral-900 px-3 py-2 text-sm"
                onClick={() => {
                  setEditing(true);
                  setTimeout(() => firstNameRef.current?.focus(), 0);
                }}
              >
                Hemen Düzenle
              </button>
            ) : (
              <div className="mt-4 flex items-center gap-2">
                <button className="rounded-xl bg-white text-neutral-900 px-3 py-2 text-sm" onClick={handleSave} disabled={saving}>
                  {saving ? "Kaydediliyor..." : "Kaydet"}
                </button>
                <button className="rounded-xl px-3 py-2 text-sm bg-transparent ring-1 ring-white/70 text-white" onClick={handleCancel}>
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

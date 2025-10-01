"use client";
import { useRef, useState } from "react";

type Props = {
  value?: string | null;
  onChange: (url: string | null) => void;
  label?: string;
};

export default function AvatarInput({ value, onChange, label = "Profil Fotoğrafı" }: Props) {
  const [preview, setPreview] = useState<string | null>(value ?? null);
  const [busy, setBusy] = useState(false);
  const inp = useRef<HTMLInputElement>(null);

  async function selectFile(e: React.ChangeEvent<HTMLInputElement>) {
    const f = e.target.files?.[0];
    if (!f) return;
    if (!["image/jpeg","image/png","image/webp"].includes(f.type)) {
      alert("JPEG/PNG/WEBP yükleyin."); return;
    }
    if (f.size > 5 * 1024 * 1024) { alert("Maksimum 5 MB."); return; }

    const localUrl = URL.createObjectURL(f);
    setPreview(localUrl);
    setBusy(true);
    try {
      // Use presigned upload helper aligned with /api/v1
      const mod: any = await import("@/lib/upload");
      const { fileUrl } = await mod.uploadAvatar(f);
      onChange(fileUrl as string);
    } catch (err) {
      URL.revokeObjectURL(localUrl);
      setPreview(value ?? null);
      onChange(value ?? null);
      alert("Yükleme sırasında bir hata oluştu.");
    } finally {
      setBusy(false);
      if (inp.current) inp.current.value = "";
    }
  }

  return (
    <div className="space-y-2">
      <label className="block text-sm font-medium opacity-90">{label}</label>

      <div className="flex items-center gap-4">
        <div className="w-24 h-24 rounded-full bg-white/5 overflow-hidden ring-1 ring-white/10">
          {preview ? (
            <img src={preview} alt="Profil fotoğrafı" className="w-full h-full object-cover" />
          ) : (
            <div className="w-full h-full flex items-center justify-center text-xs opacity-60">Fotoğraf</div>
          )}
        </div>

        <div className="flex gap-2">
          <button type="button" className="px-3 py-2 rounded-md bg-white/10 hover:bg-white/15"
                  onClick={() => inp.current?.click()} disabled={busy}>
            Değiştir
          </button>
          <button type="button" className="px-3 py-2 rounded-md bg-white/5 hover:bg-white/10"
                  onClick={() => { setPreview(null); onChange(null); }} disabled={busy}>
            Kaldır
          </button>
        </div>
      </div>

      <input ref={inp} type="file" accept="image/jpeg,image/png,image/webp" className="hidden" onChange={selectFile}/>
    </div>
  );
}



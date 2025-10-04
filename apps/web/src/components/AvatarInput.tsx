"use client";
import { useRef, useState } from "react";
import { useSession } from "next-auth/react";

type Props = {
  value?: string | null;
  onChange: (url: string | null) => void;
  label?: string;
  profile?: { id?: string; talent_profile_id?: string };
};

export default function AvatarInput({ value, onChange, label = "Profil Fotoğrafı", profile }: Props) {
  const { data: session } = useSession();
  const [preview, setPreview] = useState<string | null>(value ?? null);
  const [busy, setBusy] = useState(false);
  const inp = useRef<HTMLInputElement>(null);

  async function selectFile(e: React.ChangeEvent<HTMLInputElement>) {
    const f = e.target.files?.[0];
    if (!f) return;
    if (!["image/jpeg","image/png","image/webp"].includes(f.type)) {
      alert("JPEG/PNG/WEBP yükleyin."); return;
    }
    if (f.size > 2 * 1024 * 1024) { alert("Maksimum 2 MB."); return; }

    const localUrl = URL.createObjectURL(f);
    setPreview(localUrl);
    setBusy(true);
    try {
      // Get correct profile ID - talent_profile_id is what we need
      const profileId = 
        profile?.id || 
        profile?.talent_profile_id || 
        session?.user?.talent_profile_id;
      
      if (!profileId) {
        // Fallback: try to get from user API
        const userRes = await fetch("/api/proxy/api/v1/users/me", { credentials: "include" });
        if (!userRes.ok) throw new Error("Kullanıcı bilgisi alınamadı");
        const user = await userRes.json();
        const fallbackProfileId = user.talent_profile_id;
        if (!fallbackProfileId) throw new Error("Talent profil ID bulunamadı. Lütfen önce profilinizi oluşturun.");
        return await uploadWithProfileId(f, fallbackProfileId);
      }

      await uploadWithProfileId(f, profileId);
    } catch (err) {
      console.error("Avatar upload error:", err);
      URL.revokeObjectURL(localUrl);
      setPreview(value ?? null);
      onChange(value ?? null);
      alert(`Yükleme sırasında hata: ${err instanceof Error ? err.message : "Bilinmeyen hata"}`);
    } finally {
      setBusy(false);
      if (inp.current) inp.current.value = "";
    }
  }

  async function uploadWithProfileId(file: File, profileId: string) {
    // Use new presigned upload with profile fallbacks
    const { uploadFileWithPresigned, saveProfileAvatar } = await import("@/lib/upload-presigned");
    
    const fileUrl = await uploadFileWithPresigned(file, profileId, "profile_image", "profiles");
    await saveProfileAvatar(fileUrl);
    
    onChange(fileUrl);
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



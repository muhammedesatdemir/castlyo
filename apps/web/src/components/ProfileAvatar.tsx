"use client";
import { useRef } from "react";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";

export function ProfileHeader({
  photoUrl,
  initials,
  editing,
  onChangePhoto,
  onRemovePhoto,
}: {
  photoUrl?: string | null;
  initials: string;
  editing: boolean;
  onChangePhoto: (f: File) => void;
  onRemovePhoto: () => void;
}) {
  const fileRef = useRef<HTMLInputElement>(null);

  return (
    <div className="flex flex-col items-center">
      <Avatar className="h-20 w-20 ring-1 ring-slate-200">
        <AvatarImage src={photoUrl ?? undefined} alt="" />
        <AvatarFallback className="text-lg">{initials}</AvatarFallback>
      </Avatar>

      {/* buton satırı: yüksekliği sabit, görünürlük toggle */}
      <div className="mt-2 h-9">
        <div className={editing ? "flex gap-2" : "invisible flex gap-2"}>
          <Button
            size="sm"
            variant="secondary"
            className="!bg-white !text-slate-800 hover:!bg-white"
            onClick={() => fileRef.current?.click()}
          >
            Değiştir
          </Button>
          <Button
            size="sm"
            variant="outline"
            className="!text-slate-800"
            disabled={!photoUrl}
            onClick={onRemovePhoto}
          >
            Kaldır
          </Button>
        </div>
      </div>

      <input
        ref={fileRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={(e) => {
          const f = e.currentTarget.files?.[0];
          if (f) onChangePhoto(f);
          e.currentTarget.value = "";
        }}
      />
    </div>
  );
}

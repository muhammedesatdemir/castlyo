"use client";

import { useForm } from "react-hook-form";
// import AvatarUploader from "@/components/AvatarUploader";

type FormValues = {
  firstName: string;
  lastName: string;
  phone: string;
  profilePhotoUrl: string | null; // YENİ
};

export default function Step2Account() {
  const { register, handleSubmit, setValue, watch, formState } = useForm<FormValues>({
    defaultValues: {
      firstName: "",
      lastName: "",
      phone: "",
      profilePhotoUrl: null,
    },
  });

  const onSubmit = async (data: FormValues) => {
    // mevcut submit akışınız (API’ye gönderin)
    // await fetch("/api/onboarding/step-2", { method: "POST", body: JSON.stringify(data) })
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
      {/* YENİ: Avatar */}
      {/* <AvatarUploader
        value={watch("profilePhotoUrl")}
        onChange={(url) => setValue("profilePhotoUrl", url, { shouldDirty: true })}
      /> */}

      {/* Mevcut alanlar */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <input {...register("firstName", { required: true })} placeholder="Adınız" />
        <input {...register("lastName", { required: true })} placeholder="Soyadınız" />
      </div>

      <input {...register("phone", { required: true })} placeholder="+90 5XX XXX XX XX" />

      <div className="flex justify-end">
        <button className="px-4 py-2 rounded-md bg-orange-600 hover:bg-orange-700" type="submit">
          Sonraki
        </button>
      </div>
    </form>
  );
}

import { z } from "zod";

export const step1Schema = z.object({
  agencyName: z.string().trim().min(2, "Şirket adı zorunludur"),
  companyName: z.string().trim().min(2, "Ticari unvan zorunludur"),
  taxNumber: z.string().trim().min(6, "Vergi numarası zorunludur"),
  about: z.string().trim().optional(),
  website: z.string().trim().url("Geçerli bir URL girin").optional().or(z.literal("")),
});

export const step2Schema = z.object({
  contactName: z.string().trim().min(2, "İletişim sorumlusu zorunludur"),
  contactEmail: z.string().trim().email("Geçerli bir e-posta girin"),
  contactPhone: z.string().trim().min(6, "Telefon zorunludur"),
  address: z.string().trim().min(5, "Adres zorunludur"),
  country: z.string().trim().min(2, "Ülke zorunludur"),
  city: z.string().trim().min(2, "Şehir zorunludur"),
});

export const step3Schema = z.object({
  specialties: z.array(z.string()).min(1, "En az bir alan seçin"),
  verificationDocKey: z.string().trim().optional(), // PDF yüklenince dolacak
});

export type Step1 = z.infer<typeof step1Schema>;
export type Step2 = z.infer<typeof step2Schema>;
export type Step3 = z.infer<typeof step3Schema>;

// boş stringleri backend'e null gönder
export const normalize = (obj: Record<string, any>) =>
  Object.fromEntries(
    Object.entries(obj).map(([k, v]) => [k, typeof v === "string" && v.trim() === "" ? null : v])
  );

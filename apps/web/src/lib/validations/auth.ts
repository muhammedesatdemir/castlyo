import { z } from 'zod';
import { parsePhoneNumber, isValidPhoneNumber } from 'libphonenumber-js';

const phoneSchema = z
  .string()
  .refine((phone) => {
    if (!phone) return true; // Optional phone
    try {
      return isValidPhoneNumber(phone, 'TR');
    } catch {
      return false;
    }
  }, 'Geçerli bir telefon numarası giriniz');

// Güçlü şifre validasyonu
const passwordSchema = z
  .string()
  .min(8, 'Şifre en az 8 karakter olmalı')
  .regex(/[A-Z]/, 'Şifre en az bir büyük harf içermeli')
  .regex(/[a-z]/, 'Şifre en az bir küçük harf içermeli')
  .regex(/[0-9]/, 'Şifre en az bir rakam içermeli')
  .regex(/[^A-Za-z0-9]/, 'Şifre en az bir özel karakter içermeli');

export const loginSchema = z.object({
  email: z
    .string()
    .min(1, 'E-posta adresi gerekli')
    .email('Geçerli bir e-posta adresi giriniz'),
  password: z
    .string()
    .min(1, 'Şifre gerekli'),
});

export const talentRegistrationSchema = z.object({
  // Personal Info
  email: z
    .string()
    .min(1, 'E-posta adresi gerekli')
    .email('Geçerli bir e-posta adresi giriniz')
    .transform((email) => email.toLowerCase()),
  
  password: passwordSchema,
  
  passwordConfirm: z
    .string()
    .min(8, 'Şifre tekrarı gerekli'),
  
  phone: phoneSchema.optional(),
  
  // Profile Info (for talent_profiles)
  firstName: z
    .string()
    .min(2, 'Ad en az 2 karakter olmalı')
    .max(50, 'Ad en fazla 50 karakter olabilir'),
  
  lastName: z
    .string()
    .min(2, 'Soyad en az 2 karakter olmalı')
    .max(50, 'Soyad en fazla 50 karakter olabilir'),
  
  dateOfBirth: z
    .string()
    .optional()
    .refine((date) => {
      if (!date) return true;
      const birth = new Date(date);
      const today = new Date();
      const age = today.getFullYear() - birth.getFullYear();
      return age >= 16 && age <= 80;
    }, 'Yaş 16-80 arasında olmalı'),
  
  gender: z
    .enum(['MALE', 'FEMALE', 'OTHER'], {
      required_error: 'Cinsiyet seçimi gerekli'
    }),
  
  city: z
    .string()
    .min(1, 'Şehir seçimi gerekli'),
  
  bio: z
    .string()
    .max(1000, 'Bio en fazla 1000 karakter olabilir')
    .optional(),
  
  // Experience
  experience: z
    .enum(['BEGINNER', 'AMATEUR', 'SEMI_PRO', 'PROFESSIONAL'], {
      required_error: 'Deneyim seviyesi gerekli'
    }),
  
  specialties: z
    .array(z.string())
    .min(1, 'En az bir uzmanlık alanı seçiniz')
    .max(5, 'En fazla 5 uzmanlık alanı seçebilirsiniz'),
  
  skills: z
    .array(z.string())
    .max(10, 'En fazla 10 yetenek girebilirsiniz')
    .optional(),
  
  languages: z
    .array(z.string())
    .min(1, 'En az bir dil seçiniz')
    .max(5, 'En fazla 5 dil seçebilirsiniz'),
  
  // Physical attributes (optional for some talent types)
  height: z
    .number()
    .min(120, 'Boy en az 120 cm olmalı')
    .max(250, 'Boy en fazla 250 cm olabilir')
    .optional(),
  
  weight: z
    .number()
    .min(30, 'Kilo en az 30 kg olmalı')
    .max(200, 'Kilo en fazla 200 kg olabilir')
    .optional(),
  
  eyeColor: z.string().optional(),
  hairColor: z.string().optional(),
  
  // KVKK
  kvkkConsent: z
    .boolean()
    .refine((val) => val === true, 'KVKK metnini onaylamanız gerekli'),
  
  marketingConsent: z.boolean().optional(),
  
}).refine((data) => data.password === data.passwordConfirm, {
  message: 'Şifreler eşleşmiyor',
  path: ['passwordConfirm'],
});

export const agencyRegistrationSchema = z.object({
  // Authentication
  email: z
    .string()
    .min(1, 'E-posta adresi gerekli')
    .email('Geçerli bir e-posta adresi giriniz')
    .transform((email) => email.toLowerCase()),
  
  password: passwordSchema,
  
  passwordConfirm: z
    .string()
    .min(8, 'Şifre tekrarı gerekli'),
  
  phone: phoneSchema.optional(),
  
  // Company Info
  companyName: z
    .string()
    .min(2, 'Şirket adı en az 2 karakter olmalı')
    .max(200, 'Şirket adı en fazla 200 karakter olabilir'),
  
  tradeName: z
    .string()
    .max(200, 'Ticari unvan en fazla 200 karakter olabilir')
    .optional(),
  
  taxNumber: z
    .string()
    .regex(/^\d{10,11}$/, 'Vergi numarası 10-11 haneli olmalı')
    .optional(),
  
  description: z
    .string()
    .max(2000, 'Açıklama en fazla 2000 karakter olabilir')
    .optional(),
  
  website: z
    .string()
    .url('Geçerli bir website adresi giriniz')
    .optional()
    .or(z.literal('')),
  
  // Contact Info
  contactPerson: z
    .string()
    .min(2, 'İletişim kişisi adı en az 2 karakter olmalı')
    .max(200, 'İletişim kişisi adı en fazla 200 karakter olabilir'),
  
  contactEmail: z
    .string()
    .email('Geçerli bir e-posta adresi giriniz')
    .optional()
    .or(z.literal('')),
  
  contactPhone: phoneSchema.optional(),
  
  // Address
  address: z
    .string()
    .max(500, 'Adres en fazla 500 karakter olabilir')
    .optional(),
  
  city: z
    .string()
    .min(1, 'Şehir seçimi gerekli'),
  
  // Specialties
  specialties: z
    .array(z.string())
    .min(1, 'En az bir uzmanlık alanı seçiniz')
    .max(5, 'En fazla 5 uzmanlık alanı seçebilirsiniz'),
  
  // KVKK
  kvkkConsent: z
    .boolean()
    .refine((val) => val === true, 'KVKK metnini onaylamanız gerekli'),
  
  marketingConsent: z.boolean().optional(),
  
}).refine((data) => data.password === data.passwordConfirm, {
  message: 'Şifreler eşleşmiyor',
  path: ['passwordConfirm'],
});

export const emailVerificationSchema = z.object({
  token: z.string().min(1, 'Doğrulama kodu gerekli'),
});

export const forgotPasswordSchema = z.object({
  email: z
    .string()
    .min(1, 'E-posta adresi gerekli')
    .email('Geçerli bir e-posta adresi giriniz'),
});

export const resetPasswordSchema = z.object({
  token: z.string().min(1, 'Token gerekli'),
  password: passwordSchema,
  passwordConfirm: z
    .string()
    .min(8, 'Şifre tekrarı gerekli'),
}).refine((data) => data.password === data.passwordConfirm, {
  message: 'Şifreler eşleşmiyor',
  path: ['passwordConfirm'],
});

// Type exports
export type LoginFormData = z.infer<typeof loginSchema>;
export type TalentRegistrationFormData = z.infer<typeof talentRegistrationSchema>;
export type AgencyRegistrationFormData = z.infer<typeof agencyRegistrationSchema>;
export type EmailVerificationFormData = z.infer<typeof emailVerificationSchema>;
export type ForgotPasswordFormData = z.infer<typeof forgotPasswordSchema>;
export type ResetPasswordFormData = z.infer<typeof resetPasswordSchema>;

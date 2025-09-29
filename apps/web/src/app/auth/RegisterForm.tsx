"use client";
import { FormProvider, useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { RegisterSchema, type RegisterInput } from "./RegisterSchema";
import TermsConsentSection from "@/components/auth/TermsConsentSection";
import { TERMS_VERSION, PRIVACY_VERSION } from "@/constants/policies";
import { api } from "@/lib/api"; // proxy client

export default function RegisterForm() {
  const methods = useForm<RegisterInput>({ resolver: zodResolver(RegisterSchema), mode: "onChange" });
  const { handleSubmit, formState: { isValid, isSubmitting } } = methods;

  const onSubmit = async (values: RegisterInput) => {
    await api.post("/api/proxy/auth/register", {
      ...values,
      consents: {
        ...values.consents,
        termsVersion: TERMS_VERSION,
        privacyVersion: PRIVACY_VERSION,
      }
    });
  };

  return (
    <FormProvider {...methods}>
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
        {/* email/password/role alanları */}
        <TermsConsentSection />
        <button
          type="submit"
          disabled={!isValid || isSubmitting}
          className="btn btn-primary w-full disabled:opacity-50"
          data-qa="btn-register"
        >
          {isSubmitting ? "Gönderiliyor..." : "Kayıt Ol"}
        </button>
      </form>
    </FormProvider>
  );
}

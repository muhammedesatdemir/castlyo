"use client";
import { useFormContext } from "react-hook-form";
import Link from "next/link";

export default function TermsConsentSection() {
  const { register, formState: { errors } } = useFormContext();

  return (
    <div className="space-y-3">
      <label className="flex items-start gap-3">
        <input
          type="checkbox"
          {...register("consents.acceptedTerms", { required: true })}
          className="mt-1 h-4 w-4"
          data-qa="chk-terms"
        />
        <span className="text-sm leading-6">
          <Link href="/terms" className="underline" target="_blank">
            Kullanım Koşulları ve Üyelik Sözleşmesi
          </Link>
          'ni okudum ve kabul ediyorum. <span className="text-red-500">*</span>
        </span>
      </label>
      {errors?.consents?.acceptedTerms && (
        <p className="text-xs text-red-500">Bu alan zorunludur.</p>
      )}

      <label className="flex items-start gap-3">
        <input
          type="checkbox"
          {...register("consents.acceptedPrivacy", { required: true })}
          className="mt-1 h-4 w-4"
          data-qa="chk-privacy"
        />
        <span className="text-sm leading-6">
          <Link href="/privacy" className="underline" target="_blank">
            Gizlilik Politikası (KVKK)
          </Link>
          'nı okudum ve kabul ediyorum. <span className="text-red-500">*</span>
        </span>
      </label>
      {errors?.consents?.acceptedPrivacy && (
        <p className="text-xs text-red-500">Bu alan zorunludur.</p>
      )}
    </div>
  );
}

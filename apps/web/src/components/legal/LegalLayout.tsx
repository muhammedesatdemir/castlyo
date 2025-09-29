import { PropsWithChildren } from "react";

/**
 * Sade kurumsal yasal sayfa yerleşimi.
 * - Server Component (no "use client") -> hydration güvenli
 * - Başlık ortalı, tek kolon kart
 * - TOC/Buttons/UpdatedAt kaldırıldı
 */
export default function LegalLayout({
  title,
  children,
}: PropsWithChildren<{ title: string }>) {
  return (
    <div className="min-h-screen bg-brand-light/30">
      <div className="mx-auto max-w-4xl px-6 py-10">
        <h1 className="text-center text-3xl md:text-4xl font-extrabold tracking-tight text-brand-dark">
          {title}
        </h1>

        <article className="mt-8 rounded-xl bg-white shadow-soft border border-brand-dark/10 p-6 md:p-10">
          <div className="prose max-w-none prose-zinc">
            {children}
          </div>
        </article>
      </div>
    </div>
  );
}
"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { montserratDisplay } from "@/lib/fonts";
import { getTalentHref } from "@/lib/routes";

export default function StickyCta() {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const targets = Array.from(
      document.querySelectorAll<HTMLElement>("[data-hide-sticky]")
    );

    let anyIntersecting = false;

    const compute = () => {
      const atTop = window.scrollY < 200; // sayfa başı eşiği
      const atBottom =
        window.innerHeight + window.scrollY >=
        document.documentElement.scrollHeight - 200; // sayfa sonu eşiği

      // hedef bölümler görünürse gizle
      const shouldHide = anyIntersecting || atTop || atBottom;
      setVisible(!shouldHide);
    };

    // hedef bölümleri izle
    const io =
      targets.length > 0
        ? new IntersectionObserver(
            (entries) => {
              anyIntersecting = entries.some(
                (e) => e.isIntersecting && e.intersectionRatio > 0.2
              );
              compute();
            },
            { threshold: [0, 0.2, 0.5, 0.8, 1] }
          )
        : null;

    targets.forEach((el) => io?.observe(el));

    // scroll/resize olaylarında da durum güncelle
    const onScroll = () => compute();
    const onResize = () => compute();

    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", onResize);
    // ilk hesap
    compute();

    return () => {
      io?.disconnect();
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", onResize);
    };
  }, []);

  return (
    <div className="fixed inset-x-0 bottom-5 z-[60] flex justify-center">
      <Link
        href={getTalentHref()}
        aria-hidden={!visible}
        className={
          montserratDisplay.className +
          // görünürlük ve animasyon
          ` transform transition-all duration-300 ease-out
            ${visible ? "opacity-100 translate-y-0 pointer-events-auto"
                      : "opacity-0 translate-y-3 pointer-events-none"}
            rounded-2xl px-5 py-3 font-bold
            shadow-xl ring-1 ring-black/5
            bg-[#F6E6C3] text-[#962901]`
        }
      >
        Hemen Başla
      </Link>
    </div>
  );
}

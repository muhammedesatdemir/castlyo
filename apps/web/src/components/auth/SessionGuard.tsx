"use client";
import { useEffect } from "react";
import { __SESSION_KILLED__ } from "@/lib/api";
import { usePathname } from "next/navigation";

const AUTH_ROUTES = ["/auth", "/signin", "/giris", "/login"];

export default function SessionGuard({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();

  useEffect(() => {
    if (AUTH_ROUTES.includes(pathname)) return; // don't redirect on auth pages
    if (__SESSION_KILLED__) {
      import("@/lib/api").then(m => m.redirectToAuth());
    }
  }, [pathname]);

  if (!AUTH_ROUTES.includes(pathname) && __SESSION_KILLED__) return null;
  return children as any;
}



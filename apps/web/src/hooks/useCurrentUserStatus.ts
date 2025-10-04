"use client";

import { useEffect, useMemo, useState } from "react";
import { UsersMeFlags } from "../types/jobs";

export type UserRole = "AGENCY" | "TALENT" | "ADMIN" | "UNKNOWN";

export type CurrentUserStatus = {
  loading: boolean;
  isAuthenticated: boolean;
  role: UserRole;
  isAgencyProfileComplete: boolean;
  isTalentProfileComplete: boolean;
  canPostJobs: boolean;   // agency + profile complete
  canApplyJobs: boolean;  // talent + profile complete
};

export function useCurrentUserStatus(): CurrentUserStatus {
  const [raw, setRaw] = useState<UsersMeFlags | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let ignore = false;
    (async () => {
      try {
        const res = await fetch("/api/proxy/api/v1/users/me", { credentials: "include" });
        if (!res.ok) {
          setRaw(null);
        } else {
          const data = await res.json();
          setRaw(data?.data ?? data); // {data:{...}} veya direkt {...}
        }
      } catch {
        setRaw(null);
      } finally {
        if (!ignore) setLoading(false);
      }
    })();
    return () => { ignore = true; };
  }, []);

  return useMemo<CurrentUserStatus>(() => {
    const user = raw || null;
    const role: UserRole = (user?.role as UserRole) ?? "UNKNOWN";
    const isAuth = !!user?.id;

    // Backend henüz bu bayrakları koymadıysa, türet:
    const isAgencyProfileComplete = !!(user?.isAgencyProfileComplete);
    const isTalentProfileComplete = !!(user?.isTalentProfileComplete);

    const canPostJobs = role === "AGENCY" && isAgencyProfileComplete;
    const canApplyJobs = role === "TALENT" && isTalentProfileComplete;

    return {
      loading,
      isAuthenticated: isAuth,
      role,
      isAgencyProfileComplete,
      isTalentProfileComplete,
      canPostJobs,
      canApplyJobs,
    };
  }, [raw, loading]);
}

"use client";

import { useEffect, useMemo, useState } from "react";
import useMe from "@/hooks/useMe";
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
  const { me: raw, meLoading: loading } = useMe();

  return useMemo<CurrentUserStatus>(() => {
    const user = (raw as any) || null;
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

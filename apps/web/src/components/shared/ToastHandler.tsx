"use client";

import { useSearchParams } from "next/navigation";
import { useEffect } from "react";
import { showRoleMismatchToast } from "@/lib/role-toast";

export default function ToastHandler() {
  const searchParams = useSearchParams();

  useEffect(() => {
    const toastType = searchParams.get("toast");
    
    if (toastType === "agency_forbidden") {
      showRoleMismatchToast("TALENT");
    }
    
    if (toastType === "talent_forbidden") {
      showRoleMismatchToast("AGENCY");
    }
  }, [searchParams]);

  return null;
}

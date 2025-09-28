"use client";

import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useEffect } from "react";
import { toast } from "@/components/ui/toast";

interface RoleRequiredProps {
  required: "TALENT" | "AGENCY";
  children: React.ReactNode;
}

export default function RoleRequired({ required, children }: RoleRequiredProps) {
  const { data: session, status } = useSession();
  const router = useRouter();

  useEffect(() => {
    if (status === "authenticated") {
      const role = (session?.user as any)?.role;
      if (role && role !== required) {
        toast({
          type: "error",
          title: "Erişim engellendi",
          message: role === "TALENT"
            ? "Yetenek hesabıyla Ajans onboardingine erişemezsiniz."
            : "Ajans hesabıyla Yetenek onboardingine erişemezsiniz.",
        });
        router.replace("/");
      }
    }
  }, [status, session, required, router]);

  return <>{children}</>;
}

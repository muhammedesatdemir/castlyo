"use client";

import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { MouseEvent, KeyboardEvent } from "react";
import { toast } from "@/components/ui/toast";

type Role = "TALENT" | "AGENCY" | "ADMIN";
type Props = {
  to: string;
  targetRole: "TALENT" | "AGENCY";
  children: React.ReactNode;
  className?: string;
};

export default function RoleGateCTA({ to, targetRole, children, className }: Props) {
  const { data, status } = useSession();
  const router = useRouter();
  const userRole = (data?.user as any)?.role as Role | undefined;

  // ⬇⬇⬇ KURAL: Auth ise ve rol mismatch ise BLOKLA ⬇⬇⬇
  const isMismatch =
    status === "authenticated" &&
    !!userRole &&
    userRole !== targetRole &&
    userRole !== "ADMIN"; // admin serbest olsun istiyorsanız

  const showMessage = () => {
    if (!isMismatch) return;
    const cur =
      userRole === "TALENT" ? "Yetenek" : userRole === "AGENCY" ? "Ajans" : (userRole || "Bilinmeyen");
    const other = targetRole === "TALENT" ? "yetenek" : "ajans";
    toast.error("Rolüne uygun olmayan işlem", `${cur} olarak giriş yaptınız. ${other} olarak başlamak isterseniz çıkış yapıp o rol ile kayıt olun.`);
  };

  // capture fazında default'u durdur; onClick'te mesaj + izin varsa push
  const stopIfMismatch = (e: MouseEvent) => {
    if (isMismatch) {
      e.preventDefault();
      e.stopPropagation();
    }
  };

  const activate = () => {
    if (isMismatch) {
      showMessage();
      return;
    }
    router.push(to);
  };

  const onKeyDown = (e: KeyboardEvent<HTMLButtonElement>) => {
    if (e.key === "Enter" || e.key === " ") {
      e.preventDefault();
      activate();
    }
  };

  return (
    <button
      type="button"
      data-role-user={userRole ?? "unknown"}
      data-role-target={targetRole}
      aria-disabled={isMismatch}
      onMouseDownCapture={stopIfMismatch}
      onClickCapture={stopIfMismatch}
      onAuxClickCapture={stopIfMismatch}
      onClick={activate}
      onKeyDown={onKeyDown}
      className={className}
    >
      {children}
    </button>
  );
}

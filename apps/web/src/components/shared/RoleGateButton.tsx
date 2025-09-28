"use client";

import * as React from "react";
import Link from "next/link";
import { useSession } from "next-auth/react";
import { Button } from "@/components/ui/button";
import { toast } from "@/components/ui/toast";
import { cn } from "@/lib/utils";

type Role = "TALENT" | "AGENCY";

interface RoleGateButtonProps {
  targetRole: Role;
  href: string;
  children: React.ReactNode;
  className?: string;
  variant?: React.ComponentProps<typeof Button>["variant"];
  size?: React.ComponentProps<typeof Button>["size"];
}

const roleTitle: Record<Role, string> = {
  TALENT: "Yetenek",
  AGENCY: "Ajans",
};

export default function RoleGateButton({
  targetRole,
  href,
  children,
  className,
  variant = "default",
  size,
}: RoleGateButtonProps) {
  const { data: session, status } = useSession();
  const userRole = (session?.user as any)?.role as Role | undefined;
  const isAuthed = status === "authenticated" && !!userRole;
  const isMismatch = isAuthed && userRole !== targetRole;

  const blockedMsg =
    userRole === "TALENT"
      ? "Yetenek olarak kayıt oldunuz. Ajans olarak başlamak isterseniz çıkış yapıp ajans kaydı oluşturabilirsiniz."
      : "Ajans olarak kayıt oldunuz. Yetenek olarak başlamak isterseniz çıkış yapıp yetenek kaydı oluşturabilirsiniz.";

  const block = (e: React.SyntheticEvent) => {
    if (isMismatch) {
      e.preventDefault();
      e.stopPropagation();
      // Capture fazı için native event üzerinde de durduralım
      // @ts-ignore
      if (e.nativeEvent?.stopImmediatePropagation) {
        // @ts-ignore
        e.nativeEvent.stopImmediatePropagation();
      }
      toast({
        type: "error",
        title: "Rolüne uygun olmayan işlem",
        message: blockedMsg,
      });
      return true;
    }
    return false;
  };

  // Capture phase handlers - ebeveyn onClick'lerini engeller
  const onClickCapture: React.MouseEventHandler<HTMLAnchorElement> = (e) => {
    if (block(e)) return;
  };

  const onMouseDownCapture: React.MouseEventHandler<HTMLAnchorElement> = (e) => {
    if (block(e)) return;
  };

  // Bubble phase handlers - normal Link davranışını engeller
  const onClick: React.MouseEventHandler<HTMLAnchorElement> = (e) => {
    if (block(e)) return;
  };

  const onMouseDown: React.MouseEventHandler<HTMLAnchorElement> = (e) => {
    if (block(e)) return;
  };

  const onAuxClick: React.MouseEventHandler<HTMLAnchorElement> = (e) => {
    if (block(e)) return;
  };

  const onKeyDown: React.KeyboardEventHandler<HTMLAnchorElement> = (e) => {
    if ((e.key === "Enter" || e.key === " ") && block(e)) return;
  };

  return (
    <Button
      asChild
      variant={variant}
      size={size}
      className={cn(isMismatch && "opacity-60 cursor-not-allowed", className)}
      data-role-target={targetRole}
      data-role-user={userRole ?? "ANON"}
    >
      <Link
        href={href}
        onClickCapture={onClickCapture}
        onMouseDownCapture={onMouseDownCapture}
        onClick={onClick}
        onMouseDown={onMouseDown}
        onAuxClick={onAuxClick}
        onKeyDown={onKeyDown}
        aria-disabled={isMismatch ? "true" : undefined}
        tabIndex={0}
      >
        {children}
      </Link>
    </Button>
  );
}

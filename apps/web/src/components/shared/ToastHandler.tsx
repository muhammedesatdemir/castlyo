"use client";

import { useSearchParams } from "next/navigation";
import { useEffect } from "react";
import { toast } from "@/components/ui/toast";

export default function ToastHandler() {
  const searchParams = useSearchParams();

  useEffect(() => {
    const toastType = searchParams.get("toast");
    
    if (toastType === "agency_forbidden") {
      toast({
        type: "error",
        title: "Rolüne uygun olmayan işlem",
        message: "Yetenek olarak kayıt oldunuz. Ajans olarak başlamak isterseniz çıkış yapıp ajans kaydı oluşturabilirsiniz.",
      });
    }
    
    if (toastType === "talent_forbidden") {
      toast({
        type: "error",
        title: "Rolüne uygun olmayan işlem", 
        message: "Ajans olarak kayıt oldunuz. Yetenek olarak başlamak isterseniz çıkış yapıp yetenek kaydı oluşturabilirsiniz.",
      });
    }
  }, [searchParams]);

  return null;
}

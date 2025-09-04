// src/lib/fonts.ts
import { Montserrat } from "next/font/google";

export const montserratDisplay = Montserrat({
  subsets: ["latin"],
  weight: ["600", "700", "800", "900"], // başlık ve vurgular
  display: "swap",
});

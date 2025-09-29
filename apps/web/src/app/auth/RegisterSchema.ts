import { z } from "zod";

export const RegisterSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8),
  role: z.enum(["TALENT","AGENCY"]),
  consents: z.object({
    acceptedTerms: z.literal(true, { errorMap: () => ({ message: "Gerekli" }) }),
    acceptedPrivacy: z.literal(true, { errorMap: () => ({ message: "Gerekli" }) }),
  })
});

export type RegisterInput = z.infer<typeof RegisterSchema>;

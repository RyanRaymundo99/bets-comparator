import { z } from "zod";
import { CPFValidator } from "@/lib/utils/cpf-validation";

export const signUpSchema = z
  .object({
    name: z.string().min(2, { message: "Name must be at least 2 characters" }),
    email: z.string().email({ message: "Please enter a valid email address" }),
    phone: z
      .string()
      .min(1, { message: "Phone number is required" })
      .refine(
        (phone) => {
          const cleaned = phone.replace(/\D/g, "");
          return cleaned.length >= 10 && cleaned.length <= 13;
        },
        { message: "Please enter a valid phone number (ex: (11) 99999-9999)" }
      ),
    cpf: z
      .string()
      .min(1, { message: "CPF is required" })
      .refine((cpf) => CPFValidator.isValid(cpf), {
        message: "Please enter a valid CPF",
      }),
    password: z
      .string()
      .min(8, { message: "Password must be at least 8 characters" }),
    confirmPassword: z.string(),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Passwords don't match",
    path: ["confirmPassword"],
  });

export type SignUpFormValues = z.infer<typeof signUpSchema>;

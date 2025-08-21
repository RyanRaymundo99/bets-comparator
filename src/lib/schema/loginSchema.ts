import { z } from "zod";
import { CPFValidator } from "@/lib/utils/cpf-validation";

export const loginSchema = z
  .object({
    emailOrCpf: z.string().min(1, { message: "Email or CPF is required" }),
    password: z.string().min(8, { message: "Password is required" }),
    rememberMe: z.boolean().optional(),
  })
  .refine(
    (data) => {
      // Check if it's a valid email or CPF
      const isEmail = z.string().email().safeParse(data.emailOrCpf).success;
      const isCpf = CPFValidator.isValid(data.emailOrCpf);

      console.log("Schema validation:", {
        input: data.emailOrCpf,
        isEmail,
        isCpf,
        isValid: isEmail || isCpf,
      });

      if (!isEmail && !isCpf) {
        return false;
      }
      return true;
    },
    {
      message: "Please enter a valid email address or CPF",
      path: ["emailOrCpf"],
    }
  );

export type LoginFormValues = z.infer<typeof loginSchema>;

"use client";
import React, { useState, useCallback, useEffect } from "react";
import { Lock, ArrowRight, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Form } from "@/components/ui/form";
import { useForm } from "react-hook-form";
import Link from "next/link";
import { useToast } from "@/hooks/use-toast";
import { useRouter } from "next/navigation";
import { InputField, CheckboxField } from "@/components/Auth/FormFields";
import { EmailField } from "@/components/Auth/EmailField";
import { AuthLayout } from "@/components/ui/auth-layout";

// Define the form values type locally since we're not using Zod anymore
interface LoginFormValues {
  emailOrCpf: string;
  password: string;
  rememberMe: boolean;
}

const REMEMBER_EMAIL_KEY = "remembered-email";
const REMEMBER_PASSWORD_KEY = "remembered-password";

const Login = () => {
  const [pending, setPending] = useState(false);
  const { toast } = useToast();
  const router = useRouter();

  const form = useForm<LoginFormValues>({
    defaultValues: {
      emailOrCpf: "",
      password: "",
      rememberMe: false,
    },
  });

  // Autofill remembered credentials on mount
  useEffect(() => {
    const rememberedEmail = localStorage.getItem(REMEMBER_EMAIL_KEY);
    const rememberedPassword = localStorage.getItem(REMEMBER_PASSWORD_KEY);
    if (rememberedEmail && rememberedPassword) {
      form.setValue("emailOrCpf", rememberedEmail);
      try {
        form.setValue("password", atob(rememberedPassword));
      } catch {
        form.setValue("password", "");
      }
      form.setValue("rememberMe", true);
    }
  }, [form]);

  // Clear any existing form errors when component mounts
  useEffect(() => {
    form.clearErrors();
  }, [form]);

  const onSubmit = useCallback(
    async (data: LoginFormValues) => {
      // Custom validation
      if (!data.emailOrCpf.trim()) {
        toast({
          variant: "destructive",
          title: "Erro no login",
          description: "Email ou CPF é obrigatório",
        });
        return;
      }

      if (!data.password.trim()) {
        toast({
          variant: "destructive",
          title: "Erro no login",
          description: "Senha é obrigatória",
        });
        return;
      }

      try {
        setPending(true);

        // Use our simple custom login endpoint
        console.log("Using custom login with email:", data.emailOrCpf);

        const response = await fetch("/api/auth/custom-login", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            email: data.emailOrCpf,
            password: data.password,
          }),
        });

        const result = await response.json();

        if (response.ok && result.success) {
          // Remember Me logic
          if (data.rememberMe) {
            localStorage.setItem(REMEMBER_EMAIL_KEY, data.emailOrCpf);
            localStorage.setItem(REMEMBER_PASSWORD_KEY, btoa(data.password));
          } else {
            localStorage.removeItem(REMEMBER_EMAIL_KEY);
            localStorage.removeItem(REMEMBER_PASSWORD_KEY);
          }

          // Store user session in localStorage for simple session management
          localStorage.setItem("auth-user", JSON.stringify(result.user));
          localStorage.setItem("auth-session", "true");

          console.log("Login successful, redirecting to home");
          router.push("/home");
        } else {
          toast({
            variant: "destructive",
            title: "Erro no login",
            description: result.error || "Ocorreu um erro ao fazer login",
          });
        }
      } catch {
        toast({
          variant: "destructive",
          title: "Erro no login",
          description: "Ocorreu um erro inesperado",
        });
      } finally {
        setPending(false);
      }
    },
    [router, toast]
  );

  return (
    <AuthLayout
      title="Login"
      description=""
      showLogo={false}
    >
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
          <EmailField
            value={form.watch("emailOrCpf")}
            onChange={(value) => form.setValue("emailOrCpf", value)}
            required
          />

          <div className="space-y-2">
            <div className="flex items-center justify-end">
              <Link
                href="/forgot-password"
                className="text-sm font-medium text-blue-600 hover:text-blue-700 hover:underline transition-colors"
              >
                Esqueceu a senha?
              </Link>
            </div>
            <InputField
              control={form.control}
              name="password"
              label="Senha"
              placeholder="••••••••"
              type="password"
              icon={<Lock className="h-5 w-5 text-slate-400" />}
              showPasswordToggle={true}
              labelPosition="top"
            />
          </div>

          <div className="flex items-center justify-between">
            <CheckboxField
              control={form.control}
              name="rememberMe"
              label="Lembrar de mim"
            />
          </div>

          <Button
            type="submit"
            className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold h-12 text-base rounded-lg transition-colors duration-200"
            disabled={pending}
          >
            {pending ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin mr-2" />
                Aguarde...
              </>
            ) : (
              <>
                Entrar
                <ArrowRight className="h-4 w-4 ml-2" />
              </>
            )}
          </Button>
        </form>
      </Form>

      <div className="mt-6 text-center text-sm text-slate-600">
        Não tem uma conta?{" "}
        <Link
          href="/signup"
          className="text-blue-600 hover:text-blue-700 font-medium hover:underline transition-colors"
        >
          Criar conta
        </Link>
      </div>

      <div className="mt-6 text-center text-xs text-slate-500">
        Ao fazer login, você concorda com nossos termos de serviço e política de
        privacidade.
      </div>
    </AuthLayout>
  );
};

export default Login;

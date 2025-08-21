"use client";
import React, { useState, useCallback, useEffect } from "react";
import { Lock, ArrowRight, Loader2, Code } from "lucide-react";
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
  const [isLocalhost, setIsLocalhost] = useState(false);
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

  // Check if we're on localhost
  useEffect(() => {
    const isLocalhostCheck =
      typeof window !== "undefined" &&
      (window.location.hostname === "localhost" ||
        window.location.hostname === "127.0.0.1") &&
      window.location.port === "3000";

    setIsLocalhost(isLocalhostCheck);
  }, []);

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

          console.log("Login successful, redirecting to dashboard");
          router.push("/dashboard");
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

  const handleCreateDevAccess = async () => {
    try {
      setPending(true);

      // Create a dev user with all permissions
      const response = await fetch("/api/auth/create-dev-user", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          email: "dev@buildstrategy.com",
          password: "12345678",
          name: "Developer User",
          cpf: "12345678901",
        }),
      });

      const result = await response.json();

      if (response.ok && result.success) {
        toast({
          title: "Dev User Created!",
          description: `Use ${result.credentials.email} / ${result.credentials.password} to login`,
        });

        // Auto-fill the form with the unique credentials
        form.setValue("emailOrCpf", result.credentials.email);
        form.setValue("password", result.credentials.password);

        // Show success message with credentials
        console.log("Form auto-filled with:", {
          email: result.credentials.email,
          password: result.credentials.password,
        });

        // Focus on the password field for better UX
        setTimeout(() => {
          const passwordInput = document.querySelector(
            'input[name="password"]'
          ) as HTMLInputElement;
          if (passwordInput) {
            passwordInput.focus();
            passwordInput.select(); // Select the password text for easy replacement
          }
        }, 100);
      } else {
        toast({
          variant: "destructive",
          title: "Error Creating Dev User",
          description: result.error || "Failed to create dev user",
        });
      }
    } catch (error) {
      console.error("Error creating dev user:", error);
      toast({
        variant: "destructive",
        title: "Error Creating Dev User",
        description: "Failed to create dev user",
      });
    } finally {
      setPending(false);
    }
  };

  return (
    <AuthLayout
      title=""
      description={
        <>
          Não tem uma conta?{" "}
          <Link
            href="/signup"
            className="text-blue-300 hover:text-blue-200 hover:underline transition-colors"
          >
            Criar conta
          </Link>
          .
        </>
      }
      showLogo={true}
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
                className="text-sm font-medium text-blue-300 hover:text-blue-200 hover:underline transition-colors"
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
              icon={<Lock className="h-5 w-5 text-gray-300" />}
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
            className="w-full bg-white/10 hover:bg-white/20 text-white border border-white/20 hover:border-white/30 transition-all duration-200 h-12 text-base font-medium backdrop-blur-[10px] relative overflow-hidden"
            disabled={pending}
            style={{
              boxShadow: "inset 0 1px 0 0 rgba(255, 255, 255, 0.1)",
            }}
          >
            {/* Mirror effect for button */}
            <div className="absolute inset-0 bg-gradient-to-br from-white/10 via-transparent to-white/5 opacity-30 pointer-events-none rounded-md"></div>
            <div className="absolute top-0 left-0 w-full h-px bg-gradient-to-r from-transparent via-white/20 to-transparent"></div>

            {pending ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin mr-2 relative z-10" />
                <span className="relative z-10">Aguarde...</span>
              </>
            ) : (
              <>
                <span className="relative z-10">Entrar</span>
                <ArrowRight className="h-4 w-4 ml-2 relative z-10" />
              </>
            )}
          </Button>
        </form>
      </Form>

      {/* Create Dev Access Button - Only on localhost */}
      {isLocalhost && (
        <div className="mt-6 pt-4 border-t border-white/10">
          <Button
            type="button"
            onClick={handleCreateDevAccess}
            variant="ghost"
            className="w-full text-xs text-gray-400 hover:text-blue-300 hover:bg-white/5 transition-all duration-200 h-8 relative overflow-hidden"
          >
            {/* Mirror effect for button */}
            <div className="absolute inset-0 bg-gradient-to-br from-white/5 via-transparent to-white/2 opacity-20 pointer-events-none rounded-md"></div>
            <div className="absolute top-0 left-0 w-full h-px bg-gradient-to-r from-transparent via-white/10 to-transparent"></div>

            <Code className="h-3 w-3 mr-2 relative z-10" />
            <span className="relative z-10">Create Dev Access</span>
          </Button>
        </div>
      )}

      <div className="mt-8 text-center text-xs text-gray-300">
        Ao fazer login, você concorda com nossos termos de serviço e política de
        privacidade.
      </div>
    </AuthLayout>
  );
};

export default Login;

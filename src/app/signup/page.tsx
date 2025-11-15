"use client";

import React, { useState } from "react";
import { useForm } from "react-hook-form";
import { Button } from "@/components/ui/button";
import { Form } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Mail, Lock, User, ArrowRight, Loader2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { AuthLayout } from "@/components/ui/auth-layout";

interface SignupFormValues {
  name: string;
  email: string;
  password: string;
  confirmPassword: string;
}

export default function SignupPage() {
  const [pending, setPending] = useState(false);
  const { toast } = useToast();
  const router = useRouter();

  const form = useForm<SignupFormValues>({
    defaultValues: {
      name: "",
      email: "",
      password: "",
      confirmPassword: "",
    },
  });

  const onSubmit = async (data: SignupFormValues) => {
    // Validation
    if (!data.name.trim()) {
      toast({
        variant: "destructive",
        title: "Erro no cadastro",
        description: "Nome é obrigatório",
      });
      return;
    }

    if (!data.email.trim()) {
      toast({
        variant: "destructive",
        title: "Erro no cadastro",
        description: "Email é obrigatório",
      });
      return;
    }

    if (data.password.length < 8) {
      toast({
        variant: "destructive",
        title: "Erro no cadastro",
        description: "A senha deve ter no mínimo 8 caracteres",
      });
      return;
    }

    if (data.password !== data.confirmPassword) {
      toast({
        variant: "destructive",
        title: "Erro no cadastro",
        description: "As senhas não coincidem",
      });
      return;
    }

    try {
      setPending(true);

      const response = await fetch("/api/auth/signup", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          name: data.name,
          email: data.email,
          password: data.password,
        }),
      });

      const result = await response.json();

      if (response.ok && result.success) {
        toast({
          title: "Cadastro realizado!",
          description: "Sua conta foi criada com sucesso. Faça login para continuar.",
        });

        // Redirect to login
        setTimeout(() => {
          router.push("/login");
        }, 1500);
      } else {
        toast({
          variant: "destructive",
          title: "Erro no cadastro",
          description: result.error || "Ocorreu um erro ao criar sua conta",
        });
      }
    } catch (error) {
      console.error("Signup error:", error);
      toast({
        variant: "destructive",
        title: "Erro no cadastro",
        description: "Ocorreu um erro inesperado",
      });
    } finally {
      setPending(false);
    }
  };

  return (
    <AuthLayout
      title="Criar Conta"
      description={
        <>
          Já tem uma conta?{" "}
          <Link
            href="/login"
            className="text-blue-300 hover:text-blue-200 hover:underline transition-colors"
          >
            Fazer login
          </Link>
          .
        </>
      }
      showLogo={true}
    >
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
          {/* Name Field */}
          <div className="space-y-2">
            <Label htmlFor="name" className="text-gray-300">
              Nome Completo
            </Label>
            <div className="relative">
              <User className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
              <Input
                id="name"
                placeholder="João Silva"
                {...form.register("name")}
                className="pl-10 bg-white/5 border-white/10 text-white placeholder-gray-400 focus:border-blue-500"
                disabled={pending}
              />
            </div>
          </div>

          {/* Email Field */}
          <div className="space-y-2">
            <Label htmlFor="email" className="text-gray-300">
              Email
            </Label>
            <div className="relative">
              <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
              <Input
                id="email"
                type="email"
                placeholder="joao.silva@exemplo.com"
                {...form.register("email")}
                className="pl-10 bg-white/5 border-white/10 text-white placeholder-gray-400 focus:border-blue-500"
                disabled={pending}
              />
            </div>
          </div>

          {/* Password Field */}
          <div className="space-y-2">
            <Label htmlFor="password" className="text-gray-300">
              Senha
            </Label>
            <div className="relative">
              <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
              <Input
                id="password"
                type="password"
                placeholder="••••••••"
                {...form.register("password")}
                className="pl-10 bg-white/5 border-white/10 text-white placeholder-gray-400 focus:border-blue-500"
                disabled={pending}
              />
            </div>
            <p className="text-xs text-gray-400">Mínimo de 8 caracteres</p>
          </div>

          {/* Confirm Password Field */}
          <div className="space-y-2">
            <Label htmlFor="confirmPassword" className="text-gray-300">
              Confirmar Senha
            </Label>
            <div className="relative">
              <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
              <Input
                id="confirmPassword"
                type="password"
                placeholder="••••••••"
                {...form.register("confirmPassword")}
                className="pl-10 bg-white/5 border-white/10 text-white placeholder-gray-400 focus:border-blue-500"
                disabled={pending}
              />
            </div>
          </div>

          {/* Submit Button */}
          <Button
            type="submit"
            className="w-full bg-white/10 hover:bg-white/20 text-white border border-white/20 hover:border-white/30 transition-all duration-200 h-12 text-base font-medium backdrop-blur-[10px] relative overflow-hidden"
            disabled={pending}
            style={{
              boxShadow: "inset 0 1px 0 0 rgba(255, 255, 255, 0.1)",
            }}
          >
            {/* Mirror effect */}
            <div className="absolute inset-0 bg-gradient-to-br from-white/10 via-transparent to-white/5 opacity-30 pointer-events-none rounded-md"></div>
            <div className="absolute top-0 left-0 w-full h-px bg-gradient-to-r from-transparent via-white/20 to-transparent"></div>

            {pending ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin mr-2 relative z-10" />
                <span className="relative z-10">Criando conta...</span>
              </>
            ) : (
              <>
                <span className="relative z-10">Criar Conta</span>
                <ArrowRight className="h-4 w-4 ml-2 relative z-10" />
              </>
            )}
          </Button>
        </form>
      </Form>

      <div className="mt-8 text-center text-xs text-gray-300">
        Ao criar uma conta, você concorda com nossos{" "}
        <Link href="/terms" className="text-blue-300 hover:underline">
          termos de serviço
        </Link>{" "}
        e{" "}
        <Link href="/privacy" className="text-blue-300 hover:underline">
          política de privacidade
        </Link>
        .
      </div>
    </AuthLayout>
  );
}

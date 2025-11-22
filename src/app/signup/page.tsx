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
      description=""
      showLogo={false}
    >
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
          {/* Name Field */}
          <div className="space-y-2">
            <Label htmlFor="name" className="text-slate-900 font-medium">
              Nome Completo
            </Label>
            <div className="relative">
              <User className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-slate-400" />
              <Input
                id="name"
                placeholder="João Silva"
                {...form.register("name")}
                className="pl-10 bg-white border border-slate-200 text-slate-900 placeholder-slate-400 focus:border-blue-600 focus:ring-1 focus:ring-blue-600 rounded-lg"
                disabled={pending}
              />
            </div>
          </div>

          {/* Email Field */}
          <div className="space-y-2">
            <Label htmlFor="email" className="text-slate-900 font-medium">
              Email
            </Label>
            <div className="relative">
              <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-slate-400" />
              <Input
                id="email"
                type="email"
                placeholder="joao.silva@exemplo.com"
                {...form.register("email")}
                className="pl-10 bg-white border border-slate-200 text-slate-900 placeholder-slate-400 focus:border-blue-600 focus:ring-1 focus:ring-blue-600 rounded-lg"
                disabled={pending}
              />
            </div>
          </div>

          {/* Password Field */}
          <div className="space-y-2">
            <Label htmlFor="password" className="text-slate-900 font-medium">
              Senha
            </Label>
            <div className="relative">
              <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-slate-400" />
              <Input
                id="password"
                type="password"
                placeholder="••••••••"
                {...form.register("password")}
                className="pl-10 bg-white border border-slate-200 text-slate-900 placeholder-slate-400 focus:border-blue-600 focus:ring-1 focus:ring-blue-600 rounded-lg"
                disabled={pending}
              />
            </div>
            <p className="text-xs text-slate-500">Mínimo de 8 caracteres</p>
          </div>

          {/* Confirm Password Field */}
          <div className="space-y-2">
            <Label htmlFor="confirmPassword" className="text-slate-900 font-medium">
              Confirmar Senha
            </Label>
            <div className="relative">
              <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-slate-400" />
              <Input
                id="confirmPassword"
                type="password"
                placeholder="••••••••"
                {...form.register("confirmPassword")}
                className="pl-10 bg-white border border-slate-200 text-slate-900 placeholder-slate-400 focus:border-blue-600 focus:ring-1 focus:ring-blue-600 rounded-lg"
                disabled={pending}
              />
            </div>
          </div>

          {/* Submit Button */}
          <Button
            type="submit"
            className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold h-12 text-base rounded-lg transition-colors duration-200"
            disabled={pending}
          >
            {pending ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin mr-2" />
                Criando conta...
              </>
            ) : (
              <>
                Criar Conta
                <ArrowRight className="h-4 w-4 ml-2" />
              </>
            )}
          </Button>
        </form>
      </Form>

      <div className="mt-8 text-center text-xs text-slate-500">
        Ao criar uma conta, você concorda com nossos{" "}
        <Link href="/terms" className="text-blue-600 hover:underline">
          termos de serviço
        </Link>{" "}
        e{" "}
        <Link href="/privacy" className="text-blue-600 hover:underline">
          política de privacidade
        </Link>
        .
      </div>
    </AuthLayout>
  );
}

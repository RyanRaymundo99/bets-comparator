"use client";
import React, { useState, useCallback } from "react";
import { Mail, Lock, User, ArrowRight, Loader2 } from "lucide-react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Button } from "@/components/ui/button";
import { Form } from "@/components/ui/form";
import Link from "next/link";
import { useToast } from "@/hooks/use-toast";
import { InputField } from "@/components/Auth/FormFields";
import { CPFField } from "@/components/Auth/CPFField";
import { SignUpFormValues, signUpSchema } from "@/lib/schema/signupSchema";
import { authClient } from "@/lib/auth-client";
import { mockAuthClient } from "@/lib/mock-auth";
import { AuthLayout } from "@/components/ui/auth-layout";
import { SuccessPopup } from "@/components/ui/success-popup";

const Signup = () => {
  const form = useForm<SignUpFormValues>({
    resolver: zodResolver(signUpSchema),
    defaultValues: {
      name: "",
      email: "",
      cpf: "",
      password: "",
      confirmPassword: "",
    },
  });
  const [pending, setPending] = useState(false);
  const [showSuccessPopup, setShowSuccessPopup] = useState(false);
  const { toast } = useToast();

  const onSubmit = useCallback(
    async (data: SignUpFormValues) => {
      try {
        setPending(true);

        // Try real auth first, fallback to mock auth for testing
        try {
          await authClient.signUp.email(
            {
              email: data.email,
              password: data.password,
              name: data.name,
            },
            {
              onSuccess: () => {
                setShowSuccessPopup(true);
              },
              onError: (ctx) => {
                toast({
                  variant: "destructive",
                  title: "Erro ao criar conta",
                  description:
                    ctx.error.message ?? "Ocorreu um erro ao criar a conta.",
                });
              },
            }
          );
        } catch (authError) {
          console.log("Real auth failed, using mock auth:", authError);

          // Fallback to mock auth for testing
          await mockAuthClient.signUp({
            email: data.email,
            password: data.password,
            name: data.name,
            cpf: data.cpf,
          });

          setShowSuccessPopup(true);
        }
      } catch (error) {
        console.error("Signup error:", error);
        toast({
          variant: "destructive",
          title: "Erro ao criar conta",
          description: "Ocorreu um erro inesperado",
        });
      } finally {
        setPending(false);
      }
    },
    [toast]
  );

  return (
    <AuthLayout
      title="Criar uma conta"
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
      showLogo={false}
    >
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
          <InputField
            control={form.control}
            name="name"
            label="Nome completo"
            placeholder="João Silva"
            type="text"
            icon={<User className="h-5 w-5 text-gray-300" />}
            labelPosition="top"
          />

          <InputField
            control={form.control}
            name="email"
            label="Email"
            placeholder="joao.silva@exemplo.com"
            type="email"
            icon={<Mail className="h-5 w-5 text-gray-300" />}
            labelPosition="top"
          />

          <CPFField
            value={form.watch("cpf")}
            onChange={(value) => form.setValue("cpf", value)}
            onBlur={() => form.trigger("cpf")}
            error={form.formState.errors.cpf?.message}
            required
          />

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

          <InputField
            control={form.control}
            name="confirmPassword"
            label="Confirmar senha"
            placeholder="••••••••"
            type="password"
            icon={<Lock className="h-5 w-5 text-gray-300" />}
            showPasswordToggle={true}
            labelPosition="top"
          />

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
                <span className="relative z-10">Criar conta</span>
                <ArrowRight className="h-4 w-4 ml-2 relative z-10" />
              </>
            )}
          </Button>
        </form>
      </Form>

      <div className="mt-8 text-center text-xs text-gray-300">
        Ao criar uma conta, você concorda com nossos{" "}
        <Link
          href="/terms"
          className="text-blue-300 hover:text-blue-200 hover:underline"
        >
          Termos
        </Link>{" "}
        e{" "}
        <Link
          href="/privacy"
          className="text-blue-300 hover:text-blue-200 hover:underline"
        >
          Política de Privacidade
        </Link>
        .
      </div>

      <SuccessPopup
        isOpen={showSuccessPopup}
        onClose={() => {
          setShowSuccessPopup(false);
          // Redirect to dashboard after closing popup
          setTimeout(() => {
            window.location.href = "/dashboard";
          }, 500);
        }}
        title="Conta criada com sucesso!"
        message="Sua conta foi criada e está aguardando aprovação da nossa equipe. Você receberá uma notificação quando sua conta for aprovada."
        showApprovalStatus={true}
      />
    </AuthLayout>
  );
};

export default Signup;

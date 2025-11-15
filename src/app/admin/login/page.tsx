"use client";

import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { Loader2, Shield } from "lucide-react";
import { useRouter } from "next/navigation";
import { useFormSubmit } from "@/hooks/use-form-submit";
import { useFetch } from "@/hooks/use-fetch";

const AdminLoginPage = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const { toast } = useToast();
  const router = useRouter();

  // Check if already logged in
  const { data: sessionData } = useFetch<{ valid: boolean }>(
    "/api/auth/verify-admin-session",
    {
      immediate: true,
      showToast: false,
      onSuccess: (data) => {
        if (data?.valid) {
          router.push("/admin");
        }
      },
    }
  );

  // Form submission with reusable hook
  const { loading, submit } = useFormSubmit({
    successMessage: "Login realizado! Redirecionando para o painel...",
    errorMessage: "Credenciais inválidas",
    redirect: "/admin",
  });

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    if (!email || !password) {
      toast({
        variant: "destructive",
        title: "Erro",
        description: "Preencha todos os campos",
      });
      return;
    }

    await submit(e, async () => {
      return fetch("/api/auth/admin-login", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ email, password }),
      });
    });
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 flex items-center justify-center p-4">
      <Card className="w-full max-w-md bg-gradient-to-br from-gray-900/90 to-gray-800/90 border-gray-700/50 backdrop-blur-xl">
        <CardHeader className="text-center">
          <div className="flex justify-center mb-4">
            <div className="w-16 h-16 bg-gradient-to-br from-blue-600 to-purple-600 rounded-full flex items-center justify-center">
              <Shield className="w-8 h-8 text-white" />
            </div>
          </div>
          <CardTitle className="text-2xl text-white">Admin Login</CardTitle>
          <p className="text-gray-300">Acesse o painel Bets Comparator</p>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email" className="text-white">
                Email
              </Label>
              <Input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="admin@betscomparator.com"
                className="bg-gray-800 border-gray-700 text-white placeholder:text-gray-400"
                required
                disabled={loading}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="password" className="text-white">
                Senha
              </Label>
              <Input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Digite a senha admin"
                className="bg-gray-800 border-gray-700 text-white placeholder:text-gray-400"
                required
                disabled={loading}
              />
            </div>
            <Button
              type="submit"
              disabled={loading}
              className="w-full bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white"
            >
              {loading ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Entrando...
                </>
              ) : (
                "Entrar"
              )}
            </Button>
          </form>

          <div className="mt-6 p-4 bg-blue-900/30 border border-blue-700/50 rounded-lg">
            <h4 className="text-white font-medium mb-2">
              📋 Credenciais Padrão Admin:
            </h4>
            <p className="text-gray-300 text-sm">
              Email: <code className="text-blue-300">admin@betscomparator.com</code>
            </p>
            <p className="text-gray-300 text-sm">
              Senha: <code className="text-blue-300">admin123456</code>
            </p>
            <div className="mt-3 pt-3 border-t border-blue-700/30">
              <p className="text-gray-400 text-xs">
                💡 <strong>Primeiro acesso?</strong> Crie o admin visitando:
              </p>
              <a 
                href="/api/auth/create-admin" 
                target="_blank"
                className="text-blue-400 hover:text-blue-300 text-xs underline mt-1 inline-block"
              >
                /api/auth/create-admin
              </a>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default AdminLoginPage;

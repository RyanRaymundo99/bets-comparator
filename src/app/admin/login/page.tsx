"use client";

import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { Loader2, Shield } from "lucide-react";
import { useRouter } from "next/navigation";
import { useFetch } from "@/hooks/use-fetch";

const AdminLoginPage = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const { toast } = useToast();
  const router = useRouter();

  // Check if already logged in
  useFetch<{ valid: boolean }>(
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

  const [loading, setLoading] = useState(false);
  const [creatingAdmin, setCreatingAdmin] = useState(false);

  const handleCreateAdmin = async () => {
    try {
      setCreatingAdmin(true);
      const response = await fetch("/api/auth/create-admin", {
        method: "GET",
      });
      const result = await response.json();
      
      if (result.success) {
        toast({
          title: "Sucesso",
          description: result.message || "Admin criado com sucesso!",
        });
        if (result.credentials) {
          setEmail(result.credentials.email);
          // Don't set password for security, but show it in toast
          toast({
            title: "Credenciais",
            description: `Email: ${result.credentials.email}, Senha: ${result.credentials.password}`,
          });
        }
      } else {
        toast({
          variant: "destructive",
          title: "Erro",
          description: result.error || "Erro ao criar admin",
        });
      }
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Erro",
        description: "Erro ao criar admin",
      });
    } finally {
      setCreatingAdmin(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    
    if (!email || !password) {
      toast({
        variant: "destructive",
        title: "Erro",
        description: "Preencha todos os campos",
      });
      return;
    }

    try {
      setLoading(true);
      console.log("Attempting login for:", email);
      
      const response = await fetch("/api/auth/admin-login", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        credentials: "include",
        body: JSON.stringify({ email, password }),
      });

      console.log("Response status:", response.status, response.statusText);
      
      let result;
      try {
        const text = await response.text();
        console.log("Response text:", text);
        result = text ? JSON.parse(text) : {};
      } catch (parseError) {
        console.error("Failed to parse response:", parseError);
        setLoading(false);
        toast({
          variant: "destructive",
          title: "Erro",
          description: "Resposta inválida do servidor",
        });
        return;
      }

      console.log("Login result:", result);

      if (response.ok && result.success) {
        console.log("Login successful! Redirecting...");
        
        // Show success toast
        toast({
          title: "Sucesso",
          description: "Login realizado! Redirecionando...",
        });
        
        // Wait longer to ensure cookie is fully set and processed by browser
        // Then use hard redirect
        setTimeout(() => {
          console.log("Redirecting to /admin now");
          window.location.href = "/admin";
        }, 1000);
        return;
      } else {
        console.error("Login failed:", result);
        setLoading(false);
        toast({
          variant: "destructive",
          title: "Erro",
          description: result.error || result.message || "Credenciais inválidas",
        });
      }
    } catch (error) {
      console.error("Login error:", error);
      setLoading(false);
      toast({
        variant: "destructive",
        title: "Erro",
        description: error instanceof Error ? error.message : "Ocorreu um erro ao fazer login",
      });
    }
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
              <p className="text-gray-400 text-xs mb-2">
                💡 <strong>Primeiro acesso?</strong> Crie o admin:
              </p>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={handleCreateAdmin}
                disabled={creatingAdmin}
                className="w-full text-xs"
              >
                {creatingAdmin ? (
                  <>
                    <Loader2 className="w-3 h-3 mr-2 animate-spin" />
                    Criando...
                  </>
                ) : (
                  "Criar Admin"
                )}
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default AdminLoginPage;

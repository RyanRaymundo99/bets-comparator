"use client";

import React, { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ArrowLeft, Building2, Link as LinkIcon, Save } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useFormSubmit } from "@/hooks/use-form-submit";

export default function NewMyBetPage() {
  const [formData, setFormData] = useState({
    name: "",
    url: "",
  });
  const { toast } = useToast();
  const router = useRouter();

  const { loading, submit } = useFormSubmit({
    successMessage: "Sua casa de apostas foi criada! Redirecionando...",
    errorMessage: "Falha ao criar sua casa de apostas",
    redirect: "/dashboard",
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.name || !formData.url) {
      toast({
        variant: "destructive",
        title: "Erro",
        description: "Nome e URL são obrigatórios",
      });
      return;
    }

    // Validate URL format
    try {
      new URL(formData.url);
    } catch {
      toast({
        variant: "destructive",
        title: "Erro",
        description: "Por favor, insira uma URL válida (ex: https://exemplo.com)",
      });
      return;
    }

    await submit(e, async () => {
      return fetch("/api/user/bets", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(formData),
      });
    });
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 text-white p-8">
      <div className="max-w-2xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center space-x-4">
          <Link href="/dashboard">
            <Button variant="outline" size="icon" className="border-gray-700 text-white hover:bg-gray-800">
              <ArrowLeft className="w-4 h-4" />
            </Button>
          </Link>
          <div>
            <h1 className="text-3xl font-bold text-white">Criar Minha Casa de Apostas</h1>
            <p className="text-gray-300 mt-1">
              Adicione sua casa de apostas para comparar com outras
            </p>
          </div>
        </div>

        {/* Form Card */}
        <Card className="bg-gradient-to-br from-gray-900/90 to-gray-800/90 border-gray-700/50 backdrop-blur-xl">
          <CardHeader>
            <CardTitle className="text-white flex items-center">
              <Building2 className="w-5 h-5 mr-2 text-blue-400" />
              Informações da Casa de Apostas
            </CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="space-y-2">
                <Label htmlFor="name" className="text-white">
                  Nome da Casa de Apostas *
                </Label>
                <Input
                  id="name"
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="Ex: Minha Casa de Apostas"
                  className="bg-gray-800 border-gray-700 text-white placeholder:text-gray-400"
                  required
                  disabled={loading}
                />
                <p className="text-sm text-gray-400">
                  O nome que aparecerá nas comparações
                </p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="url" className="text-white flex items-center">
                  <LinkIcon className="w-4 h-4 mr-2" />
                  URL do Site *
                </Label>
                <Input
                  id="url"
                  type="url"
                  value={formData.url}
                  onChange={(e) => setFormData({ ...formData, url: e.target.value })}
                  placeholder="https://exemplo.com"
                  className="bg-gray-800 border-gray-700 text-white placeholder:text-gray-400"
                  required
                  disabled={loading}
                />
                <p className="text-sm text-gray-400">
                  A URL será usada para preencher automaticamente os parâmetros
                </p>
              </div>

              <div className="bg-blue-900/30 border border-blue-700/50 rounded-lg p-4">
                <h4 className="text-white font-medium mb-2">ℹ️ O que acontece depois?</h4>
                <ul className="text-sm text-gray-300 space-y-1 list-disc list-inside">
                  <li>Os parâmetros serão criados automaticamente com base nas definições do admin</li>
                  <li>Você poderá preencher os parâmetros depois de criar</li>
                  <li>Sua casa de apostas aparecerá nas comparações junto com outras</li>
                </ul>
              </div>

              <div className="flex space-x-4">
                <Button
                  type="submit"
                  disabled={loading}
                  className="flex-1 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white"
                >
                  {loading ? (
                    <>
                      <Save className="w-4 h-4 mr-2 animate-spin" />
                      Criando...
                    </>
                  ) : (
                    <>
                      <Save className="w-4 h-4 mr-2" />
                      Criar Casa de Apostas
                    </>
                  )}
                </Button>
                <Link href="/dashboard">
                  <Button
                    type="button"
                    variant="outline"
                    className="border-gray-700 text-white hover:bg-gray-800"
                    disabled={loading}
                  >
                    Cancelar
                  </Button>
                </Link>
              </div>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}


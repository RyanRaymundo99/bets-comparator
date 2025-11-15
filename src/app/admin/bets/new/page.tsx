"use client";

import React, { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ArrowLeft, Building2, Save } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import Link from "next/link";
import { useRouter } from "next/navigation";

export default function NewBetPage() {
  const [formData, setFormData] = useState({
    name: "",
    cnpj: "",
    url: "",
    region: "",
    license: "",
  });
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();
  const router = useRouter();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.name) {
      toast({
        variant: "destructive",
        title: "Erro",
        description: "Nome é obrigatório",
      });
      return;
    }

    try {
      setLoading(true);

      const response = await fetch("/api/bets", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(formData),
      });

      const data = await response.json();

      if (data.success) {
        toast({
          title: "Sucesso",
          description: "Casa de apostas cadastrada com sucesso",
        });
        router.push("/admin/bets");
      } else {
        throw new Error(data.error);
      }
    } catch (error: unknown) {
      console.error("Error creating bet:", error);
      toast({
        variant: "destructive",
        title: "Erro",
        description:
          error instanceof Error ? error.message : "Falha ao cadastrar casa de apostas",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 text-white p-8">
      <div className="max-w-3xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center space-x-3">
          <Link href="/admin/bets">
            <Button variant="ghost" className="text-gray-400 hover:text-white">
              <ArrowLeft className="w-4 h-4" />
            </Button>
          </Link>
          <div>
            <h1 className="text-3xl font-bold text-white flex items-center">
              <Building2 className="w-8 h-8 mr-3 text-blue-400" />
              Nova Casa de Apostas
            </h1>
            <p className="text-gray-300 mt-1">
              Cadastre uma nova casa de apostas regulamentada
            </p>
          </div>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit}>
          <Card className="bg-gradient-to-br from-gray-900/90 to-gray-800/90 border-gray-700/50 backdrop-blur-xl">
            <CardHeader>
              <CardTitle className="text-white">Informações da Casa de Apostas</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-2">
                <Label htmlFor="name" className="text-gray-300">
                  Nome *
                </Label>
                <Input
                  id="name"
                  placeholder="Ex: Bet365"
                  value={formData.name}
                  onChange={(e) =>
                    setFormData({ ...formData, name: e.target.value })
                  }
                  className="bg-gray-800 border-gray-700 text-white"
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="cnpj" className="text-gray-300">
                  CNPJ
                </Label>
                <Input
                  id="cnpj"
                  placeholder="00.000.000/0000-00"
                  value={formData.cnpj}
                  onChange={(e) =>
                    setFormData({ ...formData, cnpj: e.target.value })
                  }
                  className="bg-gray-800 border-gray-700 text-white"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="url" className="text-gray-300">
                  Website
                </Label>
                <Input
                  id="url"
                  type="url"
                  placeholder="https://exemplo.com"
                  value={formData.url}
                  onChange={(e) =>
                    setFormData({ ...formData, url: e.target.value })
                  }
                  className="bg-gray-800 border-gray-700 text-white"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="region" className="text-gray-300">
                  Região
                </Label>
                <Input
                  id="region"
                  placeholder="Ex: Nacional, São Paulo, etc."
                  value={formData.region}
                  onChange={(e) =>
                    setFormData({ ...formData, region: e.target.value })
                  }
                  className="bg-gray-800 border-gray-700 text-white"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="license" className="text-gray-300">
                  Licença
                </Label>
                <Input
                  id="license"
                  placeholder="Ex: Licença SECAP #12345"
                  value={formData.license}
                  onChange={(e) =>
                    setFormData({ ...formData, license: e.target.value })
                  }
                  className="bg-gray-800 border-gray-700 text-white"
                />
              </div>

              <div className="flex space-x-4 pt-4">
                <Button
                  type="submit"
                  disabled={loading}
                  className="flex-1 bg-blue-600 hover:bg-blue-700 text-white"
                >
                  <Save className="w-4 h-4 mr-2" />
                  {loading ? "Salvando..." : "Salvar"}
                </Button>
                <Link href="/admin/bets" className="flex-1">
                  <Button
                    type="button"
                    variant="outline"
                    className="w-full border-gray-700 text-gray-300 hover:bg-gray-800"
                  >
                    Cancelar
                  </Button>
                </Link>
              </div>
            </CardContent>
          </Card>
        </form>
      </div>
    </div>
  );
}


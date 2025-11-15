"use client";

import React, { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Building2,
  Plus,
  Search,
  Edit,
  Trash2,
  BarChart3,
  ArrowLeft,
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import Link from "next/link";
import { useRouter } from "next/navigation";

interface Bet {
  id: string;
  name: string;
  cnpj?: string | null;
  url?: string | null;
  region?: string | null;
  license?: string | null;
  createdAt: string;
  updatedAt: string;
  parameters: Parameter[];
}

interface Parameter {
  id: string;
  name: string;
  value: number;
  category?: string | null;
  unit?: string | null;
}

export default function BetsManagementPage() {
  const [bets, setBets] = useState<Bet[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedRegion, setSelectedRegion] = useState<string>("all");
  const { toast } = useToast();
  const router = useRouter();

  const fetchBets = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      if (selectedRegion !== "all") {
        params.append("region", selectedRegion);
      }
      if (searchTerm) {
        params.append("search", searchTerm);
      }

      const response = await fetch(`/api/bets?${params.toString()}`);
      const data = await response.json();

      if (data.success) {
        setBets(data.bets);
      } else {
        throw new Error(data.error);
      }
    } catch (error) {
      console.error("Error fetching bets:", error);
      toast({
        variant: "destructive",
        title: "Erro",
        description: "Falha ao carregar casas de apostas",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: string, name: string) => {
    if (!confirm(`Tem certeza que deseja excluir a casa de apostas "${name}"?`)) {
      return;
    }

    try {
      const response = await fetch(`/api/bets/${id}`, {
        method: "DELETE",
      });

      const data = await response.json();

      if (data.success) {
        toast({
          title: "Sucesso",
          description: "Casa de apostas excluída com sucesso",
        });
        fetchBets();
      } else {
        throw new Error(data.error);
      }
    } catch (error) {
      console.error("Error deleting bet:", error);
      toast({
        variant: "destructive",
        title: "Erro",
        description: "Falha ao excluir casa de apostas",
      });
    }
  };

  useEffect(() => {
    fetchBets();
  }, [selectedRegion]);

  const filteredBets = bets.filter((bet) =>
    searchTerm
      ? bet.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        bet.cnpj?.toLowerCase().includes(searchTerm.toLowerCase())
      : true
  );

  const regions = Array.from(new Set(bets.map((b) => b.region).filter(Boolean)));

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 text-white p-8">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <div className="flex items-center space-x-3">
              <Link href="/admin">
                <Button
                  variant="ghost"
                  className="text-gray-400 hover:text-white"
                >
                  <ArrowLeft className="w-4 h-4" />
                </Button>
              </Link>
              <div>
                <h1 className="text-3xl font-bold text-white flex items-center">
                  <Building2 className="w-8 h-8 mr-3 text-blue-400" />
                  Gestão de Casas de Apostas
                </h1>
                <p className="text-gray-300 mt-1">
                  Cadastre e gerencie casas de apostas regulamentadas
                </p>
              </div>
            </div>
          </div>
          <Link href="/admin/bets/new">
            <Button className="bg-blue-600 hover:bg-blue-700 text-white">
              <Plus className="w-4 h-4 mr-2" />
              Nova Casa de Apostas
            </Button>
          </Link>
        </div>

        {/* Filters */}
        <Card className="bg-gradient-to-br from-gray-900/90 to-gray-800/90 border-gray-700/50 backdrop-blur-xl">
          <CardHeader>
            <CardTitle className="text-white text-lg">Filtros</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-5 w-5" />
                <Input
                  placeholder="Buscar por nome ou CNPJ..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10 bg-gray-800 border-gray-700 text-white placeholder-gray-400"
                />
              </div>
              <select
                value={selectedRegion}
                onChange={(e) => setSelectedRegion(e.target.value)}
                className="px-4 py-2 bg-gray-800 border-gray-700 text-white rounded-md border focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="all">Todas as Regiões</option>
                {regions.map((region) => (
                  <option key={region || ""} value={region || ""}>
                    {region || "N/A"}
                  </option>
                ))}
              </select>
            </div>
          </CardContent>
        </Card>

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <Card className="bg-gradient-to-br from-blue-900/50 to-blue-800/30 border-blue-700/50 backdrop-blur-xl">
            <CardContent className="pt-6">
              <div className="text-3xl font-bold text-white">
                {bets.length}
              </div>
              <div className="text-sm text-blue-200 mt-1">
                Total de Casas de Apostas
              </div>
            </CardContent>
          </Card>
          <Card className="bg-gradient-to-br from-purple-900/50 to-purple-800/30 border-purple-700/50 backdrop-blur-xl">
            <CardContent className="pt-6">
              <div className="text-3xl font-bold text-white">
                {bets.reduce((acc, bet) => acc + bet.parameters.length, 0)}
              </div>
              <div className="text-sm text-purple-200 mt-1">
                Total de Parâmetros
              </div>
            </CardContent>
          </Card>
          <Card className="bg-gradient-to-br from-green-900/50 to-green-800/30 border-green-700/50 backdrop-blur-xl">
            <CardContent className="pt-6">
              <div className="text-3xl font-bold text-white">
                {filteredBets.length}
              </div>
              <div className="text-sm text-green-200 mt-1">
                Resultados da Busca
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Bets List */}
        {loading ? (
          <Card className="bg-gradient-to-br from-gray-900/90 to-gray-800/90 border-gray-700/50 backdrop-blur-xl">
            <CardContent className="p-12 text-center text-gray-400">
              Carregando...
            </CardContent>
          </Card>
        ) : filteredBets.length === 0 ? (
          <Card className="bg-gradient-to-br from-gray-900/90 to-gray-800/90 border-gray-700/50 backdrop-blur-xl">
            <CardContent className="p-12 text-center">
              <Building2 className="w-16 h-16 text-gray-600 mx-auto mb-4" />
              <h3 className="text-xl font-semibold text-gray-300 mb-2">
                Nenhuma casa de apostas encontrada
              </h3>
              <p className="text-gray-400 mb-6">
                Comece cadastrando a primeira casa de apostas
              </p>
              <Link href="/admin/bets/new">
                <Button className="bg-blue-600 hover:bg-blue-700 text-white">
                  <Plus className="w-4 h-4 mr-2" />
                  Cadastrar Casa de Apostas
                </Button>
              </Link>
            </CardContent>
          </Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredBets.map((bet) => (
              <Card
                key={bet.id}
                className="bg-gradient-to-br from-gray-900/90 to-gray-800/90 border-gray-700/50 backdrop-blur-xl hover:border-blue-500/50 transition-all"
              >
                <CardHeader>
                  <CardTitle className="text-white flex items-center justify-between">
                    <span className="truncate">{bet.name}</span>
                    <Building2 className="w-5 h-5 text-blue-400 flex-shrink-0" />
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="text-sm space-y-2">
                    {bet.cnpj && (
                      <div className="text-gray-300">
                        <span className="text-gray-500">CNPJ:</span> {bet.cnpj}
                      </div>
                    )}
                    {bet.region && (
                      <div className="text-gray-300">
                        <span className="text-gray-500">Região:</span>{" "}
                        {bet.region}
                      </div>
                    )}
                    {bet.license && (
                      <div className="text-gray-300">
                        <span className="text-gray-500">Licença:</span>{" "}
                        {bet.license}
                      </div>
                    )}
                    <div className="text-gray-300">
                      <span className="text-gray-500">Parâmetros:</span>{" "}
                      {bet.parameters.length}
                    </div>
                  </div>
                  <div className="flex space-x-2 pt-3 border-t border-gray-700">
                    <Link href={`/admin/bets/${bet.id}`} className="flex-1">
                      <Button
                        variant="outline"
                        className="w-full border-blue-500 text-blue-400 hover:bg-blue-900/30"
                      >
                        <Edit className="w-4 h-4 mr-2" />
                        Editar
                      </Button>
                    </Link>
                    <Link href={`/admin/bets/${bet.id}/parameters`}>
                      <Button
                        variant="outline"
                        className="border-purple-500 text-purple-400 hover:bg-purple-900/30"
                      >
                        <BarChart3 className="w-4 h-4" />
                      </Button>
                    </Link>
                    <Button
                      variant="outline"
                      className="border-red-500 text-red-400 hover:bg-red-900/30"
                      onClick={() => handleDelete(bet.id, bet.name)}
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}


"use client";

import React, { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Building2,
  Search,
  BarChart3,
  Filter,
  TrendingUp,
  Star,
  ArrowRight,
  Sparkles,
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useRouter } from "next/navigation";

interface Bet {
  id: string;
  name: string;
  region?: string | null;
  license?: string | null;
  parameters: Parameter[];
}

interface Parameter {
  id: string;
  name: string;
  value: number;
  category?: string | null;
  unit?: string | null;
}

export default function ClientDashboard() {
  const [bets, setBets] = useState<Bet[]>([]);
  const [selectedBets, setSelectedBets] = useState<string[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedRegion, setSelectedRegion] = useState<string>("all");
  const [loading, setLoading] = useState(true);
  const [generatingInsights, setGeneratingInsights] = useState(false);
  const [insights, setInsights] = useState<any>(null);
  const { toast } = useToast();
  const router = useRouter();

  const fetchBets = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      if (selectedRegion !== "all") {
        params.append("region", selectedRegion);
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

  const handleGenerateInsights = async () => {
    if (selectedBets.length === 0) {
      toast({
        variant: "destructive",
        title: "Erro",
        description: "Selecione pelo menos uma casa de apostas",
      });
      return;
    }

    try {
      setGeneratingInsights(true);
      const response = await fetch("/api/insights", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          betIds: selectedBets,
          type: selectedBets.length > 1 ? "comparative" : "single",
        }),
      });

      const data = await response.json();

      if (data.success) {
        setInsights(data);
        toast({
          title: "Sucesso",
          description: "Insights gerados com sucesso!",
        });
      } else {
        throw new Error(data.error);
      }
    } catch (error) {
      console.error("Error generating insights:", error);
      toast({
        variant: "destructive",
        title: "Erro",
        description: "Falha ao gerar insights",
      });
    } finally {
      setGeneratingInsights(false);
    }
  };

  const handleToggleBet = (betId: string) => {
    setSelectedBets((prev) =>
      prev.includes(betId)
        ? prev.filter((id) => id !== betId)
        : [...prev, betId]
    );
    // Clear insights when selection changes
    setInsights(null);
  };

  useEffect(() => {
    fetchBets();
  }, [selectedRegion]);

  const filteredBets = bets.filter((bet) =>
    searchTerm
      ? bet.name.toLowerCase().includes(searchTerm.toLowerCase())
      : true
  );

  const regions = Array.from(new Set(bets.map((b) => b.region).filter(Boolean)));

  const handleLogout = () => {
    document.cookie =
      "better-auth.session=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;";
    localStorage.removeItem("auth-user");
    localStorage.removeItem("auth-session");
    router.push("/login");
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 text-white p-8">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-4xl font-bold text-white">
              Comparador de Casas de Apostas
            </h1>
            <p className="text-gray-300 mt-2">
              Compare e analise casas de apostas regulamentadas no Brasil
            </p>
          </div>
          <div className="flex items-center space-x-2">
            <Button
              onClick={fetchBets}
              variant="outline"
              className="border-gray-700 text-white hover:bg-gray-800"
            >
              <TrendingUp className="w-4 h-4 mr-2" />
              Atualizar
            </Button>
            <Button onClick={handleLogout} variant="outline">
              Sair
            </Button>
          </div>
        </div>

        {/* Selection Summary */}
        {selectedBets.length > 0 && (
          <Card className="bg-gradient-to-r from-blue-900/50 to-purple-900/50 border-blue-700/50 backdrop-blur-xl">
            <CardContent className="py-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <div className="w-10 h-10 rounded-full bg-blue-600 flex items-center justify-center">
                    <Building2 className="w-5 h-5" />
                  </div>
                  <div>
                    <div className="text-lg font-semibold">
                      {selectedBets.length}{" "}
                      {selectedBets.length === 1 ? "casa" : "casas"} selecionada
                      {selectedBets.length !== 1 ? "s" : ""}
                    </div>
                    <div className="text-sm text-gray-300">
                      Clique em "Gerar Insights" para análise com IA
                    </div>
                  </div>
                </div>
                <Button
                  onClick={handleGenerateInsights}
                  disabled={generatingInsights}
                  className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white"
                >
                  <Sparkles className="w-4 h-4 mr-2" />
                  {generatingInsights ? "Gerando..." : "Gerar Insights com IA"}
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Filters */}
        <Card className="bg-gradient-to-br from-gray-900/90 to-gray-800/90 border-gray-700/50 backdrop-blur-xl">
          <CardHeader>
            <CardTitle className="text-white text-lg flex items-center">
              <Filter className="w-5 h-5 mr-2 text-blue-400" />
              Filtros
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-5 w-5" />
                <Input
                  placeholder="Buscar casa de apostas..."
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
                  <option key={region} value={region}>
                    {region}
                  </option>
                ))}
              </select>
            </div>
          </CardContent>
        </Card>

        {/* AI Insights */}
        {insights && (
          <Card className="bg-gradient-to-br from-purple-900/50 to-blue-900/50 border-purple-700/50 backdrop-blur-xl">
            <CardHeader>
              <CardTitle className="text-white flex items-center">
                <Sparkles className="w-6 h-6 mr-2 text-purple-400" />
                Insights Gerados por IA
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              {insights.type === "comparative" && insights.overallSummary && (
                <div>
                  <h3 className="text-lg font-semibold text-white mb-2">
                    Resumo Comparativo
                  </h3>
                  <p className="text-gray-300">{insights.overallSummary}</p>
                </div>
              )}

              {insights.type === "comparative" && insights.rankings && (
                <div>
                  <h3 className="text-lg font-semibold text-white mb-3">
                    Ranking
                  </h3>
                  <div className="space-y-3">
                    {insights.rankings.map((rank: any, index: number) => (
                      <div
                        key={rank.name}
                        className="flex items-center space-x-4 p-4 bg-gray-800/50 rounded-lg"
                      >
                        <div className="text-3xl font-bold text-blue-400">
                          #{index + 1}
                        </div>
                        <div className="flex-1">
                          <div className="flex items-center space-x-2">
                            <h4 className="text-white font-semibold">
                              {rank.name}
                            </h4>
                            {index === 0 && (
                              <Star className="w-5 h-5 text-yellow-400 fill-yellow-400" />
                            )}
                          </div>
                          <div className="text-sm text-gray-400 mt-1">
                            Pontuação: {rank.score}/100
                          </div>
                          <p className="text-gray-300 text-sm mt-2">
                            {rank.reasoning}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {insights.insights && insights.insights[0] && (
                <div>
                  <h3 className="text-lg font-semibold text-white mb-3">
                    Análise Detalhada
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="p-4 bg-green-900/30 border border-green-700/50 rounded-lg">
                      <h4 className="font-semibold text-green-400 mb-2">
                        Pontos Fortes
                      </h4>
                      <ul className="list-disc list-inside text-gray-300 text-sm space-y-1">
                        {insights.insights[0].strengths?.map(
                          (strength: string, i: number) => (
                            <li key={i}>{strength}</li>
                          )
                        )}
                      </ul>
                    </div>
                    <div className="p-4 bg-red-900/30 border border-red-700/50 rounded-lg">
                      <h4 className="font-semibold text-red-400 mb-2">
                        Pontos Fracos
                      </h4>
                      <ul className="list-disc list-inside text-gray-300 text-sm space-y-1">
                        {insights.insights[0].weaknesses?.map(
                          (weakness: string, i: number) => (
                            <li key={i}>{weakness}</li>
                          )
                        )}
                      </ul>
                    </div>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        )}

        {/* Bets Grid */}
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
              <p className="text-gray-400">
                Ajuste os filtros ou tente uma busca diferente
              </p>
            </CardContent>
          </Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredBets.map((bet) => {
              const isSelected = selectedBets.includes(bet.id);
              return (
                <Card
                  key={bet.id}
                  className={`cursor-pointer transition-all ${
                    isSelected
                      ? "bg-gradient-to-br from-blue-900/70 to-purple-900/70 border-blue-500"
                      : "bg-gradient-to-br from-gray-900/90 to-gray-800/90 border-gray-700/50 hover:border-blue-500/50"
                  } backdrop-blur-xl`}
                  onClick={() => handleToggleBet(bet.id)}
                >
                  <CardHeader>
                    <CardTitle className="text-white flex items-center justify-between">
                      <span className="truncate">{bet.name}</span>
                      {isSelected ? (
                        <div className="w-6 h-6 rounded-full bg-blue-600 flex items-center justify-center flex-shrink-0">
                          <ArrowRight className="w-4 h-4" />
                        </div>
                      ) : (
                        <Building2 className="w-5 h-5 text-blue-400 flex-shrink-0" />
                      )}
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <div className="text-sm space-y-1">
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
                      <div className="flex items-center space-x-2 pt-2">
                        <BarChart3 className="w-4 h-4 text-purple-400" />
                        <span className="text-gray-300 text-sm">
                          {bet.parameters.length} parâmetros
                        </span>
                      </div>
                    </div>
                    {isSelected && (
                      <div className="pt-2 border-t border-blue-700">
                        <div className="text-xs text-blue-300 font-medium">
                          ✓ Selecionada para comparação
                        </div>
                      </div>
                    )}
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}

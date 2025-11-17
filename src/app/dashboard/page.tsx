"use client";

import React, { useState, useCallback, useEffect } from "react";
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
  Sliders,
  Clock,
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useRouter } from "next/navigation";
import { useFetch } from "@/hooks/use-fetch";
import { useApi } from "@/hooks/use-api";
import Link from "next/link";

interface Bet {
  id: string;
  name: string;
  region?: string | null;
  license?: string | null;
  url?: string | null;
  parameters: Parameter[];
  user?: {
    id: string;
    name: string;
    email: string;
  } | null;
}

interface Parameter {
  id: string;
  name: string;
  value: number;
  category?: string | null;
  unit?: string | null;
}

interface RankingItem {
  betName: string;
  score: number;
  reason: string;
}

interface BetInsight {
  strengths?: string[];
  weaknesses?: string[];
  recommendations?: string[];
}

interface Insight {
  type?: string;
  summary?: string;
  overallSummary?: string;
  rankings?: RankingItem[];
  insights?: BetInsight[];
  comparisons?: Record<string, unknown>;
}

export default function ClientDashboard() {
  const [selectedBets, setSelectedBets] = useState<string[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedRegion, setSelectedRegion] = useState<string>("all");
  const [insights, setInsights] = useState<Insight | null>(null);
  const { toast } = useToast();
  const router = useRouter();

  // Check if user has linked a bet
  interface LinkStatus {
    hasLinkedBet: boolean;
    userBet: {
      id: string;
      bet: {
        id: string;
        name: string;
        betId: string | null;
        parameters: Parameter[];
      };
      parameters: Parameter[];
    } | null;
    pendingRequest: {
      id: string;
      bet: {
        id: string;
        name: string;
        betId: string | null;
      };
      status: string;
      requestedAt: string;
    } | null;
  }
  const { data: linkStatus, loading: checkingLink } = useFetch<LinkStatus>(
    "/api/user/link-bet",
    {
      immediate: true,
      showToast: false,
      onSuccess: (data) => {
        if (!data?.hasLinkedBet && !data?.pendingRequest) {
          router.push("/setup");
        }
      },
    }
  );

  // Fetch bets using reusable hook
  const {
    data: betsData,
    loading,
    refetch: refetchBets,
  } = useFetch<{ bets: Bet[] }>(
    () => {
      const params = new URLSearchParams();
      if (selectedRegion !== "all") {
        params.append("region", selectedRegion);
      }
      return `/api/bets?${params.toString()}`;
    },
    {
      showToast: true,
      errorMessage: "Falha ao carregar casas de apostas",
      dependencies: [selectedRegion],
      immediate: !!linkStatus?.hasLinkedBet, // Only fetch if user has linked bet
    }
  );

  const bets = betsData?.bets || [];

  // Auto-select user's linked bet when bets are loaded
  useEffect(() => {
    if (
      linkStatus?.userBet?.bet?.id &&
      bets.length > 0 &&
      selectedBets.length === 0
    ) {
      const userBetId = linkStatus.userBet.bet.id;
      // Check if the bet exists in the bets list
      const betExists = bets.some((bet) => bet.id === userBetId);
      if (betExists) {
        setSelectedBets([userBetId]);
      }
    }
  }, [linkStatus?.userBet?.bet?.id, bets, selectedBets.length]);

  // Generate insights using reusable hook
  const generateInsightsApi = useCallback(async () => {
    if (selectedBets.length === 0) {
      throw new Error("Selecione pelo menos uma casa de apostas");
    }
    return fetch("/api/insights", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        betIds: selectedBets,
        type: selectedBets.length > 1 ? "comparative" : "single",
      }),
    });
  }, [selectedBets]);

  const { loading: generatingInsights, execute: generateInsights } =
    useApi<Insight>(generateInsightsApi, {
      onSuccess: (data) => {
        setInsights(data);
      },
      successMessage: "Insights gerados com sucesso!",
      errorMessage: "Falha ao gerar insights",
    });

  const handleGenerateInsights = async () => {
    if (selectedBets.length === 0) {
      toast({
        variant: "destructive",
        title: "Erro",
        description: "Selecione pelo menos uma casa de apostas",
      });
      return;
    }
    await generateInsights();
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

  const filteredBets = bets.filter((bet) =>
    searchTerm
      ? bet.name.toLowerCase().includes(searchTerm.toLowerCase())
      : true
  );

  // Separate user's bet from other bets
  const userBetId = linkStatus?.userBet?.bet?.id;
  const userBet = userBetId
    ? filteredBets.find((bet) => bet.id === userBetId)
    : null;
  const otherBets = filteredBets.filter((bet) => bet.id !== userBetId);

  const regions = Array.from(
    new Set(bets.map((b) => b.region).filter(Boolean))
  );

  const handleLogout = () => {
    document.cookie =
      "better-auth.session=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;";
    localStorage.removeItem("auth-user");
    localStorage.removeItem("auth-session");
    router.push("/login");
  };

  // Show loading while checking link status
  if (checkingLink) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 text-white flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-white mx-auto mb-4"></div>
          <p className="text-gray-300">Carregando...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 text-white p-4 sm:p-6 lg:p-8">
      <div className="max-w-7xl mx-auto space-y-3 sm:space-y-4">
        {/* Compact Header with Quick Access */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 sm:gap-4">
          <div className="flex-1 min-w-0">
            <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-white truncate">
              Comparador de Casas
            </h1>
            {linkStatus?.userBet && (
              <Link
                href={`/my-bet/${linkStatus.userBet.id}`}
                className="block mt-1"
              >
                <div className="flex items-center gap-2 text-sm sm:text-base text-blue-400 hover:text-blue-300 transition-colors">
                  <Building2 className="w-4 h-4 flex-shrink-0" />
                  <span className="truncate">
                    {linkStatus.userBet.bet?.name}
                  </span>
                  <span className="text-gray-400">•</span>
                  <span className="text-gray-400 text-xs sm:text-sm">
                    {linkStatus.userBet.bet?.betId}
                  </span>
                </div>
              </Link>
            )}
            {linkStatus?.pendingRequest && !linkStatus?.userBet && (
              <div className="mt-2 p-3 bg-yellow-900/30 border border-yellow-700/50 rounded-lg">
                <div className="flex items-center gap-2 text-sm text-yellow-200">
                  <Clock className="w-4 h-4" />
                  <span>
                    Solicitação pendente para &quot;
                    {linkStatus.pendingRequest.bet?.name}&quot;. Aguardando
                    aprovação do administrador.
                  </span>
                </div>
              </div>
            )}
          </div>
          <div className="flex items-center gap-2 flex-shrink-0">
            <Button
              onClick={refetchBets}
              variant="outline"
              size="sm"
              className="border-gray-700 text-white hover:bg-gray-800"
            >
              <TrendingUp className="w-4 h-4 sm:mr-2" />
              <span className="hidden sm:inline">Atualizar</span>
            </Button>
            <Button onClick={handleLogout} variant="outline" size="sm">
              Sair
            </Button>
          </div>
        </div>

        {/* Compact Filters and Selection Summary */}
        <Card className="bg-gradient-to-br from-gray-900/90 to-gray-800/90 border-gray-700/50 backdrop-blur-xl">
          <CardContent className="p-3 sm:p-4">
            <div className="space-y-3">
              {/* Filters Row */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 sm:gap-3">
                <div className="relative">
                  <Search className="absolute left-2 sm:left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4 sm:h-5 sm:w-5" />
                  <Input
                    placeholder="Buscar..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-8 sm:pl-10 h-9 sm:h-10 bg-gray-800 border-gray-700 text-white placeholder-gray-400 text-sm"
                  />
                </div>
                <select
                  value={selectedRegion}
                  onChange={(e) => setSelectedRegion(e.target.value)}
                  className="px-3 sm:px-4 py-2 h-9 sm:h-10 bg-gray-800 border-gray-700 text-white rounded-md border focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                >
                  <option value="all">Todas as Regiões</option>
                  {regions.map((region) => (
                    <option key={region} value={region || ""}>
                      {region}
                    </option>
                  ))}
                </select>
              </div>

              {/* Selection Summary - Compact */}
              {selectedBets.length > 0 && (
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 sm:gap-3 pt-2 border-t border-gray-700">
                  <div className="flex items-center gap-2 text-sm sm:text-base">
                    <div className="w-8 h-8 rounded-full bg-blue-600 flex items-center justify-center flex-shrink-0">
                      <Building2 className="w-4 h-4" />
                    </div>
                    <span className="font-semibold">
                      {selectedBets.length}{" "}
                      {selectedBets.length === 1 ? "casa" : "casas"} selecionada
                      {selectedBets.length !== 1 ? "s" : ""}
                    </span>
                  </div>
                  <Button
                    onClick={handleGenerateInsights}
                    disabled={generatingInsights}
                    size="sm"
                    className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white w-full sm:w-auto"
                  >
                    <Sparkles className="w-4 h-4 mr-2" />
                    {generatingInsights ? "Gerando..." : "Gerar Insights"}
                  </Button>
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* AI Insights */}
        {insights && (
          <Card className="bg-gradient-to-br from-purple-900/50 to-blue-900/50 border-purple-700/50 backdrop-blur-xl">
            <CardHeader className="pb-3">
              <CardTitle className="text-white flex items-center text-lg sm:text-xl">
                <Sparkles className="w-5 h-5 sm:w-6 sm:h-6 mr-2 text-purple-400" />
                Insights Gerados por IA
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4 sm:space-y-6">
              {insights.type === "comparative" && insights.overallSummary && (
                <div>
                  <h3 className="text-base sm:text-lg font-semibold text-white mb-2">
                    Resumo Comparativo
                  </h3>
                  <p className="text-sm sm:text-base text-gray-300">
                    {insights.overallSummary}
                  </p>
                </div>
              )}

              {insights.type === "comparative" && insights.rankings && (
                <div>
                  <h3 className="text-base sm:text-lg font-semibold text-white mb-2 sm:mb-3">
                    Ranking
                  </h3>
                  <div className="space-y-2 sm:space-y-3">
                    {insights.rankings.map(
                      (rank: RankingItem, index: number) => (
                        <div
                          key={rank.betName}
                          className="flex items-start sm:items-center gap-3 sm:gap-4 p-3 sm:p-4 bg-gray-800/50 rounded-lg"
                        >
                          <div className="text-2xl sm:text-3xl font-bold text-blue-400 flex-shrink-0">
                            #{index + 1}
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2">
                              <h4 className="text-white font-semibold text-sm sm:text-base truncate">
                                {rank.betName}
                              </h4>
                              {index === 0 && (
                                <Star className="w-4 h-4 sm:w-5 sm:h-5 text-yellow-400 fill-yellow-400 flex-shrink-0" />
                              )}
                            </div>
                            <div className="text-xs sm:text-sm text-gray-400 mt-1">
                              Pontuação: {rank.score}/100
                            </div>
                            <p className="text-gray-300 text-xs sm:text-sm mt-2 line-clamp-2">
                              {rank.reason}
                            </p>
                          </div>
                        </div>
                      )
                    )}
                  </div>
                </div>
              )}

              {insights.insights && insights.insights[0] && (
                <div>
                  <h3 className="text-base sm:text-lg font-semibold text-white mb-2 sm:mb-3">
                    Análise Detalhada
                  </h3>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
                    <div className="p-3 sm:p-4 bg-green-900/30 border border-green-700/50 rounded-lg">
                      <h4 className="font-semibold text-green-400 mb-2 text-sm sm:text-base">
                        Pontos Fortes
                      </h4>
                      <ul className="list-disc list-inside text-gray-300 text-xs sm:text-sm space-y-1">
                        {insights.insights[0].strengths?.map(
                          (strength: string, i: number) => (
                            <li key={i}>{strength}</li>
                          )
                        )}
                      </ul>
                    </div>
                    <div className="p-3 sm:p-4 bg-red-900/30 border border-red-700/50 rounded-lg">
                      <h4 className="font-semibold text-red-400 mb-2 text-sm sm:text-base">
                        Pontos Fracos
                      </h4>
                      <ul className="list-disc list-inside text-gray-300 text-xs sm:text-sm space-y-1">
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

        {/* User's Bet and Other Bets - Side by Side */}
        {loading ? (
          <Card className="bg-gradient-to-br from-gray-900/90 to-gray-800/90 border-gray-700/50 backdrop-blur-xl">
            <CardContent className="p-8 sm:p-12 text-center text-gray-400">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-white mx-auto mb-2"></div>
              <p className="text-sm">Carregando...</p>
            </CardContent>
          </Card>
        ) : otherBets.length === 0 && !userBet ? (
          <Card className="bg-gradient-to-br from-gray-900/90 to-gray-800/90 border-gray-700/50 backdrop-blur-xl">
            <CardContent className="p-8 sm:p-12 text-center">
              <Building2 className="w-12 h-12 sm:w-16 sm:h-16 text-gray-600 mx-auto mb-3 sm:mb-4" />
              <h3 className="text-lg sm:text-xl font-semibold text-gray-300 mb-2">
                Nenhuma casa encontrada
              </h3>
              <p className="text-sm sm:text-base text-gray-400">
                Ajuste os filtros ou tente uma busca diferente
              </p>
            </CardContent>
          </Card>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-4 gap-3 sm:gap-4">
            {/* User's Bet - Sidebar */}
            {userBet && (
              <div className="lg:col-span-1">
                <h2 className="text-lg sm:text-xl font-bold text-white mb-2 sm:mb-3 flex items-center">
                  <Building2 className="w-4 h-4 sm:w-5 sm:h-5 mr-2 text-green-400" />
                  <span className="hidden sm:inline">Minha Casa</span>
                  <span className="sm:hidden">Minha Casa</span>
                </h2>
                {(() => {
                  const isSelected = selectedBets.includes(userBet.id);
                  return (
                    <Card
                      className={`cursor-pointer transition-all ${
                        isSelected
                          ? "bg-gradient-to-br from-blue-900/70 to-purple-900/70 border-blue-500"
                          : "bg-gradient-to-br from-gray-900/90 to-gray-800/90 border-gray-700/50 hover:border-blue-500/50"
                      } backdrop-blur-xl`}
                      onClick={() => handleToggleBet(userBet.id)}
                    >
                      <CardHeader className="pb-2 sm:pb-3">
                        <CardTitle className="text-white flex items-center justify-between text-base sm:text-lg">
                          <span className="truncate">{userBet.name}</span>
                          {isSelected ? (
                            <div className="w-5 h-5 sm:w-6 sm:h-6 rounded-full bg-blue-600 flex items-center justify-center flex-shrink-0 ml-2">
                              <ArrowRight className="w-3 h-3 sm:w-4 sm:h-4" />
                            </div>
                          ) : (
                            <Building2 className="w-4 h-4 sm:w-5 sm:h-5 text-blue-400 flex-shrink-0 ml-2" />
                          )}
                        </CardTitle>
                      </CardHeader>
                      <CardContent className="space-y-2 sm:space-y-3 pt-0">
                        <div className="flex flex-wrap items-center gap-1.5 sm:gap-2 text-xs sm:text-sm">
                          <span className="text-green-400 font-medium">
                            ✓ Minha Casa
                          </span>
                          {userBet.region && (
                            <>
                              <span className="text-gray-500">•</span>
                              <span className="text-gray-300">
                                {userBet.region}
                              </span>
                            </>
                          )}
                          <span className="text-gray-500">•</span>
                          <span className="text-gray-300">
                            {userBet.parameters.length} parâmetros
                          </span>
                        </div>
                        <div className="pt-2 border-t border-gray-700">
                          <Link
                            href={`/my-bet/${linkStatus?.userBet?.id}/parameters`}
                            onClick={(e) => e.stopPropagation()}
                          >
                            <Button
                              variant="outline"
                              size="icon"
                              className="border-blue-500 text-blue-400 hover:bg-blue-900/30 rounded-full h-8 w-8"
                            >
                              <BarChart3 className="w-4 h-4" />
                            </Button>
                          </Link>
                        </div>
                        {isSelected && (
                          <div className="pt-2 border-t border-blue-700">
                            <div className="text-xs text-blue-300 font-medium">
                              ✓ Selecionada
                            </div>
                          </div>
                        )}
                      </CardContent>
                    </Card>
                  );
                })()}
              </div>
            )}

            {/* Other Bets Grid */}
            <div className={userBet ? "lg:col-span-3" : "lg:col-span-4"}>
              {otherBets.length > 0 && (
                <>
                  <h2 className="text-lg sm:text-xl font-bold text-white mb-2 sm:mb-3 flex items-center">
                    <Building2 className="w-4 h-4 sm:w-5 sm:h-5 mr-2 text-blue-400" />
                    <span className="hidden sm:inline">
                      Outras Casas de Apostas
                    </span>
                    <span className="sm:hidden">Outras Casas</span>
                  </h2>
                  <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-3 sm:gap-4">
                    {otherBets.map((bet) => {
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
                          <CardHeader className="pb-2 sm:pb-3">
                            <CardTitle className="text-white flex items-center justify-between text-base sm:text-lg">
                              <span className="truncate">{bet.name}</span>
                              {isSelected ? (
                                <div className="w-5 h-5 sm:w-6 sm:h-6 rounded-full bg-blue-600 flex items-center justify-center flex-shrink-0 ml-2">
                                  <ArrowRight className="w-3 h-3 sm:w-4 sm:h-4" />
                                </div>
                              ) : (
                                <Building2 className="w-4 h-4 sm:w-5 sm:h-5 text-blue-400 flex-shrink-0 ml-2" />
                              )}
                            </CardTitle>
                          </CardHeader>
                          <CardContent className="space-y-2 sm:space-y-3 pt-0">
                            <div className="flex flex-wrap items-center gap-1.5 sm:gap-2 text-xs sm:text-sm">
                              {bet.region && (
                                <>
                                  <span className="text-gray-300">
                                    {bet.region}
                                  </span>
                                  <span className="text-gray-500">•</span>
                                </>
                              )}
                              <span className="text-gray-300">
                                {bet.parameters.length} parâmetros
                              </span>
                            </div>
                            <div className="pt-2 border-t border-gray-700">
                              <Link
                                href={`/bets/${bet.id}/parameters`}
                                onClick={(e) => e.stopPropagation()}
                              >
                                <Button
                                  variant="outline"
                                  size="icon"
                                  className="border-blue-500 text-blue-400 hover:bg-blue-900/30 rounded-full h-8 w-8"
                                >
                                  <BarChart3 className="w-4 h-4" />
                                </Button>
                              </Link>
                            </div>
                            {isSelected && (
                              <div className="pt-2 border-t border-blue-700">
                                <div className="text-xs text-blue-300 font-medium">
                                  ✓ Selecionada
                                </div>
                              </div>
                            )}
                          </CardContent>
                        </Card>
                      );
                    })}
                  </div>
                </>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

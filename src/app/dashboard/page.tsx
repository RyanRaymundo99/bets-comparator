"use client";

import React, { useState, useCallback, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Building2,
  Search,
  BarChart3,
  Star,
  ArrowRight,
  Sparkles,
  Clock,
  ChevronDown,
  ChevronUp,
  RefreshCw,
  LogOut,
  ExternalLink,
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
  const [expandedCards, setExpandedCards] = useState<Set<string>>(new Set());
  const { toast } = useToast();
  const router = useRouter();

  const toggleCard = (betId: string) => {
    setExpandedCards((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(betId)) {
        newSet.delete(betId);
      } else {
        newSet.add(betId);
      }
      return newSet;
    });
  };

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
      <div className="min-h-screen bg-gradient-to-br from-[#0a1628] via-[#0f1f3a] to-[#1e3a5f] text-white flex items-center justify-center">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-16 w-16 border-4 border-[#4a6a9a]/30 border-t-blue-300 mb-6"></div>
          <p className="text-blue-200 font-semibold text-lg">Carregando...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#0a1628] via-[#0f1f3a] to-[#1e3a5f] text-white relative overflow-hidden">
      {/* Background decorative elements */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-[#2d4a75]/20 rounded-full blur-3xl"></div>
        <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-[#5a7ba5]/20 rounded-full blur-3xl"></div>
        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-[#3a5a8a]/10 rounded-full blur-3xl"></div>
      </div>
      
      <div className="relative z-10 max-w-7xl mx-auto p-6 md:p-8 lg:p-10 space-y-8">
        {/* Header */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="flex-1">
            <div className="flex items-center space-x-4">
              <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-[#2d4a75] to-[#3a5a8a] flex items-center justify-center shadow-lg shadow-[#2d4a75]/30">
                <Building2 className="w-7 h-7 text-blue-100" />
              </div>
              <div>
                <h1 className="text-3xl md:text-4xl font-bold text-white tracking-tight">
                  Comparador de Casas
                </h1>
                {linkStatus?.userBet && (
                  <Link
                    href={`/my-bet/${linkStatus.userBet.id}`}
                    className="block mt-1.5"
                  >
                    <div className="flex items-center gap-2 text-sm md:text-base text-blue-200/80 hover:text-blue-100 transition-colors">
                      <Building2 className="w-4 h-4 flex-shrink-0" />
                      <span className="truncate">
                        {linkStatus.userBet.bet?.name}
                      </span>
                      <span className="text-blue-300/50">•</span>
                      <span className="text-blue-300/60 text-xs sm:text-sm">
                        {linkStatus.userBet.bet?.betId}
                      </span>
                    </div>
                  </Link>
                )}
                {linkStatus?.pendingRequest && !linkStatus?.userBet && (
                  <div className="mt-2 p-3 bg-yellow-900/30 border border-yellow-700/50 rounded-xl">
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
            </div>
          </div>
          <div className="flex items-center gap-2 flex-shrink-0">
            <Button
              onClick={refetchBets}
              variant="outline"
              className="border-[#4a6a9a]/40 text-blue-200 hover:bg-[#1e3a5f]/40 hover:text-blue-100 hover:border-[#5a7ba5] transition-all rounded-xl"
            >
              <RefreshCw className="w-4 h-4 sm:mr-2" />
              <span className="hidden sm:inline">Atualizar</span>
            </Button>
            <Button 
              onClick={handleLogout} 
              variant="outline"
              className="border-[#4a6a9a]/40 text-blue-200 hover:bg-red-500/20 hover:text-red-200 hover:border-red-400/50 transition-all rounded-xl"
            >
              <LogOut className="w-4 h-4 sm:mr-2" />
              <span className="hidden sm:inline">Sair</span>
            </Button>
          </div>
        </div>

        {/* Filters */}
        <Card className="bg-gradient-to-br from-[#1e3a5f]/40 via-[#2d4a75]/30 to-[#3a5a8a]/20 border-[#4a6a9a]/30 backdrop-blur-2xl shadow-2xl shadow-[#1e3a5f]/20 rounded-2xl">
          <CardHeader className="pb-4">
            <CardTitle className="text-white text-xl font-bold flex items-center">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-[#2d4a75] to-[#3a5a8a] flex items-center justify-center mr-3 shadow-lg">
                <Search className="w-5 h-5 text-blue-100" />
              </div>
              Filtros
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="relative group">
                  <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-blue-300/60 h-5 w-5 group-focus-within:text-blue-300 transition-colors" />
                  <Input
                    placeholder="Buscar..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-12 pr-4 py-6 bg-[#0f1f3a]/60 border-[#4a6a9a]/30 text-white placeholder-blue-200/40 focus:border-[#5a7ba5] focus:ring-2 focus:ring-[#5a7ba5]/40 focus:bg-[#0f1f3a]/80 rounded-xl transition-all duration-200"
                  />
                </div>
                <select
                  value={selectedRegion}
                  onChange={(e) => setSelectedRegion(e.target.value)}
                  className="px-4 py-6 bg-[#0f1f3a]/60 border-[#4a6a9a]/30 text-white rounded-xl border focus:outline-none focus:ring-2 focus:ring-[#5a7ba5]/40 focus:border-[#5a7ba5] focus:bg-[#0f1f3a]/80 transition-all duration-200 cursor-pointer"
                >
                  <option value="all">Todas as Regiões</option>
                  {regions.map((region) => (
                    <option key={region} value={region || ""}>
                      {region}
                    </option>
                  ))}
                </select>
              </div>

              {/* Selection Summary */}
              {selectedBets.length > 0 && (
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 pt-4 border-t border-[#4a6a9a]/30">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-[#2d4a75] to-[#3a5a8a] flex items-center justify-center shadow-lg">
                      <Building2 className="w-6 h-6 text-blue-100" />
                    </div>
                    <span className="font-semibold text-blue-100 text-lg">
                      {selectedBets.length}{" "}
                      {selectedBets.length === 1 ? "casa selecionada" : "casas selecionadas"}
                    </span>
                  </div>
                  <Button
                    onClick={handleGenerateInsights}
                    disabled={generatingInsights}
                    className="bg-gradient-to-r from-[#2d4a75] via-[#3a5a8a] to-[#4a6a9a] hover:from-[#3a5a8a] hover:via-[#4a6a9a] hover:to-[#5a7ba5] text-white shadow-xl hover:shadow-2xl transition-all duration-300 rounded-xl px-6 py-6 h-auto font-semibold"
                  >
                    <Sparkles className="w-5 h-5 mr-2" />
                    {generatingInsights ? "Gerando..." : "Gerar Insights"}
                  </Button>
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* AI Insights */}
        {insights && (
          <Card className="bg-gradient-to-br from-[#1e3a5f]/60 via-[#2d4a75]/50 to-[#3a5a8a]/40 border-[#4a6a9a]/40 backdrop-blur-2xl shadow-2xl rounded-2xl">
            <CardHeader className="pb-4">
              <CardTitle className="text-white flex items-center text-xl font-bold">
                <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-purple-500/30 to-blue-500/30 flex items-center justify-center mr-3 shadow-lg">
                  <Sparkles className="w-5 h-5 text-purple-300" />
                </div>
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
          <Card className="bg-gradient-to-br from-[#1e3a5f]/40 via-[#2d4a75]/30 to-[#3a5a8a]/20 border-[#4a6a9a]/30 backdrop-blur-2xl shadow-2xl rounded-2xl">
            <CardContent className="p-16 text-center">
              <div className="inline-block animate-spin rounded-full h-16 w-16 border-4 border-[#4a6a9a]/30 border-t-blue-300 mb-6"></div>
              <p className="text-blue-200 font-semibold text-lg">Carregando...</p>
            </CardContent>
          </Card>
        ) : otherBets.length === 0 && !userBet ? (
          <Card className="bg-gradient-to-br from-[#1e3a5f]/40 via-[#2d4a75]/30 to-[#3a5a8a]/20 border-[#4a6a9a]/30 backdrop-blur-2xl shadow-2xl rounded-2xl">
            <CardContent className="p-16 text-center">
              <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-[#2d4a75] to-[#3a5a8a] flex items-center justify-center mx-auto mb-6 shadow-lg">
                <Building2 className="w-12 h-12 text-blue-200" />
              </div>
              <h3 className="text-2xl font-bold text-blue-100 mb-3">
                Nenhuma casa encontrada
              </h3>
              <p className="text-blue-200/70 text-lg">
                Ajuste os filtros ou tente uma busca diferente
              </p>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-6">
            {/* All Bets Grid - Including User's Bet */}
            <div>
              {(userBet || otherBets.length > 0) && (
                <>
                  {userBet && (
                    <h2 className="text-xl font-bold text-white mb-4 flex items-center">
                      <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-green-500/20 to-green-600/20 flex items-center justify-center mr-3">
                        <Building2 className="w-5 h-5 text-green-400" />
                      </div>
                      Minha Casa
                    </h2>
                  )}
                  {otherBets.length > 0 && (
                    <h2 className="text-xl font-bold text-white mb-4 flex items-center">
                      <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-[#2d4a75] to-[#3a5a8a] flex items-center justify-center mr-3 shadow-lg">
                        <Building2 className="w-5 h-5 text-blue-300" />
                      </div>
                      {userBet ? "Outras Casas de Apostas" : "Casas de Apostas"}
                    </h2>
                  )}
                </>
              )}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {/* User's Bet Card */}
                {userBet && (() => {
                  const isSelected = selectedBets.includes(userBet.id);
                  const isExpanded = expandedCards.has(userBet.id);
                  const hasDetails = userBet.region || userBet.license;
                  
                  return (
                    <Card
                      key={userBet.id}
                      className={`relative bg-gradient-to-br from-[#1e3a5f]/50 via-[#2d4a75]/40 to-[#3a5a8a]/30 border-[#4a6a9a]/30 backdrop-blur-xl hover:border-[#5a7ba5]/50 hover:shadow-2xl hover:shadow-[#3a5a8a]/20 hover:scale-[1.03] transition-all duration-500 rounded-2xl overflow-hidden group cursor-pointer ${
                        isSelected ? "ring-2 ring-blue-400/50" : ""
                      }`}
                      onClick={() => handleToggleBet(userBet.id)}
                    >
                      <div className="absolute inset-0 bg-gradient-to-br from-[#3a5a8a]/0 to-[#4a6a9a]/10 opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
                      
                      <CardHeader className="relative pb-4 pt-6 px-6">
                        <div className="flex items-start justify-between gap-3">
                          <div className="flex-1 min-w-0">
                            <CardTitle className="text-white font-bold text-xl group-hover:text-blue-100 transition-colors duration-300 mb-1">
                              {userBet.name}
                            </CardTitle>
                            {userBet.url && (
                              <a
                                href={userBet.url}
                                target="_blank"
                                rel="noopener noreferrer"
                                onClick={(e) => e.stopPropagation()}
                                className="flex items-center gap-1.5 text-blue-300/70 hover:text-blue-200 transition-colors text-sm group/link"
                              >
                                <span className="truncate">{userBet.url}</span>
                                <ExternalLink className="w-3.5 h-3.5 flex-shrink-0 group-hover/link:scale-110 transition-transform" />
                              </a>
                            )}
                          </div>
                          <div className="flex items-center gap-2 flex-shrink-0">
                            {isSelected && (
                              <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center shadow-lg">
                                <ArrowRight className="w-4 h-4 text-white" />
                              </div>
                            )}
                            <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-[#2d4a75] to-[#3a5a8a] flex items-center justify-center group-hover:scale-110 group-hover:rotate-3 transition-all duration-300 shadow-lg">
                              <Building2 className="w-6 h-6 text-blue-200" />
                            </div>
                          </div>
                        </div>
                      </CardHeader>
                      
                      <CardContent className="relative space-y-4 px-6 pb-6">
                        {/* Informação compacta sempre visível */}
                        <div className="flex items-center justify-between p-3 rounded-xl bg-gradient-to-r from-green-500/20 to-green-600/10 border border-green-500/30">
                          <span className="text-green-300 font-semibold text-xs uppercase tracking-wider">✓ Minha Casa</span>
                          <span className="text-blue-100 font-bold text-lg">{userBet.parameters.length} parâmetros</span>
                        </div>

                        {/* Botão para expandir/colapsar */}
                        {hasDetails && (
                          <Button
                            variant="ghost"
                            onClick={(e) => {
                              e.stopPropagation();
                              toggleCard(userBet.id);
                            }}
                            className="w-full flex items-center justify-between p-3 rounded-xl bg-[#0f1f3a]/20 hover:bg-[#0f1f3a]/40 text-blue-200 hover:text-blue-100 transition-all duration-200 group/btn"
                          >
                            <span className="text-sm font-medium">
                              {isExpanded ? "Ocultar detalhes" : "Ver detalhes"}
                            </span>
                            {isExpanded ? (
                              <ChevronUp className="w-4 h-4 group-hover/btn:scale-110 transition-transform" />
                            ) : (
                              <ChevronDown className="w-4 h-4 group-hover/btn:scale-110 transition-transform" />
                            )}
                          </Button>
                        )}

                        {/* Conteúdo expandível */}
                        {isExpanded && hasDetails && (
                          <div className="space-y-3 animate-in slide-in-from-top-2 duration-300">
                            {userBet.region && (
                              <div className="flex items-start gap-3 p-3 rounded-xl bg-[#0f1f3a]/30 group-hover:bg-[#0f1f3a]/50 transition-colors">
                                <span className="text-blue-200/60 font-semibold text-xs uppercase tracking-wider min-w-[70px]">Região</span>
                                <span className="text-blue-50 font-medium text-sm flex-1">{userBet.region}</span>
                              </div>
                            )}
                            {userBet.license && (
                              <div className="flex items-start gap-3 p-3 rounded-xl bg-[#0f1f3a]/30 group-hover:bg-[#0f1f3a]/50 transition-colors">
                                <span className="text-blue-200/60 font-semibold text-xs uppercase tracking-wider min-w-[70px]">Licença</span>
                                <span className="text-blue-50 font-medium text-sm flex-1">{userBet.license}</span>
                              </div>
                            )}
                          </div>
                        )}

                        {/* Botões de ação */}
                        <div className="flex gap-2 pt-2 border-t border-[#4a6a9a]/20">
                          <Link
                            href={`/my-bet/${linkStatus?.userBet?.id}/parameters`}
                            onClick={(e) => e.stopPropagation()}
                            className="flex-1"
                          >
                            <Button
                              variant="outline"
                              className="w-full border-[#5a7ba5]/50 text-blue-200 hover:bg-[#5a7ba5]/30 hover:text-blue-100 hover:border-[#6b8cb5] transition-all rounded-xl font-medium"
                            >
                              <BarChart3 className="w-4 h-4 mr-2" />
                              Parâmetros
                            </Button>
                          </Link>
                        </div>
                        
                        {isSelected && (
                          <div className="pt-2 border-t border-blue-700/30">
                            <div className="text-xs text-blue-300 font-medium flex items-center gap-2">
                              <div className="w-2 h-2 rounded-full bg-blue-400"></div>
                              Selecionada
                            </div>
                          </div>
                        )}
                      </CardContent>
                    </Card>
                  );
                })()}
                
                {/* Other Bets Cards */}
                {otherBets.map((bet, index) => {
                      const isSelected = selectedBets.includes(bet.id);
                      const isExpanded = expandedCards.has(bet.id);
                      const hasDetails = bet.region || bet.license;
                      
                      return (
                        <Card
                          key={bet.id}
                          className={`relative bg-gradient-to-br from-[#1e3a5f]/50 via-[#2d4a75]/40 to-[#3a5a8a]/30 border-[#4a6a9a]/30 backdrop-blur-xl hover:border-[#5a7ba5]/50 hover:shadow-2xl hover:shadow-[#3a5a8a]/20 hover:scale-[1.03] transition-all duration-500 rounded-2xl overflow-hidden group cursor-pointer ${
                            isSelected ? "ring-2 ring-blue-400/50" : ""
                          }`}
                          style={{ animationDelay: `${index * 50}ms` }}
                          onClick={() => handleToggleBet(bet.id)}
                        >
                          <div className="absolute inset-0 bg-gradient-to-br from-[#3a5a8a]/0 to-[#4a6a9a]/10 opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
                          
                          <CardHeader className="relative pb-4 pt-6 px-6">
                            <div className="flex items-start justify-between gap-3">
                              <div className="flex-1 min-w-0">
                                <CardTitle className="text-white font-bold text-xl group-hover:text-blue-100 transition-colors duration-300 mb-1">
                                  {bet.name}
                                </CardTitle>
                                {bet.url && (
                                  <a
                                    href={bet.url}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    onClick={(e) => e.stopPropagation()}
                                    className="flex items-center gap-1.5 text-blue-300/70 hover:text-blue-200 transition-colors text-sm group/link"
                                  >
                                    <span className="truncate">{bet.url}</span>
                                    <ExternalLink className="w-3.5 h-3.5 flex-shrink-0 group-hover/link:scale-110 transition-transform" />
                                  </a>
                                )}
                              </div>
                              <div className="flex items-center gap-2 flex-shrink-0">
                                {isSelected && (
                                  <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center shadow-lg">
                                    <ArrowRight className="w-4 h-4 text-white" />
                                  </div>
                                )}
                                <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-[#2d4a75] to-[#3a5a8a] flex items-center justify-center group-hover:scale-110 group-hover:rotate-3 transition-all duration-300 shadow-lg">
                                  <Building2 className="w-6 h-6 text-blue-200" />
                                </div>
                              </div>
                            </div>
                          </CardHeader>
                          
                          <CardContent className="relative space-y-4 px-6 pb-6">
                            {/* Informação compacta sempre visível */}
                            <div className="flex items-center justify-between p-3 rounded-xl bg-gradient-to-r from-[#2d4a75]/30 to-[#3a5a8a]/20 border border-[#4a6a9a]/30">
                              <span className="text-blue-200/70 font-semibold text-xs uppercase tracking-wider">Parâmetros</span>
                              <span className="text-blue-100 font-bold text-lg">{bet.parameters.length}</span>
                            </div>

                            {/* Botão para expandir/colapsar */}
                            {hasDetails && (
                              <Button
                                variant="ghost"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  toggleCard(bet.id);
                                }}
                                className="w-full flex items-center justify-between p-3 rounded-xl bg-[#0f1f3a]/20 hover:bg-[#0f1f3a]/40 text-blue-200 hover:text-blue-100 transition-all duration-200 group/btn"
                              >
                                <span className="text-sm font-medium">
                                  {isExpanded ? "Ocultar detalhes" : "Ver detalhes"}
                                </span>
                                {isExpanded ? (
                                  <ChevronUp className="w-4 h-4 group-hover/btn:scale-110 transition-transform" />
                                ) : (
                                  <ChevronDown className="w-4 h-4 group-hover/btn:scale-110 transition-transform" />
                                )}
                              </Button>
                            )}

                            {/* Conteúdo expandível */}
                            {isExpanded && hasDetails && (
                              <div className="space-y-3 animate-in slide-in-from-top-2 duration-300">
                                {bet.region && (
                                  <div className="flex items-start gap-3 p-3 rounded-xl bg-[#0f1f3a]/30 group-hover:bg-[#0f1f3a]/50 transition-colors">
                                    <span className="text-blue-200/60 font-semibold text-xs uppercase tracking-wider min-w-[70px]">Região</span>
                                    <span className="text-blue-50 font-medium text-sm flex-1">{bet.region}</span>
                                  </div>
                                )}
                                {bet.license && (
                                  <div className="flex items-start gap-3 p-3 rounded-xl bg-[#0f1f3a]/30 group-hover:bg-[#0f1f3a]/50 transition-colors">
                                    <span className="text-blue-200/60 font-semibold text-xs uppercase tracking-wider min-w-[70px]">Licença</span>
                                    <span className="text-blue-50 font-medium text-sm flex-1">{bet.license}</span>
                                  </div>
                                )}
                              </div>
                            )}

                            {/* Botões de ação */}
                            <div className="flex gap-2 pt-2 border-t border-[#4a6a9a]/20">
                              <Link
                                href={`/bets/${bet.id}/parameters`}
                                onClick={(e) => e.stopPropagation()}
                                className="flex-1"
                              >
                                <Button
                                  variant="outline"
                                  className="w-full border-[#5a7ba5]/50 text-blue-200 hover:bg-[#5a7ba5]/30 hover:text-blue-100 hover:border-[#6b8cb5] transition-all rounded-xl font-medium"
                                >
                                  <BarChart3 className="w-4 h-4 mr-2" />
                                  Parâmetros
                                </Button>
                              </Link>
                            </div>
                            
                            {isSelected && (
                              <div className="pt-2 border-t border-blue-700/30">
                                <div className="text-xs text-blue-300 font-medium flex items-center gap-2">
                                  <div className="w-2 h-2 rounded-full bg-blue-400"></div>
                                  Selecionada
                                </div>
                              </div>
                            )}
                          </CardContent>
                        </Card>
                      );
                    })}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

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
  Plus,
  X,
  ChevronUp as ChevronUpIcon,
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
  const [isComparisonWidgetExpanded, setIsComparisonWidgetExpanded] = useState(true);
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

  // Removed auto-select - user must manually select houses for comparison

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

  const handleCompare = () => {
    if (selectedBets.length === 0) {
      toast({
        variant: "destructive",
        title: "Erro",
        description: "Selecione pelo menos uma casa de apostas para comparar",
      });
      return;
    }
    // Navegar para página de comparação com os IDs das casas selecionadas
    const queryParams = selectedBets.map((id) => `ids=${id}`).join("&");
    router.push(`/comparison?${queryParams}`);
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
      <div className="min-h-screen bg-white text-slate-800 flex items-center justify-center">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-16 w-16 border-4 border-blue-100 border-t-blue-600 mb-6"></div>
          <p className="text-slate-700 font-semibold text-lg">Carregando...</p>
        </div>
      </div>
    );
  }

  // Get selected bets data for comparison widget
  const selectedBetsData = bets.filter((bet) => selectedBets.includes(bet.id));

  return (
    <div className="min-h-screen bg-white text-slate-800 relative overflow-hidden">
      <div className="relative z-10 max-w-7xl mx-auto p-6 md:p-8 lg:p-10 space-y-8">
        {/* Header */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="flex-1">
            <div className="flex items-center space-x-4">
              <div className="w-14 h-14 rounded-2xl bg-blue-600 flex items-center justify-center shadow-lg">
                <Building2 className="w-7 h-7 text-white" />
              </div>
              <div>
                <h1 className="text-3xl md:text-4xl font-bold text-slate-900 tracking-tight">
                  Comparador de Casas
                </h1>
                {linkStatus?.userBet && (
                  <Link
                    href={`/my-bet/${linkStatus.userBet.id}`}
                    className="block mt-1.5"
                  >
                    <div className="flex items-center gap-2 text-sm md:text-base text-blue-600 hover:text-blue-700 transition-colors">
                      <Building2 className="w-4 h-4 flex-shrink-0" />
                      <span className="truncate">
                        {linkStatus.userBet.bet?.name}
                      </span>
                      <span className="text-slate-400">•</span>
                      <span className="text-slate-500 text-xs sm:text-sm">
                        {linkStatus.userBet.bet?.betId}
                      </span>
                    </div>
                  </Link>
                )}
                {linkStatus?.pendingRequest && !linkStatus?.userBet && (
                  <div className="mt-2 p-3 bg-yellow-50 border border-yellow-200 rounded-xl">
                    <div className="flex items-center gap-2 text-sm text-yellow-800">
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
              className="border-blue-200 text-blue-700 hover:bg-blue-50 hover:border-blue-300 transition-all rounded-xl"
            >
              <RefreshCw className="w-4 h-4 sm:mr-2" />
              <span className="hidden sm:inline">Atualizar</span>
            </Button>
            <Button 
              onClick={handleLogout} 
              variant="outline"
              className="border-blue-200 text-blue-700 hover:bg-red-50 hover:text-red-600 hover:border-red-300 transition-all rounded-xl"
            >
              <LogOut className="w-4 h-4 sm:mr-2" />
              <span className="hidden sm:inline">Sair</span>
            </Button>
          </div>
        </div>

        {/* Filters */}
        <Card className="bg-white border border-slate-200 shadow-sm rounded-2xl">
          <CardHeader className="pb-4">
            <CardTitle className="text-slate-900 text-xl font-bold flex items-center">
              <div className="w-10 h-10 rounded-xl bg-blue-100 flex items-center justify-center mr-3">
                <Search className="w-5 h-5 text-blue-600" />
              </div>
              Filtros
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="relative group">
                  <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-slate-400 h-5 w-5 group-focus-within:text-blue-600 transition-colors" />
                  <Input
                    placeholder="Buscar..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-12 pr-4 py-6 bg-slate-50 border-slate-200 text-slate-900 placeholder-slate-400 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 focus:bg-white rounded-xl transition-all duration-200"
                  />
                </div>
                <select
                  value={selectedRegion}
                  onChange={(e) => setSelectedRegion(e.target.value)}
                  className="px-4 py-6 bg-slate-50 border-slate-200 text-slate-900 rounded-xl border focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 focus:bg-white transition-all duration-200 cursor-pointer"
                >
                  <option value="all">Todas as Regiões</option>
                  {regions.map((region) => (
                    <option key={region} value={region || ""}>
                      {region}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* AI Insights */}
        {insights && (
          <Card className="bg-white border border-slate-200 shadow-sm rounded-2xl">
            <CardHeader className="pb-4">
              <CardTitle className="text-slate-900 flex items-center text-xl font-bold">
                <div className="w-10 h-10 rounded-xl bg-blue-100 flex items-center justify-center mr-3">
                  <Sparkles className="w-5 h-5 text-blue-600" />
                </div>
                Insights Gerados por IA
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4 sm:space-y-6">
              {insights.type === "comparative" && insights.overallSummary && (
                <div>
                  <h3 className="text-base sm:text-lg font-semibold text-slate-900 mb-2">
                    Resumo Comparativo
                  </h3>
                  <p className="text-sm sm:text-base text-slate-600">
                    {insights.overallSummary}
                  </p>
                </div>
              )}

              {insights.type === "comparative" && insights.rankings && (
                <div>
                  <h3 className="text-base sm:text-lg font-semibold text-slate-900 mb-2 sm:mb-3">
                    Ranking
                  </h3>
                  <div className="space-y-2 sm:space-y-3">
                    {insights.rankings.map(
                      (rank: RankingItem, index: number) => (
                        <div
                          key={rank.betName}
                          className="flex items-start sm:items-center gap-3 sm:gap-4 p-3 sm:p-4 bg-slate-50 rounded-lg border border-slate-200"
                        >
                          <div className="text-2xl sm:text-3xl font-bold text-blue-600 flex-shrink-0">
                            #{index + 1}
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2">
                              <h4 className="text-slate-900 font-semibold text-sm sm:text-base truncate">
                                {rank.betName}
                              </h4>
                              {index === 0 && (
                                <Star className="w-4 h-4 sm:w-5 sm:h-5 text-yellow-500 fill-yellow-500 flex-shrink-0" />
                              )}
                            </div>
                            <div className="text-xs sm:text-sm text-slate-500 mt-1">
                              Pontuação: {rank.score}/100
                            </div>
                            <p className="text-slate-600 text-xs sm:text-sm mt-2 line-clamp-2">
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
                  <h3 className="text-base sm:text-lg font-semibold text-slate-900 mb-2 sm:mb-3">
                    Análise Detalhada
                  </h3>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
                    <div className="p-3 sm:p-4 bg-green-50 border border-green-200 rounded-lg">
                      <h4 className="font-semibold text-green-700 mb-2 text-sm sm:text-base">
                        Pontos Fortes
                      </h4>
                      <ul className="list-disc list-inside text-slate-700 text-xs sm:text-sm space-y-1">
                        {insights.insights[0].strengths?.map(
                          (strength: string, i: number) => (
                            <li key={i}>{strength}</li>
                          )
                        )}
                      </ul>
                    </div>
                    <div className="p-3 sm:p-4 bg-red-50 border border-red-200 rounded-lg">
                      <h4 className="font-semibold text-red-700 mb-2 text-sm sm:text-base">
                        Pontos Fracos
                      </h4>
                      <ul className="list-disc list-inside text-slate-700 text-xs sm:text-sm space-y-1">
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
          <Card className="bg-white border border-slate-200 shadow-sm rounded-2xl">
            <CardContent className="p-16 text-center">
              <div className="inline-block animate-spin rounded-full h-16 w-16 border-4 border-blue-100 border-t-blue-600 mb-6"></div>
              <p className="text-slate-700 font-semibold text-lg">Carregando...</p>
            </CardContent>
          </Card>
        ) : otherBets.length === 0 && !userBet ? (
          <Card className="bg-white border border-slate-200 shadow-sm rounded-2xl">
            <CardContent className="p-16 text-center">
              <div className="w-20 h-20 rounded-2xl bg-blue-100 flex items-center justify-center mx-auto mb-6">
                <Building2 className="w-12 h-12 text-blue-600" />
              </div>
              <h3 className="text-2xl font-bold text-slate-900 mb-3">
                Nenhuma casa encontrada
              </h3>
              <p className="text-slate-600 text-lg">
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
                    <h2 className="text-xl font-bold text-slate-900 mb-4 flex items-center">
                      <div className="w-10 h-10 rounded-xl bg-green-100 flex items-center justify-center mr-3">
                        <Building2 className="w-5 h-5 text-green-600" />
                      </div>
                      Minha Casa
                    </h2>
                  )}
                  {otherBets.length > 0 && (
                    <h2 className="text-xl font-bold text-slate-900 mb-4 flex items-center">
                      <div className="w-10 h-10 rounded-xl bg-blue-100 flex items-center justify-center mr-3">
                        <Building2 className="w-5 h-5 text-blue-600" />
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
                      className={`relative bg-white border border-slate-200 hover:border-blue-300 hover:shadow-lg transition-all duration-300 rounded-xl overflow-hidden group ${
                        isSelected ? "ring-2 ring-blue-500" : ""
                      }`}
                    >
                      {/* Botão + no canto superior direito */}
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleToggleBet(userBet.id);
                        }}
                        className={`absolute top-4 right-4 z-10 w-10 h-10 rounded-full flex items-center justify-center transition-all duration-200 ${
                          isSelected
                            ? "bg-blue-600 text-white hover:bg-blue-700"
                            : "bg-blue-100 text-blue-600 hover:bg-blue-200"
                        }`}
                      >
                        {isSelected ? (
                          <X className="w-5 h-5" />
                        ) : (
                          <Plus className="w-5 h-5" />
                        )}
                      </button>
                      
                      <CardHeader className="relative pb-4 pt-6 px-6">
                        <div className="flex items-start justify-between gap-3">
                          <div className="flex-1 min-w-0 pr-12">
                            <CardTitle className="text-slate-900 font-bold text-xl mb-1">
                              {userBet.name}
                            </CardTitle>
                            {userBet.url && (
                              <a
                                href={userBet.url}
                                target="_blank"
                                rel="noopener noreferrer"
                                onClick={(e) => e.stopPropagation()}
                                className="flex items-center gap-1.5 text-blue-600 hover:text-blue-700 transition-colors text-sm group/link"
                              >
                                <span className="truncate">{userBet.url}</span>
                                <ExternalLink className="w-3.5 h-3.5 flex-shrink-0 group-hover/link:scale-110 transition-transform" />
                              </a>
                            )}
                          </div>
                        </div>
                      </CardHeader>
                      
                      <CardContent className="relative space-y-4 px-6 pb-6">
                        {/* Informação compacta sempre visível */}
                        <div className="flex items-center justify-between p-3 rounded-lg bg-green-50 border border-green-200">
                          <span className="text-green-700 font-semibold text-xs uppercase tracking-wider">✓ Minha Casa</span>
                          <span className="text-slate-900 font-bold text-lg">{userBet.parameters.length} parâmetros</span>
                        </div>

                        {/* Botão para expandir/colapsar */}
                        {hasDetails && (
                          <Button
                            variant="ghost"
                            onClick={(e) => {
                              e.stopPropagation();
                              toggleCard(userBet.id);
                            }}
                            className="w-full flex items-center justify-between p-3 rounded-lg bg-slate-50 hover:bg-slate-100 text-slate-700 hover:text-slate-900 transition-all duration-200 group/btn"
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
                              <div className="flex items-start gap-3 p-3 rounded-lg bg-slate-50 transition-colors">
                                <span className="text-slate-600 font-semibold text-xs uppercase tracking-wider min-w-[70px]">Região</span>
                                <span className="text-slate-900 font-medium text-sm flex-1">{userBet.region}</span>
                              </div>
                            )}
                            {userBet.license && (
                              <div className="flex items-start gap-3 p-3 rounded-lg bg-slate-50 transition-colors">
                                <span className="text-slate-600 font-semibold text-xs uppercase tracking-wider min-w-[70px]">Licença</span>
                                <span className="text-slate-900 font-medium text-sm flex-1">{userBet.license}</span>
                              </div>
                            )}
                          </div>
                        )}

                        {/* Botões de ação */}
                        <div className="flex gap-2 pt-2 border-t border-slate-200">
                          <Link
                            href={`/my-bet/${linkStatus?.userBet?.id}/parameters`}
                            onClick={(e) => e.stopPropagation()}
                            className="flex-1"
                          >
                            <Button
                              variant="outline"
                              className="w-full border-blue-200 text-blue-700 hover:bg-blue-50 hover:border-blue-300 transition-all rounded-lg font-medium"
                            >
                              <BarChart3 className="w-4 h-4 mr-2" />
                              Parâmetros
                            </Button>
                          </Link>
                        </div>
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
                          className={`relative bg-white border border-slate-200 hover:border-blue-300 hover:shadow-lg transition-all duration-300 rounded-xl overflow-hidden group ${
                            isSelected ? "ring-2 ring-blue-500" : ""
                          }`}
                          style={{ animationDelay: `${index * 50}ms` }}
                        >
                          {/* Botão + no canto superior direito */}
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              handleToggleBet(bet.id);
                            }}
                            className={`absolute top-4 right-4 z-10 w-10 h-10 rounded-full flex items-center justify-center transition-all duration-200 ${
                              isSelected
                                ? "bg-blue-600 text-white hover:bg-blue-700"
                                : "bg-blue-100 text-blue-600 hover:bg-blue-200"
                            }`}
                          >
                            {isSelected ? (
                              <X className="w-5 h-5" />
                            ) : (
                              <Plus className="w-5 h-5" />
                            )}
                          </button>
                          
                          <CardHeader className="relative pb-4 pt-6 px-6">
                            <div className="flex items-start justify-between gap-3">
                              <div className="flex-1 min-w-0 pr-12">
                                <CardTitle className="text-slate-900 font-bold text-xl mb-1">
                                  {bet.name}
                                </CardTitle>
                                {bet.url && (
                                  <a
                                    href={bet.url}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    onClick={(e) => e.stopPropagation()}
                                    className="flex items-center gap-1.5 text-blue-600 hover:text-blue-700 transition-colors text-sm group/link"
                                  >
                                    <span className="truncate">{bet.url}</span>
                                    <ExternalLink className="w-3.5 h-3.5 flex-shrink-0 group-hover/link:scale-110 transition-transform" />
                                  </a>
                                )}
                              </div>
                            </div>
                          </CardHeader>
                          
                          <CardContent className="relative space-y-4 px-6 pb-6">
                            {/* Informação compacta sempre visível */}
                            <div className="flex items-center justify-between p-3 rounded-lg bg-blue-50 border border-blue-200">
                              <span className="text-blue-700 font-semibold text-xs uppercase tracking-wider">Parâmetros</span>
                              <span className="text-slate-900 font-bold text-lg">{bet.parameters.length}</span>
                            </div>

                            {/* Botão para expandir/colapsar */}
                            {hasDetails && (
                              <Button
                                variant="ghost"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  toggleCard(bet.id);
                                }}
                                className="w-full flex items-center justify-between p-3 rounded-lg bg-slate-50 hover:bg-slate-100 text-slate-700 hover:text-slate-900 transition-all duration-200 group/btn"
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
                                  <div className="flex items-start gap-3 p-3 rounded-lg bg-slate-50 transition-colors">
                                    <span className="text-slate-600 font-semibold text-xs uppercase tracking-wider min-w-[70px]">Região</span>
                                    <span className="text-slate-900 font-medium text-sm flex-1">{bet.region}</span>
                                  </div>
                                )}
                                {bet.license && (
                                  <div className="flex items-start gap-3 p-3 rounded-lg bg-slate-50 transition-colors">
                                    <span className="text-slate-600 font-semibold text-xs uppercase tracking-wider min-w-[70px]">Licença</span>
                                    <span className="text-slate-900 font-medium text-sm flex-1">{bet.license}</span>
                                  </div>
                                )}
                              </div>
                            )}

                            {/* Botões de ação */}
                            <div className="flex gap-2 pt-2 border-t border-slate-200">
                              <Link
                                href={`/bets/${bet.id}/parameters`}
                                onClick={(e) => e.stopPropagation()}
                                className="flex-1"
                              >
                                <Button
                                  variant="outline"
                                  className="w-full border-blue-200 text-blue-700 hover:bg-blue-50 hover:border-blue-300 transition-all rounded-lg font-medium"
                                >
                                  <BarChart3 className="w-4 h-4 mr-2" />
                                  Parâmetros
                                </Button>
                              </Link>
                            </div>
                          </CardContent>
                        </Card>
                      );
                    })}
              </div>
            </div>
          </div>
        )}

        {/* Comparison Widget - Flutuante */}
        {selectedBets.length > 0 && (
          <div className="fixed bottom-6 right-6 z-50 max-w-md w-full">
            {isComparisonWidgetExpanded ? (
              <Card className="bg-white border-2 border-blue-200 shadow-2xl rounded-2xl overflow-hidden">
                <CardHeader 
                  className="bg-gradient-to-r from-purple-600 to-blue-600 text-white pb-3 cursor-pointer"
                  onClick={() => setIsComparisonWidgetExpanded(false)}
                >
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-white text-base font-bold flex items-center gap-2">
                      <span>VS</span>
                      <span>|</span>
                      <span>Lista de comparação</span>
                    </CardTitle>
                    <ChevronDown className="w-5 h-5" />
                  </div>
                </CardHeader>
                <CardContent className="p-4 space-y-3">
                  {/* Items selecionados */}
                  <div className="space-y-2 max-h-48 overflow-y-auto">
                    {selectedBetsData.map((bet) => (
                      <div
                        key={bet.id}
                        className="flex items-center gap-3 p-2 bg-slate-50 rounded-lg border border-slate-200 relative"
                        onClick={(e) => e.stopPropagation()}
                      >
                        <div className="w-10 h-10 rounded-lg bg-blue-100 flex items-center justify-center flex-shrink-0">
                          <Building2 className="w-5 h-5 text-blue-600" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-semibold text-slate-900 truncate">
                            {bet.name}
                          </p>
                          <p className="text-xs text-slate-500">
                            {bet.parameters.length} parâmetros
                          </p>
                        </div>
                        <button
                          onClick={(e) => {
                            e.preventDefault();
                            e.stopPropagation();
                            handleToggleBet(bet.id);
                          }}
                          className="w-8 h-8 rounded-full flex items-center justify-center text-slate-400 hover:text-red-600 hover:bg-red-50 transition-colors cursor-pointer flex-shrink-0 z-10"
                          type="button"
                          aria-label={`Remover ${bet.name} da comparação`}
                        >
                          <X className="w-4 h-4" />
                        </button>
                      </div>
                    ))}
                  </div>

                  {/* Botões de ação */}
                  <div className="flex gap-2 pt-2 border-t border-slate-200">
                    <Button
                      onClick={handleCompare}
                      disabled={selectedBets.length === 0}
                      className="flex-1 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-lg"
                    >
                      Comparar
                    </Button>
                    <button
                      onClick={() => {
                        const addMore = document.querySelector('[data-add-more]');
                        addMore?.scrollIntoView({ behavior: 'smooth' });
                      }}
                      className="w-10 h-10 rounded-full bg-blue-100 text-blue-600 hover:bg-blue-200 flex items-center justify-center transition-colors"
                      data-add-more
                    >
                      <Plus className="w-5 h-5" />
                    </button>
                  </div>
                </CardContent>
              </Card>
            ) : (
              // Widget colapsado - apenas barra horizontal
              <div
                className="bg-gradient-to-r from-purple-600 to-blue-600 text-white rounded-full px-6 py-3 shadow-2xl cursor-pointer hover:opacity-90 transition-opacity flex items-center justify-between gap-4"
                onClick={() => setIsComparisonWidgetExpanded(true)}
              >
                <div className="flex items-center gap-3">
                  <span className="text-white font-bold text-base">VS</span>
                  <span className="text-white/80">|</span>
                  <span className="text-white font-bold text-base">
                    {selectedBets.length} {selectedBets.length === 1 ? "item selecionado" : "itens selecionados"}
                  </span>
                </div>
                <ChevronUp className="w-5 h-5" />
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

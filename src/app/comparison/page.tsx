"use client";

import React, { useState, useEffect, useMemo, Suspense, useRef } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Building2, ExternalLink, Star, CheckCircle, XCircle } from "lucide-react";
import Link from "next/link";
import Image from "next/image";
import { useToast } from "@/hooks/use-toast";
import { PARAMETER_DEFINITIONS, PARAMETER_CATEGORIES, getParametersByCategory } from "@/lib/parameter-definitions";
import { ComparisonRadarChart } from "@/components/ui/comparison-radar-chart";
import { ComparisonAdvantages } from "@/components/ui/comparison-advantages";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

interface Bet {
  id: string;
  name: string;
  url?: string | null;
  region?: string | null;
  license?: string | null;
  logo?: string | null;
  coverImage?: string | null;
  domain?: string | null;
  parameters: Parameter[];
}

interface Parameter {
  id: string;
  name: string;
  valueText?: string | null;
  valueNumber?: number | null;
  valueBoolean?: boolean | null;
  valueRating?: number | null;
  category?: string | null;
  unit?: string | null;
  type?: string | null;
}

function ComparisonPageContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const { toast } = useToast();
  const [bets, setBets] = useState<Bet[]>([]);
  const [loading, setLoading] = useState(true);
  const [isHeaderShrunk, setIsHeaderShrunk] = useState(false);
  
  // Ref para o elemento que marca o fim do gráfico (trigger point)
  const chartEndRef = useRef<HTMLDivElement>(null);

  // Detectar quando chegar na seção "Comparação Detalhada" para ativar o shrinking header
  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        // Só ativa quando o elemento saiu para CIMA da tela (não quando está abaixo)
        // boundingClientRect.top < 0 significa que o elemento está acima da viewport
        const isAboveViewport = entry.boundingClientRect.top < 0;
        setIsHeaderShrunk(!entry.isIntersecting && isAboveViewport);
      },
      {
        root: null,
        rootMargin: "0px 0px 0px 0px",
        threshold: 0,
      }
    );

    if (chartEndRef.current) {
      observer.observe(chartEndRef.current);
    }

    return () => observer.disconnect();
  }, [bets]);

  // Pegar IDs dos query params
  const betIds = useMemo(() => {
    const ids = searchParams.getAll("ids");
    return ids.filter((id) => id && id.trim() !== "");
  }, [searchParams]);

  useEffect(() => {
    if (betIds.length === 0) {
      toast({
        variant: "destructive",
        title: "Erro",
        description: "Nenhuma casa de apostas selecionada para comparação",
      });
      router.push("/dashboard");
      return;
    }
    fetchBets();
  }, [betIds]);

  const fetchBets = async () => {
    try {
      setLoading(true);
      const promises = betIds.map((id) =>
        fetch(`/api/bets/${id}`).then((res) => res.json())
      );
      const results = await Promise.all(promises);

      const fetchedBets: Bet[] = results
        .map((result) => {
          if (result.success) {
            return result.data?.bet || result.bet;
          }
          return null;
        })
        .filter((bet): bet is Bet => bet !== null);

      setBets(fetchedBets);
    } catch (error) {
      console.error("Error fetching bets:", error);
      toast({
        variant: "destructive",
        title: "Erro",
        description: "Falha ao carregar casas de apostas para comparação",
      });
    } finally {
      setLoading(false);
    }
  };

  // Organizar parâmetros únicos de todas as casas + todos os parâmetros definidos
  const allParameters = useMemo(() => {
    const paramMap = new Map<string, Parameter[]>();
    
    // Collect parameters from all bets
    bets.forEach((bet) => {
      bet.parameters.forEach((param) => {
        if (!paramMap.has(param.name)) {
          paramMap.set(param.name, []);
        }
        paramMap.get(param.name)?.push(param);
      });
    });

    // Get all defined parameters and merge with existing ones
    const allParamNames = new Set<string>();
    
    // Add all defined parameter names
    PARAMETER_DEFINITIONS.forEach((def) => {
      allParamNames.add(def.name);
    });
    
    // Add all existing parameter names from bets
    paramMap.forEach((_, name) => {
      allParamNames.add(name);
    });

    // Return all parameters (defined + existing)
    return Array.from(allParamNames).map((paramName) => {
      const paramDef = PARAMETER_DEFINITIONS.find((d) => d.name === paramName);
      const existingParams = paramMap.get(paramName) || [];
      
      return {
        name: paramName,
        values: existingParams,
        category: existingParams[0]?.category || paramDef?.category || null,
        unit: existingParams[0]?.unit || paramDef?.unit || null,
      };
    });
  }, [bets]);

  const getParameterValue = (betId: string, paramName: string): Parameter | null => {
    const bet = bets.find((b) => b.id === betId);
    if (!bet) return null;
    return bet.parameters.find((p) => p.name === paramName) || null;
  };

  const getParameterDisplayValue = (param: Parameter | null): string => {
    if (!param) return "-";
    
    if (param.valueText !== null && param.valueText !== undefined) {
      return param.valueText;
    }
    
    if (param.valueNumber !== null && param.valueNumber !== undefined) {
      return typeof param.valueNumber === 'number' 
        ? param.valueNumber.toLocaleString("pt-BR")
        : String(param.valueNumber);
    }
    
    if (param.valueBoolean !== null && param.valueBoolean !== undefined) {
      return param.valueBoolean ? "Sim" : "Não";
    }
    
    if (param.valueRating !== null && param.valueRating !== undefined) {
      return `${param.valueRating}/5`;
    }
    
    return "-";
  };

  // Calculate overall score for a bet
  const calculateBetScore = (bet: Bet): number => {
    const ratingParams = bet.parameters.filter(
      (p) => p.valueRating !== null && p.valueRating !== undefined
    );
    
    if (ratingParams.length === 0) return 0;
    
    const avgRating = ratingParams.reduce((sum, p) => sum + (p.valueRating || 0), 0) / ratingParams.length;
    return Math.round(avgRating * 20); // Convert 0-5 rating to 0-100 score
  };

  const renderStars = (rating: number) => {
    const fullStars = Math.floor(rating);
    const hasHalfStar = rating % 1 >= 0.5;
    const emptyStars = 5 - fullStars - (hasHalfStar ? 1 : 0);

    return (
      <div className="flex items-center gap-0.5">
        {Array.from({ length: fullStars }).map((_, i) => (
          <Star key={`full-${i}`} className="w-5 h-5 text-yellow-500 fill-yellow-500" />
        ))}
        {hasHalfStar && (
          <div className="relative w-5 h-5">
            <Star className="w-5 h-5 text-gray-300 fill-gray-300" />
            <div className="absolute inset-0 overflow-hidden w-1/2">
              <Star className="w-5 h-5 text-yellow-500 fill-yellow-500" />
            </div>
          </div>
        )}
        {Array.from({ length: emptyStars }).map((_, i) => (
          <Star key={`empty-${i}`} className="w-5 h-5 text-gray-300 fill-gray-300" />
        ))}
      </div>
    );
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-white text-slate-900 flex items-center justify-center">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-16 w-16 border-4 border-blue-100 border-t-blue-600 mb-6"></div>
          <p className="text-slate-700 font-semibold text-lg">Carregando comparação...</p>
        </div>
      </div>
    );
  }

  if (bets.length === 0) {
    return (
      <div className="min-h-screen bg-white text-slate-900 flex items-center justify-center">
        <Card className="bg-white border border-slate-200 shadow-sm rounded-2xl max-w-md">
          <CardContent className="p-8 text-center">
            <Building2 className="w-16 h-16 text-slate-400 mx-auto mb-4" />
            <h3 className="text-xl font-bold text-slate-900 mb-2">
              Nenhuma casa encontrada
            </h3>
            <p className="text-slate-600 mb-6">
              Não foi possível carregar as casas de apostas selecionadas.
            </p>
            <Link href="/dashboard">
              <Button className="bg-blue-600 hover:bg-blue-700 text-white">
                <ArrowLeft className="w-4 h-4 mr-2" />
                Voltar ao Dashboard
              </Button>
            </Link>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Componente para renderizar o mini card no header shrunk
  const renderShrunkCard = (bet: Bet) => {
    const score = calculateBetScore(bet);
    
    return (
      <div className="flex items-center gap-3 px-4 py-2">
        {/* Logo pequeno */}
        <div className="relative w-10 h-10 sm:w-12 sm:h-12 rounded-lg overflow-hidden bg-gradient-to-br from-blue-50 to-purple-50 border border-slate-200 shadow-sm flex-shrink-0">
          {bet.coverImage ? (
            <Image src={bet.coverImage} alt={bet.name} fill className="object-cover" sizes="48px" />
          ) : bet.logo ? (
            <Image src={bet.logo} alt={bet.name} fill className="object-cover" sizes="48px" />
          ) : (
            <div className="w-full h-full flex items-center justify-center">
              <Building2 className="w-5 h-5 text-blue-400" />
            </div>
          )}
        </div>
        
        {/* Nome e score */}
        <div className="flex-1 min-w-0">
          <span className="text-sm font-semibold text-slate-900 truncate block">
            {bet.name}
          </span>
          <div className="flex items-center gap-2">
            <span className="text-xs text-slate-500">{score} pts</span>
            {bet.url && (
              <a
                href={bet.url}
                target="_blank"
                rel="noopener noreferrer"
                className="text-xs text-blue-600 hover:text-blue-800 flex items-center gap-0.5"
              >
                <ExternalLink className="w-3 h-3" />
              </a>
            )}
          </div>
        </div>
        
        {/* Score badge */}
        <div className="bg-gradient-to-br from-blue-500 to-blue-600 text-white rounded-full w-10 h-10 sm:w-12 sm:h-12 flex items-center justify-center text-sm sm:text-base font-bold shadow-sm flex-shrink-0">
          {score}
        </div>
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-white text-slate-900">
      {/* Shrinking Header - Aparece quando passar do gráfico */}
      <div 
        className={`fixed top-0 left-0 right-0 z-50 bg-white/95 backdrop-blur-md border-b border-slate-200 shadow-lg transition-all duration-300 ${
          isHeaderShrunk ? "translate-y-0 opacity-100" : "-translate-y-full opacity-0"
        }`}
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* Header com botão voltar */}
          <div className="flex items-center gap-3 py-2 border-b border-slate-100">
            <Link href="/dashboard">
              <Button
                variant="ghost"
                size="sm"
                className="text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded-lg h-8 px-2"
              >
                <ArrowLeft className="w-4 h-4" />
              </Button>
            </Link>
            <span className="text-sm font-medium text-slate-600 truncate">
              Comparação
            </span>
          </div>
          
          {/* Mini cards das bets */}
          <div className={`flex items-center ${bets.length === 2 ? "justify-center" : "justify-start"} py-2 gap-2`}>
            {bets.map((bet, index) => (
              <React.Fragment key={bet.id}>
                <div className={`${bets.length === 2 ? "flex-1 max-w-[280px]" : ""} bg-slate-50 rounded-xl`}>
                  {renderShrunkCard(bet)}
                </div>
                
                {/* VS Separator */}
                {index < bets.length - 1 && bets.length === 2 && (
                  <div className="flex-shrink-0 bg-blue-100 px-3 py-1 rounded-full">
                    <span className="text-sm font-bold text-blue-600">VS</span>
                  </div>
                )}
              </React.Fragment>
            ))}
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
        {/* Header */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3 sm:gap-4 w-full sm:w-auto">
            <Link href="/dashboard">
              <Button
                variant="outline"
                size="icon"
                className="border-slate-200 text-slate-700 hover:bg-slate-50 rounded-xl flex-shrink-0"
              >
                <ArrowLeft className="w-4 h-4 sm:w-5 sm:h-5" />
              </Button>
            </Link>
            <div className="min-w-0 flex-1">
              <h1 className="text-2xl sm:text-3xl md:text-4xl font-bold text-slate-900 tracking-tight break-words">
                {bets.map((bet) => bet.name).join(" vs ")}
              </h1>
              <p className="text-sm sm:text-base text-slate-600 mt-1.5">
                Comparação detalhada de {bets.length} {bets.length === 1 ? "casa" : "casas"} de apostas
              </p>
            </div>
          </div>
        </div>

        {/* Breadcrumb */}
        <nav className="flex items-center gap-2 text-sm text-slate-600">
          <Link href="/dashboard" className="hover:text-blue-600 transition-colors">
            Dashboard
          </Link>
          <span>/</span>
          <span className="text-slate-900 font-medium">Comparação</span>
        </nav>

        {/* Main Comparison - Side by Side Cards with VS (only for 2 bets) */}
        <div className="relative">
          <div className={`grid gap-4 sm:gap-6 lg:gap-8 items-start ${
            bets.length === 1 
              ? "grid-cols-1 max-w-md mx-auto" 
              : bets.length === 2 
              ? "grid-cols-1 sm:grid-cols-2" 
              : "grid-cols-1 sm:grid-cols-2 lg:grid-cols-3"
          }`}>
            {bets.map((bet, index) => {
              const score = calculateBetScore(bet);

              return (
                <Card
                  key={bet.id}
                  className="bg-white border border-slate-200 shadow-lg rounded-2xl overflow-hidden hover:shadow-xl transition-shadow"
                >
                  <CardContent className="p-0">
                    {/* Cover Image / Preview - Show first */}
                    <div className="relative w-full h-48 sm:h-56 md:h-64 bg-gradient-to-br from-blue-100 to-purple-100 overflow-hidden">
                      {bet.coverImage ? (
                        <>
                          <Image
                            src={bet.coverImage}
                            alt={`${bet.name} preview`}
                            fill
                            className="object-cover"
                            priority
                            sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
                          />
                          {/* Rating Badge - Overlay on cover image */}
                          <div className="absolute top-3 right-3 sm:top-4 sm:right-4 z-20">
                            <div className="bg-gradient-to-br from-blue-500 to-blue-600 text-white rounded-full w-16 h-16 sm:w-20 sm:h-20 flex flex-col items-center justify-center shadow-lg border-2 sm:border-4 border-white">
                              <div className="text-xl sm:text-2xl font-bold">{score}</div>
                              <div className="text-[10px] sm:text-xs font-medium">Pontos</div>
                            </div>
                          </div>
                        </>
                      ) : bet.logo ? (
                        <>
                          <div className="relative w-full h-full flex items-center justify-center bg-gradient-to-br from-blue-50 to-purple-50">
                            {/* Logo - Rounded and prominent */}
                            <div className="relative w-32 h-32 sm:w-40 sm:h-40 md:w-48 md:h-48 rounded-full overflow-hidden border-4 border-white shadow-xl z-10">
                              <Image
                                src={bet.logo}
                                alt={`${bet.name} logo`}
                                fill
                                className="object-cover"
                                priority
                                sizes="(max-width: 640px) 128px, (max-width: 1024px) 160px, 192px"
                              />
                            </div>
                          </div>
                          {/* Rating Badge - Positioned to not overlap logo */}
                          <div className="absolute top-3 right-3 sm:top-4 sm:right-4 z-20">
                            <div className="bg-gradient-to-br from-blue-500 to-blue-600 text-white rounded-full w-16 h-16 sm:w-20 sm:h-20 flex flex-col items-center justify-center shadow-lg border-2 sm:border-4 border-white">
                              <div className="text-xl sm:text-2xl font-bold">{score}</div>
                              <div className="text-[10px] sm:text-xs font-medium">Pontos</div>
                            </div>
                          </div>
                        </>
                      ) : bet.url ? (
                        <>
                          <div className="relative w-full h-full flex items-center justify-center bg-gradient-to-br from-blue-50 to-purple-50">
                            <div className="text-center p-4 sm:p-8">
                              <Building2 className="w-12 h-12 sm:w-16 sm:h-16 text-blue-400 mx-auto mb-2 sm:mb-4" />
                              <p className="text-xs sm:text-sm text-slate-600 font-medium truncate px-2">{bet.domain || bet.url}</p>
                            </div>
                          </div>
                          {/* Rating Badge */}
                          <div className="absolute top-3 right-3 sm:top-4 sm:right-4 z-20">
                            <div className="bg-gradient-to-br from-blue-500 to-blue-600 text-white rounded-full w-16 h-16 sm:w-20 sm:h-20 flex flex-col items-center justify-center shadow-lg border-2 sm:border-4 border-white">
                              <div className="text-xl sm:text-2xl font-bold">{score}</div>
                              <div className="text-[10px] sm:text-xs font-medium">Pontos</div>
                            </div>
                          </div>
                        </>
                      ) : (
                        <>
                          <div className="relative w-full h-full flex items-center justify-center bg-gradient-to-br from-blue-50 to-purple-50">
                            <Building2 className="w-12 h-12 sm:w-16 sm:h-16 text-blue-400" />
                          </div>
                          {/* Rating Badge */}
                          <div className="absolute top-3 right-3 sm:top-4 sm:right-4 z-20">
                            <div className="bg-gradient-to-br from-blue-500 to-blue-600 text-white rounded-full w-16 h-16 sm:w-20 sm:h-20 flex flex-col items-center justify-center shadow-lg border-2 sm:border-4 border-white">
                              <div className="text-xl sm:text-2xl font-bold">{score}</div>
                              <div className="text-[10px] sm:text-xs font-medium">Pontos</div>
                            </div>
                          </div>
                        </>
                      )}
                    </div>

                    {/* Bet Info */}
                    <div className="p-4 sm:p-6 space-y-3 sm:space-y-4">
                      {/* Bet Name */}
                      <h2 className="text-xl sm:text-2xl font-bold text-slate-900 line-clamp-2">
                        {bet.name}
                      </h2>

                      {/* Key Parameters Preview */}
                      <div className="space-y-1.5 sm:space-y-2">
                        {bet.parameters.slice(0, 3).map((param) => {
                          const paramDef = PARAMETER_DEFINITIONS.find((d) => d.name === param.name);
                          if (!paramDef) return null;

                          const displayValue = getParameterDisplayValue(param);
                          if (displayValue === "-") return null;

                          return (
                            <div key={param.id || param.name} className="flex items-center justify-between text-xs sm:text-sm">
                              <span className="text-slate-600 truncate pr-2">{param.name}:</span>
                              <span className="font-semibold text-slate-900 text-right flex-shrink-0">
                                {displayValue}
                                {param.unit && ` ${param.unit}`}
                              </span>
                            </div>
                          );
                        })}
                      </div>

                      {/* Visit Website Button */}
                      {bet.url && (
                        <a
                          href={bet.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="block w-full"
                        >
                          <Button className="w-full bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm sm:text-base py-2 sm:py-2.5">
                            <span className="truncate">{bet.domain || "Visitar Site"}</span>
                            <ExternalLink className="w-3 h-3 sm:w-4 sm:h-4 ml-2 flex-shrink-0" />
                          </Button>
                        </a>
                      )}
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>

          {/* VS Separator - Only show for exactly 2 bets */}
          {bets.length === 2 && (
            <div className="hidden sm:block absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 z-30">
              <div className="bg-white px-6 py-3 sm:px-8 sm:py-4 rounded-full border-4 border-blue-500 shadow-2xl">
                <span className="text-2xl sm:text-3xl font-black text-blue-600">VS</span>
              </div>
            </div>
          )}
        </div>

        {/* Radar Chart Comparison */}
        {bets.length >= 2 && (
          <ComparisonRadarChart bets={bets} />
        )}

        {/* Comparison Advantages Dropdown */}
        {bets.length === 2 && (
          <ComparisonAdvantages bets={bets} />
        )}

        {/* Detailed Parameters Section */}
        <div className="mt-12 pt-8 border-t border-slate-200">
          {/* Trigger point para o shrinking header - ativa ao chegar na Comparação Detalhada */}
          <div ref={chartEndRef} className="h-0" aria-hidden="true" />
          
          <div className="text-center mb-8">
            <h2 className="text-3xl font-bold text-slate-900 mb-2">
              Comparação Detalhada
            </h2>
            <p className="text-slate-600">
              Todos os parâmetros organizados por categoria
            </p>
          </div>

          {/* Parameters Table - Organized by Category */}
          {allParameters.length > 0 && (
            <div className="space-y-8">
            {PARAMETER_CATEGORIES.map((category) => {
              // Get all defined parameters in this category
              const categoryDefs = getParametersByCategory(category);
              
              if (categoryDefs.length === 0) return null;

              return (
                <Card
                  key={category}
                  className="bg-white border border-slate-200 shadow-sm rounded-xl overflow-hidden"
                >
                  <CardContent className="p-0">
                    {/* Category Header */}
                    <div className="bg-gradient-to-r from-blue-50 to-purple-50 px-4 sm:px-6 py-3 sm:py-4 border-b border-slate-200">
                      <div className="flex items-center gap-2 sm:gap-3 flex-wrap">
                        <div className="w-1 h-6 sm:h-8 bg-gradient-to-b from-blue-500 to-purple-500 rounded-full flex-shrink-0" />
                        <h2 className="text-lg sm:text-xl font-bold text-slate-900">{category}</h2>
                        <span className="text-xs sm:text-sm text-slate-500 font-normal">
                          ({categoryDefs.length} parâmetros)
                        </span>
                      </div>
                    </div>

                    {/* Table */}
                    <div className="overflow-x-auto -mx-4 sm:mx-0">
                      <div className="inline-block min-w-full align-middle">
                        <div className="overflow-hidden">
                          <Table>
                            <TableHeader>
                              <TableRow className="bg-slate-50">
                                <TableHead className="w-[200px] sm:w-[250px] font-semibold text-slate-900 text-xs sm:text-sm">
                                  Parâmetro
                                </TableHead>
                                {bets.map((bet) => (
                                  <TableHead
                                    key={bet.id}
                                    className="text-center font-semibold text-slate-900 min-w-[150px] sm:min-w-[200px] text-xs sm:text-sm"
                                  >
                                    <span className="line-clamp-2">{bet.name}</span>
                                  </TableHead>
                                ))}
                              </TableRow>
                            </TableHeader>
                        <TableBody>
                          {categoryDefs.map((paramDef) => {
                            return (
                              <TableRow key={paramDef.name} className="hover:bg-slate-50">
                                <TableCell className="font-medium text-slate-900 text-xs sm:text-sm py-3 sm:py-4">
                                  <div>
                                    <div className="font-semibold">{paramDef.name}</div>
                                    {paramDef.description && (
                                      <div className="text-[10px] sm:text-xs text-slate-500 mt-1 line-clamp-2">
                                        {paramDef.description}
                                      </div>
                                    )}
                                  </div>
                                </TableCell>
                                {bets.map((bet) => {
                                  const paramValue = getParameterValue(bet.id, paramDef.name);
                                  const displayValue = getParameterDisplayValue(paramValue);
                                  const unit = paramValue?.unit || paramDef.unit;
                                  const isBoolean = paramValue?.valueBoolean !== null && paramValue?.valueBoolean !== undefined;
                                  // Check both the parameter value and the definition type for rating
                                  const isRating = (paramValue?.valueRating !== null && paramValue?.valueRating !== undefined) || 
                                                  paramDef.type === "rating";
                                  const hasValue = displayValue !== "-";
                                  
                                  return (
                                    <TableCell key={bet.id} className="text-center py-3 sm:py-4">
                                      {hasValue ? (
                                        <div className="flex items-center justify-center gap-1.5 sm:gap-2">
                                          {isBoolean ? (
                                            <div className={`flex items-center gap-1 sm:gap-2 px-2 sm:px-3 py-1 sm:py-1.5 rounded-lg ${
                                              paramValue?.valueBoolean
                                                ? "bg-green-50 text-green-700 border border-green-200"
                                                : "bg-red-50 text-red-700 border border-red-200"
                                            }`}>
                                              {paramValue?.valueBoolean ? (
                                                <CheckCircle className="w-3 h-3 sm:w-4 sm:h-4 flex-shrink-0" />
                                              ) : (
                                                <XCircle className="w-3 h-3 sm:w-4 sm:h-4 flex-shrink-0" />
                                              )}
                                              <span className="text-xs sm:text-sm font-medium">
                                                {paramValue?.valueBoolean ? "Sim" : "Não"}
                                              </span>
                                            </div>
                                          ) : isRating && paramValue?.valueRating !== null && paramValue?.valueRating !== undefined ? (
                                            <div className="flex flex-col items-center gap-1.5 sm:gap-2">
                                              {renderStars(paramValue.valueRating)}
                                              <span className="text-xs sm:text-sm text-slate-600 font-medium">
                                                {displayValue}
                                              </span>
                                            </div>
                                          ) : (
                                            <span className="text-xs sm:text-base font-medium text-slate-900 break-words">
                                              {displayValue}
                                              {unit && ` ${unit}`}
                                            </span>
                                          )}
                                        </div>
                                      ) : (
                                        <span className="text-xs sm:text-sm text-slate-400 italic">-</span>
                                      )}
                                    </TableCell>
                                  );
                                })}
                              </TableRow>
                            );
                          })}
                            </TableBody>
                          </Table>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
            </div>
          )}
        </div>

        {/* Footer - Back Button */}
        <div className="flex justify-center pt-8">
          <Link href="/dashboard">
            <Button
              variant="outline"
              className="border-blue-200 text-blue-700 hover:bg-blue-50 hover:border-blue-300 rounded-xl"
            >
              <ArrowLeft className="w-4 h-4 mr-2" />
              Voltar ao Dashboard
            </Button>
          </Link>
        </div>
      </div>
    </div>
  );
}

export default function ComparisonPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-white text-slate-900 flex items-center justify-center">
          <div className="text-center">
            <div className="inline-block animate-spin rounded-full h-16 w-16 border-4 border-blue-100 border-t-blue-600 mb-6"></div>
            <p className="text-slate-700 font-semibold text-lg">Carregando comparação...</p>
          </div>
        </div>
      }
    >
      <ComparisonPageContent />
    </Suspense>
  );
}


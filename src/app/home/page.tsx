"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Building2,
  Star,
  TrendingUp,
  TrendingDown,
  Minus,
  ArrowRight,
  ExternalLink,
  ChevronRight,
  ChevronDown,
  LogOut,
  BarChart3,
  CheckCircle2,
  XCircle,
  Globe,
  MapPin,
  FileText,
  Hash,
} from "lucide-react";
import Image from "next/image";
import { useFetch } from "@/hooks/use-fetch";
import { useToast } from "@/hooks/use-toast";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import Link from "next/link";
import { PARAMETER_CATEGORIES, PARAMETER_DEFINITIONS, getParametersByCategory } from "@/lib/parameter-definitions";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

interface HomeData {
  bet: {
    id: string;
    name: string;
    company?: string | null;
    url?: string | null;
    domain?: string | null;
    cnpj?: string | null;
    status?: string | null;
    scope?: string | null;
    platformType?: string | null;
    region?: string | null;
    license?: string | null;
    betId?: string | null;
    logo?: string | null;
    coverImage?: string | null;
  };
  rating: {
    overall: number;
    score: number;
    stars: number;
  };
  ranking: {
    position: number;
    total: number;
    top10: Array<{
      id: string;
      name: string;
      score: number;
      position: number;
    }>;
    aboveCurrent: Array<{
      id: string;
      name: string;
      score: number;
      position: number;
    }>;
    belowCurrent: Array<{
      id: string;
      name: string;
      score: number;
      position: number;
    }>;
    allRanking?: Array<{
      id: string;
      name: string;
      score: number;
      position: number;
    }>;
  };
  parameters: Array<{
    id: string;
    name: string;
    category?: string | null;
    value: string;
    unit?: string | null;
    trend: "up" | "down" | "stable";
    type?: string | null;
  }>;
}

interface ParameterDetailModalProps {
  parameter: HomeData["parameters"][0] | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

function ParameterDetailModal({ parameter, open, onOpenChange }: ParameterDetailModalProps) {
  if (!parameter) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto bg-white border border-slate-200 rounded-2xl">
        <DialogHeader>
          <DialogTitle className="text-2xl font-bold text-slate-900">
            {parameter.name}
          </DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <div className="p-4 bg-slate-50 rounded-xl border border-slate-200">
            <div className="text-sm text-slate-600 mb-2 font-medium">Valor Atual</div>
            <div className="text-2xl font-bold text-slate-900">
              {parameter.value} {parameter.unit || ""}
            </div>
          </div>
          {parameter.category && (
            <div className="p-4 bg-white rounded-xl border border-slate-200">
              <div className="text-sm text-slate-600 mb-1 font-medium">Categoria</div>
              <div className="text-base font-semibold text-slate-900">{parameter.category}</div>
            </div>
          )}
          {parameter.type && (
            <div className="p-4 bg-white rounded-xl border border-slate-200">
              <div className="text-sm text-slate-600 mb-1 font-medium">Tipo</div>
              <div className="text-base font-semibold text-slate-900 capitalize">{parameter.type}</div>
            </div>
          )}
          <div className="p-4 bg-blue-50 rounded-xl border border-blue-200">
            <div className="text-sm text-blue-700 italic">
              Histórico e gráficos detalhados serão implementados em breve.
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

export default function HomePage() {
  const router = useRouter();
  const { toast } = useToast();
  const [selectedParameter, setSelectedParameter] = useState<HomeData["parameters"][0] | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isRankingExpanded, setIsRankingExpanded] = useState(false);

  const { data, loading, error } = useFetch<HomeData>("/api/user/home", {
    immediate: true,
    showToast: true,
    errorMessage: "Falha ao carregar dados da home",
    onError: () => {
      // If user doesn't have a linked bet, redirect to setup
      router.push("/setup");
    },
  });

  const handleParameterClick = (parameter: HomeData["parameters"][0]) => {
    setSelectedParameter(parameter);
    setIsModalOpen(true);
  };

  const handleCompare = () => {
    router.push("/dashboard");
  };

  const renderStars = (rating: number) => {
    const fullStars = Math.floor(rating);
    const hasHalfStar = rating % 1 >= 0.5;
    const emptyStars = 5 - fullStars - (hasHalfStar ? 1 : 0);

    return (
      <div className="flex items-center gap-1">
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

  const getTrendIcon = (trend: "up" | "down" | "stable") => {
    switch (trend) {
      case "up":
        return <TrendingUp className="w-5 h-5 text-green-600" />;
      case "down":
        return <TrendingDown className="w-5 h-5 text-red-600" />;
      default:
        return <Minus className="w-5 h-5 text-gray-400" />;
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-white text-slate-800 flex items-center justify-center">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-16 w-16 border-4 border-blue-100 border-t-blue-600 mb-6"></div>
          <p className="text-slate-700 font-semibold text-lg">Carregando...</p>
        </div>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="min-h-screen bg-white text-slate-800 flex items-center justify-center">
        <Card className="max-w-md">
          <CardContent className="p-8 text-center">
            <Building2 className="w-16 h-16 text-slate-400 mx-auto mb-4" />
            <h3 className="text-xl font-bold text-slate-900 mb-2">
              Erro ao carregar dados
            </h3>
            <p className="text-slate-600 mb-6">
              Não foi possível carregar os dados da sua casa de apostas.
            </p>
            <Button onClick={() => router.push("/setup")} className="bg-blue-600 hover:bg-blue-700 text-white">
              Configurar Casa
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  const { bet, rating, ranking, parameters } = data;

  const handleLogout = () => {
    document.cookie = "better-auth.session=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;";
    localStorage.removeItem("auth-user");
    localStorage.removeItem("auth-session");
    router.push("/login");
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
        {/* Navigation Header */}
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-4">
            <Link href="/dashboard">
              <Button
                variant="outline"
                className="bg-white border border-slate-200 text-slate-700 hover:bg-slate-50 hover:border-slate-300 rounded-xl shadow-sm"
              >
                <BarChart3 className="w-4 h-4 mr-2" />
                Dashboard
              </Button>
            </Link>
          </div>
          <Button
            onClick={handleLogout}
            variant="outline"
            className="bg-white border border-slate-200 text-slate-700 hover:bg-red-50 hover:text-red-600 hover:border-red-300 rounded-xl shadow-sm"
          >
            <LogOut className="w-4 h-4 mr-2" />
            Sair
          </Button>
        </div>
        {/* Header Section */}
        <Card className="bg-white border border-slate-200 shadow-lg rounded-2xl overflow-hidden">
          {/* Cover Image with Logo Overlay */}
          <div className="relative">
            {/* Cover Image */}
            {bet.coverImage ? (
              <div className="relative w-full h-48 md:h-64 bg-gradient-to-br from-blue-600 to-blue-700">
                <Image
                  src={bet.coverImage}
                  alt={`${bet.name} cover`}
                  fill
                  className="object-cover"
                  priority
                />
              </div>
            ) : (
              <div className="relative w-full h-48 md:h-64 bg-gradient-to-br from-blue-600 to-blue-700" />
            )}

            {/* Logo Overlay (Facebook-style) */}
            <div className="absolute -bottom-12 md:-bottom-16 left-6 md:left-8 z-10">
              {bet.logo ? (
                <div className="relative w-28 h-28 md:w-36 md:h-36 rounded-full overflow-hidden border-4 border-white shadow-xl bg-white">
                  <Image
                    src={bet.logo}
                    alt={`${bet.name} logo`}
                    fill
                    className="object-cover"
                    priority
                  />
                </div>
              ) : (
                <div className="relative w-28 h-28 md:w-36 md:h-36 rounded-full bg-gradient-to-br from-blue-600 to-blue-700 flex items-center justify-center shadow-xl border-4 border-white">
                  <Building2 className="w-14 h-14 md:w-20 md:h-20 text-white" />
                </div>
              )}
            </div>
          </div>

          <CardContent className="p-6 md:p-8 pt-24 md:pt-28">
            <div className="flex flex-col lg:flex-row gap-6 lg:gap-8">
              {/* Left Side - Name, Rating */}
              <div className="flex-1 space-y-3">
                  <div>
                    <h1 className="text-3xl md:text-4xl font-bold text-slate-900 mb-2">
                      {bet.name}
                    </h1>
                    {bet.company && (
                      <p className="text-slate-600 text-base md:text-lg">{bet.company}</p>
                    )}
                    {bet.url && (
                      <a
                        href={bet.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-2 text-blue-600 hover:text-blue-700 transition-colors text-sm mt-2"
                      >
                        <span className="truncate max-w-xs">{bet.url}</span>
                        <ExternalLink className="w-4 h-4 flex-shrink-0" />
                      </a>
                    )}

                    {/* Additional Info Badges */}
                    <div className="flex flex-wrap gap-2 mt-3">
                      {/* Status */}
                      {bet.status && (
                        <div
                          className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold ${
                            bet.status === "Funcionando"
                              ? "bg-green-100 text-green-700 border border-green-200"
                              : "bg-red-100 text-red-700 border border-red-200"
                          }`}
                        >
                          {bet.status === "Funcionando" ? (
                            <CheckCircle2 className="w-3.5 h-3.5" />
                          ) : (
                            <XCircle className="w-3.5 h-3.5" />
                          )}
                          {bet.status}
                        </div>
                      )}

                      {/* Platform Type */}
                      {bet.platformType && (
                        <div className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-blue-100 text-blue-700 border border-blue-200 text-xs font-semibold">
                          <Building2 className="w-3.5 h-3.5" />
                          {bet.platformType}
                        </div>
                      )}

                      {/* Scope */}
                      {bet.scope && (
                        <div className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-purple-100 text-purple-700 border border-purple-200 text-xs font-semibold">
                          <Globe className="w-3.5 h-3.5" />
                          {bet.scope}
                        </div>
                      )}

                      {/* Region */}
                      {bet.region && (
                        <div className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-100 text-slate-700 border border-slate-200 text-xs font-semibold">
                          <MapPin className="w-3.5 h-3.5" />
                          {bet.region}
                        </div>
                      )}
                    </div>

                    {/* Additional Details */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mt-4 pt-4 border-t border-slate-200">
                      {/* CNPJ */}
                      {bet.cnpj && (
                        <div className="flex items-start gap-2">
                          <FileText className="w-4 h-4 text-slate-400 mt-0.5 flex-shrink-0" />
                          <div>
                            <div className="text-xs text-slate-500 font-medium">CNPJ</div>
                            <div className="text-sm text-slate-900 font-semibold">{bet.cnpj}</div>
                          </div>
                        </div>
                      )}

                      {/* License */}
                      {bet.license && (
                        <div className="flex items-start gap-2">
                          <FileText className="w-4 h-4 text-slate-400 mt-0.5 flex-shrink-0" />
                          <div>
                            <div className="text-xs text-slate-500 font-medium">Licença</div>
                            <div className="text-sm text-slate-900 font-semibold">{bet.license}</div>
                          </div>
                        </div>
                      )}

                      {/* Bet ID */}
                      {bet.betId && (
                        <div className="flex items-start gap-2">
                          <Hash className="w-4 h-4 text-slate-400 mt-0.5 flex-shrink-0" />
                          <div>
                            <div className="text-xs text-slate-500 font-medium">ID da Casa</div>
                            <div className="text-sm text-slate-900 font-semibold font-mono">{bet.betId}</div>
                          </div>
                        </div>
                      )}

                      {/* Domain */}
                      {bet.domain && (
                        <div className="flex items-start gap-2">
                          <Globe className="w-4 h-4 text-slate-400 mt-0.5 flex-shrink-0" />
                          <div>
                            <div className="text-xs text-slate-500 font-medium">Domínio</div>
                            <div className="text-sm text-slate-900 font-semibold">{bet.domain}</div>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="flex flex-wrap items-center gap-4">
                    {/* Overall Rating */}
                    <div className="flex items-center gap-3">
                      <div className="text-3xl font-bold text-slate-900">
                        {rating.overall.toFixed(1)}
                      </div>
                      <div className="text-slate-600">/ 5</div>
                    </div>

                    {/* Stars */}
                    {renderStars(rating.stars)}

                    {/* Ranking */}
                    <div className="text-slate-600">
                      <span className="font-semibold text-slate-900">{ranking.position}°</span> lugar entre{" "}
                      <span className="font-semibold text-slate-900">{ranking.total}</span> casas avaliadas
                    </div>
                  </div>

                  {/* Compare Button - Inside the card */}
                  <div className="pt-4 mt-4 border-t border-slate-200">
                    <Button
                      onClick={handleCompare}
                      size="lg"
                      className="w-full bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white font-bold text-base md:text-lg px-6 py-4 rounded-xl shadow-lg hover:shadow-xl transition-all duration-200"
                    >
                      <span>COMPARAR COM OUTRAS CASAS</span>
                      <ArrowRight className="w-5 h-5 ml-2" />
                    </Button>
                  </div>
                </div>

              {/* Right Side - Ranking Panel */}
              <div className="lg:w-80 flex-shrink-0">
                <Card className="bg-slate-50 border border-slate-200 rounded-xl">
                  <CardHeader className="pb-3">
                    <CardTitle className="text-lg font-bold text-slate-900">Ranking</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    {!isRankingExpanded ? (
                      <>
                        {/* Top 10 */}
                        <div>
                          <div className="text-xs font-semibold text-slate-600 uppercase tracking-wider mb-2">
                            Top 10
                          </div>
                          <div className="space-y-2">
                            {ranking.top10.map((item) => (
                              <div
                                key={item.id}
                                className={`flex items-center justify-between p-2 rounded-lg ${
                                  item.id === bet.id
                                    ? "bg-blue-100 border-2 border-blue-500"
                                    : "bg-white border border-slate-200"
                                }`}
                              >
                                <div className="flex items-center gap-2">
                                  <span className="text-sm font-bold text-slate-700">#{item.position}</span>
                                  <span className="text-sm text-slate-900 truncate">{item.name}</span>
                                </div>
                                <span className="text-xs font-semibold text-slate-600">{item.score}</span>
                              </div>
                            ))}
                          </div>
                        </div>

                        {/* 3 Above Current (if position > 3) */}
                        {ranking.position > 3 && ranking.aboveCurrent.length > 0 && (
                          <div>
                            <div className="text-xs font-semibold text-slate-600 uppercase tracking-wider mb-2">
                              3 Acima de Você
                            </div>
                            <div className="space-y-2">
                              {ranking.aboveCurrent.map((item) => (
                                <div
                                  key={item.id}
                                  className="flex items-center justify-between p-2 rounded-lg bg-white border border-slate-200"
                                >
                                  <div className="flex items-center gap-2">
                                    <span className="text-sm font-bold text-slate-700">#{item.position}</span>
                                    <span className="text-sm text-slate-900 truncate">{item.name}</span>
                                  </div>
                                  <span className="text-xs font-semibold text-slate-600">{item.score}</span>
                                </div>
                              ))}
                            </div>
                          </div>
                        )}

                        {/* Current Position Highlight */}
                        <div className={`${ranking.position > 3 ? 'mt-2' : ''} pt-2 border-t border-slate-200`}>
                          <div className="text-xs font-semibold text-blue-600 uppercase tracking-wider mb-2">
                            Sua Posição
                          </div>
                          <div className="p-2 rounded-lg bg-blue-100 border-2 border-blue-500">
                            <div className="flex items-center justify-between">
                              <div className="flex items-center gap-2">
                                <span className="text-sm font-bold text-blue-700">#{ranking.position}</span>
                                <span className="text-sm font-semibold text-blue-900 truncate">{bet.name}</span>
                              </div>
                              <span className="text-xs font-semibold text-blue-700">{rating.score}</span>
                            </div>
                          </div>
                        </div>

                        {/* 3 Below Current */}
                        {ranking.belowCurrent.length > 0 && (
                          <div>
                            <div className="text-xs font-semibold text-slate-600 uppercase tracking-wider mb-2">
                              3 Abaixo de Você
                            </div>
                            <div className="space-y-2">
                              {ranking.belowCurrent.map((item) => (
                                <div
                                  key={item.id}
                                  className="flex items-center justify-between p-2 rounded-lg bg-white border border-slate-200"
                                >
                                  <div className="flex items-center gap-2">
                                    <span className="text-sm font-bold text-slate-700">#{item.position}</span>
                                    <span className="text-sm text-slate-900 truncate">{item.name}</span>
                                  </div>
                                  <span className="text-xs font-semibold text-slate-600">{item.score}</span>
                                </div>
                              ))}
                            </div>
                          </div>
                        )}

                        {/* Expand Button */}
                        {ranking.allRanking && ranking.allRanking.length > 0 && (
                          <div className="pt-2 border-t border-slate-200">
                            <Button
                              onClick={() => setIsRankingExpanded(true)}
                              variant="outline"
                              className="w-full border-slate-300 text-slate-700 hover:bg-slate-100 rounded-lg text-sm"
                            >
                              Ver Ranking Completo ({ranking.total} casas)
                              <ChevronDown className="w-4 h-4 ml-2" />
                            </Button>
                          </div>
                        )}
                      </>
                    ) : (
                      <>
                        {/* Full Ranking */}
                        <div>
                          <div className="flex items-center justify-between mb-2">
                            <div className="text-xs font-semibold text-slate-600 uppercase tracking-wider">
                              Ranking Completo
                            </div>
                            <Button
                              onClick={() => setIsRankingExpanded(false)}
                              variant="ghost"
                              size="sm"
                              className="h-6 px-2 text-xs text-slate-600 hover:text-slate-900"
                            >
                              Fechar
                            </Button>
                          </div>
                          <div className="space-y-2 max-h-96 overflow-y-auto">
                            {ranking.allRanking?.map((item) => (
                              <div
                                key={item.id}
                                className={`flex items-center justify-between p-2 rounded-lg ${
                                  item.id === bet.id
                                    ? "bg-blue-100 border-2 border-blue-500"
                                    : "bg-white border border-slate-200"
                                }`}
                              >
                                <div className="flex items-center gap-2">
                                  <span className={`text-sm font-bold ${
                                    item.id === bet.id ? "text-blue-700" : "text-slate-700"
                                  }`}>
                                    #{item.position}
                                  </span>
                                  <span className={`text-sm truncate ${
                                    item.id === bet.id ? "font-semibold text-blue-900" : "text-slate-900"
                                  }`}>
                                    {item.name}
                                  </span>
                                </div>
                                <span className={`text-xs font-semibold ${
                                  item.id === bet.id ? "text-blue-700" : "text-slate-600"
                                }`}>
                                  {item.score}
                                </span>
                              </div>
                            ))}
                          </div>
                        </div>
                      </>
                    )}
                  </CardContent>
                </Card>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Parameters Table - Organized by Category */}
        {parameters.length > 0 ? (
          <div className="space-y-8">
            <h2 className="text-2xl font-bold text-slate-900">Parâmetros</h2>
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
                    <div className="bg-gradient-to-r from-blue-50 to-purple-50 px-6 py-4 border-b border-slate-200">
                      <div className="flex items-center gap-3">
                        <div className="w-1 h-8 bg-gradient-to-b from-blue-500 to-purple-500 rounded-full" />
                        <h3 className="text-xl font-bold text-slate-900">{category}</h3>
                        <span className="text-sm text-slate-500 font-normal">
                          ({categoryDefs.length} parâmetros)
                        </span>
                      </div>
                    </div>

                    {/* Table */}
                    <div className="overflow-x-auto">
                      <Table>
                        <TableHeader>
                          <TableRow className="bg-slate-50">
                            <TableHead className="w-[300px] font-semibold text-slate-900">
                              Parâmetro
                            </TableHead>
                            <TableHead className="font-semibold text-slate-900">
                              Valor
                            </TableHead>
                            <TableHead className="w-[100px] font-semibold text-slate-900 text-center">
                              Tendência
                            </TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {categoryDefs.map((paramDef) => {
                            const existingParam = parameters.find((p) => p.name === paramDef.name);
                            const param = existingParam || {
                              id: null,
                              name: paramDef.name,
                              category: paramDef.category,
                              value: "-",
                              unit: paramDef.unit,
                              trend: "stable" as const,
                              type: paramDef.type,
                            };

                            return (
                              <TableRow 
                                key={paramDef.name} 
                                className="hover:bg-slate-50 cursor-pointer"
                                onClick={() => param.id && handleParameterClick(param)}
                              >
                                <TableCell className="font-medium text-slate-900">
                                  <div>
                                    <div>{param.name}</div>
                                    {paramDef.description && (
                                      <div className="text-xs text-slate-500 mt-1">
                                        {paramDef.description}
                                      </div>
                                    )}
                                  </div>
                                </TableCell>
                                <TableCell>
                                  <div className="flex items-center gap-2">
                                    <span className="text-base font-medium text-slate-900">
                                      {param.value}
                                      {param.unit && ` ${param.unit}`}
                                    </span>
                                  </div>
                                </TableCell>
                                <TableCell className="text-center">
                                  {getTrendIcon(param.trend)}
                                </TableCell>
                              </TableRow>
                            );
                          })}
                        </TableBody>
                      </Table>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        ) : (
          <Card className="bg-white border border-slate-200 rounded-2xl shadow-sm">
            <CardContent className="p-8 text-center">
              <Building2 className="w-16 h-16 text-slate-400 mx-auto mb-4" />
              <h3 className="text-xl font-bold text-slate-900 mb-2">
                Nenhum parâmetro cadastrado
              </h3>
              <p className="text-slate-600">
                Os parâmetros da sua casa de apostas ainda não foram configurados.
              </p>
            </CardContent>
          </Card>
        )}
      </div>

      {/* Parameter Detail Modal */}
      <ParameterDetailModal
        parameter={selectedParameter}
        open={isModalOpen}
        onOpenChange={setIsModalOpen}
      />
    </div>
  );
}


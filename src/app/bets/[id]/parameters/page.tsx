"use client";

import React, { useState, useEffect, useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import {
  ArrowLeft,
  Building2,
  Star,
  Eye,
  BarChart3,
  TrendingUp,
  CheckCircle,
  XCircle,
  Percent,
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import Link from "next/link";
import { useParams } from "next/navigation";
import {
  PARAMETER_CATEGORIES,
  PARAMETER_DEFINITIONS,
} from "@/lib/parameter-definitions";
import dynamic from "next/dynamic";
import { Legend } from "recharts";

// Lazy load charts
const BarChart = dynamic(
  () => import("recharts").then((mod) => mod.BarChart),
  { ssr: false }
);
const Bar = dynamic(() => import("recharts").then((mod) => mod.Bar), {
  ssr: false,
});
const XAxis = dynamic(() => import("recharts").then((mod) => mod.XAxis), {
  ssr: false,
});
const YAxis = dynamic(() => import("recharts").then((mod) => mod.YAxis), {
  ssr: false,
});
const CartesianGrid = dynamic(
  () => import("recharts").then((mod) => mod.CartesianGrid),
  { ssr: false }
);
const Tooltip = dynamic(() => import("recharts").then((mod) => mod.Tooltip), {
  ssr: false,
});
const ResponsiveContainer = dynamic(
  () => import("recharts").then((mod) => mod.ResponsiveContainer),
  { ssr: false }
);
const PieChart = dynamic(
  () => import("recharts").then((mod) => mod.PieChart),
  { ssr: false }
);
const Pie = dynamic(() => import("recharts").then((mod) => mod.Pie), {
  ssr: false,
});
const Cell = dynamic(() => import("recharts").then((mod) => mod.Cell), {
  ssr: false,
});

interface Bet {
  id: string;
  name: string;
  url?: string;
  parameters: Parameter[];
}

interface Parameter {
  id: string;
  name: string;
  category?: string;
  valueText?: string | null;
  valueNumber?: number | null;
  valueBoolean?: boolean | null;
  valueRating?: number | null;
  unit?: string | null;
  type?: string | null;
  description?: string | null;
}

export default function BetParametersViewPage() {
  const params = useParams();
  const betId = params.id as string;
  const [bet, setBet] = useState<Bet | null>(null);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    fetchBet();
  }, [betId]);

  const fetchBet = async () => {
    try {
      setLoading(true);
      const response = await fetch(`/api/bets/${betId}`);
      const data = await response.json();

      if (data.success) {
        setBet(data.data?.bet || data.bet);
      } else {
        throw new Error(data.error);
      }
    } catch (error) {
      console.error("Error fetching bet:", error);
      toast({
        variant: "destructive",
        title: "Erro",
        description: "Falha ao carregar parâmetros da casa de apostas",
      });
    } finally {
      setLoading(false);
    }
  };

  // Calculate statistics
  const stats = useMemo(() => {
    if (!bet) return null;

    const totalParams = PARAMETER_DEFINITIONS.length;
    const filledParams = bet.parameters.filter(
      (p) =>
        (p.valueText !== null && p.valueText !== undefined) ||
        (p.valueNumber !== null && p.valueNumber !== undefined) ||
        (p.valueBoolean !== null && p.valueBoolean !== undefined) ||
        (p.valueRating !== null && p.valueRating !== undefined)
    ).length;
    const completionRate =
      totalParams > 0 ? (filledParams / totalParams) * 100 : 0;

    // Count by type - map types from definitions
    const numericParams = bet.parameters.filter((p) => {
      const def = PARAMETER_DEFINITIONS.find((d) => d.name === p.name);
      const isNumeric =
        def &&
        (def.type === "number" ||
          def.type === "currency" ||
          def.type === "percentage");
      return (
        isNumeric &&
        p.valueNumber !== null &&
        p.valueNumber !== undefined
      );
    });
    const booleanParams = bet.parameters.filter((p) => {
      const def = PARAMETER_DEFINITIONS.find((d) => d.name === p.name);
      return (
        def?.type === "boolean" &&
        p.valueBoolean !== null &&
        p.valueBoolean !== undefined
      );
    });
    const ratingParams = bet.parameters.filter((p) => {
      const def = PARAMETER_DEFINITIONS.find((d) => d.name === p.name);
      return (
        def?.type === "rating" &&
        p.valueRating !== null &&
        p.valueRating !== undefined
      );
    });

    const ratings = ratingParams
      .map((p) => p.valueRating)
      .filter((r): r is number => r !== null && r !== undefined);
    const avgRating =
      ratings.length > 0
        ? ratings.reduce((sum, r) => sum + r, 0) / ratings.length
        : 0;

    const yesCount = booleanParams.filter((p) => p.valueBoolean === true).length;
    const noCount = booleanParams.filter((p) => p.valueBoolean === false).length;

    return {
      totalParams,
      filledParams,
      completionRate,
      numericParams: numericParams.length,
      booleanParams: booleanParams.length,
      ratingParams: ratingParams.length,
      avgRating,
      yesCount,
      noCount,
    };
  }, [bet]);

  // Prepare chart data
  const chartData = useMemo(() => {
    if (!bet) return [];

    return bet.parameters
      .filter((p) => {
        const def = PARAMETER_DEFINITIONS.find((d) => d.name === p.name);
        const isNumeric =
          def &&
          (def.type === "number" ||
            def.type === "currency" ||
            def.type === "percentage");
        return (
          isNumeric &&
          p.valueNumber !== null &&
          p.valueNumber !== undefined
        );
      })
      .slice(0, 10)
      .map((p) => ({
        name: p.name.length > 15 ? p.name.substring(0, 15) + "..." : p.name,
        value: p.valueNumber || 0,
        fullName: p.name,
      }));
  }, [bet]);

  const ratingData = useMemo(() => {
    if (!bet) return [];

    return bet.parameters
      .filter((p) => {
        const def = PARAMETER_DEFINITIONS.find((d) => d.name === p.name);
        return (
          def?.type === "rating" &&
          p.valueRating !== null &&
          p.valueRating !== undefined
        );
      })
      .map((p) => ({
        name: p.name.length > 20 ? p.name.substring(0, 20) + "..." : p.name,
        rating: p.valueRating || 0,
        fullName: p.name,
      }));
  }, [bet]);

  const booleanData = useMemo(() => {
    if (!stats) return [];
    return [
      { name: "Sim", value: stats.yesCount, color: "#10b981" },
      { name: "Não", value: stats.noCount, color: "#ef4444" },
    ];
  }, [stats]);

  const renderValue = (param: Parameter) => {
    if (param.valueText !== null && param.valueText !== undefined) {
      return (
        <div className="px-4 py-2 bg-gray-800/50 border border-gray-700 rounded-md text-white">
          {param.valueText}
        </div>
      );
    }
    if (param.valueNumber !== null && param.valueNumber !== undefined) {
      const formatted = param.valueNumber.toLocaleString("pt-BR", {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
      });
      return (
        <div className="space-y-2">
          <div className="px-4 py-2 bg-gray-800/50 border border-gray-700 rounded-md text-white">
            {formatted}
            {param.unit ? ` ${param.unit}` : ""}
          </div>
        </div>
      );
    }
    if (param.valueBoolean !== null && param.valueBoolean !== undefined) {
      return (
        <div
          className={`px-4 py-2 rounded-md flex items-center space-x-2 ${
            param.valueBoolean === true
              ? "bg-green-900/30 border border-green-700 text-green-300"
              : "bg-red-900/30 border border-red-700 text-red-300"
          }`}
        >
          {param.valueBoolean === true ? (
            <CheckCircle className="w-4 h-4" />
          ) : (
            <XCircle className="w-4 h-4" />
          )}
          <span>{param.valueBoolean === true ? "Sim" : "Não"}</span>
        </div>
      );
    }
    if (param.valueRating !== null && param.valueRating !== undefined) {
      const rating = param.valueRating;
      return (
        <div className="space-y-2">
          <div className="flex items-center gap-1">
            {Array.from({ length: 5 }).map((_, i) => (
              <Star
                key={i}
                className={`w-4 h-4 ${
                  i < rating
                    ? "text-yellow-400 fill-yellow-400"
                    : "text-gray-500"
                }`}
              />
            ))}
          </div>
          <div className="w-full bg-[#0f1f3a]/50 rounded-full h-2.5 overflow-hidden">
            <div
              className="bg-white h-2.5 rounded-full transition-all duration-500 shadow-lg shadow-white/20"
              style={{ width: `${(rating / 5) * 100}%` }}
            />
          </div>
        </div>
      );
    }
    return (
      <span className="text-gray-500 italic px-4 py-2 bg-gray-800/50 border border-gray-700 rounded-md block">
        Não preenchido
      </span>
    );
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-[#0a1628] via-[#0f1f3a] to-[#1e3a5f] text-white flex items-center justify-center">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-16 w-16 border-4 border-[#4a6a9a]/30 border-t-blue-300 mb-6"></div>
          <p className="text-blue-200 font-semibold text-lg">Carregando parâmetros...</p>
        </div>
      </div>
    );
  }

  if (!bet || !stats) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-[#0a1628] via-[#0f1f3a] to-[#1e3a5f] text-white flex items-center justify-center">
        <Card className="bg-gradient-to-br from-[#1e3a5f]/40 via-[#2d4a75]/30 to-[#3a5a8a]/20 border-[#4a6a9a]/30 backdrop-blur-2xl shadow-2xl rounded-2xl">
          <CardContent className="p-16 text-center">
            <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-[#2d4a75] to-[#3a5a8a] flex items-center justify-center mx-auto mb-6 shadow-lg">
              <Building2 className="w-12 h-12 text-blue-200" />
            </div>
            <h3 className="text-2xl font-bold text-blue-100 mb-3">
              Casa de apostas não encontrada
            </h3>
            <Link href="/admin/bets">
              <Button className="bg-gradient-to-r from-[#2d4a75] via-[#3a5a8a] to-[#4a6a9a] hover:from-[#3a5a8a] hover:via-[#4a6a9a] hover:to-[#5a7ba5] text-white shadow-xl hover:shadow-2xl transition-all duration-300 rounded-xl px-6 py-6 h-auto font-semibold mt-4">
                <ArrowLeft className="w-5 h-5 mr-2" />
                Voltar
              </Button>
            </Link>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Group parameters by category from actual data
  const parametersByCategory: Record<string, Parameter[]> = {};
  bet.parameters.forEach((param) => {
    const def = PARAMETER_DEFINITIONS.find((d) => d.name === param.name);
    if (def) {
      const category = def.category;
      if (!parametersByCategory[category]) {
        parametersByCategory[category] = [];
      }
      parametersByCategory[category].push(param);
    }
  });

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
        <div className="flex items-center space-x-4">
          <Link href="/admin/bets">
            <Button
              variant="ghost"
              size="icon"
              className="text-blue-300/80 hover:text-blue-100 hover:bg-[#1e3a5f]/40 rounded-xl transition-all duration-200 hover:scale-110"
            >
              <ArrowLeft className="w-5 h-5" />
            </Button>
          </Link>
          <div className="flex items-center space-x-4">
            <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-[#2d4a75] to-[#3a5a8a] flex items-center justify-center shadow-lg shadow-[#2d4a75]/30">
              <Building2 className="w-7 h-7 text-blue-100" />
            </div>
            <div>
              <h1 className="text-3xl md:text-4xl font-bold text-white tracking-tight">
                {bet.name}
              </h1>
              <p className="text-blue-200/70 mt-1.5 text-sm md:text-base">
                Visualize os parâmetros desta casa de apostas
              </p>
            </div>
          </div>
        </div>

        {/* Statistics Overview */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {/* Card 1 - Taxa de Preenchimento */}
          <Card className="relative bg-gradient-to-br from-[#0a1628]/90 via-[#0f1f3a]/80 to-[#152547]/70 border-[#1e3a5f]/40 backdrop-blur-2xl shadow-2xl shadow-[#0a1628]/30 hover:shadow-[#1e3a5f]/40 rounded-2xl overflow-hidden group hover:scale-[1.03] transition-all duration-500">
            <div className="absolute inset-0 bg-gradient-to-br from-[#1e3a5f]/0 to-[#1e3a5f]/20 opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
            <CardContent className="relative pt-8 pb-6 px-6">
              <div className="flex items-start justify-between mb-4">
                <div>
                  <div className="text-4xl md:text-5xl font-bold text-white mb-1 group-hover:text-blue-100 transition-colors duration-300">
                    {stats.completionRate.toFixed(0)}%
                  </div>
                  <div className="text-sm text-blue-200/70 font-medium uppercase tracking-wider mb-4">
                    Taxa de Preenchimento
                  </div>
                  <div className="w-full bg-[#0f1f3a]/50 rounded-full h-2.5 overflow-hidden">
                    <div
                      className="bg-white h-2.5 rounded-full transition-all duration-500 shadow-lg shadow-white/20"
                      style={{ width: `${stats.completionRate}%` }}
                    />
                  </div>
                  <p className="text-xs text-blue-200/80 mt-3">
                    {stats.filledParams} de {stats.totalParams} parâmetros
                  </p>
                </div>
                <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-[#1e3a5f] to-[#2d4a75] flex items-center justify-center shadow-lg shadow-[#1e3a5f]/30 group-hover:scale-110 group-hover:rotate-3 transition-all duration-300">
                  <Percent className="w-8 h-8 text-blue-200" />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Card 2 - Avaliação Média */}
          <Card className="relative bg-gradient-to-br from-[#1e3a5f]/90 via-[#2d4a75]/80 to-[#3a5a8a]/70 border-[#4a6a9a]/40 backdrop-blur-2xl shadow-2xl shadow-[#1e3a5f]/30 hover:shadow-[#3a5a8a]/40 rounded-2xl overflow-hidden group hover:scale-[1.03] transition-all duration-500">
            <div className="absolute inset-0 bg-gradient-to-br from-[#3a5a8a]/0 to-[#4a6a9a]/20 opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
            <CardContent className="relative pt-8 pb-6 px-6">
              <div className="flex items-start justify-between mb-4">
                <div>
                  <div className="text-4xl md:text-5xl font-bold text-white mb-1 group-hover:text-blue-50 transition-colors duration-300">
                    {stats.avgRating > 0 ? stats.avgRating.toFixed(1) : "N/A"}
                  </div>
                  <div className="text-sm text-blue-100/80 font-medium uppercase tracking-wider mb-3">
                    Avaliação Média
                  </div>
                  {stats.avgRating > 0 && (
                    <div className="flex space-x-1">
                      {[1, 2, 3, 4, 5].map((star) => (
                        <Star
                          key={star}
                          className={`w-4 h-4 ${
                            star <= Math.round(stats.avgRating)
                              ? "text-yellow-400 fill-yellow-400"
                              : "text-gray-600"
                          }`}
                        />
                      ))}
                    </div>
                  )}
                </div>
                <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-[#3a5a8a] to-[#4a6a9a] flex items-center justify-center shadow-lg shadow-[#3a5a8a]/30 group-hover:scale-110 group-hover:rotate-3 transition-all duration-300">
                  <Star className="w-8 h-8 text-blue-100 fill-blue-100" />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Card 3 - Parâmetros Numéricos */}
          <Card className="relative bg-gradient-to-br from-[#5a7ba5]/90 via-[#6b8cb5]/80 to-[#7c9dc5]/70 border-[#8daed5]/40 backdrop-blur-2xl shadow-2xl shadow-[#5a7ba5]/30 hover:shadow-[#7c9dc5]/40 rounded-2xl overflow-hidden group hover:scale-[1.03] transition-all duration-500">
            <div className="absolute inset-0 bg-gradient-to-br from-[#7c9dc5]/0 to-[#8daed5]/20 opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
            <CardContent className="relative pt-8 pb-6 px-6">
              <div className="flex items-start justify-between mb-4">
                <div>
                  <div className="text-4xl md:text-5xl font-bold text-white mb-1 group-hover:text-blue-50 transition-colors duration-300">
                    {stats.numericParams}
                  </div>
                  <div className="text-sm text-blue-50/80 font-medium uppercase tracking-wider">
                    Parâmetros Numéricos
                  </div>
                  <p className="text-xs text-blue-50/70 mt-2">
                    Valores monetários e percentuais
                  </p>
                </div>
                <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-[#6b8cb5] to-[#7c9dc5] flex items-center justify-center shadow-lg shadow-[#6b8cb5]/30 group-hover:scale-110 group-hover:rotate-3 transition-all duration-300">
                  <BarChart3 className="w-8 h-8 text-blue-50" />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Card 4 - Características */}
          <Card className="relative bg-gradient-to-br from-[#2d4a75]/90 via-[#3a5a8a]/80 to-[#4a6a9a]/70 border-[#5a7ba5]/40 backdrop-blur-2xl shadow-2xl shadow-[#2d4a75]/30 hover:shadow-[#4a6a9a]/40 rounded-2xl overflow-hidden group hover:scale-[1.03] transition-all duration-500">
            <div className="absolute inset-0 bg-gradient-to-br from-[#4a6a9a]/0 to-[#5a7ba5]/20 opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
            <CardContent className="relative pt-8 pb-6 px-6">
              <div className="flex items-start justify-between mb-4">
                <div>
                  <div className="text-4xl md:text-5xl font-bold text-white mb-1 group-hover:text-blue-50 transition-colors duration-300">
                    {stats.booleanParams}
                  </div>
                  <div className="text-sm text-blue-100/80 font-medium uppercase tracking-wider">
                    Características
                  </div>
                  <p className="text-xs text-blue-100/70 mt-2">
                    {stats.yesCount} Sim • {stats.noCount} Não
                  </p>
                </div>
                <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-[#3a5a8a] to-[#4a6a9a] flex items-center justify-center shadow-lg shadow-[#3a5a8a]/30 group-hover:scale-110 group-hover:rotate-3 transition-all duration-300">
                  <TrendingUp className="w-8 h-8 text-blue-100" />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Charts Section - Always visible */}
        <Card className="bg-gradient-to-br from-[#1e3a5f]/40 via-[#2d4a75]/30 to-[#3a5a8a]/20 border-[#4a6a9a]/30 backdrop-blur-2xl shadow-2xl shadow-[#1e3a5f]/20 rounded-2xl">
          <CardHeader className="pb-4">
            <CardTitle className="text-white text-xl font-bold flex items-center">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-[#2d4a75] to-[#3a5a8a] flex items-center justify-center mr-3 shadow-lg">
                <BarChart3 className="w-5 h-5 text-blue-100" />
              </div>
              Parâmetros Numéricos
            </CardTitle>
          </CardHeader>
          <CardContent>
            {chartData.length > 0 ? (
              <div className="h-64 sm:h-80">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={chartData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                    <XAxis
                      dataKey="name"
                      stroke="#9ca3af"
                      fontSize={12}
                      angle={-45}
                      textAnchor="end"
                      height={80}
                    />
                    <YAxis stroke="#9ca3af" fontSize={12} />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: "#1f2937",
                        border: "1px solid #374151",
                        borderRadius: "8px",
                        color: "#fff",
                      }}
                    />
                    <Bar dataKey="value" fill="#3b82f6" radius={[8, 8, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            ) : (
              <div className="h-64 sm:h-80 flex items-center justify-center border-2 border-dashed border-gray-700 rounded-lg">
                <div className="text-center">
                  <BarChart3 className="w-16 h-16 text-gray-600 mx-auto mb-4" />
                  <p className="text-gray-400 text-lg">Nenhum parâmetro numérico preenchido</p>
                  <p className="text-gray-500 text-sm mt-2">
                    Preencha valores monetários ou percentuais para ver o gráfico
                  </p>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Rating Chart - Always visible */}
        <Card className="bg-gradient-to-br from-[#1e3a5f]/40 via-[#2d4a75]/30 to-[#3a5a8a]/20 border-[#4a6a9a]/30 backdrop-blur-2xl shadow-2xl shadow-[#1e3a5f]/20 rounded-2xl">
          <CardHeader className="pb-4">
            <CardTitle className="text-white text-xl font-bold flex items-center">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-yellow-500/30 to-yellow-600/30 flex items-center justify-center mr-3 shadow-lg">
                <Star className="w-5 h-5 text-yellow-300 fill-yellow-300" />
              </div>
              Avaliações em Estrelas
            </CardTitle>
          </CardHeader>
          <CardContent>
            {ratingData.length > 0 ? (
              <div className="h-64 sm:h-80">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={ratingData} layout="vertical">
                    <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                    <XAxis
                      type="number"
                      domain={[0, 5]}
                      stroke="#9ca3af"
                      fontSize={12}
                    />
                    <YAxis
                      dataKey="name"
                      type="category"
                      stroke="#9ca3af"
                      fontSize={12}
                      width={120}
                    />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: "#1f2937",
                        border: "1px solid #374151",
                        borderRadius: "8px",
                        color: "#fff",
                      }}
                    />
                    <Bar
                      dataKey="rating"
                      fill="#ffffff"
                      radius={[0, 8, 8, 0]}
                    />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            ) : (
              <div className="h-64 sm:h-80 flex items-center justify-center border-2 border-dashed border-gray-700 rounded-lg">
                <div className="text-center">
                  <Star className="w-16 h-16 text-gray-600 mx-auto mb-4" />
                  <p className="text-gray-400 text-lg">Nenhuma avaliação preenchida</p>
                  <p className="text-gray-500 text-sm mt-2">
                    Preencha avaliações em estrelas para ver o gráfico
                  </p>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Boolean Distribution - Always visible */}
        <Card className="bg-gradient-to-br from-[#1e3a5f]/40 via-[#2d4a75]/30 to-[#3a5a8a]/20 border-[#4a6a9a]/30 backdrop-blur-2xl shadow-2xl shadow-[#1e3a5f]/20 rounded-2xl">
          <CardHeader className="pb-4">
            <CardTitle className="text-white text-xl font-bold flex items-center">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-[#2d4a75] to-[#3a5a8a] flex items-center justify-center mr-3 shadow-lg">
                <TrendingUp className="w-5 h-5 text-blue-100" />
              </div>
              Distribuição de Características
            </CardTitle>
          </CardHeader>
          <CardContent>
            {stats.yesCount + stats.noCount > 0 ? (
              <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={booleanData}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      label={(props: { name?: string; percent?: number }) => {
                        const { name = "", percent = 0 } = props;
                        return `${name}: ${(percent * 100).toFixed(0)}%`;
                      }}
                      outerRadius={80}
                      fill="#8884d8"
                      dataKey="value"
                    >
                      {booleanData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip
                      contentStyle={{
                        backgroundColor: "#1f2937",
                        border: "1px solid #374151",
                        borderRadius: "8px",
                        color: "#fff",
                      }}
                    />
                    <Legend />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            ) : (
              <div className="h-64 flex items-center justify-center border-2 border-dashed border-gray-700 rounded-lg">
                <div className="text-center">
                  <TrendingUp className="w-16 h-16 text-gray-600 mx-auto mb-4" />
                  <p className="text-gray-400 text-lg">Nenhuma característica preenchida</p>
                  <p className="text-gray-500 text-sm mt-2">
                    Preencha características (Sim/Não) para ver a distribuição
                  </p>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Parameters by Category */}
        {PARAMETER_CATEGORIES.map((category) => {
          const categoryParams = parametersByCategory[category] || [];
          if (categoryParams.length === 0) return null;

          return (
            <Card
              key={category}
              className="bg-gradient-to-br from-[#1e3a5f]/40 via-[#2d4a75]/30 to-[#3a5a8a]/20 border-[#4a6a9a]/30 backdrop-blur-2xl shadow-2xl shadow-[#1e3a5f]/20 rounded-2xl"
            >
              <CardHeader className="pb-4">
                <CardTitle className="text-white text-xl font-bold flex items-center">
                  <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-purple-500/30 to-blue-500/30 flex items-center justify-center mr-3 shadow-lg">
                    <Eye className="w-5 h-5 text-purple-300" />
                  </div>
                  {category}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                  {categoryParams.map((param) => (
                      <div
                        key={param.id}
                        className="p-4 bg-gray-800/50 rounded-lg border border-gray-700/50"
                      >
                        <div className="space-y-2">
                          <div className="flex items-start justify-between">
                            <Label className="text-white text-sm font-medium">
                              {param.name}
                            </Label>
                          </div>
                          <div className="text-white text-base">
                            {renderValue(param)}
                          </div>
                          {param.description && (
                            <p className="text-xs text-gray-400 mt-1">
                              {param.description}
                            </p>
                          )}
                        </div>
                      </div>
                    ))}
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
}

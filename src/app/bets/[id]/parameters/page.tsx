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
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { useToast } from "@/hooks/use-toast";
import Link from "next/link";
import { useParams } from "next/navigation";
import {
  PARAMETER_CATEGORIES,
  PARAMETER_DEFINITIONS,
  getParametersByCategory,
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
  id: string | null;
  name: string;
  category?: string | null;
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
        ? ratings.reduce((sum, r) => sum + r, 0) / ratings.length / 10 // Divide by 10 to convert from stored format (x10)
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
        rating: (p.valueRating || 0) / 10, // Divide by 10 to convert from stored format (x10)
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
        <div className="px-4 py-2 bg-slate-50 border border-slate-200 rounded-md text-slate-900">
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
          <div className="px-4 py-2 bg-slate-50 border border-slate-200 rounded-md text-blue-600 font-medium">
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
              ? "bg-green-50 border border-green-200 text-green-700"
              : "bg-red-50 border border-red-200 text-red-700"
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
      // Rating is stored as ×10 (45 = 4.5), so divide by 10
      const rating = Number(param.valueRating) / 10;
      const fullStars = Math.floor(rating);
      const partialFill = rating - fullStars;
      const emptyStars = 5 - fullStars - (partialFill > 0 ? 1 : 0);
      return (
        <div className="space-y-2">
          <div className="flex items-center gap-1">
            {/* Estrelas completas */}
            {Array.from({ length: fullStars }).map((_, i) => (
              <Star
                key={`full-${i}`}
                className="w-4 h-4 text-yellow-500 fill-yellow-500"
              />
            ))}
            {/* Estrela parcial */}
            {partialFill > 0 && (
              <div className="relative w-4 h-4">
                <Star className="w-4 h-4 text-gray-300 fill-gray-300" />
                <div 
                  className="absolute inset-0 overflow-hidden"
                  style={{ width: `${partialFill * 100}%` }}
                >
                  <Star className="w-4 h-4 text-yellow-500 fill-yellow-500" />
                </div>
              </div>
            )}
            {/* Estrelas vazias */}
            {Array.from({ length: emptyStars }).map((_, i) => (
              <Star
                key={`empty-${i}`}
                className="w-4 h-4 text-gray-300 fill-gray-300"
              />
            ))}
            <span className="ml-2 text-sm font-medium text-slate-600">
              {rating.toFixed(1)}/5
            </span>
          </div>
          <div className="w-full bg-slate-100 rounded-full h-2.5 overflow-hidden">
            <div
              className="bg-blue-600 h-2.5 rounded-full transition-all duration-500"
              style={{ width: `${(rating / 5) * 100}%` }}
            />
          </div>
        </div>
      );
    }
    return (
      <span className="text-slate-400 italic px-4 py-2 bg-slate-50 border border-slate-200 rounded-md block">
        Não preenchido
      </span>
    );
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-white text-slate-900 flex items-center justify-center">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-16 w-16 border-4 border-blue-100 border-t-blue-600 mb-6"></div>
          <p className="text-slate-700 font-semibold text-lg">Carregando parâmetros...</p>
        </div>
      </div>
    );
  }

  if (!bet || !stats) {
    return (
      <div className="min-h-screen bg-white text-slate-900 flex items-center justify-center">
        <Card className="bg-white border border-slate-200 shadow-sm rounded-2xl">
          <CardContent className="p-16 text-center">
            <div className="w-20 h-20 rounded-2xl bg-blue-100 flex items-center justify-center mx-auto mb-6">
              <Building2 className="w-12 h-12 text-blue-600" />
            </div>
            <h3 className="text-2xl font-bold text-slate-900 mb-3">
              Casa de apostas não encontrada
            </h3>
            <Link href="/admin/bets">
              <Button className="bg-blue-600 hover:bg-blue-700 text-white rounded-xl px-6 py-6 h-auto font-semibold mt-4">
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
    <div className="min-h-screen bg-white text-slate-900">
      <div className="max-w-7xl mx-auto p-6 md:p-8 lg:p-10 space-y-8">
        {/* Header */}
        <div className="flex items-center space-x-4">
          <Link href="/dashboard">
            <Button
              variant="ghost"
              size="icon"
              className="border-slate-200 text-slate-700 hover:bg-slate-50 rounded-xl"
            >
              <ArrowLeft className="w-5 h-5" />
            </Button>
          </Link>
          <div className="flex items-center space-x-4">
            <div className="w-14 h-14 rounded-2xl bg-blue-600 flex items-center justify-center shadow-lg">
              <Building2 className="w-7 h-7 text-white" />
            </div>
            <div>
              <h1 className="text-3xl md:text-4xl font-bold text-slate-900 tracking-tight">
                {bet.name}
              </h1>
              <p className="text-slate-600 mt-1.5 text-sm md:text-base">
                Visualize os parâmetros desta casa de apostas
              </p>
            </div>
          </div>
        </div>

        {/* Statistics Overview */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {/* Card 1 - Taxa de Preenchimento */}
          <Card className="bg-white border border-slate-200 shadow-sm rounded-xl hover:shadow-md transition-shadow">
            <CardContent className="pt-6 pb-6 px-6">
              <div className="flex items-start justify-between mb-4">
                <div className="flex-1">
                  <div className="text-4xl md:text-5xl font-bold text-slate-900 mb-2">
                    {stats.completionRate.toFixed(0)}%
                  </div>
                  <div className="text-sm text-slate-600 font-medium uppercase tracking-wider mb-4">
                    Taxa de Preenchimento
                  </div>
                  <div className="w-full bg-slate-100 rounded-full h-2.5 overflow-hidden">
                    <div
                      className="bg-blue-600 h-2.5 rounded-full transition-all duration-500"
                      style={{ width: `${stats.completionRate}%` }}
                    />
                  </div>
                  <p className="text-xs text-slate-500 mt-3">
                    {stats.filledParams} de {stats.totalParams} parâmetros
                  </p>
                </div>
                <div className="w-12 h-12 rounded-xl bg-blue-100 flex items-center justify-center flex-shrink-0">
                  <Percent className="w-6 h-6 text-blue-600" />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Card 2 - Avaliação Média */}
          <Card className="bg-white border border-slate-200 shadow-sm rounded-xl hover:shadow-md transition-shadow">
            <CardContent className="pt-6 pb-6 px-6">
              <div className="flex items-start justify-between mb-4">
                <div className="flex-1">
                  <div className="text-4xl md:text-5xl font-bold text-slate-900 mb-2">
                    {stats.avgRating > 0 ? stats.avgRating.toFixed(1) : "N/A"}
                  </div>
                  <div className="text-sm text-slate-600 font-medium uppercase tracking-wider mb-3">
                    Avaliação Média
                  </div>
                  {stats.avgRating > 0 && (
                    <div className="flex space-x-1">
                      {[1, 2, 3, 4, 5].map((star) => (
                        <Star
                          key={star}
                          className={`w-4 h-4 ${
                            star <= Math.round(stats.avgRating)
                              ? "text-yellow-500 fill-yellow-500"
                              : "text-slate-300"
                          }`}
                        />
                      ))}
                    </div>
                  )}
                </div>
                <div className="w-12 h-12 rounded-xl bg-yellow-100 flex items-center justify-center flex-shrink-0">
                  <Star className="w-6 h-6 text-yellow-600 fill-yellow-600" />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Card 3 - Parâmetros Numéricos */}
          <Card className="bg-white border border-slate-200 shadow-sm rounded-xl hover:shadow-md transition-shadow">
            <CardContent className="pt-6 pb-6 px-6">
              <div className="flex items-start justify-between mb-4">
                <div className="flex-1">
                  <div className="text-4xl md:text-5xl font-bold text-slate-900 mb-2">
                    {stats.numericParams}
                  </div>
                  <div className="text-sm text-slate-600 font-medium uppercase tracking-wider">
                    Parâmetros Numéricos
                  </div>
                  <p className="text-xs text-slate-500 mt-2">
                    Valores monetários e percentuais
                  </p>
                </div>
                <div className="w-12 h-12 rounded-xl bg-blue-100 flex items-center justify-center flex-shrink-0">
                  <BarChart3 className="w-6 h-6 text-blue-600" />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Card 4 - Características */}
          <Card className="bg-white border border-slate-200 shadow-sm rounded-xl hover:shadow-md transition-shadow">
            <CardContent className="pt-6 pb-6 px-6">
              <div className="flex items-start justify-between mb-4">
                <div className="flex-1">
                  <div className="text-4xl md:text-5xl font-bold text-slate-900 mb-2">
                    {stats.booleanParams}
                  </div>
                  <div className="text-sm text-slate-600 font-medium uppercase tracking-wider">
                    Características
                  </div>
                  <p className="text-xs text-slate-500 mt-2">
                    {stats.yesCount} Sim • {stats.noCount} Não
                  </p>
                </div>
                <div className="w-12 h-12 rounded-xl bg-green-100 flex items-center justify-center flex-shrink-0">
                  <TrendingUp className="w-6 h-6 text-green-600" />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Charts Section - Always visible */}
        <Card className="bg-white border border-slate-200 shadow-sm rounded-xl">
          <CardHeader className="pb-4">
            <CardTitle className="text-slate-900 text-xl font-bold flex items-center">
              <div className="w-10 h-10 rounded-xl bg-blue-100 flex items-center justify-center mr-3">
                <BarChart3 className="w-5 h-5 text-blue-600" />
              </div>
              Parâmetros Numéricos
            </CardTitle>
          </CardHeader>
          <CardContent>
            {chartData.length > 0 ? (
              <div className="h-64 sm:h-80">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={chartData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                    <XAxis
                      dataKey="name"
                      stroke="#64748b"
                      fontSize={12}
                      angle={-45}
                      textAnchor="end"
                      height={80}
                    />
                    <YAxis stroke="#64748b" fontSize={12} />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: "#ffffff",
                        border: "1px solid #e2e8f0",
                        borderRadius: "8px",
                        color: "#1e293b",
                      }}
                    />
                    <Bar dataKey="value" fill="#2563eb" radius={[8, 8, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            ) : (
              <div className="h-64 sm:h-80 flex items-center justify-center border-2 border-dashed border-slate-200 rounded-lg">
                <div className="text-center">
                  <BarChart3 className="w-16 h-16 text-slate-300 mx-auto mb-4" />
                  <p className="text-slate-600 text-lg">Nenhum parâmetro numérico preenchido</p>
                  <p className="text-slate-500 text-sm mt-2">
                    Preencha valores monetários ou percentuais para ver o gráfico
                  </p>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Rating Chart - Always visible */}
        <Card className="bg-white border border-slate-200 shadow-sm rounded-xl">
          <CardHeader className="pb-4">
            <CardTitle className="text-slate-900 text-xl font-bold flex items-center">
              <div className="w-10 h-10 rounded-xl bg-yellow-100 flex items-center justify-center mr-3">
                <Star className="w-5 h-5 text-yellow-600 fill-yellow-600" />
              </div>
              Avaliações em Estrelas
            </CardTitle>
          </CardHeader>
          <CardContent>
            {ratingData.length > 0 ? (
              <div className="h-64 sm:h-80">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={ratingData} layout="vertical">
                    <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                    <XAxis
                      type="number"
                      domain={[0, 5]}
                      stroke="#64748b"
                      fontSize={12}
                    />
                    <YAxis
                      dataKey="name"
                      type="category"
                      stroke="#64748b"
                      fontSize={12}
                      width={120}
                    />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: "#ffffff",
                        border: "1px solid #e2e8f0",
                        borderRadius: "8px",
                        color: "#1e293b",
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
              <div className="h-64 sm:h-80 flex items-center justify-center border-2 border-dashed border-slate-200 rounded-lg">
                <div className="text-center">
                  <Star className="w-16 h-16 text-slate-300 mx-auto mb-4" />
                  <p className="text-slate-600 text-lg">Nenhuma avaliação preenchida</p>
                  <p className="text-slate-500 text-sm mt-2">
                    Preencha avaliações em estrelas para ver o gráfico
                  </p>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Boolean Distribution - Always visible */}
        <Card className="bg-white border border-slate-200 shadow-sm rounded-xl">
          <CardHeader className="pb-4">
            <CardTitle className="text-slate-900 text-xl font-bold flex items-center">
              <div className="w-10 h-10 rounded-xl bg-green-100 flex items-center justify-center mr-3">
                <TrendingUp className="w-5 h-5 text-green-600" />
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
                        backgroundColor: "#ffffff",
                        border: "1px solid #e2e8f0",
                        borderRadius: "8px",
                        color: "#1e293b",
                      }}
                    />
                    <Legend />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            ) : (
              <div className="h-64 flex items-center justify-center border-2 border-dashed border-slate-200 rounded-lg">
                <div className="text-center">
                  <TrendingUp className="w-16 h-16 text-slate-300 mx-auto mb-4" />
                  <p className="text-slate-600 text-lg">Nenhuma característica preenchida</p>
                  <p className="text-slate-500 text-sm mt-2">
                    Preencha características (Sim/Não) para ver a distribuição
                  </p>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Parameters by Category - Table Format */}
        {PARAMETER_CATEGORIES.map((category) => {
          // Get all defined parameters in this category
          const categoryDefs = getParametersByCategory(category);
          const existingParams = parametersByCategory[category] || [];
          
          if (categoryDefs.length === 0) return null;

          // Pegar nota geral da categoria
          const categoryRatingParam = (parametersByCategory[category] || []).find(
            (p) => p.name === `__category_rating_${category}`
          ) || bet.parameters?.find((p: { name: string }) => p.name === `__category_rating_${category}`);
          const categoryRating = categoryRatingParam?.valueRating
            ? Number(categoryRatingParam.valueRating) / 10
            : null;

          return (
            <Card
              key={category}
              className="bg-white border border-slate-200 shadow-sm rounded-xl overflow-hidden"
            >
              <CardHeader className="pb-4 bg-gradient-to-r from-blue-50 to-purple-50 border-b border-slate-200">
                <CardTitle className="text-slate-900 text-xl font-bold flex items-center justify-between flex-wrap gap-3">
                  <div className="flex items-center">
                    <div className="w-1 h-8 bg-gradient-to-b from-blue-500 to-purple-500 rounded-full mr-3" />
                    {category}
                    <span className="ml-3 text-sm text-slate-500 font-normal">
                      ({categoryDefs.length} parâmetros)
                    </span>
                  </div>
                  
                  {/* Nota Geral da Categoria */}
                  {categoryRating !== null && (
                    <div className="flex items-center gap-2 bg-white rounded-lg px-3 py-1.5 border border-slate-200 shadow-sm">
                      <span className="text-sm font-medium text-slate-600">Nota Geral:</span>
                      <div className="flex items-center gap-0.5">
                        {Array.from({ length: 5 }).map((_, i) => {
                          const fullStars = Math.floor(categoryRating);
                          const partialFill = categoryRating - fullStars;
                          
                          if (i < fullStars) {
                            return <Star key={i} className="w-4 h-4 text-yellow-500 fill-yellow-500" />;
                          } else if (i === fullStars && partialFill > 0) {
                            return (
                              <div key={i} className="relative w-4 h-4">
                                <Star className="w-4 h-4 text-gray-300 fill-gray-300" />
                                <div className="absolute inset-0 overflow-hidden" style={{ width: `${partialFill * 100}%` }}>
                                  <Star className="w-4 h-4 text-yellow-500 fill-yellow-500" />
                                </div>
                              </div>
                            );
                          } else {
                            return <Star key={i} className="w-4 h-4 text-gray-300 fill-gray-300" />;
                          }
                        })}
                      </div>
                      <span className="text-sm font-bold text-slate-900">{categoryRating.toFixed(1)}/5</span>
                    </div>
                  )}
                </CardTitle>
              </CardHeader>
              <CardContent className="p-0">
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
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {categoryDefs.map((paramDef) => {
                        const existingParam = existingParams.find((p) => p.name === paramDef.name);
                        const param = existingParam || {
                          id: null,
                          name: paramDef.name,
                          category: paramDef.category,
                          valueText: null,
                          valueNumber: null,
                          valueBoolean: null,
                          valueRating: null,
                          unit: paramDef.unit,
                          description: paramDef.description,
                          type: paramDef.type,
                        };

                        return (
                          <TableRow key={paramDef.name} className="hover:bg-slate-50">
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
                              {renderValue(param)}
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
    </div>
  );
}

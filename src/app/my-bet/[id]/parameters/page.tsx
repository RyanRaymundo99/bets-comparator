"use client";

import React, { useState, useEffect, useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  ArrowLeft,
  Building2,
  Star,
  Loader2,
  Eye,
  BarChart3,
  TrendingUp,
  CheckCircle,
  XCircle,
  Percent,
  DollarSign,
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import Link from "next/link";
import { useParams } from "next/navigation";
import {
  PARAMETER_CATEGORIES,
  PARAMETER_DEFINITIONS,
  getParametersByCategory,
  type ParameterDefinition,
} from "@/lib/parameter-definitions";
import dynamic from "next/dynamic";

// Lazy load charts to reduce bundle size
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
import { Legend } from "recharts";

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
  valueText?: string;
  valueNumber?: number;
  valueBoolean?: boolean;
  valueRating?: number;
  type?: string;
  unit?: string;
  options?: string[];
}

export default function MyBetParametersPage() {
  const params = useParams();
  const userBetId = params.id as string;
  const [bet, setBet] = useState<Bet | null>(null);
  const [loading, setLoading] = useState(true);
  const [parameterValues, setParameterValues] = useState<
    Record<string, string | number | boolean | null>
  >({});
  const { toast } = useToast();

  useEffect(() => {
    fetchBet();
  }, [userBetId]);

  const fetchBet = async () => {
    try {
      setLoading(true);
      const response = await fetch(`/api/user/bet/${userBetId}`);
      const data = await response.json();

      if (data.success) {
        console.log("API Response:", data);
        console.log("Parameters from API:", data.data.parameters);
        console.log("Number of parameters:", data.data.parameters?.length || 0);
        
        const betData = {
          id: data.data.bet.id,
          name: data.data.bet.name,
          url: data.data.bet.url,
          parameters: data.data.parameters || [],
        };
        setBet(betData);

        const values: Record<string, string | number | boolean | null> = {};
        (data.data.parameters || []).forEach((param: Parameter) => {
          // Check each value type and map accordingly
          if (param.valueText !== null && param.valueText !== undefined && param.valueText !== "") {
            values[param.name] = param.valueText;
          } else if (
            param.valueNumber !== null &&
            param.valueNumber !== undefined
          ) {
            // Convert Decimal to number
            values[param.name] = typeof param.valueNumber === 'object' && param.valueNumber !== null
              ? Number((param.valueNumber as { toString: () => string }).toString())
              : Number(param.valueNumber);
          } else if (
            param.valueBoolean !== null &&
            param.valueBoolean !== undefined
          ) {
            values[param.name] = param.valueBoolean;
          } else if (
            param.valueRating !== null &&
            param.valueRating !== undefined
          ) {
            values[param.name] = Number(param.valueRating);
          } else {
            // Explicitly set to null if no value
            values[param.name] = null;
          }
        });
        console.log("Parameter values mapped:", values);
        console.log("Total parameter values:", Object.keys(values).length);
        setParameterValues(values);
      } else {
        throw new Error(data.error);
      }
    } catch (error) {
      console.error("Error fetching bet:", error);
      toast({
        variant: "destructive",
        title: "Erro",
        description: "Falha ao carregar sua casa de apostas",
      });
    } finally {
      setLoading(false);
    }
  };

  // Calculate statistics
  const stats = useMemo(() => {
    if (!bet) return null;

    const totalParams = PARAMETER_DEFINITIONS.length;
    const filledParams = Object.values(parameterValues).filter(
      (v) => v !== null && v !== undefined && v !== ""
    ).length;
    const completionRate = totalParams > 0 ? (filledParams / totalParams) * 100 : 0;

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
    const booleanParams = bet.parameters.filter(
      (p) => p.valueBoolean !== null && p.valueBoolean !== undefined
    );
    const ratingParams = bet.parameters.filter((p) => {
      const def = PARAMETER_DEFINITIONS.find((d) => d.name === p.name);
      return (
        def?.type === "rating" &&
        p.valueRating !== null &&
        p.valueRating !== undefined
      );
    });

    // Calculate average rating
    const ratings = ratingParams
      .map((p) => p.valueRating)
      .filter((r): r is number => r !== null && r !== undefined);
    const avgRating =
      ratings.length > 0
        ? ratings.reduce((sum, r) => sum + r, 0) / ratings.length
        : 0;

    // Count yes/no for booleans
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
  }, [bet, parameterValues]);

  // Prepare chart data
  const chartData = useMemo(() => {
    if (!bet) return [];

    const numericParams = bet.parameters
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
      .slice(0, 10) // Limit to 10 for readability
      .map((p) => ({
        name: p.name.length > 15 ? p.name.substring(0, 15) + "..." : p.name,
        value: p.valueNumber || 0,
        fullName: p.name,
      }));

    return numericParams;
  }, [bet]);

  // Prepare rating chart data
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

  // Prepare boolean pie chart data
  const booleanData = useMemo(() => {
    if (!stats) return [];
    return [
      { name: "Sim", value: stats.yesCount, color: "#10b981" },
      { name: "Não", value: stats.noCount, color: "#ef4444" },
    ];
  }, [stats]);

  const renderValue = (def: ParameterDefinition) => {
    const value = parameterValues[def.name];
    
    // Debug: log when value is not found
    if (value === undefined) {
      console.warn(`Value not found for parameter: ${def.name}`);
    }

    if (value === null || value === undefined || value === "") {
      return (
        <div className="px-4 py-2 bg-gray-800/50 border border-gray-700 rounded-md text-gray-500 italic">
          Não preenchido
        </div>
      );
    }

    switch (def.type) {
      case "boolean":
        return (
          <div className="flex items-center space-x-2">
            <div
              className={`px-4 py-2 rounded-md flex items-center space-x-2 ${
                value === true
                  ? "bg-green-900/30 border border-green-700 text-green-300"
                  : "bg-red-900/30 border border-red-700 text-red-300"
              }`}
            >
              {value === true ? (
                <CheckCircle className="w-4 h-4" />
              ) : (
                <XCircle className="w-4 h-4" />
              )}
              <span>{value === true ? "Sim" : "Não"}</span>
            </div>
          </div>
        );

      case "select":
        return (
          <div className="px-4 py-2 bg-gray-800/50 border border-gray-700 rounded-md text-white">
            {String(value)}
          </div>
        );

      case "rating":
        const ratingValue = value as number;
        return (
          <div className="space-y-2">
            <div className="flex items-center space-x-2">
              <div className="flex space-x-1">
                {[1, 2, 3, 4, 5].map((star) => (
                  <Star
                    key={star}
                    className={`w-5 h-5 ${
                      ratingValue >= star
                        ? "text-yellow-400 fill-yellow-400"
                        : "text-gray-600"
                    }`}
                  />
                ))}
              </div>
              <span className="text-gray-300 text-sm">{ratingValue}/5</span>
            </div>
            <div className="w-full bg-gray-700 rounded-full h-2">
              <div
                className="bg-yellow-400 h-2 rounded-full transition-all"
                style={{ width: `${(ratingValue / 5) * 100}%` }}
              />
            </div>
          </div>
        );

      case "number":
      case "currency":
      case "percentage":
        const numValue = typeof value === "number" ? value : parseFloat(String(value)) || 0;
        return (
          <div className="space-y-2">
            <div className="flex items-center space-x-2">
              <div className="px-4 py-2 bg-gray-800/50 border border-gray-700 rounded-md text-white flex-1">
                {numValue.toLocaleString("pt-BR", {
                  minimumFractionDigits: 2,
                  maximumFractionDigits: 2,
                })}
              </div>
              {def.unit && (
                <span className="text-gray-400 text-sm whitespace-nowrap">
                  {def.unit}
                </span>
              )}
            </div>
            {def.max && (
              <div className="w-full bg-gray-700 rounded-full h-2">
                <div
                  className="bg-blue-500 h-2 rounded-full transition-all"
                  style={{
                    width: `${Math.min((numValue / def.max) * 100, 100)}%`,
                  }}
                />
              </div>
            )}
          </div>
        );

      case "text":
      default:
        if (
          def.name.toLowerCase().includes("descrição") ||
          def.name.toLowerCase().includes("melhorias")
        ) {
          return (
            <div className="px-4 py-3 bg-gray-800/50 border border-gray-700 rounded-md text-white min-h-[80px] whitespace-pre-wrap">
              {String(value)}
            </div>
          );
        }
        return (
          <div className="px-4 py-2 bg-gray-800/50 border border-gray-700 rounded-md text-white">
            {String(value)}
          </div>
        );
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 text-white p-8 flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-12 h-12 text-blue-400 animate-spin mx-auto mb-4" />
          <div className="text-gray-300">Carregando...</div>
        </div>
      </div>
    );
  }

  if (!bet || !stats) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 text-white p-8 flex items-center justify-center">
        <div className="text-center">
          <Building2 className="w-16 h-16 text-gray-600 mx-auto mb-4" />
          <h3 className="text-xl font-semibold text-gray-300 mb-2">
            Casa de apostas não encontrada
          </h3>
          <Link href="/dashboard">
            <Button className="mt-4">Voltar para dashboard</Button>
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 text-white p-4 sm:p-6 lg:p-8">
      <div className="max-w-7xl mx-auto space-y-4 sm:space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <Link href="/dashboard">
              <Button
                variant="outline"
                size="icon"
                className="border-gray-700 text-white hover:bg-gray-800"
              >
                <ArrowLeft className="w-4 h-4" />
              </Button>
            </Link>
            <div>
              <h1 className="text-2xl sm:text-3xl font-bold text-white">
                {bet.name}
              </h1>
              <p className="text-gray-300 mt-1 text-sm sm:text-base">
                Visualize os parâmetros da sua casa de apostas
              </p>
            </div>
          </div>
        </div>

        {/* Statistics Overview */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <Card className="bg-gradient-to-br from-blue-900/50 to-blue-800/30 border-blue-700/50 backdrop-blur-xl">
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-blue-200">Taxa de Preenchimento</p>
                  <p className="text-2xl font-bold text-white mt-1">
                    {stats.completionRate.toFixed(0)}%
                  </p>
                </div>
                <Percent className="w-8 h-8 text-blue-400" />
              </div>
              <div className="mt-4 w-full bg-gray-700 rounded-full h-2">
                <div
                  className="bg-blue-500 h-2 rounded-full transition-all"
                  style={{ width: `${stats.completionRate}%` }}
                />
              </div>
              <p className="text-xs text-blue-200 mt-2">
                {stats.filledParams} de {stats.totalParams} parâmetros
              </p>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-green-900/50 to-green-800/30 border-green-700/50 backdrop-blur-xl">
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-green-200">Avaliação Média</p>
                  <p className="text-2xl font-bold text-white mt-1">
                    {stats.avgRating > 0 ? stats.avgRating.toFixed(1) : "N/A"}
                  </p>
                </div>
                <Star className="w-8 h-8 text-green-400 fill-green-400" />
              </div>
              {stats.avgRating > 0 && (
                <div className="mt-4 flex space-x-1">
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
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-purple-900/50 to-purple-800/30 border-purple-700/50 backdrop-blur-xl">
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-purple-200">Parâmetros Numéricos</p>
                  <p className="text-2xl font-bold text-white mt-1">
                    {stats.numericParams}
                  </p>
                </div>
                <BarChart3 className="w-8 h-8 text-purple-400" />
              </div>
              <p className="text-xs text-purple-200 mt-2">
                Valores monetários e percentuais
              </p>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-orange-900/50 to-orange-800/30 border-orange-700/50 backdrop-blur-xl">
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-orange-200">Características</p>
                  <p className="text-2xl font-bold text-white mt-1">
                    {stats.booleanParams}
                  </p>
                </div>
                <TrendingUp className="w-8 h-8 text-orange-400" />
              </div>
              <p className="text-xs text-orange-200 mt-2">
                {stats.yesCount} Sim • {stats.noCount} Não
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Charts Section - Always visible */}
        <Card className="bg-gradient-to-br from-gray-900/90 to-gray-800/90 border-gray-700/50 backdrop-blur-xl">
          <CardHeader>
            <CardTitle className="text-white flex items-center text-lg sm:text-xl">
              <BarChart3 className="w-5 h-5 sm:w-6 sm:h-6 mr-2 text-blue-400" />
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
        <Card className="bg-gradient-to-br from-gray-900/90 to-gray-800/90 border-gray-700/50 backdrop-blur-xl">
          <CardHeader>
            <CardTitle className="text-white flex items-center text-lg sm:text-xl">
              <Star className="w-5 h-5 sm:w-6 sm:h-6 mr-2 text-yellow-400 fill-yellow-400" />
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
                      fill="#eab308"
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
        <Card className="bg-gradient-to-br from-gray-900/90 to-gray-800/90 border-gray-700/50 backdrop-blur-xl">
          <CardHeader>
            <CardTitle className="text-white flex items-center text-lg sm:text-xl">
              <TrendingUp className="w-5 h-5 sm:w-6 sm:h-6 mr-2 text-green-400" />
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

        {/* Debug: Show total parameters */}
        {bet && (
          <Card className="bg-yellow-900/20 border-yellow-700/50 mb-4">
            <CardContent className="pt-6">
              <p className="text-yellow-200 text-sm font-mono">
                DEBUG: Total parameters from API: {bet.parameters.length} | 
                Total definitions: {PARAMETER_DEFINITIONS.length} | 
                Mapped values: {Object.keys(parameterValues).length} |
                Categories: {PARAMETER_CATEGORIES.length}
              </p>
              <p className="text-yellow-300 text-xs mt-2">
                Categories being rendered: {PARAMETER_CATEGORIES.map(c => {
                  const defs = getParametersByCategory(c);
                  return `${c}(${defs.length})`;
                }).join(', ')}
              </p>
            </CardContent>
          </Card>
        )}

        {/* Parameters by Category - Table Format */}
        <div className="space-y-6">
          {PARAMETER_CATEGORIES.map((category) => {
            const categoryDefs = getParametersByCategory(category);
            if (categoryDefs.length === 0) return null;

            return (
              <Card
                key={category}
                className="bg-gradient-to-br from-gray-900/90 to-gray-800/90 border-gray-700/50 backdrop-blur-xl overflow-hidden"
              >
                <CardHeader className="bg-gradient-to-r from-purple-900/50 to-blue-900/50 border-b border-gray-700/50">
                  <CardTitle className="text-white flex items-center text-lg sm:text-xl">
                    <div className="w-1 h-8 bg-gradient-to-b from-purple-400 to-blue-400 rounded-full mr-3" />
                    {category}
                    <span className="ml-3 text-sm text-gray-400 font-normal">
                      ({categoryDefs.length} parâmetros)
                    </span>
                  </CardTitle>
                </CardHeader>
                <CardContent className="p-0">
                  <div className="overflow-x-auto">
                    <Table>
                      <TableHeader>
                        <TableRow className="bg-gray-800/50 border-gray-700">
                          <TableHead className="w-[300px] font-semibold text-white">
                            Parâmetro
                          </TableHead>
                          <TableHead className="font-semibold text-white">
                            Valor
                          </TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {categoryDefs.map((def) => {
                          return (
                            <TableRow key={def.name} className="hover:bg-gray-800/30 border-gray-700">
                              <TableCell className="font-medium text-white">
                                <div>
                                  <div>{def.name}</div>
                                  {def.description && (
                                    <div className="text-xs text-gray-400 mt-1">
                                      {def.description}
                                    </div>
                                  )}
                                </div>
                              </TableCell>
                              <TableCell>
                                {renderValue(def)}
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
    </div>
  );
}

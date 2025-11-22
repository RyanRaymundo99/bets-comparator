"use client";

import React, { useMemo } from "react";
import dynamic from "next/dynamic";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { PARAMETER_CATEGORIES } from "@/lib/parameter-definitions";
import { Legend } from "recharts";

// Lazy load radar chart components
const RadarChart = dynamic(
  () => import("recharts").then((mod) => mod.RadarChart),
  { ssr: false }
);
const Radar = dynamic(() => import("recharts").then((mod) => mod.Radar), {
  ssr: false,
});
const PolarGrid = dynamic(
  () => import("recharts").then((mod) => mod.PolarGrid),
  { ssr: false }
);
const PolarAngleAxis = dynamic(
  () => import("recharts").then((mod) => mod.PolarAngleAxis),
  { ssr: false }
);
const PolarRadiusAxis = dynamic(
  () => import("recharts").then((mod) => mod.PolarRadiusAxis),
  { ssr: false }
);
const ResponsiveContainer = dynamic(
  () => import("recharts").then((mod) => mod.ResponsiveContainer),
  { ssr: false }
);
const Tooltip = dynamic(() => import("recharts").then((mod) => mod.Tooltip), {
  ssr: false,
});

interface Parameter {
  id: string;
  name: string;
  valueText?: string | null;
  valueNumber?: number | null;
  valueBoolean?: boolean | null;
  valueRating?: number | null;
  category?: string | null;
}

interface Bet {
  id: string;
  name: string;
  parameters: Parameter[];
}

interface ComparisonRadarChartProps {
  bets: Bet[];
}

// Cores para cada casa de apostas
const COLORS = [
  { fill: "rgba(139, 92, 246, 0.6)", stroke: "#8b5cf6" }, // Purple
  { fill: "rgba(239, 68, 68, 0.6)", stroke: "#ef4444" }, // Red
  { fill: "rgba(59, 130, 246, 0.6)", stroke: "#3b82f6" }, // Blue
  { fill: "rgba(16, 185, 129, 0.6)", stroke: "#10b981" }, // Green
];

// Função para calcular pontuação de uma categoria para uma casa
function calculateCategoryScore(
  bet: Bet,
  category: string,
  allBets?: Bet[] // Para comparação relativa
): number {
  const categoryParams = bet.parameters.filter(
    (p) => p.category === category
  );

  if (categoryParams.length === 0) return 0;

  let totalScore = 0;
  let validParams = 0;
  let filledParams = 0;

  categoryParams.forEach((param) => {
    let paramScore = 0;
    let hasValue = false;

    // Boolean: true = 100, false = 30
    if (param.valueBoolean !== null && param.valueBoolean !== undefined) {
      paramScore = param.valueBoolean ? 100 : 30;
      hasValue = true;
      validParams++;
      filledParams++;
    }
    // Rating: multiplica por 20 para ficar de 0-100
    else if (param.valueRating !== null && param.valueRating !== undefined) {
      paramScore = param.valueRating * 20; // 5 stars = 100
      hasValue = true;
      validParams++;
      filledParams++;
    }
    // Number: normaliza baseado em comparação relativa se possível
    else if (param.valueNumber !== null && param.valueNumber !== undefined) {
      if (allBets && allBets.length > 1) {
        // Encontra valores do mesmo parâmetro em outras casas para normalizar
        const otherValues = allBets
          .map((b) => {
            const foundParam = b.parameters.find((p) => p.name === param.name);
            return foundParam?.valueNumber;
          })
          .filter((v): v is number => v !== null && v !== undefined);

        if (otherValues.length > 0) {
          const maxValue = Math.max(...otherValues, param.valueNumber);
          const minValue = Math.min(...otherValues, param.valueNumber);
          
          if (maxValue > minValue) {
            // Normaliza baseado no range entre todas as casas (30-100)
            paramScore = 30 + ((param.valueNumber - minValue) / (maxValue - minValue)) * 70;
          } else {
            paramScore = 70; // Mesmo valor = 70 pontos
          }
        } else {
          paramScore = 70; // Apenas esta casa tem valor
        }
      } else {
        // Normalização simples se não há outras casas para comparar
        if (param.valueNumber > 1000) {
          // Valores monetários grandes
          paramScore = Math.min(100, 50 + (param.valueNumber / 10000) * 50);
        } else if (param.valueNumber > 100) {
          // Valores médios
          paramScore = Math.min(100, param.valueNumber);
        } else {
          // Valores pequenos (percentuais, etc)
          paramScore = Math.min(100, param.valueNumber * 2);
        }
      }
      hasValue = true;
      validParams++;
      filledParams++;
    }
    // Text: considera como preenchido (70 pontos)
    else if (param.valueText !== null && param.valueText !== undefined && param.valueText.trim() !== "") {
      paramScore = 70; // Considera preenchido
      hasValue = true;
      validParams++;
      filledParams++;
    }

    if (hasValue) {
      totalScore += paramScore;
    }
  });

  if (validParams === 0) return 0;

  // Retorna média dos scores
  const avgScore = totalScore / validParams;
  
  // Aplica bonus de preenchimento (até 10% de bonus se todas as parâmetros estiverem preenchidos)
  const fillRate = filledParams / categoryParams.length;
  const bonus = fillRate * 10;
  
  return Math.min(100, Math.round(avgScore + bonus));
}

export function ComparisonRadarChart({ bets }: ComparisonRadarChartProps) {
  const chartData = useMemo(() => {
    // Criar dados para o gráfico radar
    const data = PARAMETER_CATEGORIES.map((category) => {
      const categoryData: Record<string, string | number> = {
        category: category,
      };

      bets.forEach((bet) => {
        const score = calculateCategoryScore(bet, category, bets);
        // Usar ID da casa como chave para evitar problemas com nomes
        categoryData[bet.id] = score;
      });

      return categoryData;
    });

    return data;
  }, [bets]);

  const chartConfig = useMemo(() => {
    const config: Record<string, { label: string; color: string }> = {};
    bets.forEach((bet, index) => {
      config[bet.id] = {
        label: bet.name,
        color: COLORS[index % COLORS.length].stroke,
      };
    });
    return config;
  }, [bets]);

  if (bets.length === 0) {
    return null;
  }

  // Calcular pontuação geral (média de todas as categorias)
  const overallScores = bets.map((bet) => {
    const categoryScores = PARAMETER_CATEGORIES.map((cat) =>
      calculateCategoryScore(bet, cat, bets)
    );
    const avgScore =
      categoryScores.reduce((a, b) => a + b, 0) / categoryScores.length;
    return Math.round(avgScore);
  });

  return (
    <Card className="bg-white border border-slate-200 shadow-sm rounded-xl">
      <CardHeader className="pb-4">
        <CardTitle className="text-slate-900 text-xl font-bold">
          Comparação por Categorias
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-6">
          {/* Gráfico Radar */}
          <div className="h-[400px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <RadarChart data={chartData}>
                <PolarGrid stroke="#e2e8f0" />
                <PolarAngleAxis
                  dataKey="category"
                  tick={{ fill: "#64748b", fontSize: 12 }}
                  className="text-xs"
                  reversed={false}
                  scale="auto"
                />
                <PolarRadiusAxis
                  angle={90}
                  domain={[0, 100]}
                  tick={{ fill: "#94a3b8", fontSize: 10 }}
                />
                <Tooltip
                  contentStyle={{
                    backgroundColor: "#ffffff",
                    border: "1px solid #e2e8f0",
                    borderRadius: "8px",
                    color: "#1e293b",
                  }}
                  formatter={(value: unknown) => `${value} pontos`}
                />
                <Legend />
                {bets.map((bet, index) => {
                  const color = COLORS[index % COLORS.length];
                  return (
                    <Radar
                      key={bet.id}
                      name={bet.name}
                      dataKey={bet.id}
                      stroke={color.stroke}
                      fill={color.fill}
                      strokeWidth={2}
                    />
                  );
                })}
              </RadarChart>
            </ResponsiveContainer>
          </div>

          {/* Pontuações Gerais */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-4 border-t border-slate-200">
            {bets.map((bet, index) => {
              const score = overallScores[index];
              const color = COLORS[index % COLORS.length];
              return (
                <div
                  key={bet.id}
                  className="flex items-center justify-between p-4 bg-slate-50 rounded-lg border border-slate-200"
                >
                  <div>
                    <p className="text-sm text-slate-600 font-medium">
                      {bet.name}
                    </p>
                    <p className="text-2xl font-bold text-slate-900 mt-1">
                      {score} Pontos
                    </p>
                  </div>
                  <div
                    className="w-12 h-12 rounded-full flex items-center justify-center text-white font-bold"
                    style={{ backgroundColor: color.stroke }}
                  >
                    {score}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}


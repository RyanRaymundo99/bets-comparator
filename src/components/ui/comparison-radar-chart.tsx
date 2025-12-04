"use client";

import React, { useMemo } from "react";
import dynamic from "next/dynamic";
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { PARAMETER_CATEGORIES } from "@/lib/parameter-definitions";
import { TrendingUp } from "lucide-react";

// Lazy load line chart components
const LineChart = dynamic(
  () => import("recharts").then((mod) => mod.LineChart),
  { ssr: false }
);
const Line = dynamic(() => import("recharts").then((mod) => mod.Line), {
  ssr: false,
});
const CartesianGrid = dynamic(
  () => import("recharts").then((mod) => mod.CartesianGrid),
  { ssr: false }
);
const XAxis = dynamic(
  () => import("recharts").then((mod) => mod.XAxis),
  { ssr: false }
);
const YAxis = dynamic(
  () => import("recharts").then((mod) => mod.YAxis),
  { ssr: false }
);
const ResponsiveContainer = dynamic(
  () => import("recharts").then((mod) => mod.ResponsiveContainer),
  { ssr: false }
);
const Tooltip = dynamic(() => import("recharts").then((mod) => mod.Tooltip), {
  ssr: false,
});
const Legend = dynamic(
  // @ts-expect-error - recharts Legend has incompatible types with Next.js dynamic
  () => import("recharts").then((mod) => mod.Legend),
  { ssr: false }
);

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
    // Rating: divide por 10 (armazenado como *10) e multiplica por 20 para ficar de 0-100
    else if (param.valueRating !== null && param.valueRating !== undefined) {
      paramScore = (Number(param.valueRating) / 10) * 20; // 5 stars = 100
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
    // Criar dados para o gráfico de linhas
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

  if (bets.length === 0) {
    return null;
  }

  // Função para abreviar nomes de categorias para o eixo X
  const abbreviateCategory = (category: string): string => {
    const abbreviations: Record<string, string> = {
      "Mercado e Acesso": "Mercado",
      "Pagamentos & Financeiro": "Pagamentos",
      "Plataforma & Experiência do Usuário": "Plataforma",
      "Produtos & Entretenimento": "Produtos",
      "Gamificação & Fidelização": "Gamificação",
      "Marketing & Comunidade": "Marketing",
      "Tráfego & Performance": "Tráfego",
      "CRM": "CRM",
    };
    return abbreviations[category] || category.slice(0, 8);
  };

  return (
    <Card className="bg-white border border-slate-200 shadow-sm rounded-xl">
      <CardHeader className="pb-4">
        <CardTitle className="text-slate-900 text-xl font-bold">
          Comparação por Categorias
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="h-[400px] w-full">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart
              data={chartData}
              margin={{
                left: 12,
                right: 12,
                top: 12,
                bottom: 12,
              }}
            >
              <CartesianGrid vertical={false} stroke="#e2e8f0" />
              <XAxis
                dataKey="category"
                tickLine={false}
                axisLine={false}
                tickMargin={8}
                tick={{ fill: "#64748b", fontSize: 12 }}
                tickFormatter={(value) => abbreviateCategory(value)}
                angle={-45}
                textAnchor="end"
                height={80}
              />
              <YAxis
                domain={[0, 100]}
                tickLine={false}
                axisLine={false}
                tick={{ fill: "#64748b", fontSize: 12 }}
                tickMargin={8}
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
                  <Line
                    key={bet.id}
                    type="monotone"
                    dataKey={bet.id}
                    name={bet.name}
                    stroke={color.stroke}
                    strokeWidth={2}
                    dot={false}
                  />
                );
              })}
            </LineChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
      <CardFooter>
        <div className="flex w-full items-start gap-2 text-sm">
          <div className="grid gap-2">
            <div className="flex items-center gap-2 leading-none font-medium">
              Comparação de {bets.length} {bets.length === 1 ? "casa" : "casas"} de apostas{" "}
              <TrendingUp className="h-4 w-4" />
            </div>
            <div className="text-muted-foreground flex items-center gap-2 leading-none">
              Mostrando pontuação por categoria (0-100 pontos)
            </div>
          </div>
        </div>
      </CardFooter>
    </Card>
  );
}


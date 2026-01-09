"use client";

import React, { useState, useMemo } from "react";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { ChevronDown, ChevronUp, Check } from "lucide-react";

interface Parameter {
  id: string;
  name: string;
  valueText?: string | null;
  valueNumber?: number | null;
  valueBoolean?: boolean | null;
  valueRating?: number | null;
  category?: string | null;
  unit?: string | null;
}

interface Bet {
  id: string;
  name: string;
  parameters: Parameter[];
}

interface ComparisonAdvantagesProps {
  bets: Bet[];
}

interface Advantage {
  parameter: string;
  description: string;
  value1: string;
  value2: string;
  difference?: string;
  percentage?: number;
}

// Função para formatar valor
function formatValue(param: Parameter | null): string {
  if (!param) return "-";

  if (param.valueText !== null && param.valueText !== undefined) {
    return param.valueText;
  }

  if (param.valueNumber !== null && param.valueNumber !== undefined) {
    const formatted = param.valueNumber.toLocaleString("pt-BR", {
      minimumFractionDigits: param.valueNumber % 1 !== 0 ? 2 : 0,
      maximumFractionDigits: 2,
    });
    return `${formatted}${param.unit ? ` ${param.unit}` : ""}`;
  }

  if (param.valueBoolean !== null && param.valueBoolean !== undefined) {
    return param.valueBoolean ? "Sim" : "Não";
  }

  if (param.valueRating !== null && param.valueRating !== undefined) {
    // Rating é armazenado como inteiro * 10, então dividimos por 10 (45 → 4.5)
    const rating = Number(param.valueRating) / 10;
    return rating % 1 === 0 ? `${rating}/5` : `${rating.toFixed(1)}/5`;
  }

  return "-";
}

// Função para comparar parâmetros e encontrar vantagens
function findAdvantages(bet1: Bet, bet2: Bet): {
  bet1Advantages: Advantage[];
  bet2Advantages: Advantage[];
} {
  const bet1Advantages: Advantage[] = [];
  const bet2Advantages: Advantage[] = [];

  // Criar mapas de parâmetros por nome
  const bet1Params = new Map(bet1.parameters.map((p) => [p.name, p]));
  const bet2Params = new Map(bet2.parameters.map((p) => [p.name, p]));

  // Obter todos os nomes únicos de parâmetros
  const allParamNames = new Set([
    ...bet1.parameters.map((p) => p.name),
    ...bet2.parameters.map((p) => p.name),
  ]);

  allParamNames.forEach((paramName) => {
    const param1 = bet1Params.get(paramName);
    const param2 = bet2Params.get(paramName);

    // Comparar valores booleanos (true é melhor)
    if (
      param1?.valueBoolean !== null &&
      param1?.valueBoolean !== undefined &&
      param2?.valueBoolean !== null &&
      param2?.valueBoolean !== undefined
    ) {
      if (param1.valueBoolean && !param2.valueBoolean) {
        bet1Advantages.push({
          parameter: paramName,
          description: `Tem ${paramName.toLowerCase()}`,
          value1: "Sim",
          value2: "Não",
        });
      } else if (!param1.valueBoolean && param2.valueBoolean) {
        bet2Advantages.push({
          parameter: paramName,
          description: `Tem ${paramName.toLowerCase()}`,
          value1: "Não",
          value2: "Sim",
        });
      }
    }
    // Comparar ratings (maior é melhor)
    else if (
      param1?.valueRating !== null &&
      param1?.valueRating !== undefined &&
      param2?.valueRating !== null &&
      param2?.valueRating !== undefined
    ) {
      // Rating is stored as ×10 (35 = 3.5), so divide by 10
      const rating1 = Number(param1.valueRating) / 10;
      const rating2 = Number(param2.valueRating) / 10;
      
      if (rating1 > rating2) {
        const diff = rating1 - rating2;
        const percentage = ((diff / rating2) * 100).toFixed(1);
        bet1Advantages.push({
          parameter: paramName,
          description: `Avaliação ${percentage}% melhor`,
          value1: `${rating1.toFixed(1)}/5`,
          value2: `${rating2.toFixed(1)}/5`,
          difference: `${diff.toFixed(1)} estrelas a mais`,
          percentage: parseFloat(percentage),
        });
      } else if (rating2 > rating1) {
        const diff = rating2 - rating1;
        const percentage = ((diff / rating1) * 100).toFixed(1);
        bet2Advantages.push({
          parameter: paramName,
          description: `Avaliação ${percentage}% melhor`,
          value1: `${rating1.toFixed(1)}/5`,
          value2: `${rating2.toFixed(1)}/5`,
          difference: `${diff.toFixed(1)} estrelas a mais`,
          percentage: parseFloat(percentage),
        });
      }
    }
    // Comparar números (maior é melhor, mas precisa considerar o contexto)
    else if (
      param1?.valueNumber !== null &&
      param1?.valueNumber !== undefined &&
      param2?.valueNumber !== null &&
      param2?.valueNumber !== undefined &&
      param1.valueNumber > 0 &&
      param2.valueNumber > 0
    ) {
      const val1 = param1.valueNumber;
      const val2 = param2.valueNumber;

      if (val1 > val2) {
        const diff = val1 - val2;
        const percentage = ((diff / val2) * 100).toFixed(2);
        const percentageNum = parseFloat(percentage);
        
        // Criar descrição mais específica
        let description = `${percentage}% ${percentageNum >= 50 ? 'muito' : ''} maior em ${paramName}`;
        if (param1.unit === "R$" || paramName.toLowerCase().includes("valor") || paramName.toLowerCase().includes("depósito") || paramName.toLowerCase().includes("saque")) {
          description = `${diff.toLocaleString("pt-BR")}${param1.unit ? ` ${param1.unit}` : ""} a mais em ${paramName}`;
        } else if (percentageNum > 0.1) {
          description = `${percentage}% maior em ${paramName}`;
        } else {
          description = `${paramName} maior`;
        }
        
        bet1Advantages.push({
          parameter: paramName,
          description: description,
          value1: formatValue(param1),
          value2: formatValue(param2),
          difference: `${diff.toLocaleString("pt-BR")}${param1.unit ? ` ${param1.unit}` : ""} a mais`,
          percentage: percentageNum,
        });
      } else if (val2 > val1) {
        const diff = val2 - val1;
        const percentage = ((diff / val1) * 100).toFixed(2);
        const percentageNum = parseFloat(percentage);
        
        // Criar descrição mais específica
        let description = `${percentage}% ${percentageNum >= 50 ? 'muito' : ''} maior em ${paramName}`;
        if (param2.unit === "R$" || paramName.toLowerCase().includes("valor") || paramName.toLowerCase().includes("depósito") || paramName.toLowerCase().includes("saque")) {
          description = `${diff.toLocaleString("pt-BR")}${param2.unit ? ` ${param2.unit}` : ""} a mais em ${paramName}`;
        } else if (percentageNum > 0.1) {
          description = `${percentage}% maior em ${paramName}`;
        } else {
          description = `${paramName} maior`;
        }
        
        bet2Advantages.push({
          parameter: paramName,
          description: description,
          value1: formatValue(param1),
          value2: formatValue(param2),
          difference: `${diff.toLocaleString("pt-BR")}${param2.unit ? ` ${param2.unit}` : ""} a mais`,
          percentage: percentageNum,
        });
      }
    }
    // Comparar textos (ter valor é melhor que não ter)
    else if (
      (param1?.valueText && (!param2?.valueText || param2.valueText === "-")) ||
      ((!param1?.valueText || param1.valueText === "-") && param2?.valueText)
    ) {
      if (param1?.valueText && param1.valueText !== "-") {
        bet1Advantages.push({
          parameter: paramName,
          description: `Tem ${paramName.toLowerCase()} preenchido`,
          value1: formatValue(param1 || null),
          value2: formatValue(param2 || null),
        });
      } else if (param2?.valueText && param2.valueText !== "-") {
        bet2Advantages.push({
          parameter: paramName,
          description: `Tem ${paramName.toLowerCase()} preenchido`,
          value1: formatValue(param1 || null),
          value2: formatValue(param2 || null),
        });
      }
    }
  });

  // Ordenar vantagens por porcentagem (maior primeiro) ou alfabeticamente
  bet1Advantages.sort((a, b) => {
    if (a.percentage && b.percentage) {
      return b.percentage - a.percentage;
    }
    return a.parameter.localeCompare(b.parameter);
  });

  bet2Advantages.sort((a, b) => {
    if (a.percentage && b.percentage) {
      return b.percentage - a.percentage;
    }
    return a.parameter.localeCompare(b.parameter);
  });

  return { bet1Advantages, bet2Advantages };
}

export function ComparisonAdvantages({ bets }: ComparisonAdvantagesProps) {
  const [expandedSection, setExpandedSection] = useState<string | null>(null);

  const advantages = useMemo(() => {
    if (bets.length !== 2) return null;
    return findAdvantages(bets[0], bets[1]);
  }, [bets]);

  if (bets.length !== 2 || !advantages) {
    return null;
  }

  const [bet1, bet2] = bets;
  const { bet1Advantages, bet2Advantages } = advantages;

  return (
    <div className="space-y-4">
      {/* Vantagens da Casa 1 */}
      {bet1Advantages.length > 0 && (
        <Card className="bg-white border border-slate-200 shadow-sm rounded-xl overflow-hidden">
          <CardHeader
            className="cursor-pointer hover:bg-slate-50 transition-colors duration-200"
            onClick={() =>
              setExpandedSection(
                expandedSection === "bet1" ? null : "bet1"
              )
            }
          >
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-bold text-slate-900">
                Por que {bet1.name} é melhor que {bet2.name}?
              </h3>
              {expandedSection === "bet1" ? (
                <ChevronUp className="w-5 h-5 text-slate-600" />
              ) : (
                <ChevronDown className="w-5 h-5 text-slate-600" />
              )}
            </div>
          </CardHeader>
          {expandedSection === "bet1" && (
            <CardContent className="pt-0 pb-6">
              <div className="space-y-3">
                {bet1Advantages.map((advantage, index) => (
                  <div
                    key={`bet1-${index}`}
                    className="flex items-start gap-3 p-3 bg-blue-50 rounded-lg border border-blue-100"
                  >
                    <div className="flex-shrink-0 w-5 h-5 rounded-full bg-green-500 flex items-center justify-center mt-0.5">
                      <Check className="w-3 h-3 text-white" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold text-slate-900">
                        {advantage.description}
                      </p>
                      <div className="flex items-center gap-2 mt-1 text-xs text-slate-600">
                        <span className="font-medium text-blue-600">
                          {advantage.value1}
                        </span>
                        <span>vs</span>
                        <span>{advantage.value2}</span>
                        {advantage.difference && (
                          <span className="text-slate-500">
                            ({advantage.difference})
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          )}
        </Card>
      )}

      {/* Vantagens da Casa 2 */}
      {bet2Advantages.length > 0 && (
        <Card className="bg-white border border-slate-200 shadow-sm rounded-xl overflow-hidden">
          <CardHeader
            className="cursor-pointer hover:bg-slate-50 transition-colors duration-200"
            onClick={() =>
              setExpandedSection(
                expandedSection === "bet2" ? null : "bet2"
              )
            }
          >
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-bold text-slate-900">
                Por que {bet2.name} é melhor que {bet1.name}?
              </h3>
              {expandedSection === "bet2" ? (
                <ChevronUp className="w-5 h-5 text-slate-600" />
              ) : (
                <ChevronDown className="w-5 h-5 text-slate-600" />
              )}
            </div>
          </CardHeader>
          {expandedSection === "bet2" && (
            <CardContent className="pt-0 pb-6">
              <div className="space-y-3">
                {bet2Advantages.map((advantage, index) => (
                  <div
                    key={`bet2-${index}`}
                    className="flex items-start gap-3 p-3 bg-red-50 rounded-lg border border-red-100"
                  >
                    <div className="flex-shrink-0 w-5 h-5 rounded-full bg-green-500 flex items-center justify-center mt-0.5">
                      <Check className="w-3 h-3 text-white" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold text-slate-900">
                        {advantage.description}
                      </p>
                      <div className="flex items-center gap-2 mt-1 text-xs text-slate-600">
                        <span>{advantage.value1}</span>
                        <span>vs</span>
                        <span className="font-medium text-red-600">
                          {advantage.value2}
                        </span>
                        {advantage.difference && (
                          <span className="text-slate-500">
                            ({advantage.difference})
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          )}
        </Card>
      )}
    </div>
  );
}


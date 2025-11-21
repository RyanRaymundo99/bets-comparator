"use client";

import React, { useState, useEffect, useMemo } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Building2, ExternalLink, ChevronDown } from "lucide-react";
import Link from "next/link";
import { useToast } from "@/hooks/use-toast";
import { PARAMETER_DEFINITIONS } from "@/lib/parameter-definitions";

interface Bet {
  id: string;
  name: string;
  url?: string | null;
  region?: string | null;
  license?: string | null;
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

export default function ComparisonPage() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const { toast } = useToast();
  const [bets, setBets] = useState<Bet[]>([]);
  const [loading, setLoading] = useState(true);

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

  // Organizar parâmetros únicos de todas as casas
  const allParameters = useMemo(() => {
    const paramMap = new Map<string, Parameter[]>();
    
    bets.forEach((bet) => {
      bet.parameters.forEach((param) => {
        if (!paramMap.has(param.name)) {
          paramMap.set(param.name, []);
        }
        paramMap.get(param.name)?.push(param);
      });
    });

    return Array.from(paramMap.keys()).map((paramName) => ({
      name: paramName,
      values: paramMap.get(paramName) || [],
      category: paramMap.get(paramName)?.[0]?.category || null,
      unit: paramMap.get(paramName)?.[0]?.unit || null,
    }));
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

  return (
    <div className="min-h-screen bg-white text-slate-900">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Link href="/dashboard">
              <Button
                variant="outline"
                size="icon"
                className="border-slate-200 text-slate-700 hover:bg-slate-50 rounded-xl"
              >
                <ArrowLeft className="w-5 h-5" />
              </Button>
            </Link>
            <div>
              <h1 className="text-3xl md:text-4xl font-bold text-slate-900 tracking-tight">
                {bets.map((bet) => bet.name).join(" vs ")}
              </h1>
              <p className="text-slate-600 mt-1.5">
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

        {/* Main Comparison - Side by Side with VS Separator */}
        <div className="relative">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 lg:gap-12">
            {bets.map((bet, index) => (
              <div key={bet.id} className="space-y-6">
                {/* Bet Header */}
                <div className="space-y-4">
                  <h2 className="text-3xl md:text-4xl font-bold text-slate-900">
                    {bet.name}
                  </h2>
                  
                  {bet.url && (
                    <a
                      href={bet.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-2 text-blue-600 hover:text-blue-700 transition-colors text-sm group"
                    >
                      <span className="truncate">{bet.url}</span>
                      <ExternalLink className="w-4 h-4 flex-shrink-0 group-hover:scale-110 transition-transform" />
                    </a>
                  )}

                  {/* Bet Info */}
                  <div className="flex flex-wrap gap-4 text-sm text-slate-600">
                    {bet.region && (
                      <div>
                        <span>Região: </span>
                        <span className="font-medium text-slate-900">{bet.region}</span>
                      </div>
                    )}
                    {bet.license && (
                      <div>
                        <span>Licença: </span>
                        <span className="font-medium text-slate-900">{bet.license}</span>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* VS Separator - Centered between bets */}
          {bets.length === 2 && (
            <div className="absolute top-0 left-1/2 transform -translate-x-1/2 -translate-y-1/2 z-10">
              <div className="bg-white px-6 py-3 rounded-full border-2 border-slate-300 shadow-md">
                <span className="text-xl font-bold text-slate-900">VS</span>
              </div>
            </div>
          )}
        </div>

        {/* Parameters Cards - Organized by Parameter */}
        {allParameters.length > 0 && (
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <h3 className="text-xl font-bold text-slate-900">
                {allParameters.length} CARACTERÍSTICAS COMPARADAS
              </h3>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {allParameters.map((param) => {
                // Buscar definição do parâmetro para pegar descrição
                const paramDef = PARAMETER_DEFINITIONS.find((d) => d.name === param.name);
                const description = paramDef?.description || "";
                
                return (
                  <Card
                    key={param.name}
                    className="bg-white border border-slate-200 shadow-sm rounded-xl hover:shadow-md transition-shadow"
                  >
                    <CardContent className="p-6 space-y-4">
                      {/* Parameter Name */}
                      <h4 className="text-lg font-bold text-slate-900 border-b border-slate-200 pb-3">
                        {param.name}
                      </h4>

                      {/* Values for each bet */}
                      <div className="space-y-2">
                        {bets.map((bet) => {
                          const paramValue = getParameterValue(bet.id, param.name);
                          const displayValue = getParameterDisplayValue(paramValue);
                          const unit = paramValue?.unit || param.unit;
                          const isBoolean = paramValue?.valueBoolean !== null && paramValue?.valueBoolean !== undefined;
                          const isRating = paramValue?.valueRating !== null && paramValue?.valueRating !== undefined;
                          const hasValue = displayValue !== "-";
                          
                          return (
                            <div
                              key={bet.id}
                              className="flex flex-col gap-1"
                            >
                              <p className="text-sm font-semibold text-slate-900">
                                {bet.name}
                              </p>
                              {hasValue ? (
                                <div className="flex items-center gap-2">
                                  {isBoolean && (
                                    <span className={`text-base font-semibold ${paramValue?.valueBoolean ? 'text-green-600' : 'text-red-600'}`}>
                                      {paramValue?.valueBoolean ? '✔' : '✗'}
                                    </span>
                                  )}
                                  <span className={`text-base font-medium ${isBoolean ? 'text-slate-700' : 'text-blue-600'}`}>
                                    {displayValue}
                                    {unit && !isBoolean && !isRating ? ` ${unit}` : ""}
                                  </span>
                                </div>
                              ) : (
                                <span className="text-sm text-slate-400 italic">-</span>
                              )}
                            </div>
                          );
                        })}
                      </div>

                      {/* Description */}
                      {description && (
                        <p className="text-xs text-slate-500 mt-4 pt-3 border-t border-slate-200">
                          {description}
                        </p>
                      )}
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          </div>
        )}

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


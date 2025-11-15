"use client";

import React, { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  ArrowLeft,
  Save,
  Building2,
  Sliders,
  Star,
  Loader2,
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import Link from "next/link";
import { useRouter, useParams } from "next/navigation";
import {
  PARAMETER_CATEGORIES,
  PARAMETER_DEFINITIONS,
  getParametersByCategory,
  type ParameterDefinition,
} from "@/lib/parameter-definitions";

interface Bet {
  id: string;
  name: string;
  company?: string;
  domain?: string;
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
}

export default function BetParametersPage() {
  const params = useParams();
  const betId = params.id as string;
  const [bet, setBet] = useState<Bet | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [parameterValues, setParameterValues] = useState<Record<string, string | number | boolean | null>>({});
  const { toast } = useToast();
  const router = useRouter();

  useEffect(() => {
    fetchBet();
  }, [betId]);

  const fetchBet = async () => {
    try {
      setLoading(true);
      const response = await fetch(`/api/bets/${betId}`);
      const data = await response.json();

      if (data.success) {
        setBet(data.bet);
        
        // Pre-fill existing parameter values
        const values: Record<string, string | number | boolean | null> = {};
        data.bet.parameters.forEach((param: Parameter) => {
          if (param.valueText !== null && param.valueText !== undefined) values[param.name] = param.valueText;
          else if (param.valueNumber !== null && param.valueNumber !== undefined) values[param.name] = param.valueNumber;
          else if (param.valueBoolean !== null && param.valueBoolean !== undefined) values[param.name] = param.valueBoolean;
          else if (param.valueRating !== null && param.valueRating !== undefined) values[param.name] = param.valueRating;
        });
        setParameterValues(values);
      } else {
        throw new Error(data.error);
      }
    } catch (error) {
      console.error("Error fetching bet:", error);
      toast({
        variant: "destructive",
        title: "Erro",
        description: "Falha ao carregar casa de apostas",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleSaveAll = async () => {
    try {
      setSaving(true);
      let successCount = 0;
      let errorCount = 0;

      // Save each parameter
      for (const def of PARAMETER_DEFINITIONS) {
        const value = parameterValues[def.name];
        
        // Skip empty values
        if (value === undefined || value === "" || value === null) {
          continue;
        }

        // Prepare the parameter data based on type
        const paramData: {
          betId: string;
          name: string;
          category?: string;
          valueText?: string;
          valueNumber?: number;
          valueBoolean?: boolean;
          valueRating?: number;
          unit?: string;
          description?: string;
          type?: string;
          options?: string[];
        } = {
          betId,
          name: def.name,
          category: def.category,
          type: def.type,
          unit: def.unit,
        };

        // Set the appropriate value field based on type
        switch (def.type) {
          case "boolean":
            paramData.valueBoolean = typeof value === "boolean" ? value : Boolean(value);
            break;
          case "rating":
            paramData.valueRating = typeof value === "number" ? value : parseInt(String(value), 10);
            break;
          case "number":
          case "currency":
          case "percentage":
            paramData.valueNumber = typeof value === "number" ? value : parseFloat(String(value));
            break;
          case "text":
          case "select":
          default:
            paramData.valueText = value !== null && value !== undefined ? String(value) : "";
            break;
        }

        try {
          const response = await fetch("/api/parameters", {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify(paramData),
          });

          if (response.ok) {
            successCount++;
          } else {
            errorCount++;
          }
        } catch (error) {
          errorCount++;
        }
      }

      toast({
        title: "Parâmetros salvos!",
        description: `✅ ${successCount} salvos${errorCount > 0 ? `, ❌ ${errorCount} com erro` : ""}`,
      });

      // Refresh the data
      await fetchBet();
    } catch (error) {
      console.error("Error saving parameters:", error);
      toast({
        variant: "destructive",
        title: "Erro",
        description: "Falha ao salvar parâmetros",
      });
    } finally {
      setSaving(false);
    }
  };

  const renderInput = (def: ParameterDefinition) => {
    const value = parameterValues[def.name];

    switch (def.type) {
      case "boolean":
        return (
          <div className="flex items-center space-x-2">
            <button
              type="button"
              onClick={() =>
                setParameterValues({ ...parameterValues, [def.name]: true })
              }
              className={`px-4 py-2 rounded-md text-sm font-medium transition-all ${
                value === true
                  ? "bg-green-600 text-white"
                  : "bg-gray-800 text-gray-400 hover:bg-gray-700"
              }`}
            >
              Sim
            </button>
            <button
              type="button"
              onClick={() =>
                setParameterValues({ ...parameterValues, [def.name]: false })
              }
              className={`px-4 py-2 rounded-md text-sm font-medium transition-all ${
                value === false
                  ? "bg-red-600 text-white"
                  : "bg-gray-800 text-gray-400 hover:bg-gray-700"
              }`}
            >
              Não
            </button>
            <button
              type="button"
              onClick={() => {
                const newValues = { ...parameterValues };
                delete newValues[def.name];
                setParameterValues(newValues);
              }}
              className="px-4 py-2 rounded-md text-sm font-medium bg-gray-800 text-gray-400 hover:bg-gray-700"
            >
              Limpar
            </button>
          </div>
        );

      case "rating":
        return (
          <div className="flex items-center space-x-2">
            {[0, 1, 2, 3, 4, 5].map((rating) => (
              <button
                key={rating}
                type="button"
                onClick={() =>
                  setParameterValues({ ...parameterValues, [def.name]: rating })
                }
                className="transition-transform hover:scale-110"
              >
                <Star
                  className={`w-6 h-6 ${
                    (value !== null && value !== undefined && Number(value) >= rating)
                      ? "text-yellow-400 fill-yellow-400"
                      : "text-gray-600"
                  }`}
                />
              </button>
            ))}
            <span className="text-gray-400 ml-2">{(value !== null && value !== undefined ? Number(value) : 0)}/5</span>
          </div>
        );

      case "select":
        return (
          <select
            value={value !== null && value !== undefined ? String(value) : ""}
            onChange={(e) =>
              setParameterValues({ ...parameterValues, [def.name]: e.target.value })
            }
            className="w-full px-4 py-2 bg-gray-800 border-gray-700 text-white rounded-md border focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="">Selecione...</option>
            {def.options?.map((option: string) => (
              <option key={option} value={option}>
                {option}
              </option>
            ))}
          </select>
        );

      case "currency":
        return (
          <div className="relative">
            <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400">
              R$
            </span>
            <Input
              type="number"
              step="0.01"
              value={value !== null && value !== undefined ? String(value) : ""}
              onChange={(e) =>
                setParameterValues({ ...parameterValues, [def.name]: e.target.value })
              }
              placeholder="0.00"
              className="pl-10 bg-gray-800 border-gray-700 text-white"
            />
          </div>
        );

      case "percentage":
        return (
          <div className="relative">
            <Input
              type="number"
              step="0.1"
              min="0"
              max="100"
              value={value !== null && value !== undefined ? String(value) : ""}
              onChange={(e) =>
                setParameterValues({ ...parameterValues, [def.name]: e.target.value })
              }
              placeholder="0.0"
              className="pr-8 bg-gray-800 border-gray-700 text-white"
            />
            <span className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400">
              %
            </span>
          </div>
        );

      case "number":
        return (
          <Input
            type="number"
            value={value !== null && value !== undefined ? String(value) : ""}
            onChange={(e) =>
              setParameterValues({ ...parameterValues, [def.name]: e.target.value })
            }
            placeholder="Digite um número"
            className="bg-gray-800 border-gray-700 text-white"
          />
        );

      case "text":
      default:
        // Check if it's a long description field
        if (def.name.toLowerCase().includes("descrição") || def.name.toLowerCase().includes("melhorias")) {
          return (
            <Textarea
              value={value !== null && value !== undefined ? String(value) : ""}
              onChange={(e) =>
                setParameterValues({ ...parameterValues, [def.name]: e.target.value })
              }
              placeholder={def.description || "Digite o texto"}
              className="bg-gray-800 border-gray-700 text-white min-h-[80px]"
            />
          );
        }
        return (
          <Input
            type="text"
            value={value !== null && value !== undefined ? String(value) : ""}
            onChange={(e) =>
              setParameterValues({ ...parameterValues, [def.name]: e.target.value })
            }
            placeholder={def.description || "Digite o texto"}
            className="bg-gray-800 border-gray-700 text-white"
          />
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

  if (!bet) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 text-white p-8 flex items-center justify-center">
        <div className="text-center">
          <Building2 className="w-16 h-16 text-gray-600 mx-auto mb-4" />
          <h3 className="text-xl font-semibold text-gray-300 mb-2">
            Casa de apostas não encontrada
          </h3>
          <Link href="/admin/bets">
            <Button className="mt-4">Voltar para lista</Button>
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 text-white p-8">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <Link href="/admin/bets">
              <Button variant="ghost" className="text-gray-400 hover:text-white">
                <ArrowLeft className="w-4 h-4" />
              </Button>
            </Link>
            <div>
              <h1 className="text-3xl font-bold text-white flex items-center">
                <Sliders className="w-8 h-8 mr-3 text-purple-400" />
                Parâmetros: {bet.name}
              </h1>
              <p className="text-gray-300 mt-1">
                {bet.company && `${bet.company} • `}
                {bet.domain}
              </p>
            </div>
          </div>
          <Button
            onClick={handleSaveAll}
            disabled={saving}
            className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white"
          >
            {saving ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Salvando...
              </>
            ) : (
              <>
                <Save className="w-4 h-4 mr-2" />
                Salvar Todos os Parâmetros
              </>
            )}
          </Button>
        </div>

        {/* Info Card */}
        <Card className="bg-gradient-to-r from-blue-900/30 to-purple-900/30 border-blue-700/50 backdrop-blur-xl">
          <CardContent className="py-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-lg font-semibold text-white">
                  📊 {PARAMETER_DEFINITIONS.length} Parâmetros Disponíveis
                </h3>
                <p className="text-gray-300 text-sm mt-1">
                  Preencha os parâmetros que desejar. Campos vazios não serão salvos.
                </p>
              </div>
              <div className="text-right">
                <div className="text-2xl font-bold text-blue-400">
                  {bet.parameters?.length || 0}
                </div>
                <div className="text-sm text-gray-400">Já preenchidos</div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Parameters by Category */}
        <div className="space-y-6">
          {PARAMETER_CATEGORIES.map((category) => {
            const params = getParametersByCategory(category);
            if (params.length === 0) return null;

            return (
              <Card
                key={category}
                className="bg-gradient-to-br from-gray-900/90 to-gray-800/90 border-gray-700/50 backdrop-blur-xl"
              >
                <CardHeader>
                  <CardTitle className="text-white text-xl flex items-center">
                    <div className="w-2 h-8 bg-gradient-to-b from-blue-500 to-purple-500 rounded-full mr-3" />
                    {category}
                    <span className="ml-3 text-sm text-gray-400 font-normal">
                      ({params.length} parâmetros)
                    </span>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {params.map((def) => (
                      <div key={def.name} className="space-y-2">
                        <Label className="text-gray-300 flex items-center">
                          {def.name}
                          {def.description && (
                            <span className="ml-2 text-xs text-gray-500">
                              ({def.description})
                            </span>
                          )}
                        </Label>
                        {renderInput(def)}
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>

        {/* Bottom Save Button */}
        <div className="sticky bottom-8 flex justify-center">
          <Button
            onClick={handleSaveAll}
            disabled={saving}
            size="lg"
            className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white shadow-2xl"
          >
            {saving ? (
              <>
                <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                Salvando todos os parâmetros...
              </>
            ) : (
              <>
                <Save className="w-5 h-5 mr-2" />
                Salvar Todos os Parâmetros ({Object.keys(parameterValues).filter(k => parameterValues[k] !== "" && parameterValues[k] !== undefined).length} preenchidos)
              </>
            )}
          </Button>
        </div>
      </div>
    </div>
  );
}


"use client";

import React, { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
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
  Save,
  Building2,
  Sliders,
  Star,
  Loader2,
  History,
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

interface ParameterHistoryItem {
  id: string;
  valueText?: string | null;
  valueNumber?: number | null;
  valueBoolean?: boolean | null;
  valueRating?: number | null;
  notes?: string | null;
  createdAt: string;
}

interface AllParametersHistoryItem {
  id: string;
  valueText?: string | null;
  valueNumber?: number | null;
  valueBoolean?: boolean | null;
  valueRating?: number | null;
  notes?: string | null;
  createdAt: string;
  parameter: {
    id: string;
    name: string;
    category?: string | null;
  };
}

export default function BetParametersPage() {
  const params = useParams();
  const betId = params.id as string;
  const [bet, setBet] = useState<Bet | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [savingParams, setSavingParams] = useState<Set<string>>(new Set());
  const [parameterValues, setParameterValues] = useState<Record<string, string | number | boolean | null>>({});
  const [historyDialog, setHistoryDialog] = useState<{ open: boolean; parameterId: string | null; parameterName: string }>({
    open: false,
    parameterId: null,
    parameterName: "",
  });
  const [parameterHistory, setParameterHistory] = useState<ParameterHistoryItem[]>([]);
  const [loadingHistory, setLoadingHistory] = useState(false);
  const [allHistoryDialog, setAllHistoryDialog] = useState<boolean>(false);
  const [allParametersHistory, setAllParametersHistory] = useState<AllParametersHistoryItem[]>([]);
  const [loadingAllHistory, setLoadingAllHistory] = useState(false);
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

  const handleSaveParameter = async (def: ParameterDefinition) => {
    const value = parameterValues[def.name];
    
    // Skip empty values
    if (value === undefined || value === "" || value === null) {
      toast({
        variant: "destructive",
        title: "Erro",
        description: "O valor não pode estar vazio",
      });
      return;
    }

    setSavingParams((prev) => new Set(prev).add(def.name));

    try {
      // Find existing parameter
      const existingParam = bet?.parameters.find((p) => p.name === def.name);
      
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

      let response;
      if (existingParam?.id) {
        // Update existing parameter - API expects { value, notes }
        let valueToSend: string | number | boolean;
        switch (def.type) {
          case "boolean":
            valueToSend = paramData.valueBoolean!;
            break;
          case "rating":
            valueToSend = paramData.valueRating!;
            break;
          case "number":
          case "currency":
          case "percentage":
            valueToSend = paramData.valueNumber!;
            break;
          default:
            valueToSend = paramData.valueText || "";
        }

        response = await fetch(`/api/parameters/${existingParam.id}`, {
          method: "PATCH",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            value: valueToSend,
            notes: null, // Can be extended to allow notes
          }),
        });
      } else {
        // Create new parameter
        response = await fetch("/api/parameters", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(paramData),
        });
      }

      if (response.ok) {
        toast({
          title: "Parâmetro salvo!",
          description: `${def.name} foi salvo com sucesso`,
        });
        // Refresh the data
        await fetchBet();
      } else {
        const errorData = await response.json();
        throw new Error(errorData.error || "Falha ao salvar parâmetro");
      }
    } catch (error) {
      console.error("Error saving parameter:", error);
      toast({
        variant: "destructive",
        title: "Erro",
        description: error instanceof Error ? error.message : "Falha ao salvar parâmetro",
      });
    } finally {
      setSavingParams((prev) => {
        const newSet = new Set(prev);
        newSet.delete(def.name);
        return newSet;
      });
    }
  };

  const handleViewHistory = async (def: ParameterDefinition) => {
    const existingParam = bet?.parameters.find((p) => p.name === def.name);
    
    if (!existingParam?.id) {
      toast({
        variant: "default",
        title: "Sem histórico",
        description: "Este parâmetro ainda não foi salvo",
      });
      return;
    }

    setHistoryDialog({
      open: true,
      parameterId: existingParam.id,
      parameterName: def.name,
    });
    setLoadingHistory(true);

    try {
      const response = await fetch(`/api/parameters/${existingParam.id}/history`);
      const data = await response.json();

      if (data.success) {
        setParameterHistory(data.history || []);
      } else {
        throw new Error(data.error || "Falha ao carregar histórico");
      }
    } catch (error) {
      console.error("Error fetching history:", error);
      toast({
        variant: "destructive",
        title: "Erro",
        description: "Falha ao carregar histórico",
      });
      setParameterHistory([]);
    } finally {
      setLoadingHistory(false);
    }
  };

  const handleViewAllHistory = async () => {
    setAllHistoryDialog(true);
    setLoadingAllHistory(true);

    try {
      const response = await fetch(`/api/bets/${betId}/parameters/history`);
      const data = await response.json();

      if (data.success) {
        setAllParametersHistory(data.history || []);
      } else {
        throw new Error(data.error || "Falha ao carregar histórico");
      }
    } catch (error) {
      console.error("Error fetching all history:", error);
      toast({
        variant: "destructive",
        title: "Erro",
        description: "Falha ao carregar histórico de alterações",
      });
      setAllParametersHistory([]);
    } finally {
      setLoadingAllHistory(false);
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
                  : "bg-slate-100 text-slate-600 hover:bg-slate-200"
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
                  : "bg-slate-100 text-slate-600 hover:bg-slate-200"
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
              className="px-4 py-2 rounded-md text-sm font-medium bg-slate-100 text-slate-600 hover:bg-slate-200"
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
                      ? "text-yellow-500 fill-yellow-500"
                      : "text-slate-300"
                  }`}
                />
              </button>
            ))}
            <span className="text-slate-600 ml-2">{(value !== null && value !== undefined ? Number(value) : 0)}/5</span>
          </div>
        );

      case "select":
        return (
          <select
            value={value !== null && value !== undefined ? String(value) : ""}
            onChange={(e) =>
              setParameterValues({ ...parameterValues, [def.name]: e.target.value })
            }
            className="w-full px-4 py-2 bg-white border-slate-300 text-slate-900 rounded-md border focus:outline-none focus:ring-2 focus:ring-blue-500"
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
            <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-500">
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
              className="pl-10 bg-white border-slate-300 text-slate-900"
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
              className="pr-8 bg-white border-slate-300 text-slate-900"
            />
            <span className="absolute right-3 top-1/2 transform -translate-y-1/2 text-slate-500">
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
              className="bg-white border-slate-300 text-slate-900 min-h-[80px]"
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
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 p-8 flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-12 h-12 text-blue-600 animate-spin mx-auto mb-4" />
          <div className="text-slate-600">Carregando...</div>
        </div>
      </div>
    );
  }

  if (!bet) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 p-8 flex items-center justify-center">
        <div className="text-center">
          <Building2 className="w-16 h-16 text-slate-400 mx-auto mb-4" />
          <h3 className="text-xl font-semibold text-slate-700 mb-2">
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
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 p-8">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <Link href="/admin/bets">
              <Button variant="ghost" className="text-slate-600 hover:text-slate-900 hover:bg-slate-100">
                <ArrowLeft className="w-4 h-4" />
              </Button>
            </Link>
            <div className="flex items-center space-x-4">
              <div className="w-14 h-14 rounded-2xl bg-blue-100 flex items-center justify-center shadow-sm">
                <Sliders className="w-7 h-7 text-blue-600" />
              </div>
              <div>
                <h1 className="text-3xl font-bold text-slate-900 flex items-center">
                  Parâmetros: {bet.name}
                </h1>
                <p className="text-slate-600 mt-1">
                  {bet.company && `${bet.company} • `}
                  {bet.domain}
                </p>
              </div>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <Button
              onClick={handleViewAllHistory}
              className="bg-blue-600 hover:bg-blue-700 text-white"
            >
              <History className="w-4 h-4 mr-2" />
              Histórico de Alterações
            </Button>
            <Button
              onClick={handleSaveAll}
              disabled={saving}
              className="bg-blue-600 hover:bg-blue-700 text-white"
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
        </div>

        {/* Info Card */}
        <Card className="bg-white border border-slate-200 shadow-sm">
          <CardContent className="py-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-lg font-semibold text-slate-900">
                  📊 {PARAMETER_DEFINITIONS.length} Parâmetros Disponíveis
                </h3>
                <p className="text-slate-600 text-sm mt-1">
                  Preencha os parâmetros que desejar. Campos vazios não serão salvos.
                </p>
              </div>
              <div className="text-right">
                <div className="text-2xl font-bold text-blue-600">
                  {bet.parameters?.length || 0}
                </div>
                <div className="text-sm text-slate-500">Já preenchidos</div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Parameters by Category - Table Format */}
        <div className="space-y-6">
          {PARAMETER_CATEGORIES.map((category) => {
            const params = getParametersByCategory(category);
            if (params.length === 0) return null;

            return (
              <Card
                key={category}
                className="bg-white border border-slate-200 shadow-sm overflow-hidden"
              >
                <CardHeader className="bg-slate-50 border-b border-slate-200">
                  <CardTitle className="text-slate-900 text-xl flex items-center">
                    <div className="w-1 h-8 bg-blue-600 rounded-full mr-3" />
                    {category}
                    <span className="ml-3 text-sm text-slate-500 font-normal">
                      ({params.length} parâmetros)
                    </span>
                  </CardTitle>
                </CardHeader>
                <CardContent className="p-0">
                  <div className="overflow-x-auto">
                    <Table>
                      <TableHeader>
                        <TableRow className="bg-slate-50 border-slate-200">
                          <TableHead className="w-[300px] font-semibold text-slate-900">
                            Parâmetro
                          </TableHead>
                          <TableHead className="font-semibold text-slate-900">
                            Valor
                          </TableHead>
                          <TableHead className="w-[150px] font-semibold text-slate-900 text-center">
                            Ações
                          </TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {params.map((def) => {
                          const existingParam = bet?.parameters.find((p) => p.name === def.name);
                          const isSaving = savingParams.has(def.name);
                          const hasValue = parameterValues[def.name] !== undefined && 
                                         parameterValues[def.name] !== null && 
                                         parameterValues[def.name] !== "";

                          return (
                            <TableRow key={def.name} className="hover:bg-slate-50 border-slate-200">
                              <TableCell className="font-medium text-slate-900">
                                <div>
                                  <div className="flex items-center gap-2">
                                    <div>{def.name}</div>
                                    {existingParam && (
                                      <button
                                        onClick={() => handleViewHistory(def)}
                                        className="text-blue-600 hover:text-blue-700 transition-colors"
                                        title="Ver histórico"
                                      >
                                        <History className="w-4 h-4" />
                                      </button>
                                    )}
                                  </div>
                                  {def.description && (
                                    <div className="text-xs text-slate-500 mt-1">
                                      {def.description}
                                    </div>
                                  )}
                                </div>
                              </TableCell>
                              <TableCell>
                                {renderInput(def)}
                              </TableCell>
                              <TableCell>
                                <div className="flex items-center justify-center gap-2">
                                  <Button
                                    size="sm"
                                    onClick={() => handleSaveParameter(def)}
                                    disabled={!hasValue || isSaving}
                                    className="bg-green-600 hover:bg-green-700 text-white"
                                  >
                                    {isSaving ? (
                                      <>
                                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                                        Salvando...
                                      </>
                                    ) : (
                                      "Salvar"
                                    )}
                                  </Button>
                                </div>
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

        {/* History Dialog */}
        <Dialog open={historyDialog.open} onOpenChange={(open) => 
          setHistoryDialog({ ...historyDialog, open })
        }>
          <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto bg-white border-slate-200">
            <DialogHeader>
              <DialogTitle className="text-slate-900 text-xl">
                Histórico: {historyDialog.parameterName}
              </DialogTitle>
              <DialogDescription className="text-slate-600">
                Histórico de alterações deste parâmetro
              </DialogDescription>
            </DialogHeader>
            {loadingHistory ? (
              <div className="flex items-center justify-center py-8">
                <Loader2 className="w-6 h-6 animate-spin text-blue-600" />
              </div>
            ) : parameterHistory.length === 0 ? (
              <div className="text-center py-8 text-slate-500">
                Nenhum histórico disponível
              </div>
            ) : (
              <div className="space-y-3">
                {parameterHistory.map((item: ParameterHistoryItem) => {
                  let displayValue = "-";
                  if (item.valueText !== null && item.valueText !== undefined) {
                    displayValue = item.valueText;
                  } else if (item.valueNumber !== null && item.valueNumber !== undefined) {
                    displayValue = item.valueNumber.toString();
                  } else if (item.valueBoolean !== null && item.valueBoolean !== undefined) {
                    displayValue = item.valueBoolean ? "Sim" : "Não";
                  } else if (item.valueRating !== null && item.valueRating !== undefined) {
                    displayValue = `${item.valueRating}/5`;
                  }

                  return (
                    <Card key={item.id} className="bg-slate-50 border-slate-200">
                      <CardContent className="p-4">
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <div className="text-slate-900 font-semibold mb-1">
                              {displayValue}
                            </div>
                            {item.notes && (
                              <div className="text-sm text-slate-600 mb-2">
                                {item.notes}
                              </div>
                            )}
                            <div className="text-xs text-slate-500">
                              {new Date(item.createdAt).toLocaleString("pt-BR")}
                            </div>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  );
                })}
              </div>
            )}
          </DialogContent>
        </Dialog>

        {/* All Parameters History Dialog */}
        <Dialog open={allHistoryDialog} onOpenChange={(open) => 
          setAllHistoryDialog(open)
        }>
          <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto bg-white border-slate-200">
            <DialogHeader>
              <DialogTitle className="text-slate-900 text-xl">
                Histórico de Alterações: {bet.name}
              </DialogTitle>
              <DialogDescription className="text-slate-600">
                Histórico completo de todas as alterações dos parâmetros
              </DialogDescription>
            </DialogHeader>
            {loadingAllHistory ? (
              <div className="flex items-center justify-center py-8">
                <Loader2 className="w-6 h-6 animate-spin text-blue-600" />
              </div>
            ) : allParametersHistory.length === 0 ? (
              <div className="text-center py-8 text-slate-500">
                Nenhum histórico disponível
              </div>
            ) : (
              <div className="space-y-3">
                {allParametersHistory.map((item: AllParametersHistoryItem) => {
                  let displayValue = "-";
                  if (item.valueText !== null && item.valueText !== undefined) {
                    displayValue = item.valueText;
                  } else if (item.valueNumber !== null && item.valueNumber !== undefined) {
                    displayValue = Number(item.valueNumber).toLocaleString("pt-BR", {
                      minimumFractionDigits: 2,
                      maximumFractionDigits: 2,
                    });
                  } else if (item.valueBoolean !== null && item.valueBoolean !== undefined) {
                    displayValue = item.valueBoolean ? "Sim" : "Não";
                  } else if (item.valueRating !== null && item.valueRating !== undefined) {
                    displayValue = `${item.valueRating}/5`;
                  }

                  return (
                    <Card key={item.id} className="bg-slate-50 border-slate-200">
                      <CardContent className="p-4">
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-2">
                              <div className="text-slate-900 font-semibold">
                                {item.parameter.name}
                              </div>
                              {item.parameter.category && (
                                <span className="text-xs text-slate-600 bg-slate-200 px-2 py-1 rounded">
                                  {item.parameter.category}
                                </span>
                              )}
                            </div>
                            <div className={`inline-block px-3 py-1 rounded-md text-sm font-medium mb-2 ${
                              item.valueBoolean !== null && item.valueBoolean !== undefined
                                ? item.valueBoolean
                                  ? "bg-green-100 text-green-700 border border-green-300"
                                  : "bg-red-100 text-red-700 border border-red-300"
                                : "bg-blue-100 text-blue-700 border border-blue-300"
                            }`}>
                              {displayValue}
                            </div>
                            {item.notes && (
                              <div className="text-sm text-slate-600 mb-2">
                                {item.notes}
                              </div>
                            )}
                            <div className="text-xs text-slate-500">
                              {new Date(item.createdAt).toLocaleString("pt-BR")}
                            </div>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  );
                })}
              </div>
            )}
          </DialogContent>
        </Dialog>

        {/* Bottom Save Button */}
        <div className="sticky bottom-8 flex justify-center gap-4">
          <Button
            onClick={handleViewAllHistory}
            size="lg"
            className="bg-blue-600 hover:bg-blue-700 text-white shadow-lg"
          >
            <History className="w-5 h-5 mr-2" />
            Histórico de Alterações
          </Button>
          <Button
            onClick={handleSaveAll}
            disabled={saving}
            size="lg"
            className="bg-blue-600 hover:bg-blue-700 text-white shadow-lg"
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


"use client";

import React, { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import {
  ArrowLeft,
  Building2,
  Star,
  Loader2,
  Eye,
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
  const userBetId = params.id as string; // This is the userBet ID, not bet ID
  const [bet, setBet] = useState<Bet | null>(null);
  const [loading, setLoading] = useState(true);
  const [parameterValues, setParameterValues] = useState<Record<string, string | number | boolean | null>>({});
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
        // Use the bet from userBet
        const betData = {
          id: data.data.bet.id,
          name: data.data.bet.name,
          url: data.data.bet.url,
          parameters: data.data.parameters, // Use user parameters, not admin parameters
        };
        setBet(betData);
        
        // Pre-fill existing parameter values from user parameters
        const values: Record<string, string | number | boolean | null> = {};
        data.data.parameters.forEach((param: Parameter) => {
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
        description: "Falha ao carregar sua casa de apostas",
      });
    } finally {
      setLoading(false);
    }
  };

  const renderValue = (def: ParameterDefinition) => {
    const value = parameterValues[def.name];

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
          <div className="px-4 py-2 bg-gray-800/50 border border-gray-700 rounded-md text-white">
            {value === true ? "Sim" : value === false ? "Não" : "Não preenchido"}
          </div>
        );

      case "select":
        return (
          <div className="px-4 py-2 bg-gray-800/50 border border-gray-700 rounded-md text-white">
            {String(value)}
          </div>
        );

      case "rating":
        return (
          <div className="flex items-center space-x-2">
            <div className="flex space-x-1">
              {[1, 2, 3, 4, 5].map((star) => (
                <Star
                  key={star}
                  className={`w-5 h-5 ${
                    (value as number) >= star
                      ? "text-yellow-400 fill-yellow-400"
                      : "text-gray-600"
                  }`}
                />
              ))}
            </div>
            <span className="text-gray-300 text-sm">
              {value}/5
            </span>
          </div>
        );

      case "number":
      case "currency":
      case "percentage":
        return (
          <div className="flex items-center space-x-2">
            <div className="px-4 py-2 bg-gray-800/50 border border-gray-700 rounded-md text-white flex-1">
              {typeof value === "number" ? value.toLocaleString("pt-BR") : value}
            </div>
            {def.unit && (
              <span className="text-gray-400 text-sm whitespace-nowrap">{def.unit}</span>
            )}
          </div>
        );

      case "text":
      default:
        if (def.name.toLowerCase().includes("descrição") || def.name.toLowerCase().includes("melhorias")) {
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

  if (!bet) {
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
              <Button variant="outline" size="icon" className="border-gray-700 text-white hover:bg-gray-800">
                <ArrowLeft className="w-4 h-4" />
              </Button>
            </Link>
            <div>
              <h1 className="text-2xl sm:text-3xl font-bold text-white">{bet.name}</h1>
              <p className="text-gray-300 mt-1 text-sm sm:text-base">Visualize os parâmetros da sua casa de apostas</p>
            </div>
          </div>
        </div>

        {/* Parameters by Category */}
        {PARAMETER_CATEGORIES.map((category) => {
          const categoryParams = getParametersByCategory(category);
          if (categoryParams.length === 0) return null;

          return (
            <Card
              key={category}
              className="bg-gradient-to-br from-gray-900/90 to-gray-800/90 border-gray-700/50 backdrop-blur-xl"
            >
              <CardHeader>
                <CardTitle className="text-white flex items-center text-lg sm:text-xl">
                  <Eye className="w-4 h-4 sm:w-5 sm:h-5 mr-2 text-purple-400" />
                  {category}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6">
                  {categoryParams.map((def) => (
                    <div key={def.name} className="space-y-2">
                      <Label className="text-white text-sm sm:text-base">
                        {def.name}
                        {def.unit && <span className="text-gray-400 ml-1 text-xs sm:text-sm">({def.unit})</span>}
                      </Label>
                      {def.description && (
                        <p className="text-xs text-gray-400">{def.description}</p>
                      )}
                      {renderValue(def)}
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


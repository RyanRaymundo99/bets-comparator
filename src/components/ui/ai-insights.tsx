"use client";

import React, { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Loader2, Sparkles, TrendingUp, TrendingDown, Lightbulb } from "lucide-react";

interface Insights {
  summary: string;
  strengths: string[];
  weaknesses: string[];
  recommendations: string[];
  marketPosition?: string;
}

interface AIInsightsProps {
  betId: string;
  betName: string;
}

export default function AIInsights({ betId, betName }: AIInsightsProps) {
  const [insights, setInsights] = useState<Insights | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchInsights = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await fetch(`/api/insights/${betId}`);
      const data = await response.json();

      if (response.ok && data.success) {
        setInsights(data.insights);
      } else {
        throw new Error(data.error || "Failed to load insights");
      }
    } catch (err) {
      console.error("Error fetching insights:", err);
      setError(err instanceof Error ? err.message : "Failed to load insights");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchInsights();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [betId]);

  return (
    <Card className="bg-white border border-slate-200 shadow-sm rounded-xl">
      <CardHeader className="pb-3 border-b border-slate-200">
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg font-bold text-slate-900 flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-purple-600" />
            Insights IA
          </CardTitle>
          <Button
            onClick={fetchInsights}
            size="sm"
            variant="outline"
            disabled={loading}
            className="text-xs"
          >
            {loading ? (
              <Loader2 className="w-3 h-3 animate-spin" />
            ) : (
              "Atualizar"
            )}
          </Button>
        </div>
      </CardHeader>
      <CardContent className="p-4">
        {loading && !insights ? (
          <div className="flex flex-col items-center justify-center py-8">
            <Loader2 className="w-8 h-8 animate-spin text-blue-600 mb-3" />
            <p className="text-sm text-slate-600">Gerando insights...</p>
          </div>
        ) : error ? (
          <div className="text-center py-4">
            <p className="text-sm text-red-600 mb-2">{error}</p>
            <Button onClick={fetchInsights} size="sm" variant="outline">
              Tentar novamente
            </Button>
          </div>
        ) : insights ? (
          <div className="space-y-4">
            {/* Summary */}
            {insights.summary && (
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
                <div className="flex items-start gap-2">
                  <Lightbulb className="w-4 h-4 text-blue-600 mt-0.5 flex-shrink-0" />
                  <p className="text-sm text-blue-900">{insights.summary}</p>
                </div>
              </div>
            )}

            {/* Strengths */}
            {insights.strengths && insights.strengths.length > 0 && (
              <div>
                <div className="flex items-center gap-2 mb-2">
                  <TrendingUp className="w-4 h-4 text-green-600" />
                  <h4 className="text-sm font-semibold text-slate-900">Pontos Fortes</h4>
                </div>
                <ul className="space-y-1.5">
                  {insights.strengths.map((strength, index) => (
                    <li key={index} className="text-xs text-slate-700 flex items-start gap-2">
                      <span className="text-green-600 mt-1">✓</span>
                      <span>{strength}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {/* Weaknesses */}
            {insights.weaknesses && insights.weaknesses.length > 0 && (
              <div>
                <div className="flex items-center gap-2 mb-2">
                  <TrendingDown className="w-4 h-4 text-orange-600" />
                  <h4 className="text-sm font-semibold text-slate-900">Pontos de Melhoria</h4>
                </div>
                <ul className="space-y-1.5">
                  {insights.weaknesses.map((weakness, index) => (
                    <li key={index} className="text-xs text-slate-700 flex items-start gap-2">
                      <span className="text-orange-600 mt-1">•</span>
                      <span>{weakness}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {/* Recommendations */}
            {insights.recommendations && insights.recommendations.length > 0 && (
              <div>
                <div className="flex items-center gap-2 mb-2">
                  <Sparkles className="w-4 h-4 text-purple-600" />
                  <h4 className="text-sm font-semibold text-slate-900">Recomendações</h4>
                </div>
                <ul className="space-y-1.5">
                  {insights.recommendations.map((rec, index) => (
                    <li key={index} className="text-xs text-slate-700 flex items-start gap-2">
                      <span className="text-purple-600 mt-1">→</span>
                      <span>{rec}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {/* Market Position */}
            {insights.marketPosition && (
              <div className="bg-purple-50 border border-purple-200 rounded-lg p-3 mt-3">
                <p className="text-xs text-purple-900">
                  <span className="font-semibold">Posição no Mercado:</span> {insights.marketPosition}
                </p>
              </div>
            )}
          </div>
        ) : (
          <div className="text-center py-4">
            <p className="text-sm text-slate-500">Nenhum insight disponível</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}


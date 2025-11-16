"use client";

import React, { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Building2, Key, Loader2, CheckCircle } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useRouter } from "next/navigation";
import { useFormSubmit } from "@/hooks/use-form-submit";

export default function SetupPage() {
  const [betId, setBetId] = useState("");
  const [betInfo, setBetInfo] = useState<{
    name: string;
    url: string;
    company?: string;
  } | null>(null);
  const [checking, setChecking] = useState(false);
  const { toast } = useToast();
  const router = useRouter();

  const { loading, submit } = useFormSubmit({
    successMessage: "Solicitação enviada! Aguardando aprovação do administrador.",
    errorMessage: "Falha ao enviar solicitação",
    redirect: "/dashboard",
  });

  const handleCheckBetId = async () => {
    if (!betId || betId.length < 3) {
      toast({
        variant: "destructive",
        title: "Erro",
        description: "Por favor, insira um Bet ID válido",
      });
      return;
    }

    try {
      setChecking(true);
      const response = await fetch(`/api/bets?search=${encodeURIComponent(betId)}`);
      const data = await response.json();

      if (data.success && data.data?.bets) {
        const bet = data.data.bets.find((b: { betId: string }) => 
          b.betId?.toUpperCase() === betId.toUpperCase()
        );

        if (bet) {
          setBetInfo({
            name: bet.name,
            url: bet.url || "",
            company: bet.company || "",
          });
        } else {
          setBetInfo(null);
          toast({
            variant: "destructive",
            title: "Bet ID não encontrado",
            description: "Verifique o Bet ID e tente novamente",
          });
        }
      } else {
        setBetInfo(null);
        toast({
          variant: "destructive",
          title: "Bet ID não encontrado",
          description: "Verifique o Bet ID e tente novamente",
        });
      }
    } catch (error) {
      console.error("Error checking bet ID:", error);
      toast({
        variant: "destructive",
        title: "Erro",
        description: "Falha ao verificar Bet ID",
      });
    } finally {
      setChecking(false);
    }
  };

  const handleLinkBet = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    if (!betId || !betInfo) {
      toast({
        variant: "destructive",
        title: "Erro",
        description: "Por favor, verifique o Bet ID primeiro",
      });
      return;
    }

    await submit(e, async () => {
      return fetch("/api/user/link-bet", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ betId: betId.toUpperCase() }),
      });
    });
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 text-white p-8 flex items-center justify-center">
      <div className="max-w-2xl w-full space-y-6">
        <Card className="bg-gradient-to-br from-gray-900/90 to-gray-800/90 border-gray-700/50 backdrop-blur-xl">
          <CardHeader className="text-center">
            <div className="flex justify-center mb-4">
              <div className="w-16 h-16 bg-gradient-to-br from-blue-600 to-purple-600 rounded-full flex items-center justify-center">
                <Building2 className="w-8 h-8 text-white" />
              </div>
            </div>
            <CardTitle className="text-2xl text-white">Configuração Inicial</CardTitle>
            <p className="text-gray-300 mt-2">
              Vincule sua casa de apostas usando o Bet ID fornecido
            </p>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleLinkBet} className="space-y-6">
              <div className="space-y-2">
                <Label htmlFor="betId" className="text-white flex items-center">
                  <Key className="w-4 h-4 mr-2" />
                  Bet ID *
                </Label>
                <div className="flex space-x-2">
                  <Input
                    id="betId"
                    type="text"
                    value={betId}
                    onChange={(e) => setBetId(e.target.value.toUpperCase())}
                    placeholder="Ex: UF87F"
                    className="bg-gray-800 border-gray-700 text-white placeholder:text-gray-400 uppercase"
                    required
                    maxLength={10}
                    disabled={loading}
                  />
                  <Button
                    type="button"
                    onClick={handleCheckBetId}
                    disabled={checking || loading || !betId}
                    variant="outline"
                    className="border-gray-700 text-white hover:bg-gray-800"
                  >
                    {checking ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                      "Verificar"
                    )}
                  </Button>
                </div>
                <p className="text-sm text-gray-400">
                  Digite o Bet ID da sua casa de apostas (ex: UF87F)
                </p>
              </div>

              {betInfo && (
                <div className="bg-green-900/30 border border-green-700/50 rounded-lg p-4 space-y-2">
                  <div className="flex items-center space-x-2 text-green-400">
                    <CheckCircle className="w-5 h-5" />
                    <span className="font-medium">Bet ID encontrado!</span>
                  </div>
                  <div className="text-sm text-gray-300 space-y-1">
                    <div>
                      <span className="text-gray-500">Nome:</span> {betInfo.name}
                    </div>
                    {betInfo.company && (
                      <div>
                        <span className="text-gray-500">Empresa:</span> {betInfo.company}
                      </div>
                    )}
                    {betInfo.url && (
                      <div>
                        <span className="text-gray-500">URL:</span>{" "}
                        <a
                          href={betInfo.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-blue-400 hover:text-blue-300"
                        >
                          {betInfo.url}
                        </a>
                      </div>
                    )}
                  </div>
                </div>
              )}

              <div className="bg-blue-900/30 border border-blue-700/50 rounded-lg p-4">
                <h4 className="text-white font-medium mb-2">ℹ️ Como funciona?</h4>
                <ul className="text-sm text-gray-300 space-y-1 list-disc list-inside">
                  <li>Você enviará uma solicitação para vincular-se a esta casa de apostas</li>
                  <li>O administrador revisará e aprovará sua solicitação</li>
                  <li>Após a aprovação, você poderá preencher os parâmetros</li>
                  <li>Compare sua casa com outras casas de apostas</li>
                </ul>
              </div>

              <Button
                type="submit"
                disabled={loading || !betInfo}
                className="w-full bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white"
              >
                {loading ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Vinculando...
                  </>
                ) : (
                  <>
                    <CheckCircle className="w-4 h-4 mr-2" />
                    Vincular Casa de Apostas
                  </>
                )}
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}


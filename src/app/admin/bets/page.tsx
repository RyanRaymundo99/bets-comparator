"use client";

import React, { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Building2,
  Plus,
  Search,
  Edit,
  Trash2,
  BarChart3,
  ArrowLeft,
  ChevronDown,
  ChevronUp,
  ExternalLink,
} from "lucide-react";
import Image from "next/image";
import { useToast } from "@/hooks/use-toast";
import Link from "next/link";
import { useRouter } from "next/navigation";

interface Bet {
  id: string;
  name: string;
  cnpj?: string | null;
  url?: string | null;
  region?: string | null;
  license?: string | null;
  betId?: string | null;
  logo?: string | null;
  createdAt: string;
  updatedAt: string;
  parameters: Parameter[];
}

interface Parameter {
  id: string;
  name: string;
  value: number;
  category?: string | null;
  unit?: string | null;
}

export default function BetsManagementPage() {
  const [bets, setBets] = useState<Bet[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedRegion, setSelectedRegion] = useState<string>("all");
  const [expandedCards, setExpandedCards] = useState<Set<string>>(new Set());
  const { toast } = useToast();
  const router = useRouter();

  const toggleCard = (betId: string) => {
    setExpandedCards((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(betId)) {
        newSet.delete(betId);
      } else {
        newSet.add(betId);
      }
      return newSet;
    });
  };

  const fetchBets = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      if (selectedRegion !== "all") {
        params.append("region", selectedRegion);
      }
      if (searchTerm) {
        params.append("search", searchTerm);
      }

      const response = await fetch(`/api/bets?${params.toString()}`);
      const data = await response.json();

      console.log("Bets API response:", data);

      if (data.success) {
        // Handle both response structures: data.data.bets or data.bets
        const bets = data.data?.bets || data.bets;
        // Ensure bets is always an array
        setBets(Array.isArray(bets) ? bets : []);
      } else {
        throw new Error(data.error);
      }
    } catch (error) {
      console.error("Error fetching bets:", error);
      toast({
        variant: "destructive",
        title: "Erro",
        description: "Falha ao carregar casas de apostas",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: string, name: string) => {
    if (!confirm(`Tem certeza que deseja excluir a casa de apostas "${name}"?`)) {
      return;
    }

    try {
      const response = await fetch(`/api/bets/${id}`, {
        method: "DELETE",
      });

      const data = await response.json();

      if (data.success) {
        toast({
          title: "Sucesso",
          description: "Casa de apostas excluída com sucesso",
        });
        fetchBets();
      } else {
        throw new Error(data.error);
      }
    } catch (error) {
      console.error("Error deleting bet:", error);
      toast({
        variant: "destructive",
        title: "Erro",
        description: "Falha ao excluir casa de apostas",
      });
    }
  };

  useEffect(() => {
    fetchBets();
  }, [selectedRegion]);

  // Ensure bets is always an array to prevent filter errors
  const safeBets = Array.isArray(bets) ? bets : [];
  
  const filteredBets = safeBets.filter((bet) =>
    searchTerm
      ? bet.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        bet.cnpj?.toLowerCase().includes(searchTerm.toLowerCase())
      : true
  );

  const regions = Array.from(new Set(safeBets.map((b) => b.region).filter(Boolean)));

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 p-8">
      <div className="max-w-7xl mx-auto space-y-8">
        {/* Header */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-6">
          <div className="flex-1">
            <div className="flex items-center space-x-4">
              <Link href="/admin">
                <Button
                  variant="ghost"
                  size="icon"
                  className="text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded-xl"
                >
                  <ArrowLeft className="w-5 h-5" />
                </Button>
              </Link>
              <div className="flex items-center space-x-4">
                <div className="w-14 h-14 rounded-2xl bg-blue-100 flex items-center justify-center shadow-sm">
                  <Building2 className="w-7 h-7 text-blue-600" />
                </div>
                <div>
                  <h1 className="text-3xl md:text-4xl font-bold text-slate-900 tracking-tight">
                    Gestão de Casas de Apostas
                  </h1>
                  <p className="text-slate-600 mt-1.5 text-sm md:text-base">
                    Cadastre e gerencie casas de apostas regulamentadas
                  </p>
                </div>
              </div>
            </div>
          </div>
          <Link href="/admin/bets/new">
            <Button className="bg-blue-600 hover:bg-blue-700 text-white shadow-lg hover:shadow-xl transition-all duration-200 rounded-xl px-6 py-6 h-auto font-semibold">
              <Plus className="w-5 h-5 mr-2" />
              Nova Casa de Apostas
            </Button>
          </Link>
        </div>

        {/* Filters */}
        <Card className="bg-white border border-slate-200 shadow-sm rounded-2xl">
          <CardHeader className="pb-4">
            <CardTitle className="text-slate-900 text-xl font-bold flex items-center">
              <div className="w-10 h-10 rounded-xl bg-blue-100 flex items-center justify-center mr-3">
                <Search className="w-5 h-5 text-blue-600" />
              </div>
              Filtros
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="relative group">
                <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-slate-400 h-5 w-5 group-focus-within:text-blue-600 transition-colors pointer-events-none" />
                <Input
                  placeholder="Buscar por nome ou CNPJ..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-12 pr-4 py-6 bg-white border-slate-200 text-slate-900 placeholder-slate-400 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 focus:bg-white rounded-xl transition-all duration-200"
                />
              </div>
              <select
                value={selectedRegion}
                onChange={(e) => setSelectedRegion(e.target.value)}
                className="px-4 py-6 bg-white border-slate-200 text-slate-900 rounded-xl border focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all duration-200 cursor-pointer"
              >
                <option value="all">Todas as Regiões</option>
                {regions.map((region) => (
                  <option key={region || ""} value={region || ""}>
                    {region || "N/A"}
                  </option>
                ))}
              </select>
            </div>
          </CardContent>
        </Card>

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Card 1 */}
          <Card className="bg-white border border-slate-200 shadow-sm hover:shadow-lg transition-all duration-200 rounded-2xl">
            <CardContent className="pt-8 pb-6 px-6">
              <div className="flex items-start justify-between mb-4">
                <div>
                  <div className="text-4xl md:text-5xl font-bold text-slate-900 mb-1">
                    {safeBets.length}
                  </div>
                  <div className="text-sm text-slate-600 font-medium uppercase tracking-wider">
                    Total de Casas de Apostas
                  </div>
                </div>
                <div className="w-16 h-16 rounded-2xl bg-blue-100 flex items-center justify-center shadow-sm">
                  <Building2 className="w-8 h-8 text-blue-600" />
                </div>
              </div>
            </CardContent>
          </Card>
          
          {/* Card 2 */}
          <Card className="bg-white border border-slate-200 shadow-sm hover:shadow-lg transition-all duration-200 rounded-2xl">
            <CardContent className="pt-8 pb-6 px-6">
              <div className="flex items-start justify-between mb-4">
                <div>
                  <div className="text-4xl md:text-5xl font-bold text-slate-900 mb-1">
                    {safeBets.reduce((acc, bet) => acc + (bet.parameters?.length || 0), 0)}
                  </div>
                  <div className="text-sm text-slate-600 font-medium uppercase tracking-wider">
                    Total de Parâmetros
                  </div>
                </div>
                <div className="w-16 h-16 rounded-2xl bg-purple-100 flex items-center justify-center shadow-sm">
                  <BarChart3 className="w-8 h-8 text-purple-600" />
                </div>
              </div>
            </CardContent>
          </Card>
          
          {/* Card 3 */}
          <Card className="bg-white border border-slate-200 shadow-sm hover:shadow-lg transition-all duration-200 rounded-2xl">
            <CardContent className="pt-8 pb-6 px-6">
              <div className="flex items-start justify-between mb-4">
                <div>
                  <div className="text-4xl md:text-5xl font-bold text-slate-900 mb-1">
                    {filteredBets.length}
                  </div>
                  <div className="text-sm text-slate-600 font-medium uppercase tracking-wider">
                    Resultados da Busca
                  </div>
                </div>
                <div className="w-16 h-16 rounded-2xl bg-green-100 flex items-center justify-center shadow-sm">
                  <Search className="w-8 h-8 text-green-600" />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Bets List */}
        {loading ? (
          <Card className="bg-white border border-slate-200 shadow-sm rounded-2xl">
            <CardContent className="p-16 text-center">
              <div className="inline-block animate-spin rounded-full h-16 w-16 border-4 border-slate-200 border-t-blue-600 mb-6"></div>
              <p className="text-slate-700 font-semibold text-lg">Carregando...</p>
            </CardContent>
          </Card>
        ) : filteredBets.length === 0 ? (
          <Card className="bg-white border border-slate-200 shadow-sm rounded-2xl">
            <CardContent className="p-16 text-center">
              <div className="w-20 h-20 rounded-2xl bg-blue-100 flex items-center justify-center mx-auto mb-6 shadow-sm">
                <Building2 className="w-12 h-12 text-blue-600" />
              </div>
              <h3 className="text-2xl font-bold text-slate-900 mb-3">
                Nenhuma casa de apostas encontrada
              </h3>
              <p className="text-slate-600 mb-8 text-lg">
                Comece cadastrando a primeira casa de apostas
              </p>
              <Link href="/admin/bets/new">
                <Button className="bg-blue-600 hover:bg-blue-700 text-white shadow-lg hover:shadow-xl transition-all duration-200 rounded-xl px-8 py-6 h-auto font-semibold">
                  <Plus className="w-5 h-5 mr-2" />
                  Cadastrar Casa de Apostas
                </Button>
              </Link>
            </CardContent>
          </Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredBets.map((bet, index) => {
              const isExpanded = expandedCards.has(bet.id);
              const hasDetails = bet.cnpj || bet.region || bet.license;
              
              return (
                <Card
                  key={bet.id}
                  className="bg-white border border-slate-200 shadow-sm hover:shadow-lg transition-all duration-200 rounded-2xl overflow-hidden group"
                >
                  <CardHeader className="pb-4 pt-6 px-6">
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <CardTitle className="text-slate-900 font-bold text-xl group-hover:text-blue-600 transition-colors duration-200">
                            {bet.name}
                          </CardTitle>
                          {bet.betId && (
                            <span className="text-sm font-mono font-semibold px-2 py-0.5 rounded bg-slate-100 text-slate-700 border border-slate-300">
                              {bet.betId}
                            </span>
                          )}
                        </div>
                        {bet.url && (
                          <a
                            href={bet.url}
                            target="_blank"
                            rel="noopener noreferrer"
                            onClick={(e) => e.stopPropagation()}
                            className="flex items-center gap-1.5 text-blue-600 hover:text-blue-700 transition-colors text-sm group/link"
                          >
                            <span className="truncate">{bet.url}</span>
                            <ExternalLink className="w-3.5 h-3.5 flex-shrink-0 group-hover/link:scale-110 transition-transform" />
                          </a>
                        )}
                      </div>
                      <div className="flex items-center gap-2 flex-shrink-0">
                        {bet.logo ? (
                          <div className="relative w-12 h-12 rounded-xl overflow-hidden border-2 border-slate-200 shadow-sm group-hover:scale-110 transition-all duration-200">
                            <Image
                              src={bet.logo}
                              alt={bet.name}
                              fill
                              className="object-cover"
                              sizes="48px"
                              unoptimized
                            />
                          </div>
                        ) : (
                          <div className="w-12 h-12 rounded-xl bg-blue-100 flex items-center justify-center group-hover:scale-110 transition-all duration-200 shadow-sm">
                            <Building2 className="w-6 h-6 text-blue-600" />
                          </div>
                        )}
                      </div>
                    </div>
                  </CardHeader>
                  
                  <CardContent className="space-y-4 px-6 pb-6">
                    {/* Informação compacta sempre visível */}
                    <div className="flex items-center justify-between p-3 rounded-xl bg-slate-50 border border-slate-200">
                      <span className="text-slate-600 font-semibold text-xs uppercase tracking-wider">Parâmetros</span>
                      <span className="text-slate-900 font-bold text-lg">{bet.parameters?.length || 0}</span>
                    </div>

                    {/* Botão para expandir/colapsar */}
                    {hasDetails && (
                      <Button
                        variant="ghost"
                        onClick={() => toggleCard(bet.id)}
                        className="w-full flex items-center justify-between p-3 rounded-xl bg-slate-50 hover:bg-slate-100 text-slate-700 hover:text-slate-900 transition-all duration-200 group/btn border border-slate-200"
                      >
                        <span className="text-sm font-medium">
                          {isExpanded ? "Ocultar detalhes" : "Ver detalhes"}
                        </span>
                        {isExpanded ? (
                          <ChevronUp className="w-4 h-4 group-hover/btn:scale-110 transition-transform" />
                        ) : (
                          <ChevronDown className="w-4 h-4 group-hover/btn:scale-110 transition-transform" />
                        )}
                      </Button>
                    )}

                    {/* Conteúdo expandível */}
                    {isExpanded && hasDetails && (
                      <div className="space-y-3 animate-in slide-in-from-top-2 duration-300">
                        {bet.cnpj && (
                          <div className="flex items-start gap-3 p-3 rounded-xl bg-slate-50 border border-slate-200">
                            <span className="text-slate-600 font-semibold text-xs uppercase tracking-wider min-w-[70px]">CNPJ</span>
                            <span className="text-slate-900 font-medium text-sm flex-1">{bet.cnpj}</span>
                          </div>
                        )}
                        {bet.region && (
                          <div className="flex items-start gap-3 p-3 rounded-xl bg-slate-50 border border-slate-200">
                            <span className="text-slate-600 font-semibold text-xs uppercase tracking-wider min-w-[70px]">Região</span>
                            <span className="text-slate-900 font-medium text-sm flex-1">{bet.region}</span>
                          </div>
                        )}
                        {bet.license && (
                          <div className="flex items-start gap-3 p-3 rounded-xl bg-slate-50 border border-slate-200">
                            <span className="text-slate-600 font-semibold text-xs uppercase tracking-wider min-w-[70px]">Licença</span>
                            <span className="text-slate-900 font-medium text-sm flex-1">{bet.license}</span>
                          </div>
                        )}
                      </div>
                    )}

                    {/* Botões de ação */}
                    <div className="flex gap-2 pt-2 border-t border-slate-200">
                      <Link href={`/admin/bets/${bet.id}`} className="flex-1">
                        <Button
                          variant="outline"
                          className="w-full border-slate-200 text-slate-700 hover:bg-slate-50 hover:text-slate-900 hover:border-slate-300 transition-all rounded-xl font-medium"
                        >
                          <Edit className="w-4 h-4 mr-2" />
                          Editar
                        </Button>
                      </Link>
                      <Link href={`/admin/bets/${bet.id}/parameters`}>
                        <Button
                          variant="outline"
                          size="icon"
                          className="border-slate-200 text-slate-700 hover:bg-slate-50 hover:text-slate-900 hover:border-slate-300 transition-all rounded-xl"
                          title="Ver Parâmetros"
                        >
                          <BarChart3 className="w-4 h-4" />
                        </Button>
                      </Link>
                      <Button
                        variant="outline"
                        size="icon"
                        className="border-red-200 text-red-600 hover:bg-red-50 hover:text-red-700 hover:border-red-300 transition-all rounded-xl"
                        onClick={() => handleDelete(bet.id, bet.name)}
                        title="Excluir"
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}


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
    <div className="min-h-screen bg-gradient-to-br from-[#0a1628] via-[#0f1f3a] to-[#1e3a5f] text-white relative overflow-hidden">
      {/* Background decorative elements */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-[#2d4a75]/20 rounded-full blur-3xl"></div>
        <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-[#5a7ba5]/20 rounded-full blur-3xl"></div>
        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-[#3a5a8a]/10 rounded-full blur-3xl"></div>
      </div>
      
      <div className="relative z-10 max-w-7xl mx-auto p-6 md:p-8 lg:p-10 space-y-8">
        {/* Header */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="flex-1">
            <div className="flex items-center space-x-4">
              <Link href="/admin">
                <Button
                  variant="ghost"
                  size="icon"
                  className="text-blue-300/80 hover:text-blue-100 hover:bg-[#1e3a5f]/40 rounded-xl transition-all duration-200 hover:scale-110"
                >
                  <ArrowLeft className="w-5 h-5" />
                </Button>
              </Link>
              <div className="flex items-center space-x-4">
                <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-[#2d4a75] to-[#3a5a8a] flex items-center justify-center shadow-lg shadow-[#2d4a75]/30">
                  <Building2 className="w-7 h-7 text-blue-100" />
                </div>
                <div>
                  <h1 className="text-3xl md:text-4xl font-bold text-white tracking-tight">
                    Gestão de Casas de Apostas
                  </h1>
                  <p className="text-blue-200/70 mt-1.5 text-sm md:text-base">
                    Cadastre e gerencie casas de apostas regulamentadas
                  </p>
                </div>
              </div>
            </div>
          </div>
          <Link href="/admin/bets/new">
            <Button className="bg-gradient-to-r from-[#2d4a75] via-[#3a5a8a] to-[#4a6a9a] hover:from-[#3a5a8a] hover:via-[#4a6a9a] hover:to-[#5a7ba5] text-white shadow-xl hover:shadow-2xl hover:shadow-[#3a5a8a]/40 transition-all duration-300 rounded-xl px-6 py-6 h-auto font-semibold group">
              <Plus className="w-5 h-5 mr-2 group-hover:rotate-90 transition-transform duration-300" />
              Nova Casa de Apostas
            </Button>
          </Link>
        </div>

        {/* Filters */}
        <Card className="bg-gradient-to-br from-[#1e3a5f]/40 via-[#2d4a75]/30 to-[#3a5a8a]/20 border-[#4a6a9a]/30 backdrop-blur-2xl shadow-2xl shadow-[#1e3a5f]/20 rounded-2xl">
          <CardHeader className="pb-4">
            <CardTitle className="text-white text-xl font-bold flex items-center">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-[#2d4a75] to-[#3a5a8a] flex items-center justify-center mr-3 shadow-lg">
                <Search className="w-5 h-5 text-blue-100" />
              </div>
              Filtros
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="relative group">
                <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-blue-300/60 h-5 w-5 group-focus-within:text-blue-300 transition-colors" />
                <Input
                  placeholder="Buscar por nome ou CNPJ..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-12 pr-4 py-6 bg-[#0f1f3a]/60 border-[#4a6a9a]/30 text-white placeholder-blue-200/40 focus:border-[#5a7ba5] focus:ring-2 focus:ring-[#5a7ba5]/40 focus:bg-[#0f1f3a]/80 rounded-xl transition-all duration-200"
                />
              </div>
              <select
                value={selectedRegion}
                onChange={(e) => setSelectedRegion(e.target.value)}
                className="px-4 py-6 bg-[#0f1f3a]/60 border-[#4a6a9a]/30 text-white rounded-xl border focus:outline-none focus:ring-2 focus:ring-[#5a7ba5]/40 focus:border-[#5a7ba5] focus:bg-[#0f1f3a]/80 transition-all duration-200 cursor-pointer"
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
          {/* Card 1 - Azul muito escuro (topo da paleta) */}
          <Card className="relative bg-gradient-to-br from-[#0a1628]/90 via-[#0f1f3a]/80 to-[#152547]/70 border-[#1e3a5f]/40 backdrop-blur-2xl shadow-2xl shadow-[#0a1628]/30 hover:shadow-[#1e3a5f]/40 rounded-2xl overflow-hidden group hover:scale-[1.03] transition-all duration-500">
            <div className="absolute inset-0 bg-gradient-to-br from-[#1e3a5f]/0 to-[#1e3a5f]/20 opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
            <CardContent className="relative pt-8 pb-6 px-6">
              <div className="flex items-start justify-between mb-4">
                <div>
                  <div className="text-4xl md:text-5xl font-bold text-white mb-1 group-hover:text-blue-100 transition-colors duration-300">
                    {safeBets.length}
                  </div>
                  <div className="text-sm text-blue-200/70 font-medium uppercase tracking-wider">
                    Total de Casas de Apostas
                  </div>
                </div>
                <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-[#1e3a5f] to-[#2d4a75] flex items-center justify-center shadow-lg shadow-[#1e3a5f]/30 group-hover:scale-110 group-hover:rotate-3 transition-all duration-300">
                  <Building2 className="w-8 h-8 text-blue-200" />
                </div>
              </div>
            </CardContent>
          </Card>
          
          {/* Card 2 - Azul médio-escuro (segunda faixa) */}
          <Card className="relative bg-gradient-to-br from-[#1e3a5f]/90 via-[#2d4a75]/80 to-[#3a5a8a]/70 border-[#4a6a9a]/40 backdrop-blur-2xl shadow-2xl shadow-[#1e3a5f]/30 hover:shadow-[#3a5a8a]/40 rounded-2xl overflow-hidden group hover:scale-[1.03] transition-all duration-500">
            <div className="absolute inset-0 bg-gradient-to-br from-[#3a5a8a]/0 to-[#4a6a9a]/20 opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
            <CardContent className="relative pt-8 pb-6 px-6">
              <div className="flex items-start justify-between mb-4">
                <div>
                  <div className="text-4xl md:text-5xl font-bold text-white mb-1 group-hover:text-blue-50 transition-colors duration-300">
                    {safeBets.reduce((acc, bet) => acc + (bet.parameters?.length || 0), 0)}
                  </div>
                  <div className="text-sm text-blue-100/80 font-medium uppercase tracking-wider">
                    Total de Parâmetros
                  </div>
                </div>
                <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-[#3a5a8a] to-[#4a6a9a] flex items-center justify-center shadow-lg shadow-[#3a5a8a]/30 group-hover:scale-110 group-hover:rotate-3 transition-all duration-300">
                  <BarChart3 className="w-8 h-8 text-blue-100" />
                </div>
              </div>
            </CardContent>
          </Card>
          
          {/* Card 3 - Azul médio (terceira faixa) */}
          <Card className="relative bg-gradient-to-br from-[#5a7ba5]/90 via-[#6b8cb5]/80 to-[#7c9dc5]/70 border-[#8daed5]/40 backdrop-blur-2xl shadow-2xl shadow-[#5a7ba5]/30 hover:shadow-[#7c9dc5]/40 rounded-2xl overflow-hidden group hover:scale-[1.03] transition-all duration-500">
            <div className="absolute inset-0 bg-gradient-to-br from-[#7c9dc5]/0 to-[#8daed5]/20 opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
            <CardContent className="relative pt-8 pb-6 px-6">
              <div className="flex items-start justify-between mb-4">
                <div>
                  <div className="text-4xl md:text-5xl font-bold text-white mb-1 group-hover:text-blue-50 transition-colors duration-300">
                    {filteredBets.length}
                  </div>
                  <div className="text-sm text-blue-50/80 font-medium uppercase tracking-wider">
                    Resultados da Busca
                  </div>
                </div>
                <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-[#6b8cb5] to-[#7c9dc5] flex items-center justify-center shadow-lg shadow-[#6b8cb5]/30 group-hover:scale-110 group-hover:rotate-3 transition-all duration-300">
                  <Search className="w-8 h-8 text-blue-50" />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Bets List */}
        {loading ? (
          <Card className="bg-gradient-to-br from-[#1e3a5f]/40 via-[#2d4a75]/30 to-[#3a5a8a]/20 border-[#4a6a9a]/30 backdrop-blur-2xl shadow-2xl rounded-2xl">
            <CardContent className="p-16 text-center">
              <div className="inline-block animate-spin rounded-full h-16 w-16 border-4 border-[#4a6a9a]/30 border-t-blue-300 mb-6"></div>
              <p className="text-blue-200 font-semibold text-lg">Carregando...</p>
            </CardContent>
          </Card>
        ) : filteredBets.length === 0 ? (
          <Card className="bg-gradient-to-br from-[#1e3a5f]/40 via-[#2d4a75]/30 to-[#3a5a8a]/20 border-[#4a6a9a]/30 backdrop-blur-2xl shadow-2xl rounded-2xl">
            <CardContent className="p-16 text-center">
              <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-[#2d4a75] to-[#3a5a8a] flex items-center justify-center mx-auto mb-6 shadow-lg">
                <Building2 className="w-12 h-12 text-blue-200" />
              </div>
              <h3 className="text-2xl font-bold text-blue-100 mb-3">
                Nenhuma casa de apostas encontrada
              </h3>
              <p className="text-blue-200/70 mb-8 text-lg">
                Comece cadastrando a primeira casa de apostas
              </p>
              <Link href="/admin/bets/new">
                <Button className="bg-gradient-to-r from-[#2d4a75] via-[#3a5a8a] to-[#4a6a9a] hover:from-[#3a5a8a] hover:via-[#4a6a9a] hover:to-[#5a7ba5] text-white shadow-xl hover:shadow-2xl transition-all duration-300 rounded-xl px-8 py-6 h-auto font-semibold">
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
                  className="relative bg-gradient-to-br from-[#1e3a5f]/50 via-[#2d4a75]/40 to-[#3a5a8a]/30 border-[#4a6a9a]/30 backdrop-blur-xl hover:border-[#5a7ba5]/50 hover:shadow-2xl hover:shadow-[#3a5a8a]/20 hover:scale-[1.03] transition-all duration-500 rounded-2xl overflow-hidden group"
                  style={{ animationDelay: `${index * 50}ms` }}
                >
                  <div className="absolute inset-0 bg-gradient-to-br from-[#3a5a8a]/0 to-[#4a6a9a]/10 opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
                  
                  <CardHeader className="relative pb-4 pt-6 px-6">
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex-1 min-w-0">
                        <CardTitle className="text-white font-bold text-xl group-hover:text-blue-100 transition-colors duration-300 mb-1">
                          {bet.name}
                        </CardTitle>
                        {bet.url && (
                          <a
                            href={bet.url}
                            target="_blank"
                            rel="noopener noreferrer"
                            onClick={(e) => e.stopPropagation()}
                            className="flex items-center gap-1.5 text-blue-300/70 hover:text-blue-200 transition-colors text-sm group/link"
                          >
                            <span className="truncate">{bet.url}</span>
                            <ExternalLink className="w-3.5 h-3.5 flex-shrink-0 group-hover/link:scale-110 transition-transform" />
                          </a>
                        )}
                      </div>
                      <div className="flex items-center gap-2 flex-shrink-0">
                        <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-[#2d4a75] to-[#3a5a8a] flex items-center justify-center group-hover:scale-110 group-hover:rotate-3 transition-all duration-300 shadow-lg">
                          <Building2 className="w-6 h-6 text-blue-200" />
                        </div>
                      </div>
                    </div>
                  </CardHeader>
                  
                  <CardContent className="relative space-y-4 px-6 pb-6">
                    {/* Informação compacta sempre visível */}
                    <div className="flex items-center justify-between p-3 rounded-xl bg-gradient-to-r from-[#2d4a75]/30 to-[#3a5a8a]/20 border border-[#4a6a9a]/30">
                      <span className="text-blue-200/70 font-semibold text-xs uppercase tracking-wider">Parâmetros</span>
                      <span className="text-blue-100 font-bold text-lg">{bet.parameters?.length || 0}</span>
                    </div>

                    {/* Botão para expandir/colapsar */}
                    {hasDetails && (
                      <Button
                        variant="ghost"
                        onClick={() => toggleCard(bet.id)}
                        className="w-full flex items-center justify-between p-3 rounded-xl bg-[#0f1f3a]/20 hover:bg-[#0f1f3a]/40 text-blue-200 hover:text-blue-100 transition-all duration-200 group/btn"
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
                          <div className="flex items-start gap-3 p-3 rounded-xl bg-[#0f1f3a]/30 group-hover:bg-[#0f1f3a]/50 transition-colors">
                            <span className="text-blue-200/60 font-semibold text-xs uppercase tracking-wider min-w-[70px]">CNPJ</span>
                            <span className="text-blue-50 font-medium text-sm flex-1">{bet.cnpj}</span>
                          </div>
                        )}
                        {bet.region && (
                          <div className="flex items-start gap-3 p-3 rounded-xl bg-[#0f1f3a]/30 group-hover:bg-[#0f1f3a]/50 transition-colors">
                            <span className="text-blue-200/60 font-semibold text-xs uppercase tracking-wider min-w-[70px]">Região</span>
                            <span className="text-blue-50 font-medium text-sm flex-1">{bet.region}</span>
                          </div>
                        )}
                        {bet.license && (
                          <div className="flex items-start gap-3 p-3 rounded-xl bg-[#0f1f3a]/30 group-hover:bg-[#0f1f3a]/50 transition-colors">
                            <span className="text-blue-200/60 font-semibold text-xs uppercase tracking-wider min-w-[70px]">Licença</span>
                            <span className="text-blue-50 font-medium text-sm flex-1">{bet.license}</span>
                          </div>
                        )}
                      </div>
                    )}

                    {/* Botões de ação */}
                    <div className="flex gap-2 pt-2 border-t border-[#4a6a9a]/20">
                      <Link href={`/admin/bets/${bet.id}`} className="flex-1">
                        <Button
                          variant="outline"
                          className="w-full border-[#5a7ba5]/50 text-blue-200 hover:bg-[#5a7ba5]/30 hover:text-blue-100 hover:border-[#6b8cb5] transition-all rounded-xl font-medium"
                        >
                          <Edit className="w-4 h-4 mr-2" />
                          Editar
                        </Button>
                      </Link>
                      <Link href={`/admin/bets/${bet.id}/parameters`}>
                        <Button
                          variant="outline"
                          size="icon"
                          className="border-[#6b8cb5]/50 text-blue-200 hover:bg-[#6b8cb5]/30 hover:text-blue-100 hover:border-[#7c9dc5] transition-all rounded-xl"
                          title="Ver Parâmetros"
                        >
                          <BarChart3 className="w-4 h-4" />
                        </Button>
                      </Link>
                      <Button
                        variant="outline"
                        size="icon"
                        className="border-red-400/30 text-red-300 hover:bg-red-500/20 hover:text-red-200 hover:border-red-400/50 transition-all rounded-xl"
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


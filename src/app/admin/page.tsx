"use client";

import React, { useState, useEffect, useCallback } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Users,
  TrendingUp,
  Shield,
  BarChart3,
  Plus,
  Building2,
  Sliders,
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useRouter } from "next/navigation";
import Link from "next/link";

interface DashboardStats {
  totalBets: number;
  totalParameters: number;
  totalUsers: number;
  totalComparisons: number;
}

export default function AdminDashboard() {
  const [stats, setStats] = useState<DashboardStats>({
    totalBets: 0,
    totalParameters: 0,
    totalUsers: 0,
    totalComparisons: 0,
  });
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();
  const router = useRouter();

  const fetchStats = useCallback(async () => {
    try {
      setLoading(true);

      // Fetch bets
      const betsResponse = await fetch("/api/bets");
      const betsData = await betsResponse.json();
      
      // Fetch parameters
      const parametersResponse = await fetch("/api/parameters");
      const parametersData = await parametersResponse.json();
      
      // Fetch users
      const usersResponse = await fetch("/api/admin/users");
      const usersData = await usersResponse.json();
      
      setStats({
        totalBets: betsData.bets?.length || 0,
        totalParameters: parametersData.parameters?.length || 0,
        totalUsers: usersData.users?.length || 0,
        totalComparisons: 0, // Will be implemented later
      });
    } catch (error) {
      console.error("Error fetching stats:", error);
      toast({
        variant: "destructive",
        title: "Erro",
        description: "Falha ao carregar estatísticas do dashboard",
      });
    } finally {
      setLoading(false);
    }
  }, [toast]);

  const handleLogout = async () => {
    try {
      document.cookie =
        "better-auth.session=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;";
      router.push("/admin/login");
    } catch (error) {
      console.error("Logout error:", error);
    }
  };

  useEffect(() => {
    fetchStats();
  }, [fetchStats]);

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 flex items-center justify-center">
        <div className="text-white">Loading dashboard...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 text-white p-8">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-4xl font-bold text-white bg-clip-text">
              Bets Comparator Admin
            </h1>
            <p className="text-gray-300 mt-2">
              Painel de administração e gestão de casas de apostas
            </p>
          </div>
          <div className="flex items-center space-x-2">
            <Button
              onClick={fetchStats}
              variant="outline"
              className="border-gray-700 text-white hover:bg-gray-800"
            >
              <TrendingUp className="w-4 h-4 mr-2" />
              Atualizar
            </Button>
            <Button onClick={handleLogout} variant="destructive">
              <Shield className="w-4 h-4 mr-2" />
              Sair
            </Button>
          </div>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {/* Total Bets */}
          <Link href="/admin/bets">
            <Card className="bg-gradient-to-br from-blue-900/50 to-blue-800/30 border-blue-700/50 hover:border-blue-500 transition-all duration-200 cursor-pointer group backdrop-blur-xl">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium text-blue-100 group-hover:text-white">
                  Casas de Apostas
                </CardTitle>
                <Building2 className="h-5 w-5 text-blue-400 group-hover:text-blue-300" />
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold text-white group-hover:text-blue-100">
                  {stats.totalBets}
                </div>
                <p className="text-xs text-blue-200/70 mt-1 group-hover:text-blue-100">
                  Clique para gerenciar
                </p>
              </CardContent>
            </Card>
          </Link>

          {/* Total Parameters */}
          <Link href="/admin/parameters">
            <Card className="bg-gradient-to-br from-purple-900/50 to-purple-800/30 border-purple-700/50 hover:border-purple-500 transition-all duration-200 cursor-pointer group backdrop-blur-xl">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium text-purple-100 group-hover:text-white">
                  Parâmetros Cadastrados
                </CardTitle>
                <Sliders className="h-5 w-5 text-purple-400 group-hover:text-purple-300" />
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold text-white group-hover:text-purple-100">
                  {stats.totalParameters}
                </div>
                <p className="text-xs text-purple-200/70 mt-1 group-hover:text-purple-100">
                  Clique para gerenciar
                </p>
              </CardContent>
            </Card>
          </Link>

          {/* Total Users */}
          <Link href="/admin/users">
            <Card className="bg-gradient-to-br from-green-900/50 to-green-800/30 border-green-700/50 hover:border-green-500 transition-all duration-200 cursor-pointer group backdrop-blur-xl">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium text-green-100 group-hover:text-white">
                  Usuários Cadastrados
                </CardTitle>
                <Users className="h-5 w-5 text-green-400 group-hover:text-green-300" />
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold text-white group-hover:text-green-100">
                  {stats.totalUsers}
                </div>
                <p className="text-xs text-green-200/70 mt-1 group-hover:text-green-100">
                  Clique para gerenciar
                </p>
              </CardContent>
            </Card>
          </Link>

          {/* Total Comparisons */}
          <Card className="bg-gradient-to-br from-orange-900/50 to-orange-800/30 border-orange-700/50 backdrop-blur-xl">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-orange-100">
                Comparações Realizadas
              </CardTitle>
              <BarChart3 className="h-5 w-5 text-orange-400" />
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-white">
                {stats.totalComparisons}
              </div>
              <p className="text-xs text-orange-200/70 mt-1">
                Total de comparações
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Quick Actions */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <Card className="bg-gradient-to-br from-gray-900/90 to-gray-800/90 border-gray-700/50 backdrop-blur-xl">
            <CardHeader>
              <CardTitle className="text-white flex items-center">
                <Building2 className="w-5 h-5 mr-2 text-blue-400" />
                Gestão de Casas de Apostas
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-gray-300">
                Cadastre e gerencie casas de apostas regulamentadas no Brasil.
                Adicione informações como CNPJ, licença e região de atuação.
              </p>
              <div className="flex space-x-2">
                <Link href="/admin/bets">
                  <Button className="bg-blue-600 hover:bg-blue-700 text-white">
                    <Building2 className="w-4 h-4 mr-2" />
                    Gerenciar Bets
                  </Button>
                </Link>
                <Link href="/admin/bets/new">
                  <Button
                    variant="outline"
                    className="border-blue-500 text-blue-400 hover:bg-blue-900/30"
                  >
                    <Plus className="w-4 h-4 mr-2" />
                    Nova Bet
                  </Button>
                </Link>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-gray-900/90 to-gray-800/90 border-gray-700/50 backdrop-blur-xl">
            <CardHeader>
              <CardTitle className="text-white flex items-center">
                <Sliders className="w-5 h-5 mr-2 text-purple-400" />
                Gestão de Parâmetros
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-gray-300">
                Configure parâmetros técnicos e reputacionais para análise
                comparativa. Mantenha histórico de alterações.
              </p>
              <div className="flex space-x-2">
                <Link href="/admin/parameters">
                  <Button className="bg-purple-600 hover:bg-purple-700 text-white">
                    <Sliders className="w-4 h-4 mr-2" />
                    Gerenciar Parâmetros
                  </Button>
                </Link>
                <Link href="/admin/parameters/new">
                  <Button
                    variant="outline"
                    className="border-purple-500 text-purple-400 hover:bg-purple-900/30"
                  >
                    <Plus className="w-4 h-4 mr-2" />
                    Novo Parâmetro
                  </Button>
                </Link>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* System Info */}
        <Card className="bg-gradient-to-br from-gray-900/90 to-gray-800/90 border-gray-700/50 backdrop-blur-xl">
          <CardHeader>
            <CardTitle className="text-white">Status do Sistema</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
              <div className="text-center">
                <div className="text-3xl font-bold text-blue-400">
                  {stats.totalBets}
                </div>
                <div className="text-sm text-gray-300 mt-1">Bets Ativas</div>
              </div>
              <div className="text-center">
                <div className="text-3xl font-bold text-purple-400">
                  {stats.totalParameters}
                </div>
                <div className="text-sm text-gray-300 mt-1">
                  Parâmetros Total
                </div>
              </div>
              <div className="text-center">
                <div className="text-3xl font-bold text-green-400">
                  {stats.totalUsers}
                </div>
                <div className="text-sm text-gray-300 mt-1">
                  Usuários Ativos
                </div>
              </div>
              <div className="text-center">
                <div className="text-3xl font-bold text-orange-400">
                  {stats.totalComparisons}
                </div>
                <div className="text-sm text-gray-300 mt-1">
                  Comparações
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

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
  Clock,
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useFetch } from "@/hooks/use-fetch";

interface DashboardStats {
  totalBets: number;
  totalParameters: number;
  totalUsers: number;
  totalComparisons: number;
  pendingRequests: number;
}

export default function AdminDashboard() {
  const [stats, setStats] = useState<DashboardStats>({
    totalBets: 0,
    totalParameters: 0,
    totalUsers: 0,
    totalComparisons: 0,
    pendingRequests: 0,
  });
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();
  const router = useRouter();

  // Verify admin session
  const { data: sessionData, loading: sessionLoading } = useFetch<{
    valid: boolean;
  }>("/api/auth/verify-admin-session", {
    immediate: true,
    showToast: false,
    onSuccess: (data) => {
      if (data && !data.valid) {
        console.log("Admin session invalid, redirecting to login");
        router.push("/admin/login");
      }
    },
    onError: () => {
      console.log("Admin session check failed, redirecting to login");
      router.push("/admin/login");
    },
  });

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

      // Fetch pending requests
      const requestsResponse = await fetch(
        "/api/admin/bet-link-requests?status=PENDING"
      );
      const requestsData = await requestsResponse.json();

      console.log("Bets data:", betsData);
      console.log("Parameters data:", parametersData);
      console.log("Users data:", usersData);
      console.log("Requests data:", requestsData);

      setStats({
        totalBets: betsData.data?.bets?.length || betsData.bets?.length || 0,
        totalParameters:
          parametersData.data?.parameters?.length ||
          parametersData.parameters?.length ||
          0,
        totalUsers: usersData.users?.length || 0,
        totalComparisons: 0, // Will be implemented later
        pendingRequests:
          requestsData.data?.requests?.length ||
          requestsData.requests?.length ||
          0,
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
    // Only fetch stats if session is valid
    if (!sessionLoading && sessionData?.valid) {
      fetchStats();
    }
  }, [fetchStats, sessionLoading, sessionData]);

  // Show loading while checking session
  if (sessionLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 flex items-center justify-center">
        <div className="text-slate-700">Verificando sessão...</div>
      </div>
    );
  }

  // If session is invalid, don't render (redirect will happen)
  if (!sessionData?.valid) {
    return null;
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 flex items-center justify-center">
        <div className="text-slate-700">Carregando dashboard...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 p-8">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-4xl font-bold text-slate-900">
              Bets Comparator Admin
            </h1>
            <p className="text-slate-600 mt-2">
              Painel de administração e gestão de casas de apostas
            </p>
          </div>
          <div className="flex items-center space-x-2">
            <Button
              onClick={fetchStats}
              variant="outline"
              className="bg-white border border-slate-200 text-slate-700 hover:bg-slate-50 hover:border-slate-300 rounded-xl shadow-sm"
            >
              <TrendingUp className="w-4 h-4 mr-2" />
              Atualizar
            </Button>
            <Button
              onClick={handleLogout}
              variant="outline"
              className="bg-white border border-slate-200 text-slate-700 hover:bg-red-50 hover:text-red-600 hover:border-red-300 rounded-xl shadow-sm"
            >
              <Shield className="w-4 h-4 mr-2" />
              Sair
            </Button>
          </div>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {/* Total Bets */}
          <Link href="/admin/bets">
            <Card className="bg-white border border-slate-200 shadow-sm hover:shadow-lg transition-all duration-200 cursor-pointer group rounded-2xl">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium text-slate-700 group-hover:text-slate-900">
                  Casas de Apostas
                </CardTitle>
                <Building2 className="h-5 w-5 text-blue-600 group-hover:text-blue-700" />
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold text-slate-900 group-hover:text-blue-600">
                  {stats.totalBets}
                </div>
                <p className="text-xs text-slate-500 mt-1 group-hover:text-slate-700">
                  Clique para gerenciar
                </p>
              </CardContent>
            </Card>
          </Link>

          {/* Total Parameters */}
          <Link href="/admin/parameters">
            <Card className="bg-white border border-slate-200 shadow-sm hover:shadow-lg transition-all duration-200 cursor-pointer group rounded-2xl">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium text-slate-700 group-hover:text-slate-900">
                  Parâmetros Cadastrados
                </CardTitle>
                <Sliders className="h-5 w-5 text-purple-600 group-hover:text-purple-700" />
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold text-slate-900 group-hover:text-purple-600">
                  {stats.totalParameters}
                </div>
                <p className="text-xs text-slate-500 mt-1 group-hover:text-slate-700">
                  Clique para gerenciar
                </p>
              </CardContent>
            </Card>
          </Link>

          {/* Total Users */}
          <Link href="/admin/users">
            <Card className="bg-white border border-slate-200 shadow-sm hover:shadow-lg transition-all duration-200 cursor-pointer group rounded-2xl">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium text-slate-700 group-hover:text-slate-900">
                  Usuários Cadastrados
                </CardTitle>
                <Users className="h-5 w-5 text-green-600 group-hover:text-green-700" />
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold text-slate-900 group-hover:text-green-600">
                  {stats.totalUsers}
                </div>
                <p className="text-xs text-slate-500 mt-1 group-hover:text-slate-700">
                  Clique para gerenciar
                </p>
              </CardContent>
            </Card>
          </Link>

          {/* Bet Link Requests */}
          <Link href="/admin/bet-link-requests">
            <Card className="bg-white border border-slate-200 shadow-sm hover:shadow-lg transition-all duration-200 cursor-pointer group rounded-2xl">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium text-slate-700 group-hover:text-slate-900">
                  Solicitações Pendentes
                </CardTitle>
                <Clock className="h-5 w-5 text-yellow-600 group-hover:text-yellow-700" />
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold text-slate-900 group-hover:text-yellow-600">
                  {stats.pendingRequests}
                </div>
                <p className="text-xs text-slate-500 mt-1 group-hover:text-slate-700">
                  Clique para gerenciar
                </p>
              </CardContent>
            </Card>
          </Link>

          {/* Total Comparisons */}
          <Card className="bg-white border border-slate-200 shadow-sm rounded-2xl">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-slate-700">
                Comparações Realizadas
              </CardTitle>
              <BarChart3 className="h-5 w-5 text-orange-600" />
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-slate-900">
                {stats.totalComparisons}
              </div>
              <p className="text-xs text-slate-500 mt-1">
                Total de comparações
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Quick Actions */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <Card className="bg-white border border-slate-200 shadow-sm rounded-2xl">
            <CardHeader>
              <CardTitle className="text-slate-900 flex items-center">
                <Building2 className="w-5 h-5 mr-2 text-blue-600" />
                Gestão de Casas de Apostas
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-slate-600">
                Cadastre e gerencie casas de apostas regulamentadas no Brasil.
                Adicione informações como CNPJ, licença e região de atuação.
              </p>
              <div className="flex space-x-2">
                <Link href="/admin/bets">
                  <Button className="bg-blue-600 hover:bg-blue-700 text-white rounded-xl">
                    <Building2 className="w-4 h-4 mr-2" />
                    Gerenciar Bets
                  </Button>
                </Link>
                <Link href="/admin/bets/new">
                  <Button
                    variant="outline"
                    className="border-slate-200 text-slate-700 hover:bg-slate-50 rounded-xl"
                  >
                    <Plus className="w-4 h-4 mr-2" />
                    Nova Bet
                  </Button>
                </Link>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-white border border-slate-200 shadow-sm rounded-2xl">
            <CardHeader>
              <CardTitle className="text-slate-900 flex items-center">
                <Sliders className="w-5 h-5 mr-2 text-purple-600" />
                Gestão de Parâmetros
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-slate-600">
                Configure parâmetros técnicos e reputacionais para análise
                comparativa. Mantenha histórico de alterações.
              </p>
              <div className="flex space-x-2">
                <Link href="/admin/parameters">
                  <Button className="bg-purple-600 hover:bg-purple-700 text-white rounded-xl">
                    <Sliders className="w-4 h-4 mr-2" />
                    Gerenciar Parâmetros
                  </Button>
                </Link>
                <Link href="/admin/parameters/new">
                  <Button
                    variant="outline"
                    className="border-slate-200 text-slate-700 hover:bg-slate-50 rounded-xl"
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
        <Card className="bg-white border border-slate-200 shadow-sm rounded-2xl">
          <CardHeader>
            <CardTitle className="text-slate-900">Status do Sistema</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
              <div className="text-center">
                <div className="text-3xl font-bold text-blue-600">
                  {stats.totalBets}
                </div>
                <div className="text-sm text-slate-600 mt-1">Bets Ativas</div>
              </div>
              <div className="text-center">
                <div className="text-3xl font-bold text-purple-600">
                  {stats.totalParameters}
                </div>
                <div className="text-sm text-slate-600 mt-1">
                  Parâmetros Total
                </div>
              </div>
              <div className="text-center">
                <div className="text-3xl font-bold text-green-600">
                  {stats.totalUsers}
                </div>
                <div className="text-sm text-slate-600 mt-1">
                  Usuários Ativos
                </div>
              </div>
              <div className="text-center">
                <div className="text-3xl font-bold text-orange-600">
                  {stats.totalComparisons}
                </div>
                <div className="text-sm text-slate-600 mt-1">Comparações</div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

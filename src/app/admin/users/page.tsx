"use client";

import React, { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import {
  Users,
  Mail,
  Shield,
  Trash2,
  Crown,
  UserCog,
  ArrowLeft,
  RefreshCw,
  Building2,
  Link as LinkIcon,
  Unlink,
  Clock,
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import Link from "next/link";
import { useRouter } from "next/navigation";

interface User {
  id: string;
  name: string;
  email: string;
  role: "ADMIN" | "CLIENT";
  emailVerified: boolean;
  createdAt: string;
  updatedAt: string;
  userBets?: Array<{
    id: string;
    bet: {
      id: string;
      name: string;
      betId: string | null;
    };
  }>;
}

export default function AdminUsersPage() {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [linkingUserId, setLinkingUserId] = useState<string | null>(null);
  const [betIdInputs, setBetIdInputs] = useState<Record<string, string>>({});
  const { toast } = useToast();
  const router = useRouter();

  const fetchUsers = async () => {
    try {
      setLoading(true);
      const response = await fetch("/api/admin/users");
      const data = await response.json();

      if (data.success) {
        setUsers(data.users);
      } else {
        throw new Error(data.error);
      }
    } catch (error) {
      console.error("Error fetching users:", error);
      toast({
        variant: "destructive",
        title: "Erro",
        description: "Falha ao carregar usuários",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleChangeRole = async (userId: string, currentRole: string, userName: string) => {
    const newRole = currentRole === "ADMIN" ? "CLIENT" : "ADMIN";
    
    if (!confirm(`Tem certeza que deseja alterar o papel de "${userName}" para ${newRole}?`)) {
      return;
    }

    try {
      const response = await fetch(`/api/admin/users/${userId}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ role: newRole }),
      });

      const data = await response.json();

      if (data.success) {
        toast({
          title: "Sucesso",
          description: `Papel alterado para ${newRole}`,
        });
        fetchUsers();
      } else {
        throw new Error(data.error);
      }
    } catch (error) {
      console.error("Error changing role:", error);
      toast({
        variant: "destructive",
        title: "Erro",
        description: "Falha ao alterar papel do usuário",
      });
    }
  };

  const handleLinkBet = async (userId: string, betId: string) => {
    if (!betId.trim()) {
      toast({
        variant: "destructive",
        title: "Erro",
        description: "Por favor, insira um Bet ID",
      });
      return;
    }

    try {
      setLinkingUserId(userId);
      const response = await fetch(`/api/admin/users/${userId}/link-bet`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ betId: betId.trim().toUpperCase() }),
      });

      const data = await response.json();

      if (data.success) {
        toast({
          title: "Sucesso",
          description: `Usuário vinculado à casa "${data.userBet.bet.name}"`,
        });
        setBetIdInputs((prev) => {
          const newInputs = { ...prev };
          delete newInputs[userId];
          return newInputs;
        });
        setLinkingUserId(null);
        fetchUsers();
      } else {
        throw new Error(data.error || "Falha ao vincular usuário");
      }
    } catch (error) {
      console.error("Error linking bet:", error);
      toast({
        variant: "destructive",
        title: "Erro",
        description: error instanceof Error ? error.message : "Falha ao vincular usuário à casa",
      });
    } finally {
      setLinkingUserId(null);
    }
  };

  const handleUnlinkBet = async (userId: string, userName: string) => {
    if (!confirm(`Tem certeza que deseja desvincular "${userName}" da sua casa de apostas?`)) {
      return;
    }

    try {
      setLinkingUserId(userId);
      const response = await fetch(`/api/admin/users/${userId}/link-bet`, {
        method: "DELETE",
      });

      const data = await response.json();

      if (data.success) {
        toast({
          title: "Sucesso",
          description: `Usuário desvinculado de "${data.betName}"`,
        });
        fetchUsers();
      } else {
        throw new Error(data.error || "Falha ao desvincular usuário");
      }
    } catch (error) {
      console.error("Error unlinking bet:", error);
      toast({
        variant: "destructive",
        title: "Erro",
        description: error instanceof Error ? error.message : "Falha ao desvincular usuário",
      });
    } finally {
      setLinkingUserId(null);
    }
  };

  const handleDeleteUser = async (userId: string, userName: string, userRole: string) => {
    if (userRole === "ADMIN") {
      toast({
        variant: "destructive",
        title: "Não permitido",
        description: "Não é possível deletar usuários ADMIN",
      });
      return;
    }

    if (!confirm(`Tem certeza que deseja DELETAR o usuário "${userName}"? Esta ação não pode ser desfeita!`)) {
      return;
    }

    try {
      const response = await fetch(`/api/admin/users/${userId}/delete`, {
        method: "DELETE",
      });

      const data = await response.json();

      if (data.success) {
        toast({
          title: "Sucesso",
          description: "Usuário deletado com sucesso",
        });
        fetchUsers();
      } else {
        throw new Error(data.error);
      }
    } catch (error) {
      console.error("Error deleting user:", error);
      toast({
        variant: "destructive",
        title: "Erro",
        description: "Falha ao deletar usuário",
      });
    }
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  const adminUsers = users.filter((u) => u.role === "ADMIN");
  const clientUsers = users.filter((u) => u.role === "CLIENT");

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 text-white p-8">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <div className="flex items-center space-x-3">
              <Link href="/admin">
                <Button
                  variant="ghost"
                  className="text-gray-400 hover:text-white"
                >
                  <ArrowLeft className="w-4 h-4" />
                </Button>
              </Link>
              <div>
                <h1 className="text-3xl font-bold text-white flex items-center">
                  <Users className="w-8 h-8 mr-3 text-green-400" />
                  Gestão de Usuários
                </h1>
                <p className="text-gray-300 mt-1">
                  Visualize e gerencie todos os usuários da plataforma
                </p>
              </div>
            </div>
          </div>
          <Button
            onClick={fetchUsers}
            variant="outline"
            className="border-gray-700 text-white hover:bg-gray-800"
            disabled={loading}
          >
            <RefreshCw className={`w-4 h-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
            Atualizar
          </Button>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <Card className="bg-gradient-to-br from-blue-900/50 to-blue-800/30 border-blue-700/50 backdrop-blur-xl">
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <div className="text-3xl font-bold text-white">
                    {users.length}
                  </div>
                  <div className="text-sm text-blue-200 mt-1">
                    Total de Usuários
                  </div>
                </div>
                <Users className="w-12 h-12 text-blue-400" />
              </div>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-purple-900/50 to-purple-800/30 border-purple-700/50 backdrop-blur-xl">
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <div className="text-3xl font-bold text-white">
                    {adminUsers.length}
                  </div>
                  <div className="text-sm text-purple-200 mt-1">
                    Administradores
                  </div>
                </div>
                <Crown className="w-12 h-12 text-purple-400" />
              </div>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-green-900/50 to-green-800/30 border-green-700/50 backdrop-blur-xl">
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <div className="text-3xl font-bold text-white">
                    {clientUsers.length}
                  </div>
                  <div className="text-sm text-green-200 mt-1">Clientes</div>
                </div>
                <UserCog className="w-12 h-12 text-green-400" />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Users List */}
        {loading ? (
          <Card className="bg-gradient-to-br from-gray-900/90 to-gray-800/90 border-gray-700/50 backdrop-blur-xl">
            <CardContent className="p-12 text-center text-gray-400">
              Carregando usuários...
            </CardContent>
          </Card>
        ) : users.length === 0 ? (
          <Card className="bg-gradient-to-br from-gray-900/90 to-gray-800/90 border-gray-700/50 backdrop-blur-xl">
            <CardContent className="p-12 text-center">
              <Users className="w-16 h-16 text-gray-600 mx-auto mb-4" />
              <h3 className="text-xl font-semibold text-gray-300 mb-2">
                Nenhum usuário encontrado
              </h3>
              <p className="text-gray-400">
                Os usuários aparecerão aqui quando se cadastrarem
              </p>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-4">
            {users.map((user) => (
              <Card
                key={user.id}
                className="bg-gradient-to-br from-gray-900/90 to-gray-800/90 border-gray-700/50 backdrop-blur-xl hover:border-blue-500/50 transition-all"
              >
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-4">
                      <div className="w-12 h-12 rounded-full bg-gradient-to-br from-blue-600 to-purple-600 flex items-center justify-center">
                        {user.role === "ADMIN" ? (
                          <Crown className="w-6 h-6 text-white" />
                        ) : (
                          <Users className="w-6 h-6 text-white" />
                        )}
                      </div>
                      <div>
                        <CardTitle className="text-white flex items-center space-x-2">
                          <span>{user.name}</span>
                          {user.role === "ADMIN" && (
                            <Badge className="bg-purple-600">ADMIN</Badge>
                          )}
                          {user.role === "CLIENT" && (
                            <Badge className="bg-blue-600">CLIENT</Badge>
                          )}
                        </CardTitle>
                        <div className="flex items-center space-x-4 mt-1 text-sm text-gray-400">
                          <div className="flex items-center space-x-1">
                            <Mail className="w-4 h-4" />
                            <span>{user.email}</span>
                          </div>
                          {user.emailVerified && (
                            <Badge variant="outline" className="text-green-400 border-green-400">
                              Verificado
                            </Badge>
                          )}
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Button
                        onClick={() => handleChangeRole(user.id, user.role, user.name)}
                        variant="outline"
                        size="sm"
                        className="border-purple-500 text-purple-400 hover:bg-purple-900/30"
                      >
                        {user.role === "ADMIN" ? (
                          <>
                            <UserCog className="w-4 h-4 mr-2" />
                            Tornar Cliente
                          </>
                        ) : (
                          <>
                            <Shield className="w-4 h-4 mr-2" />
                            Tornar Admin
                          </>
                        )}
                      </Button>
                      {user.role !== "ADMIN" && (
                        <Button
                          onClick={() => handleDeleteUser(user.id, user.name, user.role)}
                          variant="outline"
                          size="sm"
                          className="border-red-500 text-red-400 hover:bg-red-900/30"
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      )}
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {/* Linked Bet Info */}
                    {user.userBets && user.userBets.length > 0 && user.userBets[0]?.bet ? (
                      <div className="p-3 bg-blue-900/30 border border-blue-700/50 rounded-lg">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center space-x-2">
                            <Building2 className="w-4 h-4 text-blue-400" />
                            <div>
                              <div className="text-sm font-medium text-blue-200">
                                Casa Vinculada: {user.userBets[0].bet.name}
                              </div>
                              {user.userBets[0].bet.betId && (
                                <div className="text-xs text-blue-300">
                                  Bet ID: {user.userBets[0].bet.betId}
                                </div>
                              )}
                            </div>
                          </div>
                          {user.role === "CLIENT" && (
                            <Button
                              onClick={() => handleUnlinkBet(user.id, user.name)}
                              variant="outline"
                              size="sm"
                              disabled={linkingUserId === user.id}
                              className="border-red-500 text-red-400 hover:bg-red-900/30"
                            >
                              <Unlink className="w-4 h-4 mr-2" />
                              Desvincular
                            </Button>
                          )}
                        </div>
                      </div>
                    ) : user.role === "CLIENT" ? (
                      <div className="space-y-2">
                        <Link href="/admin/bet-link-requests">
                          <div className="p-3 bg-yellow-900/30 border border-yellow-700/50 rounded-lg hover:bg-yellow-900/40 transition-colors cursor-pointer">
                            <div className="flex items-center space-x-2">
                              <Clock className="w-4 h-4 text-yellow-400" />
                              <span className="text-sm text-yellow-200">
                                Ver solicitações pendentes
                              </span>
                            </div>
                          </div>
                        </Link>
                        <div className="p-3 bg-gray-800/50 border border-gray-700/50 rounded-lg">
                          <div className="flex items-center justify-between">
                            <div className="flex items-center space-x-2">
                              <Building2 className="w-4 h-4 text-gray-400" />
                              <span className="text-sm text-gray-400">Nenhuma casa vinculada</span>
                            </div>
                            <div className="flex items-center space-x-2">
                              <Input
                                placeholder="Bet ID (ex: UF87F)"
                                value={betIdInputs[user.id] || ""}
                                onChange={(e) => setBetIdInputs((prev) => ({
                                  ...prev,
                                  [user.id]: e.target.value,
                                }))}
                                onKeyDown={(e) => {
                                  const betId = betIdInputs[user.id] || "";
                                  if (e.key === "Enter" && betId.trim()) {
                                    handleLinkBet(user.id, betId);
                                  }
                                }}
                                className="w-32 h-8 bg-gray-800 border-gray-700 text-white text-xs"
                                disabled={linkingUserId === user.id}
                              />
                              <Button
                                onClick={() => handleLinkBet(user.id, betIdInputs[user.id] || "")}
                                variant="outline"
                                size="sm"
                                disabled={linkingUserId === user.id || !betIdInputs[user.id]?.trim()}
                                className="border-blue-500 text-blue-400 hover:bg-blue-900/30"
                              >
                                <LinkIcon className="w-4 h-4 mr-2" />
                                {linkingUserId === user.id ? "Vinculando..." : "Vincular"}
                              </Button>
                            </div>
                          </div>
                        </div>
                      </div>
                    ) : null}
                    
                    {/* User Info */}
                    <div className="grid grid-cols-2 gap-4 text-sm">
                      <div>
                        <span className="text-gray-500">Criado em:</span>
                        <span className="text-gray-300 ml-2">
                          {new Date(user.createdAt).toLocaleDateString("pt-BR")}
                        </span>
                      </div>
                      <div>
                        <span className="text-gray-500">Atualizado em:</span>
                        <span className="text-gray-300 ml-2">
                          {new Date(user.updatedAt).toLocaleDateString("pt-BR")}
                        </span>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

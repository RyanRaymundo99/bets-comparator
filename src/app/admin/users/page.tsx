"use client";
import React, { useState, useEffect, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  CheckCircle2,
  XCircle,
  Clock,
  User,
  Mail,
  CreditCard,
  FileText,
  RefreshCw,
  LogOut,
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useRouter } from "next/navigation";
import Link from "next/link";
import NotificationBell from "@/components/admin/NotificationBell";

interface User {
  id: string;
  name: string;
  email: string;
  cpf: string | null;
  approvalStatus: "PENDING" | "APPROVED" | "REJECTED";
  emailVerified: boolean;
  createdAt: string;
}

export default function AdminUsersPage() {
  const [users, setUsers] = useState<User[]>([]);
  const [filteredUsers, setFilteredUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [processingUser, setProcessingUser] = useState<string | null>(null);
  const [statusFilter, setStatusFilter] = useState<string>("ALL");
  const { toast } = useToast();
  const router = useRouter();

  const fetchUsers = useCallback(
    async (status?: string) => {
      try {
        const url =
          status && status !== "ALL"
            ? `/api/admin/users?status=${status}`
            : "/api/admin/users";

        const response = await fetch(url);
        if (response.ok) {
          const data = await response.json();
          setUsers(data.users);
          setFilteredUsers(data.users);
        } else {
          toast({
            variant: "destructive",
            title: "Erro",
            description: "Falha ao carregar usuários",
          });
        }
      } catch (error) {
        console.error("Error fetching users:", error);
        toast({
          variant: "destructive",
          title: "Erro",
          description: "Erro ao carregar usuários",
        });
      } finally {
        setLoading(false);
      }
    },
    [toast]
  );

  const filterUsers = useCallback(
    (status: string) => {
      setStatusFilter(status);
      if (status === "ALL") {
        setFilteredUsers(users);
      } else {
        setFilteredUsers(
          users.filter((user) => user.approvalStatus === status)
        );
      }
    },
    [users]
  );

  const handleLogout = async () => {
    try {
      // Clear session cookie
      document.cookie =
        "better-auth.session=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;";
      router.push("/admin/login");
    } catch (error) {
      console.error("Logout error:", error);
    }
  };

  useEffect(() => {
    // Check for URL parameters to set initial filter
    const urlParams = new URLSearchParams(window.location.search);
    const status = urlParams.get("status");
    if (status) {
      setStatusFilter(status);
      fetchUsers(status);
    } else {
      fetchUsers();
    }
  }, [fetchUsers]);

  useEffect(() => {
    filterUsers(statusFilter);
  }, [filterUsers, statusFilter]);

  const handleApproval = async (
    userId: string,
    action: "approve" | "reject"
  ) => {
    setProcessingUser(userId);
    try {
      const response = await fetch(`/api/admin/users/${userId}/approve`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ action }),
      });

      if (response.ok) {
        const data = await response.json();
        toast({
          title: "Sucesso",
          description: data.message,
        });
        // Refresh the users list
        fetchUsers();
      } else {
        const error = await response.json();
        toast({
          variant: "destructive",
          title: "Erro",
          description: error.error || "Falha ao processar solicitação",
        });
      }
    } catch (error) {
      console.error("Error processing approval:", error);
      toast({
        variant: "destructive",
        title: "Erro",
        description: "Erro ao processar solicitação",
      });
    } finally {
      setProcessingUser(null);
    }
  };

  const handleResetToPending = async (userId: string) => {
    try {
      setProcessingUser(userId);
      const response = await fetch(`/api/admin/users/${userId}/reset`, {
        method: "POST",
      });

      const data = await response.json();

      if (response.ok) {
        toast({
          title: "Sucesso",
          description: "Status do usuário resetado para pendente",
        });
        fetchUsers();
      } else {
        throw new Error(data.error || "Falha ao resetar status do usuário");
      }
    } catch (error) {
      console.error("Error resetting user:", error);
      toast({
        variant: "destructive",
        title: "Erro",
        description: "Falha ao resetar status do usuário",
      });
    } finally {
      setProcessingUser(null);
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "PENDING":
        return (
          <Badge
            variant="secondary"
            className="bg-yellow-500/20 text-yellow-600"
          >
            <Clock className="w-3 h-3 mr-1" />
            Pendente
          </Badge>
        );
      case "APPROVED":
        return (
          <Badge variant="secondary" className="bg-green-500/20 text-green-600">
            <CheckCircle2 className="w-3 h-3 mr-1" />
            Aprovado
          </Badge>
        );
      case "REJECTED":
        return (
          <Badge variant="secondary" className="bg-red-500/20 text-red-600">
            <XCircle className="w-3 h-3 mr-1" />
            Rejeitado
          </Badge>
        );
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("pt-BR", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background text-foreground p-8">
        <div className="max-w-6xl mx-auto">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
            <p className="mt-2 text-muted-foreground">Carregando usuários...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background text-foreground p-8">
      <div className="max-w-6xl mx-auto space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold">Admin Panel</h1>
            <p className="text-muted-foreground mt-1">
              Gerenciar usuários e verificar documentos
            </p>
          </div>
          <div className="flex items-center space-x-2">
            <NotificationBell />
            <Link href="/admin/kyc">
              <Button variant="outline">
                <FileText className="w-4 h-4 mr-2" />
                KYC Verification
              </Button>
            </Link>
            <Button onClick={fetchUsers} variant="outline">
              <RefreshCw className="w-4 h-4 mr-2" />
              Atualizar
            </Button>
            <Button onClick={handleLogout} variant="destructive">
              <LogOut className="w-4 h-4 mr-2" />
              Logout
            </Button>
          </div>
        </div>

        {/* Filter Buttons */}
        <div className="flex flex-wrap gap-2 mb-6">
          <Button
            variant={statusFilter === "ALL" ? "default" : "outline"}
            onClick={() => filterUsers("ALL")}
            size="sm"
          >
            All Users ({users.length})
          </Button>
          <Button
            variant={statusFilter === "PENDING" ? "default" : "outline"}
            onClick={() => filterUsers("PENDING")}
            size="sm"
            className="bg-yellow-600 hover:bg-yellow-700 text-white"
          >
            Pending (
            {users.filter((u) => u.approvalStatus === "PENDING").length})
          </Button>
          <Button
            variant={statusFilter === "APPROVED" ? "default" : "outline"}
            onClick={() => filterUsers("APPROVED")}
            size="sm"
            className="bg-green-600 hover:bg-green-700 text-white"
          >
            Approved (
            {users.filter((u) => u.approvalStatus === "APPROVED").length})
          </Button>
          <Button
            variant={statusFilter === "REJECTED" ? "default" : "outline"}
            onClick={() => filterUsers("REJECTED")}
            size="sm"
            className="bg-red-600 hover:bg-red-700 text-white"
          >
            Rejected (
            {users.filter((u) => u.approvalStatus === "REJECTED").length})
          </Button>
        </div>

        <div className="grid gap-4">
          {filteredUsers.length === 0 ? (
            <Card>
              <CardContent className="p-8 text-center">
                <User className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                <h3 className="text-lg font-semibold mb-2">
                  {statusFilter === "ALL"
                    ? "Nenhum usuário encontrado"
                    : `Nenhum usuário ${statusFilter.toLowerCase()} encontrado`}
                </h3>
                <p className="text-muted-foreground">
                  {statusFilter === "ALL"
                    ? "Não há usuários para exibir no momento."
                    : `Não há usuários com status ${statusFilter.toLowerCase()} no momento.`}
                </p>
              </CardContent>
            </Card>
          ) : (
            filteredUsers.map((user) => (
              <Card key={user.id} className="hover:shadow-md transition-shadow">
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-4">
                      <div className="flex-shrink-0">
                        <div className="w-10 h-10 bg-primary/10 rounded-full flex items-center justify-center">
                          <User className="w-5 h-5 text-primary" />
                        </div>
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center space-x-2 mb-1">
                          <h3 className="text-lg font-semibold truncate">
                            {user.name}
                          </h3>
                          {getStatusBadge(user.approvalStatus)}
                        </div>
                        <div className="flex items-center space-x-4 text-sm text-muted-foreground">
                          <div className="flex items-center space-x-1">
                            <Mail className="w-4 h-4" />
                            <span>{user.email}</span>
                          </div>
                          {user.cpf && (
                            <div className="flex items-center space-x-1">
                              <CreditCard className="w-4 h-4" />
                              <span>{user.cpf}</span>
                            </div>
                          )}
                          <span>Criado em {formatDate(user.createdAt)}</span>
                        </div>
                      </div>
                    </div>

                    {user.approvalStatus === "PENDING" && (
                      <div className="flex items-center space-x-2">
                        <Button
                          size="sm"
                          onClick={() => handleApproval(user.id, "approve")}
                          disabled={processingUser === user.id}
                          className="bg-green-600 hover:bg-green-700"
                        >
                          {processingUser === user.id ? (
                            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                          ) : (
                            <>
                              <CheckCircle2 className="w-4 h-4 mr-1" />
                              Aprovar
                            </>
                          )}
                        </Button>
                        <Button
                          size="sm"
                          variant="destructive"
                          onClick={() => handleApproval(user.id, "reject")}
                          disabled={processingUser === user.id}
                        >
                          {processingUser === user.id ? (
                            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                          ) : (
                            <>
                              <XCircle className="w-4 h-4 mr-1" />
                              Rejeitar
                            </>
                          )}
                        </Button>
                      </div>
                    )}

                    {/* Reset button for approved/rejected users */}
                    {(user.approvalStatus === "APPROVED" ||
                      user.approvalStatus === "REJECTED") && (
                      <div className="flex items-center space-x-2">
                        <Button
                          size="sm"
                          onClick={() => handleResetToPending(user.id)}
                          disabled={processingUser === user.id}
                          className="bg-orange-600 hover:bg-orange-700"
                        >
                          {processingUser === user.id ? (
                            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                          ) : (
                            <>
                              <Clock className="w-4 h-4 mr-1" />
                              Resetar para Pendente
                            </>
                          )}
                        </Button>
                        <Button
                          size="sm"
                          onClick={() => handleApproval(user.id, "approve")}
                          disabled={processingUser === user.id}
                          className="bg-green-600 hover:bg-green-700"
                        >
                          {processingUser === user.id ? (
                            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                          ) : (
                            <>
                              <CheckCircle2 className="w-4 h-4 mr-1" />
                              Re-aprovar
                            </>
                          )}
                        </Button>
                        <Button
                          size="sm"
                          variant="destructive"
                          onClick={() => handleApproval(user.id, "reject")}
                          disabled={processingUser === user.id}
                        >
                          {processingUser === user.id ? (
                            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                          ) : (
                            <>
                              <XCircle className="w-4 h-4 mr-1" />
                              Rejeitar
                            </>
                          )}
                        </Button>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            ))
          )}
        </div>
      </div>
    </div>
  );
}

"use client";

import React, { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Building2,
  User,
  Mail,
  Clock,
  CheckCircle,
  XCircle,
  ArrowLeft,
  RefreshCw,
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import Link from "next/link";
import { useRouter } from "next/navigation";

interface BetLinkRequest {
  id: string;
  status: "PENDING" | "APPROVED" | "REJECTED";
  requestedAt: string;
  reviewedAt: string | null;
  notes: string | null;
  user: {
    id: string;
    name: string;
    email: string;
  };
  bet: {
    id: string;
    name: string;
    betId: string | null;
    company: string | null;
  };
}

export default function BetLinkRequestsPage() {
  const [requests, setRequests] = useState<BetLinkRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<string>("all");
  const [processingId, setProcessingId] = useState<string | null>(null);
  const { toast } = useToast();
  const router = useRouter();

  const fetchRequests = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      if (filter !== "all") {
        params.append("status", filter);
      }

      const response = await fetch(`/api/admin/bet-link-requests?${params.toString()}`);
      const data = await response.json();

      if (data.success) {
        setRequests(data.data?.requests || data.requests || []);
      } else {
        throw new Error(data.error);
      }
    } catch (error) {
      console.error("Error fetching requests:", error);
      toast({
        variant: "destructive",
        title: "Erro",
        description: "Falha ao carregar solicitações",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleApprove = async (requestId: string) => {
    try {
      setProcessingId(requestId);
      const response = await fetch(`/api/admin/bet-link-requests/${requestId}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ action: "approve" }),
      });

      const data = await response.json();

      if (data.success) {
        toast({
          title: "Sucesso",
          description: "Solicitação aprovada com sucesso",
        });
        fetchRequests();
      } else {
        throw new Error(data.error);
      }
    } catch (error) {
      console.error("Error approving request:", error);
      toast({
        variant: "destructive",
        title: "Erro",
        description: error instanceof Error ? error.message : "Falha ao aprovar solicitação",
      });
    } finally {
      setProcessingId(null);
    }
  };

  const handleReject = async (requestId: string) => {
    if (!confirm("Tem certeza que deseja rejeitar esta solicitação?")) {
      return;
    }

    try {
      setProcessingId(requestId);
      const response = await fetch(`/api/admin/bet-link-requests/${requestId}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ action: "reject" }),
      });

      const data = await response.json();

      if (data.success) {
        toast({
          title: "Sucesso",
          description: "Solicitação rejeitada",
        });
        fetchRequests();
      } else {
        throw new Error(data.error);
      }
    } catch (error) {
      console.error("Error rejecting request:", error);
      toast({
        variant: "destructive",
        title: "Erro",
        description: error instanceof Error ? error.message : "Falha ao rejeitar solicitação",
      });
    } finally {
      setProcessingId(null);
    }
  };

  useEffect(() => {
    fetchRequests();
  }, [filter]);

  const pendingCount = requests.filter((r) => r.status === "PENDING").length;
  const approvedCount = requests.filter((r) => r.status === "APPROVED").length;
  const rejectedCount = requests.filter((r) => r.status === "REJECTED").length;

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "PENDING":
        return (
          <Badge className="bg-yellow-600 text-white">
            <Clock className="w-3 h-3 mr-1" />
            Pendente
          </Badge>
        );
      case "APPROVED":
        return (
          <Badge className="bg-green-600 text-white">
            <CheckCircle className="w-3 h-3 mr-1" />
            Aprovada
          </Badge>
        );
      case "REJECTED":
        return (
          <Badge className="bg-red-600 text-white">
            <XCircle className="w-3 h-3 mr-1" />
            Rejeitada
          </Badge>
        );
      default:
        return null;
    }
  };

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
                  <Building2 className="w-8 h-8 mr-3 text-blue-400" />
                  Solicitações de Vinculação
                </h1>
                <p className="text-gray-300 mt-1">
                  Gerencie solicitações de usuários para vincular-se a casas de apostas
                </p>
              </div>
            </div>
          </div>
          <Button
            onClick={fetchRequests}
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
          <Card className="bg-gradient-to-br from-yellow-900/50 to-yellow-800/30 border-yellow-700/50 backdrop-blur-xl">
            <CardContent className="pt-6">
              <div className="text-3xl font-bold text-white">
                {pendingCount}
              </div>
              <div className="text-sm text-yellow-200 mt-1">
                Pendentes
              </div>
            </CardContent>
          </Card>
          <Card className="bg-gradient-to-br from-green-900/50 to-green-800/30 border-green-700/50 backdrop-blur-xl">
            <CardContent className="pt-6">
              <div className="text-3xl font-bold text-white">
                {approvedCount}
              </div>
              <div className="text-sm text-green-200 mt-1">
                Aprovadas
              </div>
            </CardContent>
          </Card>
          <Card className="bg-gradient-to-br from-red-900/50 to-red-800/30 border-red-700/50 backdrop-blur-xl">
            <CardContent className="pt-6">
              <div className="text-3xl font-bold text-white">
                {rejectedCount}
              </div>
              <div className="text-sm text-red-200 mt-1">
                Rejeitadas
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Filters */}
        <Card className="bg-gradient-to-br from-gray-900/90 to-gray-800/90 border-gray-700/50 backdrop-blur-xl">
          <CardHeader>
            <CardTitle className="text-white text-lg">Filtros</CardTitle>
          </CardHeader>
          <CardContent>
            <select
              value={filter}
              onChange={(e) => setFilter(e.target.value)}
              className="px-4 py-2 bg-gray-800 border-gray-700 text-white rounded-md border focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="all">Todas</option>
              <option value="PENDING">Pendentes</option>
              <option value="APPROVED">Aprovadas</option>
              <option value="REJECTED">Rejeitadas</option>
            </select>
          </CardContent>
        </Card>

        {/* Requests List */}
        {loading ? (
          <Card className="bg-gradient-to-br from-gray-900/90 to-gray-800/90 border-gray-700/50 backdrop-blur-xl">
            <CardContent className="p-12 text-center text-gray-400">
              Carregando...
            </CardContent>
          </Card>
        ) : requests.length === 0 ? (
          <Card className="bg-gradient-to-br from-gray-900/90 to-gray-800/90 border-gray-700/50 backdrop-blur-xl">
            <CardContent className="p-12 text-center">
              <Building2 className="w-16 h-16 text-gray-600 mx-auto mb-4" />
              <h3 className="text-xl font-semibold text-gray-300 mb-2">
                Nenhuma solicitação encontrada
              </h3>
              <p className="text-gray-400">
                As solicitações aparecerão aqui quando os usuários solicitarem vinculação
              </p>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-4">
            {requests.map((request) => (
              <Card
                key={request.id}
                className="bg-gradient-to-br from-gray-900/90 to-gray-800/90 border-gray-700/50 backdrop-blur-xl hover:border-blue-500/50 transition-all"
              >
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-4">
                      <div className="w-12 h-12 rounded-full bg-gradient-to-br from-blue-600 to-purple-600 flex items-center justify-center">
                        <Building2 className="w-6 h-6 text-white" />
                      </div>
                      <div>
                        <CardTitle className="text-white flex items-center space-x-2">
                          <span>{request.bet.name}</span>
                          {getStatusBadge(request.status)}
                        </CardTitle>
                        <div className="flex items-center space-x-4 mt-1 text-sm text-gray-400">
                          {request.bet.betId && (
                            <div>
                              <span className="text-gray-500">Bet ID:</span>{" "}
                              <span className="text-blue-300">{request.bet.betId}</span>
                            </div>
                          )}
                          <div className="flex items-center space-x-1">
                            <User className="w-4 h-4" />
                            <span>{request.user.name}</span>
                          </div>
                          <div className="flex items-center space-x-1">
                            <Mail className="w-4 h-4" />
                            <span>{request.user.email}</span>
                          </div>
                        </div>
                      </div>
                    </div>
                    {request.status === "PENDING" && (
                      <div className="flex items-center space-x-2">
                        <Button
                          onClick={() => handleApprove(request.id)}
                          disabled={processingId === request.id}
                          className="bg-green-600 hover:bg-green-700 text-white"
                        >
                          <CheckCircle className="w-4 h-4 mr-2" />
                          {processingId === request.id ? "Aprovando..." : "Aprovar"}
                        </Button>
                        <Button
                          onClick={() => handleReject(request.id)}
                          disabled={processingId === request.id}
                          variant="destructive"
                        >
                          <XCircle className="w-4 h-4 mr-2" />
                          Rejeitar
                        </Button>
                      </div>
                    )}
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <span className="text-gray-500">Solicitado em:</span>
                      <span className="text-gray-300 ml-2">
                        {new Date(request.requestedAt).toLocaleDateString("pt-BR")}
                      </span>
                    </div>
                    {request.reviewedAt && (
                      <div>
                        <span className="text-gray-500">Revisado em:</span>
                        <span className="text-gray-300 ml-2">
                          {new Date(request.reviewedAt).toLocaleDateString("pt-BR")}
                        </span>
                      </div>
                    )}
                  </div>
                  {request.notes && (
                    <div className="mt-3 p-3 bg-gray-800/50 rounded-lg">
                      <p className="text-sm text-gray-300">
                        <span className="text-gray-500">Notas:</span> {request.notes}
                      </p>
                    </div>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}


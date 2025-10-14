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
  MoreVertical,
  Trash2,
  Edit,
  UserX,
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useRouter } from "next/navigation";
import Link from "next/link";
import NotificationBell from "@/components/admin/NotificationBell";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
// import {
//   Dialog,
//   DialogContent,
//   DialogDescription,
//   DialogFooter,
//   DialogHeader,
//   DialogTitle,
// } from "@/components/ui/dialog";

interface User {
  id: string;
  name: string;
  email: string;
  cpf: string | null;
  phone?: string | null;
  approvalStatus: "PENDING" | "APPROVED" | "REJECTED";
  kycStatus: "PENDING" | "APPROVED" | "REJECTED";
  emailVerified: boolean;
  createdAt: string;
}

export default function AdminUsersPage() {
  const [users, setUsers] = useState<User[]>([]);
  const [filteredUsers, setFilteredUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [processingUser, setProcessingUser] = useState<string | null>(null);
  const [statusFilter, setStatusFilter] = useState<string>("ALL");
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<User | null>(null);
  const [editFormData, setEditFormData] = useState({
    name: "",
    email: "",
    phone: "",
    cpf: "",
    approvalStatus: "PENDING" as "PENDING" | "APPROVED" | "REJECTED",
    kycStatus: "PENDING" as "PENDING" | "APPROVED" | "REJECTED",
  });
  const [saving, setSaving] = useState(false);
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

  const handleDeleteUser = async (userId: string) => {
    try {
      setProcessingUser(userId);
      const response = await fetch(`/api/admin/users/${userId}/delete`, {
        method: "DELETE",
      });

      const data = await response.json();

      if (response.ok) {
        toast({
          title: "Sucesso",
          description: "Usuário deletado permanentemente",
        });
        fetchUsers();
      } else {
        throw new Error(data.error || "Falha ao deletar usuário");
      }
    } catch (error) {
      console.error("Error deleting user:", error);
      toast({
        variant: "destructive",
        title: "Erro",
        description: "Falha ao deletar usuário",
      });
    } finally {
      setProcessingUser(null);
    }
  };

  const openDeleteDialog = (user: User) => {
    const confirmed = window.confirm(
      `Tem certeza que deseja deletar permanentemente o usuário ${user.name} (${user.email})?\n\nEsta ação não pode ser desfeita e irá deletar todos os dados do usuário.`
    );
    if (confirmed) {
      handleDeleteUser(user.id);
    }
  };

  const handleViewProfile = (userId: string) => {
    router.push(`/admin/users/${userId}`);
  };

  const handleEditUser = (user: User) => {
    setEditingUser(user);
    setEditFormData({
      name: user.name,
      email: user.email,
      phone: user.phone || "",
      cpf: user.cpf || "",
      approvalStatus: user.approvalStatus,
      kycStatus: user.kycStatus,
    });
    setEditDialogOpen(true);
  };

  const handleSaveUser = async () => {
    if (!editingUser) return;

    try {
      setSaving(true);
      const response = await fetch(
        `/api/admin/users/${editingUser.id}/update-profile`,
        {
          method: "PATCH",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(editFormData),
        }
      );

      if (response.ok) {
        toast({
          title: "Success",
          description: "User profile updated successfully",
        });
        setEditDialogOpen(false);
        fetchUsers(); // Refresh the users list
      } else {
        const data = await response.json();
        throw new Error(data.error || "Failed to update user");
      }
    } catch (error) {
      console.error("Error updating user:", error);
      toast({
        variant: "destructive",
        title: "Error",
        description:
          error instanceof Error ? error.message : "Failed to update user",
      });
    } finally {
      setSaving(false);
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
      <div className="min-h-screen bg-black text-white p-8">
        <div className="max-w-6xl mx-auto">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-white mx-auto"></div>
            <p className="mt-2 text-gray-400">Carregando usuários...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-black text-white p-8">
      <div className="max-w-6xl mx-auto space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold">Admin Panel</h1>
            <p className="text-gray-400 mt-1">
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

        {/* Users List */}
        <div className="grid gap-4">
          {filteredUsers.length === 0 ? (
            <Card className="bg-gray-900 border-gray-800">
              <CardContent className="p-8 text-center">
                <User className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-semibold mb-2 text-white">
                  {statusFilter === "ALL"
                    ? "Nenhum usuário encontrado"
                    : `Nenhum usuário ${statusFilter.toLowerCase()} encontrado`}
                </h3>
                <p className="text-gray-400">
                  {statusFilter === "ALL"
                    ? "Não há usuários para exibir no momento."
                    : `Não há usuários com status ${statusFilter.toLowerCase()} no momento.`}
                </p>
              </CardContent>
            </Card>
          ) : (
            filteredUsers.map((user) => (
              <Card
                key={user.id}
                className="hover:shadow-md transition-shadow bg-gray-900 border-gray-800"
              >
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

                    {/* Action Buttons */}
                    <div className="flex items-center space-x-2">
                      {user.approvalStatus === "PENDING" && (
                        <div className="flex items-center space-x-2">
                          <span className="text-xs text-gray-400 mr-2">
                            Ações:
                          </span>
                          <Button
                            size="sm"
                            onClick={() => handleApproval(user.id, "approve")}
                            disabled={processingUser === user.id}
                            className="bg-green-600 hover:bg-green-700 text-white border-0 shadow-sm"
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
                            className="bg-red-600 hover:bg-red-700 border-0 shadow-sm"
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

                      {(user.approvalStatus === "APPROVED" ||
                        user.approvalStatus === "REJECTED") && (
                        <div className="flex items-center space-x-2">
                          <span className="text-xs text-gray-400 mr-2">
                            Ações:
                          </span>
                          <Button
                            size="sm"
                            onClick={() => handleResetToPending(user.id)}
                            disabled={processingUser === user.id}
                            className="bg-orange-600 hover:bg-orange-700 text-white border-0 shadow-sm"
                          >
                            {processingUser === user.id ? (
                              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                            ) : (
                              <>
                                <Clock className="w-4 h-4 mr-1" />
                                Resetar
                              </>
                            )}
                          </Button>
                          <Button
                            size="sm"
                            onClick={() => handleApproval(user.id, "approve")}
                            disabled={processingUser === user.id}
                            className="bg-green-600 hover:bg-green-700 text-white border-0 shadow-sm"
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
                            className="bg-red-600 hover:bg-red-700 border-0 shadow-sm"
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

                    {/* User Menu Dropdown */}
                    <div className="ml-4">
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-8 w-8 p-0 hover:bg-gray-800"
                          >
                            <MoreVertical className="h-4 w-4 text-gray-400" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent
                          align="end"
                          className="bg-gray-900 border-gray-800"
                        >
                          <DropdownMenuItem
                            onClick={() => handleEditUser(user)}
                            className="text-white hover:bg-gray-800 focus:bg-gray-800"
                          >
                            <Edit className="mr-2 h-4 w-4 text-blue-400" />
                            Editar Usuário
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            onClick={() => handleViewProfile(user.id)}
                            className="text-white hover:bg-gray-800 focus:bg-gray-800"
                          >
                            <UserX className="mr-2 h-4 w-4 text-green-400" />
                            Ver Perfil
                          </DropdownMenuItem>
                          <DropdownMenuSeparator className="bg-gray-700" />
                          <DropdownMenuItem
                            className="text-red-400 hover:bg-red-900/20 focus:bg-red-900/20"
                            onClick={() => openDeleteDialog(user)}
                          >
                            <Trash2 className="mr-2 h-4 w-4" />
                            Deletar Usuário
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))
          )}
        </div>
      </div>

      {/* Edit User Modal */}
      <Dialog open={editDialogOpen} onOpenChange={setEditDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Edit User: {editingUser?.name}</DialogTitle>
            <DialogDescription>
              Update user information and status. Changes will be applied
              immediately.
            </DialogDescription>
          </DialogHeader>

          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="edit-name">Full Name</Label>
                <Input
                  id="edit-name"
                  value={editFormData.name}
                  onChange={(e) =>
                    setEditFormData({ ...editFormData, name: e.target.value })
                  }
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="edit-email">Email</Label>
                <Input
                  id="edit-email"
                  type="email"
                  value={editFormData.email}
                  onChange={(e) =>
                    setEditFormData({ ...editFormData, email: e.target.value })
                  }
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="edit-phone">Phone</Label>
                <Input
                  id="edit-phone"
                  value={editFormData.phone}
                  onChange={(e) =>
                    setEditFormData({ ...editFormData, phone: e.target.value })
                  }
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="edit-cpf">CPF</Label>
                <Input
                  id="edit-cpf"
                  value={editFormData.cpf}
                  onChange={(e) =>
                    setEditFormData({ ...editFormData, cpf: e.target.value })
                  }
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="edit-approval-status">Approval Status</Label>
                <Select
                  value={editFormData.approvalStatus}
                  onValueChange={(value: "PENDING" | "APPROVED" | "REJECTED") =>
                    setEditFormData({ ...editFormData, approvalStatus: value })
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="PENDING">Pending</SelectItem>
                    <SelectItem value="APPROVED">Approved</SelectItem>
                    <SelectItem value="REJECTED">Rejected</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="edit-kyc-status">KYC Status</Label>
                <Select
                  value={editFormData.kycStatus}
                  onValueChange={(value: "PENDING" | "APPROVED" | "REJECTED") =>
                    setEditFormData({ ...editFormData, kycStatus: value })
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="PENDING">Pending</SelectItem>
                    <SelectItem value="APPROVED">Approved</SelectItem>
                    <SelectItem value="REJECTED">Rejected</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setEditDialogOpen(false)}
              disabled={saving}
            >
              Cancel
            </Button>
            <Button onClick={handleSaveUser} disabled={saving}>
              {saving ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                  Saving...
                </>
              ) : (
                "Save Changes"
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

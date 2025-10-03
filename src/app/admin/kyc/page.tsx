"use client";

import React, { useState, useEffect, useCallback } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import {
  CheckCircle,
  XCircle,
  Eye,
  Search,
  Filter,
  User,
  AlertCircle,
  Shield,
} from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import ImageAnalysisPanel from "@/components/admin/ImageAnalysisPanel";

interface KYCUser {
  id: string;
  name: string;
  email: string;
  cpf: string;
  documentType: string;
  documentNumber: string;
  documentFront: string;
  documentBack: string;
  documentSelfie: string;
  kycStatus: "PENDING" | "APPROVED" | "REJECTED";
  kycSubmittedAt: string;
  kycReviewedAt?: string;
  kycRejectionReason?: string;
  createdAt: string;
}

const AdminKYCPage = () => {
  const [users, setUsers] = useState<KYCUser[]>([]);
  const [filteredUsers, setFilteredUsers] = useState<KYCUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("ALL");
  const [, setSelectedUser] = useState<KYCUser | null>(null);
  const [rejectionReason, setRejectionReason] = useState("");
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  const { toast } = useToast();

  const fetchUsers = useCallback(async () => {
    try {
      setLoading(true);
      const response = await fetch("/api/admin/kyc");
      const data = await response.json();

      if (response.ok) {
        setUsers(data.users);
      } else {
        throw new Error(data.error || "Failed to fetch users");
      }
    } catch (error) {
      console.error("Error fetching users:", error);
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to fetch users",
      });
    } finally {
      setLoading(false);
    }
  }, [toast]);

  const filterUsers = useCallback(() => {
    let filtered = users;

    // Filter by search term
    if (searchTerm) {
      filtered = filtered.filter(
        (user) =>
          user.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
          user.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
          user.cpf.includes(searchTerm)
      );
    }

    // Filter by status
    if (statusFilter !== "ALL") {
      filtered = filtered.filter((user) => user.kycStatus === statusFilter);
    }

    setFilteredUsers(filtered);
  }, [users, searchTerm, statusFilter]);

  useEffect(() => {
    fetchUsers();
  }, [fetchUsers]);

  useEffect(() => {
    filterUsers();
  }, [filterUsers]);

  const handleApprove = async (userId: string) => {
    try {
      setActionLoading(userId);
      const response = await fetch(`/api/admin/kyc/${userId}/approve`, {
        method: "POST",
      });

      const data = await response.json();

      if (response.ok) {
        toast({
          title: "Success",
          description: "User KYC approved successfully",
        });
        fetchUsers();
        setSelectedUser(null);
      } else {
        throw new Error(data.error || "Failed to approve KYC");
      }
    } catch (error) {
      console.error("Error approving KYC:", error);
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to approve KYC",
      });
    } finally {
      setActionLoading(null);
    }
  };

  const handleReject = async (userId: string) => {
    if (!rejectionReason.trim()) {
      toast({
        variant: "destructive",
        title: "Rejection reason required",
        description: "Please provide a reason for rejection",
      });
      return;
    }

    try {
      setActionLoading(userId);
      const response = await fetch(`/api/admin/kyc/${userId}/reject`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ reason: rejectionReason }),
      });

      const data = await response.json();

      if (response.ok) {
        toast({
          title: "Success",
          description: "User KYC rejected successfully",
        });
        fetchUsers();
        setSelectedUser(null);
        setRejectionReason("");
      } else {
        throw new Error(data.error || "Failed to reject KYC");
      }
    } catch (error) {
      console.error("Error rejecting KYC:", error);
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to reject KYC",
      });
    } finally {
      setActionLoading(null);
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "PENDING":
        return (
          <Badge variant="secondary" className="bg-yellow-600 text-white">
            Pending
          </Badge>
        );
      case "APPROVED":
        return (
          <Badge variant="secondary" className="bg-green-600 text-white">
            Approved
          </Badge>
        );
      case "REJECTED":
        return (
          <Badge variant="secondary" className="bg-red-600 text-white">
            Rejected
          </Badge>
        );
      default:
        return (
          <Badge variant="secondary" className="bg-gray-600 text-white">
            Unknown
          </Badge>
        );
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("pt-BR", {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-900 flex items-center justify-center">
        <div className="text-center">
          <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-300">Loading users...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-900 p-6">
      <div className="max-w-7xl mx-auto">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-white mb-2">
            KYC Verification
          </h1>
          <p className="text-gray-300">
            Review and verify user identity documents
          </p>
        </div>

        {/* Filters */}
        <Card className="mb-6 bg-gray-800 border-gray-700">
          <CardContent className="p-6">
            <div className="flex flex-col md:flex-row gap-4">
              <div className="flex-1">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                  <Input
                    placeholder="Search by name, email, or CPF..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10 bg-gray-700 border-gray-600 text-white placeholder:text-gray-400"
                  />
                </div>
              </div>
              <div className="w-full md:w-48">
                <Select value={statusFilter} onValueChange={setStatusFilter}>
                  <SelectTrigger className="bg-gray-700 border-gray-600 text-white">
                    <Filter className="w-4 h-4 mr-2" />
                    <SelectValue placeholder="Filter by status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="ALL">All Status</SelectItem>
                    <SelectItem value="PENDING">Pending</SelectItem>
                    <SelectItem value="APPROVED">Approved</SelectItem>
                    <SelectItem value="REJECTED">Rejected</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Users List */}
        <div className="grid gap-4">
          {filteredUsers.length === 0 ? (
            <Card className="bg-gray-800 border-gray-700">
              <CardContent className="p-8 text-center">
                <AlertCircle className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-white mb-2">
                  No users found
                </h3>
                <p className="text-gray-300">
                  {searchTerm || statusFilter !== "ALL"
                    ? "Try adjusting your search or filter criteria"
                    : "No users have submitted KYC documents yet"}
                </p>
              </CardContent>
            </Card>
          ) : (
            filteredUsers.map((user) => (
              <Card
                key={user.id}
                className="hover:shadow-md transition-shadow bg-gray-800 border-gray-700"
              >
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-4">
                      <div className="w-12 h-12 bg-blue-600 rounded-full flex items-center justify-center">
                        <User className="w-6 h-6 text-white" />
                      </div>
                      <div>
                        <h3 className="font-medium text-white">{user.name}</h3>
                        <p className="text-sm text-gray-300">{user.email}</p>
                        <p className="text-xs text-gray-400">CPF: {user.cpf}</p>
                      </div>
                    </div>

                    <div className="flex items-center space-x-4">
                      <div className="text-right">
                        <div className="mb-1">
                          {getStatusBadge(user.kycStatus)}
                        </div>
                        <p className="text-xs text-gray-400">
                          Submitted: {formatDate(user.kycSubmittedAt)}
                        </p>
                        {user.kycReviewedAt && (
                          <p className="text-xs text-gray-400">
                            Reviewed: {formatDate(user.kycReviewedAt)}
                          </p>
                        )}
                      </div>

                      <div className="flex space-x-2">
                        <Dialog>
                          <DialogTrigger asChild>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => setSelectedUser(user)}
                              className="border-gray-600 text-white hover:bg-gray-700"
                            >
                              <Eye className="w-4 h-4 mr-1" />
                              Review
                            </Button>
                          </DialogTrigger>
                          <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto bg-gray-800 border-gray-700">
                            <DialogHeader>
                              <DialogTitle className="text-white">
                                KYC Document Review - {user.name}
                              </DialogTitle>
                            </DialogHeader>

                            <div className="space-y-6">
                              {/* User Info */}
                              <div className="grid grid-cols-2 gap-4 p-4 bg-gray-700 rounded-lg">
                                <div>
                                  <label className="text-sm font-medium text-gray-300">
                                    Name
                                  </label>
                                  <p className="text-sm text-white">
                                    {user.name}
                                  </p>
                                </div>
                                <div>
                                  <label className="text-sm font-medium text-gray-300">
                                    Email
                                  </label>
                                  <p className="text-sm text-white">
                                    {user.email}
                                  </p>
                                </div>
                                <div>
                                  <label className="text-sm font-medium text-gray-300">
                                    CPF
                                  </label>
                                  <p className="text-sm text-white">
                                    {user.cpf}
                                  </p>
                                </div>
                                <div>
                                  <label className="text-sm font-medium text-gray-300">
                                    Document Type
                                  </label>
                                  <p className="text-sm text-white">
                                    {user.documentType}
                                  </p>
                                </div>
                                <div>
                                  <label className="text-sm font-medium text-gray-300">
                                    Document Number
                                  </label>
                                  <p className="text-sm text-white">
                                    {user.documentNumber}
                                  </p>
                                </div>
                                <div>
                                  <label className="text-sm font-medium text-gray-300">
                                    Status
                                  </label>
                                  <div className="mt-1">
                                    {getStatusBadge(user.kycStatus)}
                                  </div>
                                </div>
                              </div>

                              {/* Documents */}
                              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                <div>
                                  <h4 className="font-medium text-white mb-2">
                                    Document Front
                                  </h4>
                                  <img
                                    src={user.documentFront}
                                    alt="Document Front"
                                    className="w-full h-48 object-cover rounded-lg border border-gray-600"
                                  />
                                </div>
                                <div>
                                  <h4 className="font-medium text-white mb-2">
                                    Document Back
                                  </h4>
                                  <img
                                    src={user.documentBack}
                                    alt="Document Back"
                                    className="w-full h-48 object-cover rounded-lg border border-gray-600"
                                  />
                                </div>
                                <div>
                                  <h4 className="font-medium text-white mb-2">
                                    Selfie with Document
                                  </h4>
                                  <img
                                    src={user.documentSelfie}
                                    alt="Selfie with Document"
                                    className="w-full h-48 object-cover rounded-lg border border-gray-600"
                                  />
                                </div>
                              </div>

                              {/* Image Analysis */}
                              <div className="mt-6">
                                <h4 className="font-medium text-white mb-4 flex items-center gap-2">
                                  <Shield className="w-5 h-5" />
                                  Fraud Detection Analysis
                                </h4>
                                <ImageAnalysisPanel
                                  documentFront={user.documentFront}
                                  documentBack={user.documentBack}
                                  selfie={user.documentSelfie}
                                  onAnalysisComplete={(result) => {
                                    console.log("Analysis complete:", result);
                                  }}
                                />
                              </div>

                              {/* Actions */}
                              {user.kycStatus === "PENDING" && (
                                <div className="flex space-x-4 pt-4 border-t border-gray-600">
                                  <Button
                                    onClick={() => handleApprove(user.id)}
                                    disabled={actionLoading === user.id}
                                    className="bg-green-600 hover:bg-green-700"
                                  >
                                    <CheckCircle className="w-4 h-4 mr-2" />
                                    Approve
                                  </Button>
                                  <Dialog>
                                    <DialogTrigger asChild>
                                      <Button variant="destructive">
                                        <XCircle className="w-4 h-4 mr-2" />
                                        Reject
                                      </Button>
                                    </DialogTrigger>
                                    <DialogContent className="bg-gray-800 border-gray-700">
                                      <DialogHeader>
                                        <DialogTitle className="text-white">
                                          Reject KYC Verification
                                        </DialogTitle>
                                      </DialogHeader>
                                      <div className="space-y-4">
                                        <div>
                                          <label className="text-sm font-medium text-gray-300">
                                            Rejection Reason
                                          </label>
                                          <textarea
                                            value={rejectionReason}
                                            onChange={(e) =>
                                              setRejectionReason(e.target.value)
                                            }
                                            placeholder="Please provide a reason for rejection..."
                                            className="w-full mt-1 p-3 border border-gray-600 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-gray-700 text-white placeholder:text-gray-400"
                                            rows={4}
                                          />
                                        </div>
                                        <div className="flex justify-end space-x-2">
                                          <Button
                                            variant="outline"
                                            onClick={() =>
                                              setRejectionReason("")
                                            }
                                            className="border-gray-600 text-white hover:bg-gray-700"
                                          >
                                            Cancel
                                          </Button>
                                          <Button
                                            variant="destructive"
                                            onClick={() =>
                                              handleReject(user.id)
                                            }
                                            disabled={
                                              actionLoading === user.id ||
                                              !rejectionReason.trim()
                                            }
                                          >
                                            Reject KYC
                                          </Button>
                                        </div>
                                      </div>
                                    </DialogContent>
                                  </Dialog>
                                </div>
                              )}

                              {user.kycStatus === "REJECTED" &&
                                user.kycRejectionReason && (
                                  <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
                                    <h4 className="font-medium text-red-900 mb-2">
                                      Rejection Reason
                                    </h4>
                                    <p className="text-sm text-red-700">
                                      {user.kycRejectionReason}
                                    </p>
                                  </div>
                                )}
                            </div>
                          </DialogContent>
                        </Dialog>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))
          )}
        </div>
      </div>
    </div>
  );
};

export default AdminKYCPage;

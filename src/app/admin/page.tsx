"use client";

import React, { useState, useEffect, useCallback } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Users,
  FileText,
  CheckCircle,
  Clock,
  TrendingUp,
  Shield,
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useRouter } from "next/navigation";
import Link from "next/link";
import NotificationBell from "@/components/admin/NotificationBell";

interface DashboardStats {
  totalUsers: number;
  pendingApprovals: number;
  approvedUsers: number;
  rejectedUsers: number;
  pendingKYC: number;
  approvedKYC: number;
  rejectedKYC: number;
}

export default function AdminDashboard() {
  const [stats, setStats] = useState<DashboardStats>({
    totalUsers: 0,
    pendingApprovals: 0,
    approvedUsers: 0,
    rejectedUsers: 0,
    pendingKYC: 0,
    approvedKYC: 0,
    rejectedKYC: 0,
  });
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();
  const router = useRouter();

  const fetchStats = useCallback(async () => {
    try {
      setLoading(true);

      // Fetch user stats
      const usersResponse = await fetch("/api/admin/users");
      const usersData = usersResponse.ok
        ? await usersResponse.json()
        : { users: [] };
      const users = usersData.users || [];

      // Fetch KYC stats
      const kycResponse = await fetch("/api/admin/kyc");
      const kycData = kycResponse.ok ? await kycResponse.json() : { users: [] };
      const kycUsers = kycData.users || [];

      const newStats: DashboardStats = {
        totalUsers: users.length,
        pendingApprovals: users.filter(
          (u: { approvalStatus: string }) => u.approvalStatus === "PENDING"
        ).length,
        approvedUsers: users.filter(
          (u: { approvalStatus: string }) => u.approvalStatus === "APPROVED"
        ).length,
        rejectedUsers: users.filter(
          (u: { approvalStatus: string }) => u.approvalStatus === "REJECTED"
        ).length,
        pendingKYC: kycUsers.filter(
          (u: { kycStatus: string }) => u.kycStatus === "PENDING"
        ).length,
        approvedKYC: kycUsers.filter(
          (u: { kycStatus: string }) => u.kycStatus === "APPROVED"
        ).length,
        rejectedKYC: kycUsers.filter(
          (u: { kycStatus: string }) => u.kycStatus === "REJECTED"
        ).length,
      };

      setStats(newStats);
    } catch (error) {
      console.error("Error fetching stats:", error);
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to load dashboard statistics",
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
      <div className="min-h-screen bg-black flex items-center justify-center">
        <div className="text-white">Loading dashboard...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-black text-white p-8">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-white">Admin Dashboard</h1>
            <p className="text-gray-300 mt-1">BS Market Administration Panel</p>
          </div>
          <div className="flex items-center space-x-2">
            <NotificationBell className="text-white hover:text-blue-400" />
            <Button
              onClick={fetchStats}
              variant="outline"
              className="border-gray-700 text-white hover:bg-gray-800"
            >
              <TrendingUp className="w-4 h-4 mr-2" />
              Refresh
            </Button>
            <Button onClick={handleLogout} variant="destructive">
              <Shield className="w-4 h-4 mr-2" />
              Logout
            </Button>
          </div>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {/* Total Users */}
          <Link href="/admin/users">
            <Card className="bg-gray-900 border-gray-800 hover:bg-gray-800 hover:border-blue-500 transition-all duration-200 cursor-pointer group">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium text-gray-300 group-hover:text-white">
                  Total Users
                </CardTitle>
                <Users className="h-4 w-4 text-blue-400 group-hover:text-blue-300" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-white group-hover:text-blue-100">
                  {stats.totalUsers}
                </div>
                <p className="text-xs text-gray-400 mt-1 group-hover:text-gray-300">
                  Click to manage users
                </p>
              </CardContent>
            </Card>
          </Link>

          {/* Pending Approvals */}
          <Link href="/admin/users">
            <Card className="bg-gray-900 border-gray-800 hover:bg-gray-800 hover:border-yellow-500 transition-all duration-200 cursor-pointer group">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium text-gray-300 group-hover:text-white">
                  Pending Approvals
                </CardTitle>
                <Clock className="h-4 w-4 text-yellow-400 group-hover:text-yellow-300" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-white group-hover:text-yellow-100">
                  {stats.pendingApprovals}
                </div>
                <p className="text-xs text-gray-400 mt-1 group-hover:text-gray-300">
                  Click to review approvals
                </p>
              </CardContent>
            </Card>
          </Link>

          {/* Approved Users */}
          <Link href="/admin/users">
            <Card className="bg-gray-900 border-gray-800 hover:bg-gray-800 hover:border-green-500 transition-all duration-200 cursor-pointer group">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium text-gray-300 group-hover:text-white">
                  Approved Users
                </CardTitle>
                <CheckCircle className="h-4 w-4 text-green-400 group-hover:text-green-300" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-white group-hover:text-green-100">
                  {stats.approvedUsers}
                </div>
                <p className="text-xs text-gray-400 mt-1 group-hover:text-gray-300">
                  Click to view approved users
                </p>
              </CardContent>
            </Card>
          </Link>

          {/* Pending KYC */}
          <Link href="/admin/kyc">
            <Card className="bg-gray-900 border-gray-800 hover:bg-gray-800 hover:border-orange-500 transition-all duration-200 cursor-pointer group">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium text-gray-300 group-hover:text-white">
                  Pending KYC
                </CardTitle>
                <FileText className="h-4 w-4 text-orange-400 group-hover:text-orange-300" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-white group-hover:text-orange-100">
                  {stats.pendingKYC}
                </div>
                <p className="text-xs text-gray-400 mt-1 group-hover:text-gray-300">
                  Click to review KYC documents
                </p>
              </CardContent>
            </Card>
          </Link>
        </div>

        {/* Quick Actions */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <Card className="bg-gray-900 border-gray-800">
            <CardHeader>
              <CardTitle className="text-white">User Management</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-gray-300">
                Manage user accounts, approve registrations, and handle
                user-related issues.
              </p>
              <div className="flex space-x-2">
                <Link href="/admin/users">
                  <Button className="bg-blue-600 hover:bg-blue-700 text-white">
                    <Users className="w-4 h-4 mr-2" />
                    Manage Users
                  </Button>
                </Link>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-gray-900 border-gray-800">
            <CardHeader>
              <CardTitle className="text-white">KYC Verification</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-gray-300">
                Review identity documents and verify user identities for
                compliance.
              </p>
              <div className="flex space-x-2">
                <Link href="/admin/kyc">
                  <Button className="bg-green-600 hover:bg-green-700 text-white">
                    <FileText className="w-4 h-4 mr-2" />
                    Review Documents
                  </Button>
                </Link>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Recent Activity Summary */}
        <Card className="bg-gray-900 border-gray-800">
          <CardHeader>
            <CardTitle className="text-white">System Status</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="text-center">
                <div className="flex items-center justify-center mb-2">
                  <CheckCircle className="h-6 w-6 text-green-400 mr-2" />
                  <div className="text-2xl font-bold text-green-400">
                    {stats.approvedUsers}
                  </div>
                </div>
                <div className="text-sm text-gray-300">Approved Users</div>
              </div>
              <div className="text-center">
                <div className="flex items-center justify-center mb-2">
                  <Clock className="h-6 w-6 text-yellow-400 mr-2" />
                  <div className="text-2xl font-bold text-yellow-400">
                    {stats.pendingApprovals}
                  </div>
                </div>
                <div className="text-sm text-gray-300">Pending Approvals</div>
              </div>
              <div className="text-center">
                <div className="flex items-center justify-center mb-2">
                  <FileText className="h-6 w-6 text-orange-400 mr-2" />
                  <div className="text-2xl font-bold text-orange-400">
                    {stats.pendingKYC}
                  </div>
                </div>
                <div className="text-sm text-gray-300">Pending KYC</div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

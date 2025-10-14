"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import {
  Bell,
  Users,
  FileText,
  Clock,
  CheckCircle,
  ArrowLeft,
  RefreshCw,
  Eye,
} from "lucide-react";

interface Notification {
  id: string;
  type: "new_user" | "kyc_pending" | "approval_needed";
  title: string;
  message: string;
  timestamp: string;
  read: boolean;
  userId?: string;
}

export default function AdminNotificationsPage() {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);
  const [markingAllRead, setMarkingAllRead] = useState(false);
  const { toast } = useToast();
  const router = useRouter();

  useEffect(() => {
    fetchNotifications();
  }, []);

  const fetchNotifications = async () => {
    try {
      setLoading(true);
      const response = await fetch("/api/admin/notifications");
      if (response.ok) {
        const data = await response.json();
        setNotifications(data.notifications || []);
      } else {
        toast({
          variant: "destructive",
          title: "Error",
          description: "Failed to load notifications",
        });
      }
    } catch (error) {
      console.error("Error fetching notifications:", error);
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to load notifications",
      });
    } finally {
      setLoading(false);
    }
  };

  const markAllAsRead = async () => {
    try {
      setMarkingAllRead(true);
      const response = await fetch("/api/admin/notifications/read-all", {
        method: "PATCH",
      });

      if (response.ok) {
        toast({
          title: "Success",
          description: "All notifications marked as read",
        });
        fetchNotifications(); // Refresh the list
      } else {
        throw new Error("Failed to mark all notifications as read");
      }
    } catch (error) {
      console.error("Error marking all notifications as read:", error);
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to mark all notifications as read",
      });
    } finally {
      setMarkingAllRead(false);
    }
  };

  const markAsRead = async (notificationId: string) => {
    try {
      const response = await fetch(
        `/api/admin/notifications/${notificationId}/read`,
        {
          method: "PATCH",
        }
      );

      if (response.ok) {
        setNotifications((prev) =>
          prev.map((notif) =>
            notif.id === notificationId ? { ...notif, read: true } : notif
          )
        );
      }
    } catch (error) {
      console.error("Error marking notification as read:", error);
    }
  };

  const handleNotificationClick = (notification: Notification) => {
    markAsRead(notification.id);

    // Navigate based on notification type
    switch (notification.type) {
      case "new_user":
      case "approval_needed":
        router.push("/admin/users");
        break;
      case "kyc_pending":
        router.push("/admin/kyc");
        break;
    }
  };

  const getNotificationIcon = (type: string) => {
    switch (type) {
      case "new_user":
        return <Users className="w-5 h-5 text-blue-500" />;
      case "kyc_pending":
        return <FileText className="w-5 h-5 text-orange-500" />;
      case "approval_needed":
        return <Clock className="w-5 h-5 text-yellow-500" />;
      default:
        return <Bell className="w-5 h-5 text-gray-500" />;
    }
  };

  const formatTimeAgo = (timestamp: string) => {
    const now = new Date();
    const notificationTime = new Date(timestamp);
    const diffInMinutes = Math.floor(
      (now.getTime() - notificationTime.getTime()) / (1000 * 60)
    );

    if (diffInMinutes < 1) return "Just now";
    if (diffInMinutes < 60) return `${diffInMinutes}m ago`;
    if (diffInMinutes < 1440) return `${Math.floor(diffInMinutes / 60)}h ago`;
    return `${Math.floor(diffInMinutes / 1440)}d ago`;
  };

  const unreadCount = notifications.filter((n) => !n.read).length;

  if (loading) {
    return (
      <div className="min-h-screen bg-black p-6 text-white">
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-white mx-auto mb-4"></div>
            <p>Loading notifications...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-900 p-6 text-white">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center space-x-4">
            <Button
              variant="outline"
              onClick={() => router.push("/admin")}
              className="border-gray-600 text-white hover:bg-gray-800"
            >
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to Dashboard
            </Button>
            <div>
              <h1 className="text-3xl font-bold flex items-center gap-2">
                <Bell className="w-8 h-8" />
                Notifications
              </h1>
              <p className="text-gray-400">
                {notifications.length} total notifications, {unreadCount} unread
              </p>
            </div>
          </div>
          <div className="flex items-center space-x-2">
            <Button
              variant="outline"
              onClick={fetchNotifications}
              className="border-gray-600 text-white hover:bg-gray-800"
            >
              <RefreshCw className="w-4 h-4 mr-2" />
              Refresh
            </Button>
            {unreadCount > 0 && (
              <Button
                onClick={markAllAsRead}
                disabled={markingAllRead}
                className="bg-blue-600 hover:bg-blue-700 text-white"
              >
                {markingAllRead ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                    Marking...
                  </>
                ) : (
                  <>
                    <CheckCircle className="w-4 h-4 mr-2" />
                    Mark All Read
                  </>
                )}
              </Button>
            )}
          </div>
        </div>

        {/* Notifications List */}
        <div className="space-y-4">
          {notifications.length === 0 ? (
            <Card className="bg-gray-900 border-gray-800">
              <CardContent className="p-8 text-center">
                <Bell className="w-16 h-16 text-gray-500 mx-auto mb-4" />
                <h3 className="text-xl font-semibold mb-2">No Notifications</h3>
                <p className="text-gray-400">
                  You&apos;re all caught up! No new notifications at the moment.
                </p>
              </CardContent>
            </Card>
          ) : (
            notifications.map((notification) => (
              <Card
                key={notification.id}
                className={`bg-gray-900 border-gray-800 hover:bg-gray-800 transition-colors cursor-pointer ${
                  !notification.read ? "bg-blue-900/20 border-blue-500/30" : ""
                }`}
                onClick={() => handleNotificationClick(notification)}
              >
                <CardContent className="p-4">
                  <div className="flex items-start space-x-4">
                    <div className="flex-shrink-0 mt-1">
                      {getNotificationIcon(notification.type)}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between mb-2">
                        <h3 className="text-lg font-semibold text-white">
                          {notification.title}
                        </h3>
                        <div className="flex items-center space-x-2">
                          {!notification.read && (
                            <Badge className="bg-blue-600 text-white">
                              <Eye className="w-3 h-3 mr-1" />
                              New
                            </Badge>
                          )}
                          <span className="text-sm text-gray-400">
                            {formatTimeAgo(notification.timestamp)}
                          </span>
                        </div>
                      </div>
                      <p className="text-gray-300 mb-2">
                        {notification.message}
                      </p>
                      <div className="flex items-center space-x-4 text-sm text-gray-400">
                        <span className="capitalize">
                          {notification.type.replace("_", " ")}
                        </span>
                        {notification.userId && (
                          <span>User ID: {notification.userId}</span>
                        )}
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))
          )}
        </div>

        {/* Summary Stats */}
        {notifications.length > 0 && (
          <Card className="bg-gray-800 border-gray-700 mt-6">
            <CardHeader>
              <CardTitle className="text-white">Notification Summary</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="text-center">
                  <div className="text-2xl font-bold text-blue-400">
                    {notifications.filter((n) => n.type === "new_user").length}
                  </div>
                  <div className="text-sm text-gray-400">New Users</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-orange-400">
                    {
                      notifications.filter((n) => n.type === "kyc_pending")
                        .length
                    }
                  </div>
                  <div className="text-sm text-gray-400">KYC Pending</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-yellow-400">
                    {
                      notifications.filter((n) => n.type === "approval_needed")
                        .length
                    }
                  </div>
                  <div className="text-sm text-gray-400">Approval Needed</div>
                </div>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}

"use client";

import React, { useState, useEffect } from "react";
import { Bell, Clock, FileText, Users } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useToast } from "@/hooks/use-toast";
import { useRouter } from "next/navigation";

interface Notification {
  id: string;
  type: "new_user" | "kyc_pending" | "approval_needed";
  title: string;
  message: string;
  timestamp: string;
  read: boolean;
  userId?: string;
}

interface NotificationBellProps {
  className?: string;
}

export const NotificationBell: React.FC<NotificationBellProps> = ({
  className = "",
}) => {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [isOpen, setIsOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();
  const router = useRouter();

  const fetchNotifications = async () => {
    try {
      setLoading(true);
      const response = await fetch("/api/admin/notifications?showAll=true");
      if (response.ok) {
        const data = await response.json();
        console.log("NotificationBell: Fetched notifications:", data);
        setNotifications(data.notifications || []);
        setUnreadCount(data.unreadCount || 0);
      } else {
        console.error(
          "NotificationBell: Failed to fetch notifications:",
          response.status
        );
      }
    } catch (error) {
      console.error("Error fetching notifications:", error);
    } finally {
      setLoading(false);
    }
  };

  const markAsRead = async () => {
    try {
      const response = await fetch("/api/admin/notifications/read-all", {
        method: "PATCH",
      });

      if (response.ok) {
        // Re-fetch notifications to get updated read status from server
        await fetchNotifications();
      }
    } catch (error) {
      console.error("Error marking notification as read:", error);
    }
  };

  const markAllAsRead = async () => {
    try {
      const response = await fetch("/api/admin/notifications/read-all", {
        method: "PATCH",
      });

      if (response.ok) {
        toast({
          title: "Notifications marked as read",
          description: "All notifications have been marked as read",
        });

        // Re-fetch notifications to get updated read status from server
        await fetchNotifications();
      }
    } catch (error) {
      console.error("Error marking all notifications as read:", error);
    }
  };

  const getNotificationIcon = (type: string) => {
    switch (type) {
      case "new_user":
        return <Users className="w-4 h-4 text-blue-500" />;
      case "kyc_pending":
        return <FileText className="w-4 h-4 text-orange-500" />;
      case "approval_needed":
        return <Clock className="w-4 h-4 text-yellow-500" />;
      default:
        return <Bell className="w-4 h-4 text-gray-500" />;
    }
  };

  const getNotificationColor = (type: string) => {
    switch (type) {
      case "new_user":
        return "border-l-blue-500";
      case "kyc_pending":
        return "border-l-orange-500";
      case "approval_needed":
        return "border-l-yellow-500";
      default:
        return "border-l-gray-500";
    }
  };

  const handleNotificationClick = (notification: Notification) => {
    // Mark as read on server
    markAsRead();

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
    setIsOpen(false);
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

  useEffect(() => {
    fetchNotifications();

    // Poll for new notifications every 30 seconds
    const interval = setInterval(fetchNotifications, 30000);

    return () => clearInterval(interval);
  }, []);

  return (
    <DropdownMenu open={isOpen} onOpenChange={setIsOpen}>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="sm" className={`relative ${className}`}>
          <Bell className="w-5 h-5" />
          {unreadCount > 0 && (
            <Badge
              variant="destructive"
              className="absolute -top-1 -right-1 h-5 w-5 flex items-center justify-center p-0 text-xs"
            >
              {unreadCount > 99 ? "99+" : unreadCount}
            </Badge>
          )}
        </Button>
      </DropdownMenuTrigger>

      <DropdownMenuContent
        align="end"
        className="w-96 max-h-[600px] overflow-y-auto"
        sideOffset={5}
      >
        <div className="p-4 border-b">
          <div className="flex items-center justify-between">
            <h3 className="font-semibold text-sm">Notifications</h3>
            {unreadCount > 0 && (
              <Button
                variant="ghost"
                size="sm"
                onClick={markAllAsRead}
                className="text-xs h-6 px-2"
              >
                Mark all read
              </Button>
            )}
          </div>
        </div>

        <div className="max-h-[500px] overflow-y-auto">
          {loading ? (
            <div className="p-4 text-center text-sm text-muted-foreground">
              Loading notifications...
            </div>
          ) : notifications.length === 0 ? (
            <div className="p-4 text-center text-sm text-muted-foreground">
              No notifications
            </div>
          ) : (
            <>
              {/* New notifications section */}
              {notifications.filter((n) => !n.read).length > 0 && (
                <>
                  <div className="px-3 py-2 bg-blue-50 border-b">
                    <h4 className="text-xs font-semibold text-blue-700 uppercase tracking-wide">
                      New ({notifications.filter((n) => !n.read).length})
                    </h4>
                  </div>
                  {notifications
                    .filter((n) => !n.read)
                    .map((notification) => (
                      <div
                        key={notification.id}
                        className={`p-3 border-l-4 cursor-pointer ${getNotificationColor(
                          notification.type
                        )}`}
                        onClick={() => handleNotificationClick(notification)}
                      >
                        <div className="flex items-start space-x-3">
                          <div className="flex-shrink-0 mt-0.5">
                            {getNotificationIcon(notification.type)}
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center justify-between">
                              <p className="text-sm font-medium text-foreground">
                                {notification.title}
                              </p>
                              <div className="w-2 h-2 bg-blue-500 rounded-full flex-shrink-0" />
                            </div>
                            <p className="text-xs text-muted-foreground mt-1">
                              {notification.message}
                            </p>
                            <p className="text-xs text-muted-foreground mt-1">
                              {formatTimeAgo(notification.timestamp)}
                            </p>
                          </div>
                        </div>
                      </div>
                    ))}
                </>
              )}

              {/* Older notifications section */}
              {notifications.filter((n) => n.read).length > 0 && (
                <>
                  {notifications.filter((n) => !n.read).length > 0 && (
                    <div className="px-3 py-2 bg-gray-50 border-b">
                      <h4 className="text-xs font-semibold text-gray-600 uppercase tracking-wide">
                        Earlier ({notifications.filter((n) => n.read).length})
                      </h4>
                    </div>
                  )}
                  {notifications
                    .filter((n) => n.read)
                    .map((notification) => (
                      <div
                        key={notification.id}
                        className={`p-3 cursor-pointer`}
                        onClick={() => handleNotificationClick(notification)}
                      >
                        <div className="flex items-start space-x-3">
                          <div className="flex-shrink-0 mt-0.5">
                            {getNotificationIcon(notification.type)}
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center justify-between">
                              <p className="text-sm font-medium text-foreground">
                                {notification.title}
                              </p>
                            </div>
                            <p className="text-xs text-muted-foreground mt-1">
                              {notification.message}
                            </p>
                            <p className="text-xs text-muted-foreground mt-1">
                              {formatTimeAgo(notification.timestamp)}
                            </p>
                          </div>
                        </div>
                      </div>
                    ))}
                </>
              )}
            </>
          )}
        </div>
      </DropdownMenuContent>
    </DropdownMenu>
  );
};

export default NotificationBell;

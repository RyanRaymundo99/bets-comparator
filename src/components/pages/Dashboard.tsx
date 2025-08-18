"use client";
import React, { useState, useEffect, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import NavbarNew from "@/components/ui/navbar-new";
import { useRouter } from "next/navigation";
import { useToast } from "@/hooks/use-toast";
import { SessionManager } from "@/lib/session";
import { isLocalhostDev } from "@/lib/utils";
import { authClient } from "@/lib/auth-client";
import { PortfolioOverview } from "@/components/portfolio/PortfolioOverview";
import { TradingInterface } from "@/components/trading/TradingInterface";

export default function Dashboard() {
  const [isLoggingOut, setIsLoggingOut] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [isDevMode, setIsDevMode] = useState(false);
  const router = useRouter();
  const { toast } = useToast();

  // Memoize the auth check function
  const checkAuth = useCallback(() => {
    if (isLocalhostDev()) {
      const sessionInfo = SessionManager.getSessionInfo();

      if (sessionInfo.isValid && sessionInfo.user) {
        setIsDevMode(true);
        setIsLoading(false);

        // Check if dev toast has been shown for this session
        const hasShown = localStorage.getItem("dev-toast-shown");

        // Show simple dev mode indicator only if not shown before
        if (hasShown !== "true") {
          toast({
            title: "⚠️ Developer Mode",
            description: "Logged in as developer",
            variant: "default",
          });
          localStorage.setItem("dev-toast-shown", "true");
        }
      } else {
        // No valid session, redirect to login
        if (sessionInfo.user) {
          toast({
            title: "Session Expired",
            description: "Your session has expired. Please log in again.",
            variant: "destructive",
          });
        }
        router.push("/login");
      }
    } else {
      // Production: check real session
      authClient.getSession().then((session) => {
        if (!session) {
          router.push("/login");
        } else {
          setIsLoading(false);
        }
      });
    }
  }, [router, toast]);

  useEffect(() => {
    // Small delay to ensure localStorage is available
    const timeoutId = setTimeout(checkAuth, 100);

    return () => {
      clearTimeout(timeoutId);
    };
  }, [checkAuth]);

  const handleLogout = useCallback(async () => {
    setIsLoggingOut(true);
    try {
      // Clear dev session if in dev mode
      if (isDevMode) {
        SessionManager.clearSession();
        // Clear the toast flag so it shows again on next login
        localStorage.removeItem("dev-toast-shown");
      }
      window.location.href = "/login";
    } finally {
      setIsLoggingOut(false);
    }
  }, [isDevMode]);

  // Show loading state
  if (isLoading) {
    return (
      <div className="min-h-screen bg-black text-white flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-white mx-auto mb-4"></div>
          <p className="text-gray-300">Verificando autenticação...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background text-foreground">
      {/* Universal Navbar */}
      <NavbarNew isLoggingOut={isLoggingOut} handleLogout={handleLogout} />

      {/* Main Content */}
      <div className="container mx-auto px-4 py-8">
        {/* Welcome Section */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold mb-2">
            Welcome back, {isDevMode ? "Developer" : "User"}!
          </h1>
          <p className="text-muted-foreground">
            Here's what's happening with your crypto portfolio today.
          </p>
        </div>

        {/* Quick Actions */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
          <Button
            onClick={() => router.push("/trade")}
            className="h-16 text-lg"
          >
            Trade Crypto
          </Button>
          <Button
            onClick={() => router.push("/deposits")}
            variant="outline"
            className="h-16 text-lg"
          >
            Deposit Funds
          </Button>
          <Button
            onClick={() => router.push("/p2p")}
            variant="outline"
            className="h-16 text-lg"
          >
            P2P Trading
          </Button>
          <Button
            onClick={() => router.push("/portfolio")}
            variant="outline"
            className="h-16 text-lg"
          >
            View Portfolio
          </Button>
        </div>

        {/* Portfolio Overview */}
        <div className="mb-8">
          <PortfolioOverview />
        </div>

        {/* Trading Interface */}
        <div className="mb-8">
          <h2 className="text-2xl font-bold mb-4">Quick Trade</h2>
          <TradingInterface />
        </div>
      </div>
    </div>
  );
}

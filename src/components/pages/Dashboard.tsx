"use client";
import React, { useState, useEffect, useCallback } from "react";
import { Button } from "@/components/ui/button";
import NavbarNew from "@/components/ui/navbar-new";
import { useRouter } from "next/navigation";
import { useToast } from "@/hooks/use-toast";
import { isLocalhostDev } from "@/lib/utils";
import { PortfolioOverview } from "@/components/portfolio/PortfolioOverview";
import { TradingInterface } from "@/components/trading/TradingInterface";

export default function Dashboard() {
  const [isLoggingOut, setIsLoggingOut] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [isDevMode, setIsDevMode] = useState(false);
  const router = useRouter();
  const { toast } = useToast();

  // Simple auth check using localStorage
  const checkAuth = useCallback(() => {
    try {
      console.log("Checking authentication...");

      // Check for simple session in localStorage
      const hasSession = localStorage.getItem("auth-session");
      const userStr = localStorage.getItem("auth-user");

      console.log("Session check:", { hasSession, hasUser: !!userStr });

      if (hasSession === "true" && userStr) {
        const user = JSON.parse(userStr);
        console.log("Valid session found for user:", user.email);

        // Check if we're on localhost for dev mode features
        const isLocalhost = isLocalhostDev();
        setIsDevMode(isLocalhost);
        setIsLoading(false);

        // Check if dev toast has been shown for this session (only on localhost)
        if (isLocalhost) {
          const hasShown = localStorage.getItem("dev-toast-shown");
          if (hasShown !== "true") {
            toast({
              title: "⚠️ Developer Mode",
              description: `Logged in as ${user.email}`,
              variant: "default",
            });
            localStorage.setItem("dev-toast-shown", "true");
          }
        }
      } else {
        // No valid session, redirect to login
        console.log("No valid session found, redirecting to login");
        router.push("/login");
      }
    } catch (error) {
      console.error("Error checking session:", error);
      router.push("/login");
    }
  }, [router, toast]);

  useEffect(() => {
    // Check auth immediately - no delays needed with localStorage
    checkAuth();
  }, [checkAuth]);

  const handleLogout = useCallback(async () => {
    setIsLoggingOut(true);
    try {
      // Clear simple session from localStorage
      localStorage.removeItem("auth-session");
      localStorage.removeItem("auth-user");
      localStorage.removeItem("dev-toast-shown");

      console.log("Logged out, redirecting to login");
      router.push("/login");
    } catch (error) {
      console.error("Error during logout:", error);
      // Force redirect even if logout fails
      window.location.href = "/login";
    } finally {
      setIsLoggingOut(false);
    }
  }, [router]);

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

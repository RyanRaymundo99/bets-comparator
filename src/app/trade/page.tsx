"use client";
import React, { useState, useCallback } from "react";
import { TradingInterface } from "@/components/trading/TradingInterface";
import NavbarNew from "@/components/ui/navbar-new";
import { useRouter } from "next/navigation";

export default function TradePage() {
  const [isLoggingOut, setIsLoggingOut] = useState(false);
  const router = useRouter();

  const handleLogout = useCallback(async () => {
    setIsLoggingOut(true);
    try {
      // Redirect to login page
      router.push("/login");
    } finally {
      setIsLoggingOut(false);
    }
  }, [router]);

  return (
    <div className="min-h-screen bg-background text-foreground">
      <NavbarNew isLoggingOut={isLoggingOut} handleLogout={handleLogout} />
      <div className="container mx-auto px-4 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold mb-2">Trade Crypto</h1>
          <p className="text-muted-foreground">
            Buy and sell cryptocurrencies with real-time market prices
          </p>
        </div>
        <TradingInterface />
      </div>
    </div>
  );
}

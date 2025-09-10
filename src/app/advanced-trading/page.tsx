"use client";

import React, { useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import AdvancedTradingInterface from "@/components/trading/AdvancedTradingInterface";
import NavbarNew from "@/components/ui/navbar-new";
import Breadcrumb from "@/components/ui/breadcrumb";

export default function AdvancedTradingPage() {
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
        <Breadcrumb
          items={[
            { label: "Dashboard", href: "/dashboard" },
            { label: "Advanced Trading" },
          ]}
        />
        <AdvancedTradingInterface />
      </div>
    </div>
  );
}

"use client";
import React, { useState, useCallback } from "react";
import { P2POffersList } from "@/components/p2p/P2POffersList";
import NavbarNew from "@/components/ui/navbar-new";
import { useRouter } from "next/navigation";
import Breadcrumb from "@/components/ui/breadcrumb";

export default function P2PPage() {
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
            { label: "Trade" },
          ]}
        />
        <div className="mb-8">
          <h1 className="text-3xl font-bold mb-2">Trade</h1>
          <p className="text-muted-foreground">
            Trade cryptocurrencies directly with other users
          </p>
        </div>
        <P2POffersList />
      </div>
    </div>
  );
}

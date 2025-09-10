"use client";

import React, { useState, useEffect } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import NavbarNew from "@/components/ui/navbar-new";
import Breadcrumb from "@/components/ui/breadcrumb";

interface DebugInfo {
  session: any;
  balances: any[];
  error?: string;
}

export default function DebugPage() {
  const [debugInfo, setDebugInfo] = useState<DebugInfo | null>(null);
  const [loading, setLoading] = useState(false);
  const [testAmount, setTestAmount] = useState("100");
  const { toast } = useToast();

  // Check session and balances
  const checkSystem = async () => {
    setLoading(true);
    try {
      // Check session
      const sessionResponse = await fetch("/api/auth/validate-session");
      const sessionData = await sessionResponse.json();

      // Check balances
      const balanceResponse = await fetch("/api/balance");
      const balanceData = await balanceResponse.json();

      setDebugInfo({
        session: sessionData,
        balances: balanceData.balances || [],
      });
    } catch (error) {
      setDebugInfo({
        session: null,
        balances: [],
        error: error instanceof Error ? error.message : "Unknown error",
      });
    } finally {
      setLoading(false);
    }
  };

  // Add BRL balance for testing
  const addTestBalance = async () => {
    if (!testAmount || parseFloat(testAmount) <= 0) {
      toast({
        title: "Invalid Amount",
        description: "Please enter a valid amount",
        variant: "destructive",
      });
      return;
    }

    try {
      setLoading(true);
      const response = await fetch("/api/balance", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          currency: "BRL",
          amount: parseFloat(testAmount),
          type: "ADD",
        }),
      });

      if (response.ok) {
        toast({
          title: "Success",
          description: `Added ${testAmount} BRL to your balance`,
        });
        checkSystem(); // Refresh debug info
      } else {
        const error = await response.json();
        throw new Error(error.error || "Failed to add balance");
      }
    } catch (error) {
      toast({
        title: "Error",
        description:
          error instanceof Error ? error.message : "Failed to add balance",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  // Test USDT purchase
  const testBuyUSDT = async () => {
    if (!testAmount || parseFloat(testAmount) <= 0) {
      toast({
        title: "Invalid Amount",
        description: "Please enter a valid amount",
        variant: "destructive",
      });
      return;
    }

    try {
      setLoading(true);
      const response = await fetch("/api/crypto/buy-usdt", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ brlAmount: parseFloat(testAmount) }),
      });

      if (response.ok) {
        const data = await response.json();
        toast({
          title: "Success",
          description: `Successfully bought ${data.usdtAmount} USDT`,
        });
        checkSystem(); // Refresh debug info
      } else {
        const error = await response.json();
        throw new Error(error.error || "Failed to buy USDT");
      }
    } catch (error) {
      toast({
        title: "Error",
        description:
          error instanceof Error ? error.message : "Failed to buy USDT",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    checkSystem();
  }, []);

  return (
    <div className="min-h-screen bg-background">
      <NavbarNew />
      <div className="container mx-auto px-4 py-8">
        <Breadcrumb
          items={[
            { label: "Dashboard", href: "/dashboard" },
            { label: "Debug" },
          ]}
        />
        <div className="mb-6">
          <h1 className="text-3xl font-bold">Debug & Testing</h1>
          <p className="text-muted-foreground">
            Debug tools for testing the crypto wallet system
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* System Status */}
          <Card>
            <CardHeader>
              <CardTitle>System Status</CardTitle>
              <CardDescription>
                Current session and balance information
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <Button
                onClick={checkSystem}
                disabled={loading}
                className="w-full"
              >
                {loading ? "Checking..." : "Check System Status"}
              </Button>

              {debugInfo && (
                <div className="space-y-4">
                  {/* Session Info */}
                  <div className="p-4 bg-muted rounded-lg">
                    <h3 className="font-semibold mb-2">Session Status</h3>
                    {debugInfo.session?.success ? (
                      <div className="text-green-600">
                        ✅ Authenticated as:{" "}
                        {debugInfo.session.user?.email || "Unknown"}
                      </div>
                    ) : (
                      <div className="text-red-600">
                        ❌ Not authenticated:{" "}
                        {debugInfo.session?.error || "No session"}
                      </div>
                    )}
                  </div>

                  {/* Balance Info */}
                  <div className="p-4 bg-muted rounded-lg">
                    <h3 className="font-semibold mb-2">Current Balances</h3>
                    {debugInfo.balances.length > 0 ? (
                      <div className="space-y-2">
                        {debugInfo.balances.map((balance) => (
                          <div
                            key={balance.currency}
                            className="flex justify-between"
                          >
                            <span>{balance.currency}:</span>
                            <span className="font-semibold">
                              {balance.amount.toFixed(2)}
                            </span>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="text-muted-foreground">
                        No balances found
                      </div>
                    )}
                  </div>

                  {debugInfo.error && (
                    <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
                      <h3 className="font-semibold text-red-800 mb-2">Error</h3>
                      <p className="text-red-700">{debugInfo.error}</p>
                    </div>
                  )}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Testing Tools */}
          <Card>
            <CardHeader>
              <CardTitle>Testing Tools</CardTitle>
              <CardDescription>
                Add test balances and test USDT purchase
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <label className="text-sm font-medium">Amount (BRL)</label>
                <Input
                  type="number"
                  placeholder="100"
                  value={testAmount}
                  onChange={(e) => setTestAmount(e.target.value)}
                  min="0"
                  step="0.01"
                />
              </div>

              <div className="grid grid-cols-1 gap-3">
                <Button
                  onClick={addTestBalance}
                  disabled={loading}
                  variant="outline"
                  className="w-full"
                >
                  {loading ? "Processing..." : "Add BRL Balance"}
                </Button>

                <Button
                  onClick={testBuyUSDT}
                  disabled={loading}
                  className="w-full bg-green-600 hover:bg-green-700"
                >
                  {loading ? "Processing..." : "Test Buy USDT"}
                </Button>
              </div>

              <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
                <h3 className="font-semibold text-blue-800 mb-2">
                  Instructions
                </h3>
                <ol className="text-blue-700 text-sm space-y-1 list-decimal list-inside">
                  <li>First, check your system status</li>
                  <li>
                    If you have no BRL balance, add some using the button above
                  </li>
                  <li>Test buying USDT with your BRL balance</li>
                  <li>Check the system status again to see the changes</li>
                </ol>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Quick Actions */}
        <Card className="mt-6">
          <CardHeader>
            <CardTitle>Quick Actions</CardTitle>
            <CardDescription>Common debugging tasks</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <Button
                onClick={() => window.open("/wallet", "_blank")}
                variant="outline"
                className="w-full"
              >
                Open Crypto Wallet
              </Button>
              <Button
                onClick={() => window.open("/withdraw", "_blank")}
                variant="outline"
                className="w-full"
              >
                Open Withdraw Page
              </Button>
              <Button
                onClick={() => window.open("/api/balance", "_blank")}
                variant="outline"
                className="w-full"
              >
                View Balance API
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

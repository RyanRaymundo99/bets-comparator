"use client";

import React, { useState, useEffect, useCallback } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { ArrowLeft, TrendingDown, Wallet, Coins, History } from "lucide-react";
import Link from "next/link";
import NavbarNew from "@/components/ui/navbar-new";
import Breadcrumb from "@/components/ui/breadcrumb";

interface CryptoBalance {
  currency: string;
  amount: number;
  locked: number;
  usdtValue: number;
  brlValue?: number;
}

interface WalletData {
  balances: CryptoBalance[];
  totalPortfolioValue: number;
  lastUpdated: string;
}

export default function WithdrawPage() {
  const [walletData, setWalletData] = useState<WalletData | null>(null);
  const [loading, setLoading] = useState(true);
  const [usdtAmount, setUsdtAmount] = useState("");
  const [processing, setProcessing] = useState(false);
  const [withdrawalHistory, setWithdrawalHistory] = useState<
    Array<{
      id?: string;
      amount?: number;
      currency?: string;
      status?: string;
      createdAt?: string;
      description?: string;
      usdtAmount?: number;
      brlAmount?: number;
      [key: string]: unknown;
    }>
  >([]);

  const { toast } = useToast();

  // Fetch wallet data
  const fetchWalletData = useCallback(async () => {
    try {
      const response = await fetch("/api/crypto/wallet");
      if (response.ok) {
        const data = await response.json();
        setWalletData(data.data);
      } else {
        throw new Error("Failed to fetch wallet data");
      }
    } catch (error) {
      console.error("Error fetching wallet data:", error);
      toast({
        title: "Error",
        description: "Failed to load wallet data",
        variant: "destructive",
      });
    }
  }, [toast]);

  // Fetch withdrawal history
  const fetchWithdrawalHistory = async () => {
    try {
      const response = await fetch("/api/withdrawals");
      if (response.ok) {
        const data = await response.json();
        setWithdrawalHistory(data.data || []);
      }
    } catch (error) {
      console.error("Error fetching withdrawal history:", error);
    }
  };

  // Sell USDT for BRL
  const handleSellUSDT = async () => {
    if (!usdtAmount || parseFloat(usdtAmount) <= 0) {
      toast({
        title: "Invalid Amount",
        description: "Please enter a valid USDT amount",
        variant: "destructive",
      });
      return;
    }

    const usdtBalance = walletData?.balances.find((b) => b.currency === "USDT");
    if (!usdtBalance || parseFloat(usdtAmount) > usdtBalance.amount) {
      toast({
        title: "Insufficient Balance",
        description: "You don&apos;t have enough USDT to sell",
        variant: "destructive",
      });
      return;
    }

    try {
      setProcessing(true);
      const response = await fetch("/api/crypto/sell-usdt", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ usdtAmount: parseFloat(usdtAmount) }),
      });

      if (response.ok) {
        const data = await response.json();
        toast({
          title: "Success",
          description: `Successfully sold ${data.usdtAmount} USDT for ${data.brlAmount} BRL`,
        });
        setUsdtAmount("");
        fetchWalletData(); // Refresh wallet data
        fetchWithdrawalHistory(); // Refresh withdrawal history
      } else {
        const error = await response.json();
        throw new Error(error.error || "Failed to sell USDT");
      }
    } catch (error) {
      toast({
        title: "Error",
        description:
          error instanceof Error ? error.message : "Failed to sell USDT",
        variant: "destructive",
      });
    } finally {
      setProcessing(false);
    }
  };

  // Calculate BRL amount user will receive
  const calculateBRLAmount = () => {
    if (!usdtAmount || parseFloat(usdtAmount) <= 0) return 0;
    // Using the same rate as buy: 1 USDT = R$ 5.00
    return parseFloat(usdtAmount) * 5.0;
  };

  useEffect(() => {
    const loadData = async () => {
      setLoading(true);
      await Promise.all([fetchWalletData(), fetchWithdrawalHistory()]);
      setLoading(false);
    };
    loadData();
  }, [fetchWalletData]);

  if (loading) {
    return (
      <div className="min-h-screen bg-background">
        <NavbarNew isLoggingOut={false} handleLogout={() => {}} />
        <div className="container mx-auto px-4 py-8">
          <div className="flex items-center justify-center h-64">
            <div className="text-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
              <p>Loading withdrawal page...</p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  const usdtBalance = walletData?.balances.find((b) => b.currency === "USDT");
  const brlBalance = walletData?.balances.find((b) => b.currency === "BRL");

  return (
    <div className="min-h-screen bg-background">
      <NavbarNew isLoggingOut={false} handleLogout={() => {}} />
      <div className="container mx-auto px-4 py-8">
        <Breadcrumb
          items={[
            { label: "Dashboard", href: "/dashboard" },
            { label: "Withdraw" },
          ]}
        />

        {/* Header */}
        <div className="flex items-center gap-4 mb-6">
          <Link href="/wallet">
            <Button variant="outline" size="sm">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Wallet
            </Button>
          </Link>
          <div>
            <h1 className="text-3xl font-bold">Withdraw Funds</h1>
            <p className="text-muted-foreground">
              Sell your USDT for BRL and withdraw to your account
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Main Withdrawal Card */}
          <div className="lg:col-span-2">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-red-600">
                  <TrendingDown className="h-5 w-5" />
                  Sell USDT for BRL
                </CardTitle>
                <CardDescription>
                  Convert your USDT back to Brazilian Real
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                {/* Current Balances */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 p-4 bg-muted rounded-lg">
                  <div className="text-center">
                    <div className="flex items-center justify-center gap-2 mb-2">
                      <Coins className="h-5 w-5 text-green-500" />
                      <span className="text-sm text-muted-foreground">
                        USDT Balance
                      </span>
                    </div>
                    <p className="text-2xl font-bold text-green-600">
                      {usdtBalance ? usdtBalance.amount.toFixed(2) : "0.00"}{" "}
                      USDT
                    </p>
                    <p className="text-sm text-muted-foreground">
                      ≈ R${" "}
                      {(usdtBalance ? usdtBalance.amount * 5.0 : 0).toFixed(2)}
                    </p>
                  </div>
                  <div className="text-center">
                    <div className="flex items-center justify-center gap-2 mb-2">
                      <Wallet className="h-5 w-5 text-blue-500" />
                      <span className="text-sm text-muted-foreground">
                        BRL Balance
                      </span>
                    </div>
                    <p className="text-2xl font-bold text-blue-600">
                      R$ {brlBalance ? brlBalance.amount.toFixed(2) : "0.00"}
                    </p>
                  </div>
                </div>

                {/* Withdrawal Form */}
                <div className="space-y-4">
                  <div>
                    <label className="text-sm font-medium">
                      Amount to Sell (USDT)
                    </label>
                    <Input
                      type="number"
                      placeholder="0.00"
                      value={usdtAmount}
                      onChange={(e) => setUsdtAmount(e.target.value)}
                      min="0"
                      step="0.01"
                      max={usdtBalance ? usdtBalance.amount : undefined}
                    />
                    <p className="text-sm text-muted-foreground mt-1">
                      Available:{" "}
                      {usdtBalance ? usdtBalance.amount.toFixed(2) : "0.00"}{" "}
                      USDT
                    </p>
                  </div>

                  {/* Conversion Preview */}
                  <div className="p-4 bg-muted rounded-lg">
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-muted-foreground">
                        You&apos;ll Receive:
                      </span>
                      <span className="text-lg font-semibold text-green-600">
                        R$ {calculateBRLAmount().toFixed(2)}
                      </span>
                    </div>
                    <div className="flex items-center justify-between mt-2">
                      <span className="text-sm text-muted-foreground">
                        Exchange Rate:
                      </span>
                      <span className="text-sm font-medium">
                        1 USDT = R$ 5.00
                      </span>
                    </div>
                  </div>

                  <Button
                    onClick={handleSellUSDT}
                    disabled={
                      processing || !usdtAmount || parseFloat(usdtAmount) <= 0
                    }
                    className="w-full bg-red-600 hover:bg-red-700"
                  >
                    {processing ? "Processing..." : "Sell USDT for BRL"}
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Portfolio Summary */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Wallet className="h-5 w-5" />
                  Portfolio Summary
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="text-center p-4 bg-muted rounded-lg">
                  <p className="text-sm text-muted-foreground">
                    Total Portfolio Value
                  </p>
                  <p className="text-2xl font-bold">
                    ${walletData?.totalPortfolioValue.toFixed(2) || "0.00"} USDT
                  </p>
                </div>
                <div className="text-center p-4 bg-muted rounded-lg">
                  <p className="text-sm text-muted-foreground">Last Updated</p>
                  <p className="text-lg font-semibold">
                    {walletData
                      ? new Date(walletData.lastUpdated).toLocaleTimeString()
                      : "N/A"}
                  </p>
                </div>
              </CardContent>
            </Card>

            {/* Quick Actions */}
            <Card>
              <CardHeader>
                <CardTitle>Quick Actions</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <Link href="/wallet">
                  <Button variant="outline" className="w-full justify-start">
                    <Coins className="h-4 w-4 mr-2" />
                    View Wallet
                  </Button>
                </Link>
                <Link href="/wallet">
                  <Button variant="outline" className="w-full justify-start">
                    <TrendingDown className="h-4 w-4 mr-2" />
                    Trade Crypto
                  </Button>
                </Link>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Withdrawal History */}
        <Card className="mt-8">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <History className="h-5 w-5" />
              Withdrawal History
            </CardTitle>
            <CardDescription>Recent USDT to BRL conversions</CardDescription>
          </CardHeader>
          <CardContent>
            {withdrawalHistory.length > 0 ? (
              <div className="space-y-3">
                {withdrawalHistory.map((withdrawal, index) => (
                  <div
                    key={withdrawal.id || index}
                    className="flex items-center justify-between p-3 border rounded-lg"
                  >
                    <div>
                      <p className="font-medium">
                        {withdrawal.description || "USDT to BRL Conversion"}
                      </p>
                      <p className="text-sm text-muted-foreground">
                        {withdrawal.createdAt
                          ? new Date(withdrawal.createdAt).toLocaleString()
                          : "Unknown date"}
                      </p>
                    </div>
                    <div className="text-right">
                      <Badge variant="secondary">WITHDRAWAL</Badge>
                      <p className="font-semibold mt-1">
                        -{withdrawal.usdtAmount?.toFixed(2) || "0.00"} USDT
                      </p>
                      <p className="text-sm text-muted-foreground">
                        +R$ {withdrawal.brlAmount?.toFixed(2) || "0.00"}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-center text-muted-foreground py-8">
                No withdrawal history found. Start by selling some USDT for BRL.
              </p>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

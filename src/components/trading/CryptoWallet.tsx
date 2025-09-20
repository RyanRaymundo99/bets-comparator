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
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from "@/hooks/use-toast";
import {
  ArrowUpDown,
  TrendingUp,
  TrendingDown,
  Wallet,
  Coins,
  History,
  Bitcoin,
  Globe,
  Circle,
  Sparkles,
} from "lucide-react";

interface CryptoBalance {
  currency: string;
  amount: number;
  locked: number;
  usdtValue: number;
  usdtPrice?: number;
  brlValue?: number;
}

interface CryptoPrice {
  symbol: string;
  price: number;
  priceChange: number;
  priceChangePercent: number;
  volume: number;
  high24h: number;
  low24h: number;
}

interface Transaction {
  id: string;
  type: string;
  amount: number | string; // Can be number or Prisma Decimal
  currency: string;
  description: string;
  createdAt: string;
}

interface WalletData {
  balances: CryptoBalance[];
  totalPortfolioValue: number;
  recentTransactions: Transaction[];
  openOrders: unknown[];
  lastUpdated: string;
}

export default function CryptoWallet() {
  const [walletData, setWalletData] = useState<WalletData | null>(null);
  const [prices, setPrices] = useState<CryptoPrice[]>([]);
  const [loading, setLoading] = useState(true);
  const [buyAmount, setBuyAmount] = useState("");
  const [sellAmount, setSellAmount] = useState("");
  const [selectedCrypto, setSelectedCrypto] = useState("BTC");
  const [refreshing, setRefreshing] = useState(false);

  const { toast } = useToast();

  // Helper function to safely convert amount to number
  const safeAmount = (amount: number | string | unknown): number => {
    if (typeof amount === "number") return amount;
    if (typeof amount === "string") return parseFloat(amount);
    if (amount && typeof amount.toString === "function")
      return parseFloat(amount.toString());
    return 0;
  };

  // Get crypto icon component
  const getCryptoIcon = (symbol: string) => {
    switch (symbol) {
      case "BTC":
        return <Bitcoin className="w-6 h-6 text-orange-500" />;
      case "ETH":
        return <Globe className="w-6 h-6 text-blue-500" />;
      case "BNB":
        return <Circle className="w-6 h-6 text-yellow-500" />;
      case "ADA":
        return <Circle className="w-6 h-6 text-blue-600" />;
      case "SOL":
        return <Sparkles className="w-6 h-6 text-purple-500" />;
      case "USDT":
        return <Circle className="w-6 h-6 text-green-500" />;
      default:
        return <Coins className="w-6 h-6 text-gray-500" />;
    }
  };

  // Get crypto name
  const getCryptoName = (symbol: string) => {
    switch (symbol) {
      case "BTC":
        return "Bitcoin";
      case "ETH":
        return "Ethereum";
      case "BNB":
        return "Binance Coin";
      case "ADA":
        return "Cardano";
      case "SOL":
        return "Solana";
      case "USDT":
        return "Tether";
      default:
        return symbol;
    }
  };

  // Fetch wallet data
  const fetchWalletData = async () => {
    try {
      console.log("Fetching wallet data...");
      const response = await fetch("/api/crypto/wallet");
      console.log("Wallet response status:", response.status);

      if (response.ok) {
        const data = await response.json();
        console.log("Wallet data received:", data);
        setWalletData(data.data);
      } else {
        const errorData = await response.json();
        console.error("Wallet API error:", errorData);
        throw new Error(errorData.error || "Failed to fetch wallet data");
      }
    } catch (error) {
      console.error("Error fetching wallet data:", error);
      toast({
        title: "Error",
        description: "Failed to load wallet data",
        variant: "destructive",
      });
    }
  };

  // Fetch popular crypto prices
  const fetchPrices = async () => {
    try {
      console.log("Fetching prices...");
      const response = await fetch("/api/crypto/popular-pairs");
      console.log("Prices response status:", response.status);

      if (response.ok) {
        const data = await response.json();
        console.log("Prices data received:", data);
        setPrices(data.data);

        // Check if we have USDT data
        const usdtData = data.data.find(
          (p: { symbol: string }) => p.symbol === "USDTUSDT"
        );
        console.log("USDT data found:", usdtData);

        if (!usdtData) {
          console.log("No USDT data found, adding fallback...");
          // Add fallback USDT data
          setPrices((prev) => [
            ...prev,
            {
              symbol: "USDTUSDT",
              price: 1.0,
              priceChange: 0,
              priceChangePercent: 0,
              volume: 0,
              high24h: 1.0,
              low24h: 1.0,
            },
          ]);
        }
      } else {
        const errorData = await response.json();
        console.error("Prices API error:", errorData);
        throw new Error(errorData.error || "Failed to fetch prices");
      }
    } catch (error) {
      console.error("Error fetching prices:", error);
      toast({
        title: "Error",
        description: "Failed to load crypto prices",
        variant: "destructive",
      });
    }
  };

  // Buy USDT with BRL
  const handleBuyUSDT = async () => {
    if (!buyAmount || parseFloat(buyAmount) <= 0) {
      toast({
        title: "Invalid Amount",
        description: "Please enter a valid amount",
        variant: "destructive",
      });
      return;
    }

    try {
      setRefreshing(true);
      const response = await fetch("/api/crypto/buy-usdt", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ brlAmount: parseFloat(buyAmount) }),
      });

      if (response.ok) {
        const data = await response.json();
        toast({
          title: "Success",
          description: `Successfully bought ${data.usdtAmount} USDT`,
        });
        setBuyAmount("");
        fetchWalletData(); // Refresh wallet data
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
      setRefreshing(false);
    }
  };

  // Buy any crypto with BRL
  const handleBuyCrypto = async () => {
    if (!buyAmount || parseFloat(buyAmount) <= 0) {
      toast({
        title: "Invalid Amount",
        description: "Please enter a valid amount",
        variant: "destructive",
      });
      return;
    }

    try {
      setRefreshing(true);

      // If USDT is selected, use direct BRL→USDT conversion
      if (selectedCrypto === "USDT") {
        const response = await fetch("/api/crypto/buy-usdt", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ brlAmount: parseFloat(buyAmount) }),
        });

        if (response.ok) {
          const data = await response.json();
          toast({
            title: "Success",
            description: `Successfully bought ${data.usdtAmount} USDT with BRL!`,
          });
          setBuyAmount("");
          fetchWalletData(); // Refresh wallet data
        } else {
          const error = await response.json();
          throw new Error(error.error || "Failed to buy USDT");
        }
        return;
      }

      // For other cryptocurrencies, use the two-step process
      // First buy USDT with BRL
      const usdtResponse = await fetch("/api/crypto/buy-usdt", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ brlAmount: parseFloat(buyAmount) }),
      });

      if (!usdtResponse.ok) {
        const error = await usdtResponse.json();
        throw new Error(error.error || "Failed to buy USDT");
      }

      const usdtData = await usdtResponse.json();
      const usdtAmount = usdtData.usdtAmount;

      // Then buy the selected crypto with USDT
      const cryptoResponse = await fetch("/api/crypto/buy", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          amount: usdtAmount,
          cryptoCurrency: selectedCrypto,
          quoteCurrency: "USDT",
        }),
      });

      if (cryptoResponse.ok) {
        await cryptoResponse.json();
        toast({
          title: "Success",
          description: `Successfully bought ${selectedCrypto} with BRL!`,
        });
        setBuyAmount("");
        fetchWalletData(); // Refresh wallet data
      } else {
        const error = await cryptoResponse.json();
        throw new Error(error.error || "Failed to buy crypto");
      }
    } catch (error) {
      toast({
        title: "Error",
        description:
          error instanceof Error ? error.message : "Failed to buy crypto",
        variant: "destructive",
      });
    } finally {
      setRefreshing(false);
    }
  };

  // Sell USDT for BRL
  const handleSellUSDT = async () => {
    if (!sellAmount || parseFloat(sellAmount) <= 0) {
      toast({
        title: "Invalid Amount",
        description: "Please enter a valid amount",
        variant: "destructive",
      });
      return;
    }

    try {
      setRefreshing(true);
      const response = await fetch("/api/crypto/sell-usdt", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ usdtAmount: parseFloat(sellAmount) }),
      });

      if (response.ok) {
        const data = await response.json();
        toast({
          title: "Success",
          description: `Successfully sold ${data.usdtAmount} USDT for ${data.brlAmount} BRL`,
        });
        setSellAmount("");
        fetchWalletData(); // Refresh wallet data
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
      setRefreshing(false);
    }
  };

  // Refresh all data
  const handleRefresh = async () => {
    setRefreshing(true);
    await Promise.all([fetchWalletData(), fetchPrices()]);
    setRefreshing(false);
  };

  useEffect(() => {
    const loadData = async () => {
      setLoading(true);
      await Promise.all([fetchWalletData(), fetchPrices()]);
      setLoading(false);
    };
    loadData();
  }, [fetchPrices, fetchWalletData]);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
          <p>Loading wallet...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Crypto Wallet</h1>
          <p className="text-muted-foreground">
            Manage your cryptocurrency assets and trade with real-time prices
          </p>
        </div>
        <Button onClick={handleRefresh} disabled={refreshing} variant="outline">
          <ArrowUpDown className="h-4 w-4 mr-2" />
          {refreshing ? "Refreshing..." : "Refresh"}
        </Button>
      </div>

      {/* Portfolio Overview */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Wallet className="h-5 w-5" />
            Portfolio Overview
          </CardTitle>
          <CardDescription>
            Total portfolio value and asset distribution
          </CardDescription>
        </CardHeader>
        <CardContent>
          {walletData && (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="text-center p-4 bg-muted rounded-lg">
                <p className="text-sm text-muted-foreground">
                  Total Portfolio Value
                </p>
                <p className="text-2xl font-bold">
                  ${walletData.totalPortfolioValue.toFixed(2)} USDT
                </p>
              </div>
              <div className="text-center p-4 bg-muted rounded-lg">
                <p className="text-sm text-muted-foreground">Last Updated</p>
                <p className="text-lg font-semibold">
                  {new Date(walletData.lastUpdated).toLocaleTimeString()}
                </p>
              </div>
              <div className="text-center p-4 bg-muted rounded-lg">
                <p className="text-sm text-muted-foreground">Active Orders</p>
                <p className="text-2xl font-bold">
                  {walletData.openOrders.length}
                </p>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      <Tabs defaultValue="balances" className="space-y-4">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="balances">Balances</TabsTrigger>
          <TabsTrigger value="trade">Trade</TabsTrigger>
          <TabsTrigger value="prices">Prices</TabsTrigger>
          <TabsTrigger value="history">History</TabsTrigger>
        </TabsList>

        {/* Balances Tab */}
        <TabsContent value="balances" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Coins className="h-5 w-5" />
                Asset Balances
              </CardTitle>
            </CardHeader>
            <CardContent>
              {walletData?.balances && walletData.balances.length > 0 ? (
                <div className="space-y-3">
                  {walletData.balances.map((balance) => (
                    <div
                      key={balance.currency}
                      className="flex items-center justify-between p-3 border rounded-lg"
                    >
                      <div className="flex items-center gap-3">
                        {getCryptoIcon(balance.currency)}
                        <div>
                          <p className="font-medium">
                            {balance.amount.toFixed(8)} {balance.currency}
                          </p>
                          {balance.locked > 0 && (
                            <p className="text-sm text-muted-foreground">
                              Locked: {balance.locked.toFixed(8)}
                            </p>
                          )}
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="font-semibold">
                          ${balance.usdtValue.toFixed(2)} USDT
                        </p>
                        {balance.usdtPrice && (
                          <p className="text-sm text-muted-foreground">
                            ${balance.usdtPrice.toFixed(4)} per{" "}
                            {balance.currency}
                          </p>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-center text-muted-foreground py-8">
                  No balances found. Start by depositing funds or buying crypto.
                </p>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Trade Tab */}
        <TabsContent value="trade" className="space-y-6">
          {/* Buy Any Crypto with BRL */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-green-600">
                <TrendingUp className="h-5 w-5" />
                Buy Crypto with BRL
              </CardTitle>
              <CardDescription>
                Purchase any cryptocurrency using your BRL balance
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="text-sm font-medium">Crypto to Buy</label>
                  <select
                    value={selectedCrypto}
                    onChange={(e) => setSelectedCrypto(e.target.value)}
                    className="w-full p-2 border rounded-md bg-background"
                  >
                    <option value="BTC">🟠 Bitcoin (BTC)</option>
                    <option value="ETH">🔵 Ethereum (ETH)</option>
                    <option value="BNB">🟡 Binance Coin (BNB)</option>
                    <option value="ADA">🔷 Cardano (ADA)</option>
                    <option value="SOL">✨ Solana (SOL)</option>
                    <option value="USDT">💚 Tether (USDT)</option>
                  </select>
                </div>
                <div>
                  <label className="text-sm font-medium">Amount (BRL)</label>
                  <Input
                    type="number"
                    placeholder="0.00"
                    value={buyAmount}
                    onChange={(e) => setBuyAmount(e.target.value)}
                    min="0"
                    step="0.01"
                  />
                </div>
                <div>
                  <label className="text-sm font-medium">
                    You&apos;ll Receive
                  </label>
                  <div className="p-3 bg-muted rounded-md text-center">
                    <div className="flex items-center justify-center gap-2 mb-1">
                      {getCryptoIcon(selectedCrypto)}
                      <span className="text-sm text-muted-foreground">
                        {getCryptoName(selectedCrypto)}
                      </span>
                    </div>
                    <span className="text-lg font-semibold">
                      {buyAmount && selectedCrypto
                        ? (() => {
                            if (selectedCrypto === "USDT") {
                              // Direct BRL to USDT conversion
                              const brlAmount = parseFloat(buyAmount);
                              const usdtAmount = brlAmount / 5.0; // 1 USDT = R$ 5.00
                              return `${usdtAmount.toFixed(
                                6
                              )} ${selectedCrypto}`;
                            }

                            const selectedPrice = prices.find(
                              (p) => p.symbol === `${selectedCrypto}USDT`
                            );
                            if (selectedPrice && buyAmount) {
                              const brlAmount = parseFloat(buyAmount);
                              // Convert BRL to USDT first, then to selected crypto
                              const usdtAmount = brlAmount / 5.0; // Approximate BRL/USDT rate
                              const cryptoAmount =
                                usdtAmount / selectedPrice.price;
                              return `${cryptoAmount.toFixed(
                                6
                              )} ${selectedCrypto}`;
                            }
                            return `0.000000 ${selectedCrypto}`;
                          })()
                        : `0.000000 ${selectedCrypto}`}
                    </span>
                  </div>
                </div>
              </div>

              {/* Price Information */}
              {selectedCrypto && prices.length > 0 && (
                <div className="p-4 bg-muted rounded-lg">
                  {/* Crypto Header with Icon */}
                  <div className="flex items-center gap-3 mb-4 pb-3 border-b">
                    {getCryptoIcon(selectedCrypto)}
                    <div>
                      <h3 className="text-lg font-semibold">
                        {getCryptoName(selectedCrypto)} ({selectedCrypto})
                      </h3>
                      <p className="text-sm text-muted-foreground">
                        Real-time market data
                      </p>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                    <div>
                      <span className="text-muted-foreground">
                        Current Price:
                      </span>
                      <p className="font-semibold">
                        $
                        {(() => {
                          if (selectedCrypto === "USDT") {
                            return "1.0000"; // USDT is always 1:1 with USD
                          }
                          const selectedPrice = prices.find(
                            (p) => p.symbol === `${selectedCrypto}USDT`
                          );
                          return selectedPrice
                            ? selectedPrice.price.toFixed(4)
                            : "0.0000";
                        })()}{" "}
                        USDT
                      </p>
                    </div>
                    <div>
                      <span className="text-muted-foreground">24h Change:</span>
                      <p
                        className={`font-semibold ${
                          (() => {
                            const selectedPrice = prices.find(
                              (p) => p.symbol === `${selectedCrypto}USDT`
                            );
                            return selectedPrice
                              ? selectedPrice.priceChangePercent
                              : 0;
                          })() >= 0
                            ? "text-green-600"
                            : "text-red-600"
                        }`}
                      >
                        {(() => {
                          if (selectedCrypto === "USDT") {
                            return "0.00%"; // USDT is stable
                          }
                          const selectedPrice = prices.find(
                            (p) => p.symbol === `${selectedCrypto}USDT`
                          );
                          if (selectedPrice) {
                            const change = selectedPrice.priceChangePercent;
                            return `${change >= 0 ? "+" : ""}${change.toFixed(
                              2
                            )}%`;
                          }
                          return "0.00%";
                        })()}
                      </p>
                    </div>
                    <div>
                      <span className="text-muted-foreground">BRL Rate:</span>
                      <p className="font-semibold">R$ 5.00 ≈ 1 USDT</p>
                    </div>
                    <div>
                      <span className="text-muted-foreground">
                        Estimated Cost:
                      </span>
                      <p className="font-semibold">
                        {buyAmount
                          ? `R$ ${parseFloat(buyAmount).toFixed(2)}`
                          : "R$ 0.00"}
                      </p>
                    </div>
                  </div>
                </div>
              )}

              <Button
                onClick={handleBuyCrypto}
                disabled={refreshing || !buyAmount}
                className="w-full bg-green-600 hover:bg-green-700"
              >
                {refreshing
                  ? "Processing..."
                  : `Buy ${selectedCrypto} with BRL`}
              </Button>
            </CardContent>
          </Card>

          {/* Quick Actions Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Buy USDT */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-green-600">
                  <TrendingUp className="h-5 w-5" />
                  Buy USDT
                </CardTitle>
                <CardDescription>
                  Purchase USDT with your BRL balance
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <label className="text-sm font-medium">Amount (BRL)</label>
                  <Input
                    type="number"
                    placeholder="0.00"
                    value={buyAmount}
                    onChange={(e) => setBuyAmount(e.target.value)}
                    min="0"
                    step="0.01"
                  />
                </div>
                <Button
                  onClick={handleBuyUSDT}
                  disabled={refreshing || !buyAmount}
                  className="w-full"
                >
                  {refreshing ? "Processing..." : "Buy USDT"}
                </Button>
              </CardContent>
            </Card>

            {/* Sell USDT */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-red-600">
                  <TrendingDown className="h-5 w-5" />
                  Sell USDT
                </CardTitle>
                <CardDescription>Sell USDT for BRL</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <label className="text-sm font-medium">Amount (USDT)</label>
                  <Input
                    type="number"
                    placeholder="0.00"
                    value={sellAmount}
                    onChange={(e) => setSellAmount(e.target.value)}
                    min="0"
                    step="0.01"
                  />
                </div>
                <Button
                  onClick={handleSellUSDT}
                  disabled={refreshing || !sellAmount}
                  variant="outline"
                  className="w-full"
                >
                  {refreshing ? "Processing..." : "Sell USDT"}
                </Button>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Prices Tab */}
        <TabsContent value="prices" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Real-Time Crypto Prices</CardTitle>
              <CardDescription>
                Live prices from Binance exchange
              </CardDescription>
            </CardHeader>
            <CardContent>
              {prices.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {prices.map((price) => {
                    const crypto = price.symbol.replace("USDT", "");
                    return (
                      <div
                        key={price.symbol}
                        className="p-4 border rounded-lg hover:shadow-md transition-shadow"
                      >
                        <div className="flex items-center gap-3 mb-3">
                          {getCryptoIcon(crypto)}
                          <div className="flex-1">
                            <div className="flex items-center justify-between">
                              <Badge variant="outline">{price.symbol}</Badge>
                              <span
                                className={`text-sm font-medium ${
                                  price.priceChangePercent >= 0
                                    ? "text-green-600"
                                    : "text-red-600"
                                }`}
                              >
                                {price.priceChangePercent >= 0 ? "+" : ""}
                                {price.priceChangePercent.toFixed(2)}%
                              </span>
                            </div>
                            <p className="text-sm text-muted-foreground mt-1">
                              {getCryptoName(crypto)}
                            </p>
                          </div>
                        </div>
                        <p className="text-2xl font-bold mb-3">
                          ${price.price.toFixed(4)}
                        </p>
                        <div className="text-sm text-muted-foreground space-y-1">
                          <p>24h High: ${price.high24h.toFixed(4)}</p>
                          <p>24h Low: ${price.low24h.toFixed(4)}</p>
                          <p>Volume: {price.volume.toLocaleString()}</p>
                        </div>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <p className="text-center text-muted-foreground py-8">
                  No price data available.
                </p>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* History Tab */}
        <TabsContent value="history" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <History className="h-5 w-5" />
                Transaction History
              </CardTitle>
            </CardHeader>
            <CardContent>
              {walletData?.recentTransactions &&
              walletData.recentTransactions.length > 0 ? (
                <div className="space-y-3">
                  {walletData.recentTransactions.map((transaction) => (
                    <div
                      key={transaction.id}
                      className="flex items-center justify-between p-3 border rounded-lg"
                    >
                      <div>
                        <p className="font-medium">{transaction.description}</p>
                        <p className="text-sm text-muted-foreground">
                          {new Date(transaction.createdAt).toLocaleString()}
                        </p>
                      </div>
                      <div className="text-right">
                        <Badge
                          variant={
                            transaction.type === "BUY_CRYPTO"
                              ? "default"
                              : transaction.type === "SELL_CRYPTO"
                              ? "secondary"
                              : "outline"
                          }
                        >
                          {transaction.type}
                        </Badge>
                        <p className="font-semibold mt-1">
                          {safeAmount(transaction.amount).toFixed(8)}{" "}
                          {transaction.currency}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-center text-muted-foreground py-8">
                  No transaction history found.
                </p>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}

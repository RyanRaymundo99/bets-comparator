"use client";

import { useState, useEffect, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from "@/hooks/use-toast";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Loader2 } from "lucide-react";

export function TradingInterface() {
  const [amount, setAmount] = useState("");
  const [cryptoAmount, setCryptoAmount] = useState("");
  const [selectedCrypto, setSelectedCrypto] = useState("BTC");
  const [price, setPrice] = useState(0);
  const [loading, setLoading] = useState(false);
  const [userBalance, setUserBalance] = useState<any>(null);
  const { toast } = useToast();

  const cryptos = [
    { symbol: "BTC", name: "Bitcoin" },
    { symbol: "ETH", name: "Ethereum" },
    { symbol: "USDT", name: "Tether" },
  ];

  const fetchPrice = useCallback(async () => {
    try {
      const response = await fetch(
        `/api/crypto/price?symbol=${selectedCrypto}BRL`
      );
      const data = await response.json();
      setPrice(data.price);
    } catch {
      console.error("Error fetching price");
    }
  }, [selectedCrypto]);

  const fetchUserBalance = useCallback(async () => {
    try {
      const response = await fetch("/api/balance");
      if (response.ok) {
        const data = await response.json();
        setUserBalance(data.balances);
      }
    } catch {
      console.error("Error fetching balance");
    }
  }, []);

  useEffect(() => {
    fetchPrice();
    fetchUserBalance();
    const interval = setInterval(fetchPrice, 30000); // Update every 30 seconds
    return () => clearInterval(interval);
  }, [fetchPrice, fetchUserBalance]);

  const handleBuy = async () => {
    if (!amount || parseFloat(amount) <= 0) {
      toast({
        title: "Error",
        description: "Please enter a valid amount",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);
    try {
      const response = await fetch("/api/crypto/buy", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          amount: parseFloat(amount),
          cryptoCurrency: selectedCrypto,
        }),
      });

      const data = await response.json();

      if (response.ok) {
        toast({
          title: "Success",
          description: `Successfully bought ${amount} ${selectedCrypto}`,
        });
        setAmount("");
        setCryptoAmount("");
        fetchUserBalance(); // Refresh balance after successful trade
      } else {
        toast({
          title: "Error",
          description: data.error || "Failed to buy crypto",
          variant: "destructive",
        });
      }
    } catch {
      toast({
        title: "Error",
        description: "Network error",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleSell = async () => {
    if (!cryptoAmount || parseFloat(cryptoAmount) <= 0) {
      toast({
        title: "Error",
        description: "Please enter a valid amount",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);
    try {
      const response = await fetch("/api/crypto/sell", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          amount: parseFloat(cryptoAmount),
          cryptoCurrency: selectedCrypto,
        }),
      });

      const data = await response.json();

      if (response.ok) {
        toast({
          title: "Success",
          description: `Successfully sold ${cryptoAmount} ${selectedCrypto}`,
        });
        setAmount("");
        setCryptoAmount("");
        fetchUserBalance(); // Refresh balance after successful trade
      } else {
        toast({
          title: "Error",
          description: data.error || "Failed to sell crypto",
          variant: "destructive",
        });
      }
    } catch {
      toast({
        title: "Error",
        description: "Network error",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="w-full max-w-4xl mx-auto space-y-6">
      {/* User Balance Display */}
      {userBalance && (
        <div className="bg-white rounded-lg border border-gray-200 p-4">
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-lg font-semibold">Your Balances</h2>
            <Button
              variant="outline"
              size="sm"
              onClick={fetchUserBalance}
              className="text-xs"
            >
              Refresh
            </Button>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {userBalance.map((balance: any) => (
              <div key={balance.currency} className="text-center">
                <div className="text-2xl font-bold text-gray-900">
                  {balance.currency === "BRL"
                    ? `R$ ${Number(balance.amount).toLocaleString("pt-BR", {
                        minimumFractionDigits: 2,
                      })}`
                    : `${Number(balance.amount).toFixed(8)} ${
                        balance.currency
                      }`}
                </div>
                <div className="text-sm text-gray-500">{balance.currency}</div>
              </div>
            ))}
          </div>
        </div>
      )}

      <Card>
        <CardHeader>
          <CardTitle>Trade Crypto</CardTitle>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="buy" className="w-full">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="buy">Buy</TabsTrigger>
              <TabsTrigger value="sell">Sell</TabsTrigger>
            </TabsList>
            <TabsContent value="buy" className="space-y-4">
              <div className="space-y-4">
                <div>
                  <Label htmlFor="crypto-select">Select Crypto</Label>
                  <Select
                    value={selectedCrypto}
                    onValueChange={setSelectedCrypto}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select a cryptocurrency" />
                    </SelectTrigger>
                    <SelectContent>
                      {cryptos.map((crypto) => (
                        <SelectItem key={crypto.symbol} value={crypto.symbol}>
                          {crypto.name} ({crypto.symbol})
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label htmlFor="amount">Amount (BRL)</Label>
                  <Input
                    id="amount"
                    type="number"
                    placeholder="Enter amount in BRL"
                    value={amount}
                    onChange={(e) => setAmount(e.target.value)}
                  />
                </div>
                <div>
                  <Label htmlFor="crypto-amount">{selectedCrypto} Amount</Label>
                  <Input
                    id="crypto-amount"
                    type="number"
                    placeholder={`Amount in ${selectedCrypto}`}
                    value={cryptoAmount}
                    onChange={(e) => setCryptoAmount(e.target.value)}
                    readOnly
                  />
                </div>
                <div className="text-sm text-gray-600">
                  Current Price: R$ {price.toLocaleString("pt-BR")}
                </div>
                <Button
                  onClick={handleBuy}
                  disabled={loading || !amount || parseFloat(amount) <= 0}
                  className="w-full"
                >
                  {loading ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Processing...
                    </>
                  ) : (
                    `Buy ${selectedCrypto}`
                  )}
                </Button>
              </div>
            </TabsContent>
            <TabsContent value="sell" className="space-y-4">
              <div className="space-y-4">
                <div>
                  <Label htmlFor="crypto-select-sell">Select Crypto</Label>
                  <Select
                    value={selectedCrypto}
                    onValueChange={setSelectedCrypto}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select a cryptocurrency" />
                    </SelectTrigger>
                    <SelectContent>
                      {cryptos.map((crypto) => (
                        <SelectItem key={crypto.symbol} value={crypto.symbol}>
                          {crypto.name} ({crypto.symbol})
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label htmlFor="crypto-amount-sell">
                    {selectedCrypto} Amount
                  </Label>
                  <Input
                    id="crypto-amount-sell"
                    type="number"
                    placeholder={`Enter amount in ${selectedCrypto}`}
                    value={cryptoAmount}
                    onChange={(e) => setCryptoAmount(e.target.value)}
                  />
                </div>
                <div>
                  <Label htmlFor="brl-amount">BRL Amount</Label>
                  <Input
                    id="brl-amount"
                    type="number"
                    placeholder="Amount in BRL"
                    value={amount}
                    onChange={(e) => setAmount(e.target.value)}
                    readOnly
                  />
                </div>
                <div className="text-sm text-gray-600">
                  Current Price: R$ {price.toLocaleString("pt-BR")}
                </div>
                <Button
                  onClick={handleSell}
                  disabled={
                    loading || !cryptoAmount || parseFloat(cryptoAmount) <= 0
                  }
                  className="w-full"
                >
                  {loading ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Processing...
                    </>
                  ) : (
                    `Sell ${selectedCrypto}`
                  )}
                </Button>
              </div>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
}

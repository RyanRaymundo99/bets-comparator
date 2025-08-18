"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from "@/hooks/use-toast";

export function TradingInterface() {
  const [amount, setAmount] = useState("");
  const [cryptoAmount, setCryptoAmount] = useState("");
  const [selectedCrypto, setSelectedCrypto] = useState("BTC");
  const [price, setPrice] = useState(0);
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  const cryptos = [
    { symbol: "BTC", name: "Bitcoin" },
    { symbol: "ETH", name: "Ethereum" },
    { symbol: "USDT", name: "Tether" },
  ];

  useEffect(() => {
    fetchPrice();
    const interval = setInterval(fetchPrice, 30000); // Update every 30 seconds
    return () => clearInterval(interval);
  }, [selectedCrypto]);

  const fetchPrice = async () => {
    try {
      const response = await fetch(
        `/api/crypto/price?symbol=${selectedCrypto}BRL`
      );
      const data = await response.json();
      setPrice(data.price);
    } catch (error) {
      console.error("Error fetching price:", error);
    }
  };

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
      } else {
        toast({
          title: "Error",
          description: data.error || "Failed to buy crypto",
          variant: "destructive",
        });
      }
    } catch (error) {
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
      } else {
        toast({
          title: "Error",
          description: data.error || "Failed to sell crypto",
          variant: "destructive",
        });
      }
    } catch (error) {
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
    <Card className="w-full max-w-2xl mx-auto">
      <CardHeader>
        <CardTitle>Trade Crypto</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          <div>
            <label className="text-sm font-medium">Select Crypto</label>
            <select
              value={selectedCrypto}
              onChange={(e) => setSelectedCrypto(e.target.value)}
              className="w-full mt-1 p-2 border rounded-md"
            >
              {cryptos.map((crypto) => (
                <option key={crypto.symbol} value={crypto.symbol}>
                  {crypto.name} ({crypto.symbol})
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="text-sm font-medium">
              Current Price: R$ {price.toFixed(2)}
            </label>
          </div>

          <Tabs defaultValue="buy" className="w-full">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="buy">Buy</TabsTrigger>
              <TabsTrigger value="sell">Sell</TabsTrigger>
            </TabsList>

            <TabsContent value="buy" className="space-y-4">
              <div>
                <label className="text-sm font-medium">Amount in BRL</label>
                <Input
                  type="number"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  placeholder="Enter amount in BRL"
                />
              </div>
              <Button onClick={handleBuy} disabled={loading} className="w-full">
                {loading ? "Processing..." : `Buy ${selectedCrypto}`}
              </Button>
            </TabsContent>

            <TabsContent value="sell" className="space-y-4">
              <div>
                <label className="text-sm font-medium">
                  Amount in {selectedCrypto}
                </label>
                <Input
                  type="number"
                  value={cryptoAmount}
                  onChange={(e) => setCryptoAmount(e.target.value)}
                  placeholder={`Enter amount in ${selectedCrypto}`}
                />
              </div>
              <Button
                onClick={handleSell}
                disabled={loading}
                className="w-full"
                variant="outline"
              >
                {loading ? "Processing..." : `Sell ${selectedCrypto}`}
              </Button>
            </TabsContent>
          </Tabs>
        </div>
      </CardContent>
    </Card>
  );
}

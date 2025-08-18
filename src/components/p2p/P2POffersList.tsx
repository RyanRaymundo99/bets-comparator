"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";

interface P2POffer {
  id: string;
  type: "BUY" | "SELL";
  cryptoCurrency: string;
  fiatCurrency: string;
  cryptoAmount: number;
  fiatAmount: number;
  price: number;
  paymentMethods: string[];
  minTrade: number;
  maxTrade: number;
  user: {
    name: string;
    email: string;
  };
  createdAt: string;
}

export function P2POffersList() {
  const [offers, setOffers] = useState<P2POffer[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedCrypto, setSelectedCrypto] = useState("BTC");
  const [selectedType, setSelectedType] = useState<"BUY" | "SELL">("SELL");
  const { toast } = useToast();

  const cryptos = [
    { symbol: "BTC", name: "Bitcoin" },
    { symbol: "ETH", name: "Ethereum" },
    { symbol: "USDT", name: "Tether" },
  ];

  useEffect(() => {
    fetchOffers();
  }, [selectedCrypto, selectedType]);

  const fetchOffers = async () => {
    try {
      setLoading(true);
      const response = await fetch(
        `/api/p2p/offers?cryptoCurrency=${selectedCrypto}&type=${selectedType}`
      );
      const data = await response.json();
      setOffers(data.offers || []);
    } catch (error) {
      console.error("Error fetching offers:", error);
      toast({
        title: "Error",
        description: "Failed to fetch offers",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleTrade = async (offer: P2POffer) => {
    try {
      const response = await fetch("/api/p2p/trades", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          offerId: offer.id,
          cryptoAmount: offer.cryptoAmount,
          fiatAmount: offer.fiatAmount,
        }),
      });

      const data = await response.json();

      if (response.ok) {
        toast({
          title: "Success",
          description: "Trade created successfully",
        });
        // Redirect to trade details or refresh offers
        fetchOffers();
      } else {
        toast({
          title: "Error",
          description: data.error || "Failed to create trade",
          variant: "destructive",
        });
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Network error",
        variant: "destructive",
      });
    }
  };

  if (loading) {
    return <div className="text-center py-8">Loading offers...</div>;
  }

  return (
    <div className="space-y-4">
      <div className="flex gap-4 mb-6">
        <div>
          <label className="text-sm font-medium">Crypto</label>
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
          <label className="text-sm font-medium">Type</label>
          <select
            value={selectedType}
            onChange={(e) => setSelectedType(e.target.value as "BUY" | "SELL")}
            className="w-full mt-1 p-2 border rounded-md"
          >
            <option value="SELL">I want to buy</option>
            <option value="BUY">I want to sell</option>
          </select>
        </div>
      </div>

      {offers.length === 0 ? (
        <Card>
          <CardContent className="text-center py-8">
            <p>No offers available</p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4">
          {offers.map((offer) => (
            <Card key={offer.id}>
              <CardHeader>
                <div className="flex justify-between items-start">
                  <div>
                    <CardTitle className="text-lg">{offer.user.name}</CardTitle>
                    <p className="text-sm text-gray-600">
                      {offer.paymentMethods.join(", ")}
                    </p>
                  </div>
                  <Badge
                    variant={offer.type === "BUY" ? "default" : "secondary"}
                  >
                    {offer.type}
                  </Badge>
                </div>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 gap-4 mb-4">
                  <div>
                    <p className="text-sm text-gray-600">Price</p>
                    <p className="text-lg font-semibold">
                      R$ {offer.price.toFixed(2)}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">Available</p>
                    <p className="text-lg font-semibold">
                      {offer.cryptoAmount} {offer.cryptoCurrency}
                    </p>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4 mb-4">
                  <div>
                    <p className="text-sm text-gray-600">Min Trade</p>
                    <p className="font-medium">R$ {offer.minTrade}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">Max Trade</p>
                    <p className="font-medium">R$ {offer.maxTrade}</p>
                  </div>
                </div>
                <Button
                  onClick={() => handleTrade(offer)}
                  className="w-full"
                  variant={offer.type === "BUY" ? "default" : "outline"}
                >
                  Trade Now
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}

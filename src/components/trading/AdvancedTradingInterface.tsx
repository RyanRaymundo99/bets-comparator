"use client";

import React, { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { TrendingUp, TrendingDown, BarChart3, Clock } from "lucide-react";

interface CryptoPrice {
  symbol: string;
  price: number;
  priceChange: number;
  priceChangePercent: number;
  volume: number;
  high24h: number;
  low24h: number;
}

interface OrderBookEntry {
  price: number;
  quantity: number;
}

// interface TradingPair {
//   symbol: string;
//   baseAsset: string;
//   quoteAsset: string;
// }

export default function AdvancedTradingInterface() {
  const [prices, setPrices] = useState<CryptoPrice[]>([]);
  const [selectedPair, setSelectedPair] = useState<string>("BTCUSDT");
  const [orderType, setOrderType] = useState<"MARKET" | "LIMIT">("MARKET");
  const [side, setSide] = useState<"BUY" | "SELL">("BUY");
  const [amount, setAmount] = useState("");
  const [price, setPrice] = useState("");
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [trading, setTrading] = useState(false);
  const [orderBook, setOrderBook] = useState<{
    bids: OrderBookEntry[];
    asks: OrderBookEntry[];
  }>({ bids: [], asks: [] });
  const [recentTrades, setRecentTrades] = useState<
    Array<{
      isBuyerMaker?: boolean;
      qty?: string;
      price?: string;
      [key: string]: unknown;
    }>
  >([]);
  const [userBalances, setUserBalances] = useState<{ [key: string]: number }>(
    {}
  );

  const { toast } = useToast();

  // Fetch popular crypto prices
  const fetchPrices = async () => {
    try {
      const response = await fetch("/api/crypto/popular-pairs");
      if (response.ok) {
        const data = await response.json();
        setPrices(data.data);
        if (data.data.length > 0) {
          setSelectedPair(data.data[0].symbol);
        }
      }
    } catch (error) {
      console.error("Error fetching prices:", error);
    }
  };

  // Fetch order book for selected pair
  const fetchOrderBook = async () => {
    try {
      const response = await fetch(
        `/api/crypto/orderbook?symbol=${selectedPair}`
      );
      if (response.ok) {
        const data = await response.json();
        setOrderBook(data.data);
      }
    } catch (error) {
      console.error("Error fetching order book:", error);
    }
  };

  // Fetch recent trades for selected pair
  const fetchRecentTrades = async () => {
    try {
      const response = await fetch(
        `/api/crypto/recent-trades?symbol=${selectedPair}`
      );
      if (response.ok) {
        const data = await response.json();
        setRecentTrades(data.data);
      }
    } catch (error) {
      console.error("Error fetching recent trades:", error);
    }
  };

  // Fetch user balances
  const fetchUserBalances = async () => {
    try {
      const response = await fetch("/api/balance");
      if (response.ok) {
        const data = await response.json();
        const balances: { [key: string]: number } = {};
        data.balances?.forEach(
          (balance: { currency: string; amount: string | number }) => {
            balances[balance.currency] =
              typeof balance.amount === "string"
                ? parseFloat(balance.amount)
                : balance.amount;
          }
        );
        setUserBalances(balances);
      }
    } catch (error) {
      console.error("Error fetching user balances:", error);
    }
  };

  // Calculate total when amount or price changes
  useEffect(() => {
    if (amount && price) {
      setTotal(parseFloat(amount) * parseFloat(price));
    } else {
      setTotal(0);
    }
  }, [amount, price]);

  // Update price when selected pair changes
  useEffect(() => {
    const selectedPrice = prices.find((p) => p.symbol === selectedPair);
    if (selectedPrice && orderType === "MARKET") {
      setPrice(selectedPrice.price.toString());
    }
  }, [selectedPair, prices, orderType]);

  // Fetch data when selected pair changes
  useEffect(() => {
    if (selectedPair) {
      fetchOrderBook();
      fetchRecentTrades();
      fetchUserBalances(); // Fetch balances when pair changes
    }
  }, [selectedPair, fetchOrderBook, fetchRecentTrades]);

  // Load initial data
  useEffect(() => {
    const loadData = async () => {
      setLoading(true);
      await fetchPrices();
      setLoading(false);
    };
    loadData();
  }, []);

  // Execute trade
  const executeTrade = async () => {
    if (!amount || parseFloat(amount) <= 0) {
      toast({
        title: "Invalid Amount",
        description: "Please enter a valid amount",
        variant: "destructive",
      });
      return;
    }

    if (orderType === "LIMIT" && (!price || parseFloat(price) <= 0)) {
      toast({
        title: "Invalid Price",
        description: "Please enter a valid price for limit orders",
        variant: "destructive",
      });
      return;
    }

    // Check user balance before executing trade
    const tradeAmount = parseFloat(amount);
    const tradePrice =
      orderType === "LIMIT"
        ? parseFloat(price)
        : prices.find((p) => p.symbol === selectedPair)?.price || 0;
    const tradeTotal = tradeAmount * tradePrice;

    if (side === "BUY") {
      const usdtBalance = userBalances["USDT"] || 0;
      if (usdtBalance < tradeTotal) {
        toast({
          title: "Insufficient Balance",
          description: `You need ${tradeTotal.toFixed(
            2
          )} USDT but only have ${usdtBalance.toFixed(2)} USDT`,
          variant: "destructive",
        });
        return;
      }
    } else {
      const cryptoCurrency = selectedPair.replace("USDT", "");
      const cryptoBalance = userBalances[cryptoCurrency] || 0;
      if (cryptoBalance < tradeAmount) {
        toast({
          title: "Insufficient Balance",
          description: `You need ${tradeAmount.toFixed(
            6
          )} ${cryptoCurrency} but only have ${cryptoBalance.toFixed(
            6
          )} ${cryptoCurrency}`,
          variant: "destructive",
        });
        return;
      }
    }

    try {
      setTrading(true);
      const endpoint = side === "BUY" ? "/api/crypto/buy" : "/api/crypto/sell";

      const response = await fetch(endpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          amount: tradeAmount,
          cryptoCurrency: selectedPair.replace("USDT", ""),
          quoteCurrency: "USDT",
          price: orderType === "LIMIT" ? tradePrice : undefined,
        }),
      });

      if (response.ok) {
        const data = await response.json();
        toast({
          title: "Success",
          description: data.message,
        });

        // Reset form
        setAmount("");
        setPrice("");
        setTotal(0);

        // Refresh data
        fetchPrices();
        fetchOrderBook();
        fetchRecentTrades();
        fetchUserBalances(); // Refresh balances after trade
      } else {
        const error = await response.json();
        throw new Error(error.error || "Trade failed");
      }
    } catch (error) {
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Trade failed",
        variant: "destructive",
      });
    } finally {
      setTrading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
          <p>Loading trading interface...</p>
        </div>
      </div>
    );
  }

  const selectedPrice = prices.find((p) => p.symbol === selectedPair);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold">Advanced Trading</h1>
        <p className="text-muted-foreground">
          Trade cryptocurrencies with real-time prices and advanced order types
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Trading Form */}
        <div className="lg:col-span-1">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <BarChart3 className="h-5 w-5" />
                Place Order
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Trading Pair Selection */}
              <div>
                <label className="text-sm font-medium">Trading Pair</label>
                <Select value={selectedPair} onValueChange={setSelectedPair}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {prices.map((price) => (
                      <SelectItem key={price.symbol} value={price.symbol}>
                        {price.symbol}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Order Type */}
              <div>
                <label className="text-sm font-medium">Order Type</label>
                <Select
                  value={orderType}
                  onValueChange={(value: "MARKET" | "LIMIT") =>
                    setOrderType(value)
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="MARKET">Market</SelectItem>
                    <SelectItem value="LIMIT">Limit</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Buy/Sell Toggle */}
              <div className="grid grid-cols-2 gap-2">
                <Button
                  variant={side === "BUY" ? "default" : "outline"}
                  onClick={() => setSide("BUY")}
                  className="w-full"
                >
                  <TrendingUp className="h-4 w-4 mr-2" />
                  Buy
                </Button>
                <Button
                  variant={side === "SELL" ? "default" : "outline"}
                  onClick={() => setSide("SELL")}
                  className="w-full"
                >
                  <TrendingDown className="h-4 w-4 mr-2" />
                  Sell
                </Button>
              </div>

              {/* Amount Input */}
              <div>
                <label className="text-sm font-medium">
                  Amount ({selectedPair.replace("USDT", "")})
                </label>
                <Input
                  type="number"
                  placeholder="0.00"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  min="0"
                  step="0.0001"
                />
              </div>

              {/* Price Input (for limit orders) */}
              {orderType === "LIMIT" && (
                <div>
                  <label className="text-sm font-medium">Price (USDT)</label>
                  <Input
                    type="number"
                    placeholder="0.00"
                    value={price}
                    onChange={(e) => setPrice(e.target.value)}
                    min="0"
                    step="0.01"
                  />
                </div>
              )}

              {/* Total Display */}
              <div className="p-3 bg-muted rounded-lg">
                <div className="flex justify-between items-center">
                  <span className="text-sm text-muted-foreground">Total:</span>
                  <span className="font-semibold">
                    ${total.toFixed(2)} USDT
                  </span>
                </div>
              </div>

              {/* Execute Button */}
              <Button
                onClick={executeTrade}
                disabled={trading || !amount}
                className={`w-full ${
                  side === "BUY"
                    ? "bg-green-600 hover:bg-green-700"
                    : "bg-red-600 hover:bg-red-700"
                }`}
              >
                {trading
                  ? "Processing..."
                  : `${side} ${selectedPair.replace("USDT", "")}`}
              </Button>
            </CardContent>
          </Card>
        </div>

        {/* Market Data */}
        <div className="lg:col-span-2 space-y-6">
          {/* Price Information */}
          <Card>
            <CardHeader>
              <CardTitle>Market Data - {selectedPair}</CardTitle>
            </CardHeader>
            <CardContent>
              {selectedPrice && (
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div className="text-center">
                    <p className="text-sm text-muted-foreground">
                      Current Price
                    </p>
                    <p className="text-2xl font-bold">
                      ${selectedPrice.price.toFixed(4)}
                    </p>
                  </div>
                  <div className="text-center">
                    <p className="text-sm text-muted-foreground">24h Change</p>
                    <p
                      className={`text-lg font-semibold ${
                        selectedPrice.priceChangePercent >= 0
                          ? "text-green-600"
                          : "text-red-600"
                      }`}
                    >
                      {selectedPrice.priceChangePercent >= 0 ? "+" : ""}
                      {selectedPrice.priceChangePercent.toFixed(2)}%
                    </p>
                  </div>
                  <div className="text-center">
                    <p className="text-sm text-muted-foreground">24h High</p>
                    <p className="text-lg font-semibold">
                      ${selectedPrice.high24h.toFixed(4)}
                    </p>
                  </div>
                  <div className="text-center">
                    <p className="text-sm text-muted-foreground">24h Low</p>
                    <p className="text-lg font-semibold">
                      ${selectedPrice.low24h.toFixed(4)}
                    </p>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Order Book and Recent Trades */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Order Book */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <BarChart3 className="h-4 w-4" />
                  Order Book
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {/* Asks (Sell Orders) */}
                  <div className="text-sm text-red-600 font-medium">Asks</div>
                  {orderBook.asks.slice(0, 8).map((ask, index) => (
                    <div key={index} className="flex justify-between text-sm">
                      <span className="text-red-600">
                        ${ask.price.toFixed(4)}
                      </span>
                      <span>{ask.quantity.toFixed(4)}</span>
                    </div>
                  ))}

                  <hr className="my-2" />

                  {/* Bids (Buy Orders) */}
                  <div className="text-sm text-green-600 font-medium">Bids</div>
                  {orderBook.bids.slice(0, 8).map((bid, index) => (
                    <div key={index} className="flex justify-between text-sm">
                      <span className="text-green-600">
                        ${bid.price.toFixed(4)}
                      </span>
                      <span>{bid.quantity.toFixed(4)}</span>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Recent Trades */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Clock className="h-4 w-4" />
                  Recent Trades
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {recentTrades.slice(0, 10).map((trade, index) => (
                    <div
                      key={index}
                      className="flex justify-between items-center text-sm"
                    >
                      <div className="flex items-center gap-2">
                        <Badge
                          variant={trade.isBuyerMaker ? "outline" : "default"}
                          className="text-xs"
                        >
                          {trade.isBuyerMaker ? "SELL" : "BUY"}
                        </Badge>
                        <span>{parseFloat(trade.qty || "0").toFixed(4)}</span>
                      </div>
                      <span className="font-medium">
                        ${parseFloat(trade.price || "0").toFixed(4)}
                      </span>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}

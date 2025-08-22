"use client";

import { useState, useEffect, useCallback } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";

interface Balance {
  id: string;
  currency: string;
  amount: number;
  locked: number;
}

interface Transaction {
  id: string;
  type: string;
  amount: number;
  currency: string;
  description: string;
  createdAt: string;
}

export function PortfolioOverview() {
  const [balances, setBalances] = useState<Balance[]>([]);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  const fetchData = useCallback(async () => {
    try {
      setLoading(true);

      // Fetch balances
      const balanceResponse = await fetch("/api/balance");
      const balanceData = await balanceResponse.json();
      setBalances(balanceData.balances || []);

      // Fetch recent transactions
      const transactionResponse = await fetch("/api/transactions?limit=10");
      const transactionData = await transactionResponse.json();
      setTransactions(transactionData.transactions || []);
    } catch (error) {
      console.error("Error fetching portfolio data:", error);
      toast({
        title: "Error",
        description: "Failed to fetch portfolio data",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  }, [toast]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const getTransactionIcon = (type: string) => {
    switch (type) {
      case "DEPOSIT":
        return "💰";
      case "WITHDRAWAL":
        return "💸";
      case "BUY_CRYPTO":
        return "📈";
      case "SELL_CRYPTO":
        return "📉";
      case "P2P_TRADE":
        return "🤝";
      default:
        return "📊";
    }
  };

  const getTransactionColor = (type: string) => {
    switch (type) {
      case "DEPOSIT":
      case "BUY_CRYPTO":
        return "text-green-600";
      case "WITHDRAWAL":
      case "SELL_CRYPTO":
        return "text-red-600";
      default:
        return "text-gray-600";
    }
  };

  if (loading) {
    return <div className="text-center py-8">Loading portfolio...</div>;
  }

  return (
    <div className="space-y-6">
      {/* Balances */}
      <Card>
        <CardHeader>
          <CardTitle>Your Balances</CardTitle>
        </CardHeader>
        <CardContent>
          {balances.length === 0 ? (
            <p className="text-center text-gray-500 py-4">No balances found</p>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {balances.map((balance) => (
                <div
                  key={balance.id}
                  className="p-4 border rounded-lg bg-gray-50"
                >
                  <div className="flex justify-between items-center mb-2">
                    <span className="font-semibold">{balance.currency}</span>
                    <Badge variant="outline">
                      {balance.locked > 0 ? "Locked" : "Available"}
                    </Badge>
                  </div>
                  <div className="space-y-1">
                    <p className="text-2xl font-bold">
                      {balance.amount.toFixed(8)}
                    </p>
                    {balance.locked > 0 && (
                      <p className="text-sm text-gray-600">
                        Locked: {balance.locked.toFixed(8)}
                      </p>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Recent Transactions */}
      <Card>
        <CardHeader>
          <CardTitle>Recent Transactions</CardTitle>
        </CardHeader>
        <CardContent>
          {transactions.length === 0 ? (
            <p className="text-center text-gray-500 py-4">
              No transactions found
            </p>
          ) : (
            <div className="space-y-3">
              {transactions.map((transaction) => (
                <div
                  key={transaction.id}
                  className="flex items-center justify-between p-3 border rounded-lg"
                >
                  <div className="flex items-center space-x-3">
                    <span className="text-xl">
                      {getTransactionIcon(transaction.type)}
                    </span>
                    <div>
                      <p className="font-medium">{transaction.description}</p>
                      <p className="text-sm text-gray-600">
                        {new Date(transaction.createdAt).toLocaleDateString()}
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p
                      className={`font-semibold ${getTransactionColor(
                        transaction.type
                      )}`}
                    >
                      {transaction.amount > 0 ? "+" : ""}
                      {transaction.amount.toFixed(8)} {transaction.currency}
                    </p>
                    <Badge variant="outline" className="text-xs">
                      {transaction.type}
                    </Badge>
                  </div>
                </div>
              ))}
            </div>
          )}
          <div className="mt-4 text-center">
            <Button
              variant="outline"
              onClick={() => (window.location.href = "/portfolio")}
            >
              View All Transactions
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

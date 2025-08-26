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

  const getBalanceCardStyle = (currency: string) => {
    switch (currency) {
      case "BRL":
        return "bg-gradient-to-br from-green-50 to-emerald-100 border-green-200";
      case "BTC":
        return "bg-gradient-to-br from-orange-50 to-amber-100 border-orange-200";
      case "ETH":
        return "bg-gradient-to-br from-blue-50 to-indigo-100 border-blue-200";
      case "USDT":
        return "bg-gradient-to-br from-teal-50 to-cyan-100 border-teal-200";
      default:
        return "bg-gradient-to-br from-gray-50 to-slate-100 border-gray-200";
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
                  className={`p-4 border rounded-lg ${getBalanceCardStyle(balance.currency)} hover:shadow-lg transition-all duration-200`}
                >
                  <div className="flex justify-between items-center mb-3">
                    <span className="font-semibold text-gray-800">{balance.currency}</span>
                    <Badge 
                      variant="outline" 
                      className={`${
                        balance.locked > 0 
                          ? "bg-red-100 text-red-700 border-red-300" 
                          : "bg-green-100 text-green-700 border-green-300"
                      }`}
                    >
                      {balance.locked > 0 ? "Locked" : "Available"}
                    </Badge>
                  </div>
                  <div className="space-y-2">
                    <p className="text-2xl font-bold text-gray-900">
                      {balance.amount.toFixed(8)}
                    </p>
                    {balance.locked > 0 && (
                      <p className="text-sm text-red-600 font-medium">
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
                  className="flex items-center justify-between p-3 border rounded-lg bg-white hover:shadow-md transition-all duration-200"
                >
                  <div className="flex items-center space-x-3">
                    <span className="text-xl">
                      {getTransactionIcon(transaction.type)}
                    </span>
                    <div>
                      <p className="font-medium text-gray-900">{transaction.description}</p>
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
                    <Badge variant="outline" className="text-xs bg-gray-50 text-gray-700 border-gray-300">
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
              className="hover:bg-gray-50 border-gray-300 text-gray-700"
            >
              View All Transactions
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

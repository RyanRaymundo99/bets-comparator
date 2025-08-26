"use client";
import React, { useState, useEffect } from "react";
import { ChevronDown, Wallet } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

interface Balance {
  currency: string;
  amount: number;
  locked: number;
}

interface BalanceDisplayProps {
  className?: string;
}

export function BalanceDisplay({ className }: BalanceDisplayProps) {
  const [balances, setBalances] = useState<Balance[]>([]);
  const [selectedCurrency, setSelectedCurrency] = useState<string>("BRL");
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchBalances = async () => {
      try {
        setIsLoading(true);
        const response = await fetch("/api/balance");
        if (response.ok) {
          const data = await response.json();
          setBalances(data.balances || []);

          // Set default currency to first available or BRL
          if (data.balances && data.balances.length > 0) {
            const brlBalance = data.balances.find(
              (b: Balance) => b.currency === "BRL"
            );
            if (brlBalance) {
              setSelectedCurrency("BRL");
            } else {
              setSelectedCurrency(data.balances[0].currency);
            }
          }
        } else {
          setError("Failed to fetch balances");
        }
      } catch (err) {
        setError("Error loading balances");
        console.error("Error fetching balances:", err);
      } finally {
        setIsLoading(false);
      }
    };

    fetchBalances();
  }, []);

  const formatBalance = (amount: number, currency: string) => {
    if (currency === "BRL") {
      return new Intl.NumberFormat("pt-BR", {
        style: "currency",
        currency: "BRL",
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
      }).format(amount);
    } else {
      return `${amount.toFixed(8)} ${currency}`;
    }
  };

  const getCurrentBalance = () => {
    const balance = balances.find((b) => b.currency === selectedCurrency);
    return balance ? balance.amount : 0;
  };

  const getCurrencyIcon = (currency: string) => {
    switch (currency) {
      case "BRL":
        return "R$";
      case "BTC":
        return "₿";
      case "ETH":
        return "Ξ";
      case "USDT":
        return "₮";
      default:
        return currency;
    }
  };

  if (isLoading) {
    return (
      <div
        className={`flex items-center gap-2 px-3 py-2 rounded-lg bg-white/10 text-white/70 ${className}`}
      >
        <Wallet className="w-4 h-4 animate-pulse" />
        <span className="text-sm">Loading...</span>
      </div>
    );
  }

  if (error || balances.length === 0) {
    return (
      <div
        className={`flex items-center gap-2 px-3 py-2 rounded-lg bg-red-500/20 text-red-300 ${className}`}
      >
        <Wallet className="w-4 h-4" />
        <span className="text-sm">No balance</span>
      </div>
    );
  }

  return (
    <div className={`flex items-center gap-2 ${className}`}>
      {/* Balance Display */}
      <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-white/10 text-white hover:bg-white/20 transition-colors">
        <Wallet className="w-4 h-4 text-blue-300" />
        <span className="text-sm font-medium">
          {formatBalance(getCurrentBalance(), selectedCurrency)}
        </span>
      </div>

      {/* Currency Dropdown */}
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button
            variant="ghost"
            size="sm"
            className="h-8 px-2 text-white hover:text-blue-300 hover:bg-white/10"
          >
            <span className="text-sm font-medium mr-1">
              {getCurrencyIcon(selectedCurrency)}
            </span>
            <ChevronDown className="w-3 h-3" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent
          align="end"
          className="w-32 bg-black/90 border border-white/20 backdrop-blur-md"
        >
          {balances.map((balance) => (
            <DropdownMenuItem
              key={balance.currency}
              onClick={() => setSelectedCurrency(balance.currency)}
              className={`text-white hover:bg-white/20 focus:bg-white/20 cursor-pointer ${
                selectedCurrency === balance.currency
                  ? "bg-blue-500/20 text-blue-300"
                  : ""
              }`}
            >
              <div className="flex items-center justify-between w-full">
                <span className="text-sm">{balance.currency}</span>
                <span className="text-xs text-white/70">
                  {formatBalance(balance.amount, balance.currency)}
                </span>
              </div>
            </DropdownMenuItem>
          ))}
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  );
}

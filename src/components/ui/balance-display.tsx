"use client";
import React, { useState, useEffect } from "react";
import { Wallet, ChevronDown } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { formatCurrency, getFirstName } from "@/lib/formatters";

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
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [userName, setUserName] = useState<string | null>(null);

  useEffect(() => {
    const fetchBalances = async () => {
      try {
        setIsLoading(true);
        const response = await fetch("/api/balance");
        if (response.ok) {
          const data = await response.json();
          setBalances(data.balances || []);
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

    const fetchUserName = async () => {
      try {
        const response = await fetch("/api/user/status");
        if (response.ok) {
          const data = await response.json();
          setUserName(data.user?.name || null);
        }
      } catch (err) {
        console.error("Error fetching user name:", err);
      }
    };

    fetchBalances();
    fetchUserName();
  }, []);

  const getBalance = (currency: string) => {
    const balance = balances.find((b) => b.currency === currency);
    return balance ? balance.amount : 0;
  };

  const firstName = getFirstName(userName);

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

  const brlBalance = getBalance("BRL");
  const usdtBalance = getBalance("USDT");

  return (
    <div className={`flex items-center gap-2 ${className}`}>
      {/* Balance Display Button with Dropdown */}
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button
            variant="ghost"
            size="sm"
            className="h-8 px-3 py-2 rounded-lg bg-white/10 text-white hover:bg-white/20 transition-colors gap-2"
          >
            <Wallet className="w-4 h-4 text-blue-300" />
            {firstName && (
              <span className="text-sm font-medium">{firstName}</span>
            )}
            <ChevronDown className="w-3 h-3" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent
          align="end"
          className="w-48 bg-black/90 border border-white/20 backdrop-blur-md"
        >
          {/* BRL Balance */}
          <DropdownMenuItem className="text-white hover:bg-white/20 focus:bg-white/20 cursor-default">
            <div className="flex items-center justify-between w-full">
              <span className="text-sm font-medium">BRL</span>
              <span className="text-sm font-semibold text-blue-300">
                {formatCurrency(brlBalance, "BRL")}
              </span>
            </div>
          </DropdownMenuItem>

          {/* USDT Balance */}
          <DropdownMenuItem className="text-white hover:bg-white/20 focus:bg-white/20 cursor-default">
            <div className="flex items-center justify-between w-full">
              <span className="text-sm font-medium">USDT</span>
              <span className="text-sm font-semibold text-blue-300">
                {formatCurrency(usdtBalance, "USDT")}
              </span>
            </div>
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  );
}

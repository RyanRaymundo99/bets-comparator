"use client";

import { useState, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import {
  TrendingUp,
  TrendingDown,
  DollarSign,
  Bitcoin,
  BarChart3,
  ArrowUpRight,
  Eye,
  EyeOff,
  RefreshCw,
  Activity,
  Target,
  Zap,
  Shield,
  Globe,
  Clock,
  Star,
  Plus,
  ChevronLeft,
  ChevronRight,
  Play,
  Pause,
  Coins,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import NavbarNew from "@/components/ui/navbar-new";
import Breadcrumb from "@/components/ui/breadcrumb";
import KYCBanner from "@/components/ui/kyc-banner";

interface CryptoPrice {
  symbol: string;
  price: number;
  change24h: number;
  changePercent: number;
  volume: number;
  marketCap: number;
}

interface Balance {
  currency: string;
  amount: number;
  locked: number;
}

interface Transaction {
  id: string;
  type: string;
  amount: number;
  currency: string;
  status: string;
  createdAt: string;
}

interface UserStatus {
  id: string;
  name: string;
  email: string;
  approvalStatus: string;
  kycStatus: string;
  emailVerified: boolean;
  phoneVerified: boolean;
  kycSubmittedAt: string | null;
  kycReviewedAt: string | null;
  kycRejectionReason: string | null;
}

export default function Dashboard() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { toast } = useToast();
  const [isLoggingOut, setIsLoggingOut] = useState(false);
  const [balances, setBalances] = useState<Balance[]>([]);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [cryptoPrices, setCryptoPrices] = useState<CryptoPrice[]>([]);
  const [currentCryptoIndex, setCurrentCryptoIndex] = useState(0);
  const [isCarouselPlaying, setIsCarouselPlaying] = useState(true);
  const [showBalances, setShowBalances] = useState(true);
  const [totalBalance, setTotalBalance] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [userStatus, setUserStatus] = useState<UserStatus | null>(null);
  const [showKYCBanner, setShowKYCBanner] = useState(true);

  // Check if redirected from KYC submission
  useEffect(() => {
    const kycParam = searchParams.get("kyc");
    if (kycParam === "pending") {
      setShowKYCBanner(true);
    }
  }, [searchParams]);

  // Format currency in Brazilian Real
  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat("pt-BR", {
      style: "currency",
      currency: "BRL",
    }).format(value);
  };

  // Format crypto price
  const formatCryptoPrice = (value: number) => {
    return new Intl.NumberFormat("pt-BR", {
      style: "currency",
      currency: "BRL",
      minimumFractionDigits: 2,
      maximumFractionDigits: 8,
    }).format(value);
  };

  // Format percentage
  const formatPercentage = (value: number) => {
    return `${value >= 0 ? "+" : ""}${value.toFixed(2)}%`;
  };

  // Get crypto logo
  const getCryptoLogo = (symbol: string) => {
    switch (symbol) {
      case "BTC":
        return <Bitcoin className="w-8 h-8 text-orange-500" />;
      case "ETH":
        return <Globe className="w-8 h-8 text-blue-500" />;
      case "BNB":
        return (
          <div className="w-8 h-8 bg-yellow-500 rounded-full flex items-center justify-center text-white font-bold text-xs">
            BNB
          </div>
        );
      case "ADA":
        return (
          <div className="w-8 h-8 bg-blue-600 rounded-full flex items-center justify-center text-white font-bold text-xs">
            ADA
          </div>
        );
      case "SOL":
        return (
          <div className="w-8 h-8 bg-purple-500 rounded-full flex items-center justify-center text-white font-bold text-xs">
            SOL
          </div>
        );
      default:
        return <Bitcoin className="w-8 h-8 text-orange-500" />;
    }
  };

  // Fetch user data
  useEffect(() => {
    const fetchData = async () => {
      try {
        // Fetch user status
        const userStatusResponse = await fetch("/api/user/status");
        if (userStatusResponse.ok) {
          const userStatusData = await userStatusResponse.json();
          setUserStatus(userStatusData.user);
        }

        // Fetch balances
        const balanceResponse = await fetch("/api/balance");
        if (balanceResponse.ok) {
          const balanceData = await balanceResponse.json();
          setBalances(balanceData.balances || []);

          const total =
            balanceData.balances?.reduce((sum: number, balance: Balance) => {
              if (balance.currency === "BRL") {
                return sum + balance.amount;
              }
              return sum;
            }, 0) || 0;
          setTotalBalance(total);
        }

        // Fetch transactions
        const transactionResponse = await fetch("/api/transactions?limit=5");
        if (transactionResponse.ok) {
          const transactionData = await transactionResponse.json();
          setTransactions(transactionData.transactions || []);
        }

        // Fetch crypto prices
        const btcResponse = await fetch("/api/crypto/price?symbol=BTCBRL");
        const ethResponse = await fetch("/api/crypto/price?symbol=ETHBRL");

        if (btcResponse.ok && ethResponse.ok) {
          const btcData = await btcResponse.json();
          const ethData = await ethResponse.json();

          // Mock data for demonstration - replace with real API data
          const mockCryptoData: CryptoPrice[] = [
            {
              symbol: "BTC",
              price: btcData.price || 350000,
              change24h: 2500,
              changePercent: 0.72,
              volume: 1250000000,
              marketCap: 6800000000000,
            },
            {
              symbol: "ETH",
              price: ethData.price || 18500,
              change24h: -150,
              changePercent: -0.8,
              volume: 850000000,
              marketCap: 2200000000000,
            },
            {
              symbol: "BNB",
              price: 3200,
              change24h: 45,
              changePercent: 1.43,
              volume: 320000000,
              marketCap: 480000000000,
            },
            {
              symbol: "ADA",
              price: 2.85,
              change24h: -0.12,
              changePercent: -4.04,
              volume: 85000000,
              marketCap: 100000000000,
            },
            {
              symbol: "SOL",
              price: 450,
              change24h: 12.5,
              changePercent: 2.86,
              volume: 180000000,
              marketCap: 180000000000,
            },
          ];

          setCryptoPrices(mockCryptoData);
          // Reset carousel index to 0 when new data is loaded
          setCurrentCryptoIndex(0);
        } else {
          // If API calls fail, clear crypto prices and reset index
          setCryptoPrices([]);
          setCurrentCryptoIndex(0);
        }
      } catch (error) {
        console.error("Failed to fetch data:", error);
        toast({
          title: "Erro ao carregar dados",
          description: "Não foi possível carregar os dados do dashboard.",
          variant: "destructive",
        });
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
  }, [toast]);

  // Auto-advance carousel
  useEffect(() => {
    if (!isCarouselPlaying || cryptoPrices.length === 0) return;

    const interval = setInterval(() => {
      setCurrentCryptoIndex((prev) => (prev + 1) % cryptoPrices.length);
    }, 3000);

    return () => clearInterval(interval);
  }, [isCarouselPlaying, cryptoPrices.length]);

  // Carousel navigation
  const nextCrypto = () => {
    if (cryptoPrices.length === 0) return;
    setCurrentCryptoIndex((prev) => (prev + 1) % cryptoPrices.length);
  };

  const prevCrypto = () => {
    if (cryptoPrices.length === 0) return;
    setCurrentCryptoIndex(
      (prev) => (prev - 1 + cryptoPrices.length) % cryptoPrices.length
    );
  };

  const toggleCarousel = () => {
    setIsCarouselPlaying(!isCarouselPlaying);
  };

  const handleLogout = () => {
    setIsLoggingOut(true);
    localStorage.removeItem("auth-session");
    localStorage.removeItem("user");
    router.push("/login");
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background text-foreground">
        <NavbarNew isLoggingOut={isLoggingOut} handleLogout={handleLogout} />
        <div className="container mx-auto px-4 py-6 mobile-page-padding">
          <div className="flex items-center justify-center h-64">
            <RefreshCw className="w-8 h-8 animate-spin text-blue-500" />
          </div>
        </div>
      </div>
    );
  }

  const currentCrypto =
    cryptoPrices.length > 0 ? cryptoPrices[currentCryptoIndex] : null;

  return (
    <div className="min-h-screen bg-background text-foreground">
      <NavbarNew isLoggingOut={isLoggingOut} handleLogout={handleLogout} />

      <div className="container mx-auto px-4 py-6 mobile-page-padding">
        <Breadcrumb items={[{ label: "Dashboard" }]} />

        {/* KYC Status Banner */}
        {showKYCBanner && userStatus && (
          <KYCBanner
            status={userStatus.kycStatus as "PENDING" | "APPROVED" | "REJECTED"}
            onDismiss={() => setShowKYCBanner(false)}
            showDismiss={userStatus.kycStatus !== "PENDING"}
          />
        )}

        {/* Welcome Header */}
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold bg-gradient-to-r from-blue-600 via-purple-600 to-blue-800 bg-clip-text text-transparent mb-2">
            Bem-vindo ao Dashboard
          </h1>
          <p className="text-xl text-muted-foreground">
            Monitore seus investimentos e acompanhe o mercado crypto
          </p>
        </div>

        {/* Crypto Price Carousel */}
        {cryptoPrices.length > 0 && currentCrypto && (
          <Card className="mb-8">
            <CardHeader className="pb-4">
              <div className="flex items-center justify-between">
                <CardTitle className="text-foreground flex items-center gap-2">
                  <Activity className="w-5 h-5 text-blue-500" />
                  Preços em Tempo Real
                </CardTitle>
                <div className="flex items-center gap-2">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={toggleCarousel}
                    className="text-foreground hover:text-blue-500 hover:bg-muted"
                  >
                    {isCarouselPlaying ? (
                      <Pause className="w-4 h-4" />
                    ) : (
                      <Play className="w-4 h-4" />
                    )}
                  </Button>
                  <div className="flex gap-1">
                    {cryptoPrices.map((_, index) => (
                      <div
                        key={index}
                        className={`w-2 h-2 rounded-full transition-all duration-300 ${
                          index === currentCryptoIndex
                            ? "bg-blue-500 w-6"
                            : "bg-muted-foreground/30"
                        }`}
                      />
                    ))}
                  </div>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="relative">
                {/* Carousel Content */}
                <div className="flex items-center justify-center min-h-[200px]">
                  <div className="text-center">
                    <div className="flex items-center justify-center gap-3 mb-4">
                      <div
                        className={`w-16 h-16 rounded-full bg-gradient-to-r from-blue-500 to-purple-600 flex items-center justify-center`}
                      >
                        {getCryptoLogo(currentCrypto.symbol)}
                      </div>
                      <div className="text-left">
                        <h3 className="text-2xl font-bold text-foreground">
                          {currentCrypto.symbol}
                        </h3>
                        <p className="text-muted-foreground text-sm">
                          {currentCrypto.symbol === "BTC"
                            ? "Bitcoin"
                            : currentCrypto.symbol === "ETH"
                            ? "Ethereum"
                            : currentCrypto.symbol === "BNB"
                            ? "Binance Coin"
                            : currentCrypto.symbol === "ADA"
                            ? "Cardano"
                            : "Solana"}
                        </p>
                      </div>
                    </div>

                    <div className="mb-4">
                      <p className="text-4xl font-bold text-foreground mb-2">
                        {formatCryptoPrice(currentCrypto.price)}
                      </p>
                      <div className="flex items-center justify-center gap-2">
                        {currentCrypto.changePercent >= 0 ? (
                          <TrendingUp className="w-5 h-5 text-green-400" />
                        ) : (
                          <TrendingDown className="w-5 h-5 text-red-400" />
                        )}
                        <span
                          className={`text-lg font-semibold ${
                            currentCrypto.changePercent >= 0
                              ? "text-green-400"
                              : "text-red-400"
                          }`}
                        >
                          {formatPercentage(currentCrypto.changePercent)}
                        </span>
                        <span className="text-muted-foreground text-sm">
                          ({formatCurrency(currentCrypto.change24h)})
                        </span>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4 text-sm">
                      <div className="text-center">
                        <p className="text-muted-foreground">Volume 24h</p>
                        <p className="text-foreground font-semibold">
                          {formatCurrency(currentCrypto.volume)}
                        </p>
                      </div>
                      <div className="text-center">
                        <p className="text-muted-foreground">Market Cap</p>
                        <p className="text-foreground font-semibold">
                          {formatCurrency(currentCrypto.marketCap)}
                        </p>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Navigation Arrows */}
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={prevCrypto}
                  className="absolute left-2 top-1/2 transform -translate-y-1/2 text-foreground hover:text-blue-500 hover:bg-muted"
                >
                  <ChevronLeft className="w-6 h-6" />
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={nextCrypto}
                  className="absolute right-2 top-1/2 transform -translate-y-1/2 text-foreground hover:text-blue-500 hover:bg-muted"
                >
                  <ChevronRight className="w-6 h-6" />
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Fallback message when crypto prices fail to load */}
        {!isLoading && cryptoPrices.length === 0 && (
          <Card className="mb-8">
            <CardHeader>
              <CardTitle className="text-foreground flex items-center gap-2">
                <Activity className="w-5 h-5 text-blue-500" />
                Preços de Criptomoedas
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center justify-center min-h-[200px]">
                <div className="text-center">
                  <RefreshCw className="w-12 h-12 mx-auto mb-3 text-muted-foreground opacity-50" />
                  <p className="text-muted-foreground">
                    Não foi possível carregar os preços das criptomoedas.
                  </p>
                  <p className="text-sm text-muted-foreground mt-1">
                    Tente atualizar a página.
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Main Dashboard Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
          {/* Portfolio Overview */}
          <Card className="lg:col-span-2">
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                <span className="flex items-center gap-2 text-foreground">
                  <BarChart3 className="w-5 h-5" />
                  Visão Geral do Portfólio
                </span>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setShowBalances(!showBalances)}
                  className="text-foreground hover:text-blue-500 hover:bg-muted"
                >
                  {showBalances ? (
                    <EyeOff className="w-4 h-4" />
                  ) : (
                    <Eye className="w-4 h-4" />
                  )}
                </Button>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {/* Total Balance */}
                <div className="text-center p-4 bg-gradient-to-br from-blue-50 to-indigo-100 rounded-lg border border-blue-200">
                  <p className="text-sm text-blue-700 font-medium mb-1">
                    Saldo Total
                  </p>
                  <p className="text-3xl font-bold text-blue-900">
                    {showBalances ? formatCurrency(totalBalance) : "••••••"}
                  </p>
                </div>

                {/* Crypto Holdings */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {balances.map((balance, index) => (
                    <div
                      key={index}
                      className={`p-4 rounded-lg border hover:shadow-md transition-shadow ${
                        balance.currency === "BRL"
                          ? "bg-gradient-to-br from-green-50 to-emerald-100 border-green-200"
                          : "bg-gradient-to-br from-orange-50 to-amber-100 border-orange-200"
                      }`}
                    >
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center gap-2">
                          {balance.currency === "BRL" ? (
                            <DollarSign className="w-5 h-5 text-green-700" />
                          ) : (
                            <Bitcoin className="w-5 h-5 text-orange-700" />
                          )}
                          <span className="font-semibold text-gray-800">
                            {balance.currency}
                          </span>
                        </div>
                        <Badge
                          variant="secondary"
                          className={`${
                            balance.currency === "BRL"
                              ? "bg-green-100 text-green-700"
                              : "bg-orange-100 text-orange-700"
                          }`}
                        >
                          {balance.currency === "BRL" ? "Fiat" : "Crypto"}
                        </Badge>
                      </div>
                      <p className="text-2xl font-bold text-gray-900 mb-1">
                        {showBalances
                          ? balance.currency === "BRL"
                            ? formatCurrency(balance.amount)
                            : `${balance.amount.toFixed(8)} BTC`
                          : "••••••"}
                      </p>
                      {balance.locked > 0 && (
                        <p className="text-sm text-red-600 font-medium">
                          Bloqueado:{" "}
                          {balance.currency === "BRL"
                            ? formatCurrency(balance.locked)
                            : `${balance.locked.toFixed(8)} BTC`}
                        </p>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Quick Actions */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-foreground">
                <Zap className="w-5 h-5" />
                Ações Rápidas
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <Button
                onClick={() => router.push("/wallet")}
                className="w-full bg-green-600 hover:bg-green-700 text-white"
              >
                <TrendingUp className="w-4 h-4 mr-2" />
                Comprar/Vender
              </Button>
              <Button
                onClick={() => router.push("/wallet")}
                variant="outline"
                className="w-full border-border text-foreground hover:bg-muted"
              >
                <Coins className="w-4 h-4 mr-2" />
                Crypto Wallet
              </Button>
              <Button
                onClick={() => router.push("/advanced-trading")}
                variant="outline"
                className="w-full border-border text-foreground hover:bg-muted"
              >
                <Zap className="w-4 h-4 mr-2" />
                Advanced Trading
              </Button>
              <Button
                onClick={() => router.push("/deposits")}
                variant="outline"
                className="w-full border-border text-foreground hover:bg-muted"
              >
                <Plus className="w-4 h-4 mr-2" />
                Depositar
              </Button>
              <Button
                onClick={() => router.push("/withdraw")}
                variant="outline"
                className="w-full border-border text-foreground hover:bg-muted"
              >
                <ArrowUpRight className="w-4 h-4 mr-2" />
                Sacar
              </Button>
              <Button
                onClick={() => router.push("/p2p")}
                variant="outline"
                className="w-full border-border text-foreground hover:bg-muted"
              >
                <BarChart3 className="w-4 h-4 mr-2" />
                P2P Trading
              </Button>
            </CardContent>
          </Card>
        </div>

        {/* Market Overview & Recent Activity */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Market Overview */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-foreground">
                <Globe className="w-5 h-5" />
                Visão Geral do Mercado
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {cryptoPrices.slice(0, 3).map((crypto, index) => (
                  <div
                    key={index}
                    className="flex items-center justify-between p-3 bg-gradient-to-r from-gray-50 to-white rounded-lg border border-gray-200 hover:shadow-md transition-shadow"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 flex items-center justify-center">
                        {getCryptoLogo(crypto.symbol)}
                      </div>
                      <div>
                        <p className="font-semibold text-gray-900">
                          {crypto.symbol}
                        </p>
                        <p className="text-sm text-gray-600">
                          {formatCryptoPrice(crypto.price)}
                        </p>
                      </div>
                    </div>
                    <div className="text-right">
                      <div
                        className={`flex items-center gap-1 ${
                          crypto.changePercent >= 0
                            ? "text-green-600"
                            : "text-red-600"
                        }`}
                      >
                        {crypto.changePercent >= 0 ? (
                          <TrendingUp className="w-4 h-4" />
                        ) : (
                          <TrendingDown className="w-4 h-4" />
                        )}
                        <span className="font-semibold">
                          {formatPercentage(crypto.changePercent)}
                        </span>
                      </div>
                      <p className="text-xs text-gray-500">
                        Vol: {formatCurrency(crypto.volume)}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Recent Transactions */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-foreground">
                <Clock className="w-5 h-5" />
                Atividade Recente
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {transactions.length > 0 ? (
                  transactions.map((transaction, index) => (
                    <div
                      key={index}
                      className="flex items-center justify-between p-3 bg-gradient-to-r from-gray-50 to-white rounded-lg border border-gray-200 hover:shadow-md transition-shadow"
                    >
                      <div className="flex items-center gap-3">
                        <div
                          className={`w-8 h-8 rounded-full flex items-center justify-center ${
                            transaction.type === "DEPOSIT"
                              ? "bg-green-100"
                              : "bg-red-100"
                          }`}
                        >
                          {transaction.type === "DEPOSIT" ? (
                            <Plus className="w-4 h-4 text-green-600" />
                          ) : (
                            <ArrowUpRight className="w-4 h-4 text-red-600" />
                          )}
                        </div>
                        <div>
                          <p className="font-medium text-gray-900 capitalize">
                            {transaction.type.toLowerCase()}
                          </p>
                          <p className="text-sm text-gray-600">
                            {new Date(transaction.createdAt).toLocaleDateString(
                              "pt-BR"
                            )}
                          </p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="font-semibold text-gray-900">
                          {transaction.type === "DEPOSIT" ? "+" : "-"}
                          {transaction.currency === "BRL"
                            ? formatCurrency(transaction.amount)
                            : `${transaction.amount.toFixed(8)} BTC`}
                        </p>
                        <Badge
                          variant="secondary"
                          className={`text-xs ${
                            transaction.status === "COMPLETED"
                              ? "bg-green-100 text-green-700"
                              : transaction.status === "PENDING"
                              ? "bg-yellow-100 text-yellow-700"
                              : "bg-red-100 text-red-700"
                          }`}
                        >
                          {transaction.status}
                        </Badge>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="text-center py-8 text-muted-foreground">
                    <Clock className="w-12 h-12 mx-auto mb-3 opacity-50" />
                    <p>Nenhuma transação recente</p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Trading Insights */}
        <Card className="mt-8">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-foreground">
              <Target className="w-5 h-5" />
              Insights para Traders
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="text-center p-4 bg-white rounded-lg border">
                <div className="w-12 h-12 mx-auto mb-3 bg-gradient-to-r from-indigo-500 to-blue-500 rounded-full flex items-center justify-center">
                  <TrendingUp className="w-6 h-6 text-white" />
                </div>
                <h4 className="font-semibold text-foreground mb-2">
                  Mercado em Alta
                </h4>
                <p className="text-sm text-muted-foreground">
                  Bitcoin e Ethereum mostram tendência de alta com volume
                  crescente
                </p>
              </div>

              <div className="text-center p-4 bg-white rounded-lg border">
                <div className="w-12 h-12 mx-auto mb-3 bg-gradient-to-r from-green-500 to-emerald-500 rounded-full flex items-center justify-center">
                  <Shield className="w-6 h-6 text-white" />
                </div>
                <h4 className="font-semibold text-foreground mb-2">
                  Segurança
                </h4>
                <p className="text-sm text-muted-foreground">
                  Suas transações são protegidas com criptografia de ponta a
                  ponta
                </p>
              </div>

              <div className="text-center p-4 bg-white rounded-lg border">
                <div className="w-12 h-12 mx-auto mb-3 bg-gradient-to-r from-purple-500 to-pink-500 rounded-full flex items-center justify-center">
                  <Star className="w-6 h-6 text-white" />
                </div>
                <h4 className="font-semibold text-foreground mb-2">Destaque</h4>
                <p className="text-sm text-muted-foreground">
                  Solana (SOL) lidera ganhos com +2.86% nas últimas 24h
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

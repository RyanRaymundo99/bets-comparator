"use client";

import React, { useState, useEffect, useCallback } from "react";
import Image from "next/image";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import NavbarNew from "@/components/ui/navbar-new";
import { useToast } from "@/hooks/use-toast";
import {
  CreditCard,
  Building2,
  Shield,
  Clock,
  Info,
  QrCode,
  ArrowRight,
  CheckCircle,
  AlertTriangle,
  Banknote,
  RefreshCw,
} from "lucide-react";

export default function DepositsPage() {
  const [amount, setAmount] = useState("");
  const [loading, setLoading] = useState(false);
  const [qrCode, setQrCode] = useState("");
  const [qrCodeBase64, setQrCodeBase64] = useState("");
  const [paymentId, setPaymentId] = useState("");
  const [depositId, setDepositId] = useState("");
  const [paymentStatus, setPaymentStatus] = useState("");
  const [depositStatus, setDepositStatus] = useState("");
  const [isLoggingOut, setIsLoggingOut] = useState(false);
  const [showConfirmationPopup, setShowConfirmationPopup] = useState(false);
  const [confirmedDepositData, setConfirmedDepositData] = useState<{
    id: string;
    amount: number;
    fee: number;
    paymentAmount?: number;
    paymentId?: string;
    status: string;
    confirmedAt?: string;
    updatedAt: string;
  } | null>(null);
  const [currentBalance, setCurrentBalance] = useState(0);
  const [displayBalance, setDisplayBalance] = useState(0);
  const { toast } = useToast();

  const handleLogout = async () => {
    setIsLoggingOut(true);
    try {
      // Redirect to login page
      window.location.href = "/login";
    } finally {
      setIsLoggingOut(false);
    }
  };

  // Fetch current balance
  const fetchCurrentBalance = useCallback(async () => {
    try {
      const response = await fetch("/api/balance");
      if (response.ok) {
        const data = await response.json();
        const brlBalance = data.balances?.find(
          (b: { currency: string; amount: number }) => b.currency === "BRL"
        );
        if (brlBalance) {
          setCurrentBalance(brlBalance.amount);
        }
      }
    } catch (error) {
      console.error("Error fetching balance:", error);
    }
  }, []);

  // Fetch balance on component mount
  useEffect(() => {
    fetchCurrentBalance();
  }, [fetchCurrentBalance]);

  // Animate balance changes
  useEffect(() => {
    const targetBalance = currentBalance;
    const startBalance = displayBalance;
    const duration = 1000; // 1 second animation
    const startTime = Date.now();

    const animate = () => {
      const elapsed = Date.now() - startTime;
      const progress = Math.min(elapsed / duration, 1);

      // Easing function for smooth animation
      const easeOutQuart = 1 - Math.pow(1 - progress, 4);

      const currentValue =
        startBalance + (targetBalance - startBalance) * easeOutQuart;
      setDisplayBalance(currentValue);

      if (progress < 1) {
        requestAnimationFrame(animate);
      }
    };

    if (startBalance !== targetBalance) {
      animate();
    }
  }, [currentBalance, displayBalance]);

  // Check payment status
  const checkPaymentStatus = useCallback(async () => {
    if (!depositId) {
      console.log("No deposit ID available for status check");
      return;
    }

    console.log(`Checking payment status for deposit: ${depositId}`);

    try {
      const response = await fetch(`/api/deposits/${depositId}/status`);
      const data = await response.json();

      console.log("Status check response:", data);

      if (response.ok && data.success) {
        const newPaymentStatus = data.deposit.paymentStatus || "pending";
        const newDepositStatus = data.deposit.status || "PENDING";

        console.log(
          `Status update: Payment=${newPaymentStatus}, Deposit=${newDepositStatus}`
        );

        setPaymentStatus(newPaymentStatus);
        setDepositStatus(newDepositStatus);

        if (newDepositStatus === "CONFIRMED") {
          // Get detailed deposit information for the popup
          try {
            const depositResponse = await fetch(`/api/deposits/${depositId}`);
            if (depositResponse.ok) {
              const depositData = await depositResponse.json();
              setConfirmedDepositData(depositData.deposit);

              // Automatically update the balance
              await fetchCurrentBalance();

              // Show the confirmation popup
              setShowConfirmationPopup(true);
            }
          } catch (error) {
            console.error("Error fetching deposit details:", error);
          }

          toast({
            title: "Payment Confirmed! 🎉",
            description: "Your deposit has been confirmed and balance updated!",
          });
        } else if (newDepositStatus === "REJECTED") {
          toast({
            title: "Payment Failed ❌",
            description: "Your payment was not successful. Please try again.",
            variant: "destructive",
          });
        }
      } else {
        console.log("Status check failed:", data);
      }
    } catch (error) {
      console.error("Error checking payment status:", error);
      toast({
        title: "Status Check Error",
        description: "Failed to check payment status. Please try again.",
        variant: "destructive",
      });
    }
  }, [depositId, toast, fetchCurrentBalance]);

  // Auto-check payment status every 10 seconds when pending
  useEffect(() => {
    let interval: NodeJS.Timeout;

    if (depositId && depositStatus === "PENDING") {
      console.log("Starting automatic payment status check every 10 seconds");
      interval = setInterval(() => {
        console.log("Auto-checking payment status...");
        checkPaymentStatus();
      }, 10000); // 10 seconds for faster updates
    }

    return () => {
      if (interval) {
        clearInterval(interval);
        console.log("Stopped automatic payment status check");
      }
    };
  }, [depositId, depositStatus, checkPaymentStatus]);

  const handleDeposit = async () => {
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
      const response = await fetch("/api/deposits", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          amount: currentAmount, // Send the amount user wants to pay
          paymentMethod: "mercadopago",
        }),
      });

      const data = await response.json();

      if (response.ok) {
        // Set the PIX data for display
        setQrCode(data.qrCode || "");
        setQrCodeBase64(data.qrCodeBase64 || "");
        setPaymentId(data.paymentId || "");
        setDepositId(data.deposit.id || "");
        setPaymentStatus("pending");
        setDepositStatus("PENDING");

        toast({
          title: "Success",
          description: `PIX generated successfully! Você pagará ${formatCurrency(
            currentAmount
          )} e receberá ${formatCurrency(balanceAmount)} em sua conta.`,
        });
      } else {
        // Handle specific error cases
        if (response.status === 401) {
          toast({
            title: "Session Expired",
            description: "Please log in again to continue",
            variant: "destructive",
          });
          // Redirect to login
          setTimeout(() => {
            window.location.href = "/login";
          }, 2000);
        } else if (response.status === 503) {
          toast({
            title: "Service Unavailable",
            description:
              data.error || "Payment service is temporarily unavailable",
            variant: "destructive",
          });
        } else {
          toast({
            title: "Error",
            description: data.error || "Failed to create deposit",
            variant: "destructive",
          });
        }
      }
    } catch (error) {
      console.error("Deposit error:", error);
      toast({
        title: "Error",
        description: "Network error. Please try again.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat("pt-BR", {
      style: "currency",
      currency: "BRL",
    }).format(value);
  };

  const calculateFee = (amount: number) => amount * 0.03;
  const calculateBalanceAmount = (amount: number) =>
    amount - calculateFee(amount);

  const currentAmount = parseFloat(amount) || 0;
  const fee = calculateFee(currentAmount);
  const balanceAmount = calculateBalanceAmount(currentAmount);

  return (
    <div className="min-h-screen bg-background text-foreground">
      <NavbarNew isLoggingOut={isLoggingOut} handleLogout={handleLogout} />

      {/* Mobile Balance Display - Far Top Left */}
      <div className="fixed top-4 left-2 z-40 lg:hidden">
        <div className="bg-gray-900/90 backdrop-blur-sm rounded-2xl p-3 border border-gray-700 shadow-2xl">
          <div className="flex items-center space-x-2">
            <div className="w-8 h-8 rounded-full bg-green-500 flex items-center justify-center">
              <Banknote className="w-4 h-4 text-white" />
            </div>
            <div className="text-right">
              <p className="text-xs text-gray-400 font-medium">Saldo BRL</p>
              <p className="text-lg font-bold text-white tracking-tight">
                {formatCurrency(displayBalance)}
              </p>
            </div>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 py-6 mobile-page-padding">
        {/* Header */}
        <div className="text-center mb-8 max-w-2xl mx-auto">
          <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-green-100 mb-4">
            <Banknote className="w-10 h-10 text-green-600" />
          </div>
          <h1 className="text-3xl font-bold mb-2">Adicionar Fundos</h1>
          <p className="text-muted-foreground text-lg">
            Deposite BRL de forma segura e instantânea
          </p>
          <div className="mt-4 p-3 bg-green-50 border border-green-200 rounded-lg">
            <p className="text-sm text-green-700">
              <Info className="w-4 h-4 inline mr-2" />
              Sistema integrado com Mercado Pago para PIX real e funcional.
            </p>
            <p className="text-xs text-green-600 mt-2">
              <strong>Status:</strong> Mercado Pago configurado e funcionando.
              Todos os QR Codes gerados são reais e podem ser escaneados por
              qualquer app bancário brasileiro.
            </p>
            <p className="text-xs text-blue-600 mt-2">
              <strong>Segurança:</strong> Pagamentos processados diretamente
              pelo Mercado Pago com confirmação automática.
            </p>
          </div>
        </div>

        {/* Main Content Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 max-w-7xl mx-auto">
          {/* Left Column - Forms and Info */}
          <div className="space-y-6">
            {/* Institution Info Card */}
            <Card>
              <CardContent className="p-6">
                <div className="flex items-center space-x-4 mb-4">
                  <div className="w-12 h-12 rounded-lg bg-blue-500 flex items-center justify-center">
                    <Building2 className="w-6 h-6 text-white" />
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold">Mercado Pago</h3>
                    <p className="text-sm text-muted-foreground">
                      Instituição de Pagamento
                    </p>
                  </div>
                  <Badge
                    variant="secondary"
                    className="ml-auto bg-green-100 text-green-700 border-green-200"
                  >
                    <Shield className="w-4 h-4 mr-1" />
                    Seguro
                  </Badge>
                </div>

                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div className="flex items-center space-x-2 text-muted-foreground">
                    <Clock className="w-4 h-4" />
                    <span>Processamento instantâneo</span>
                  </div>
                  <div className="flex items-center space-x-2 text-muted-foreground">
                    <CheckCircle className="w-4 h-4" />
                    <span>PIX disponível 24h</span>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Amount Input Card */}
            <Card>
              <CardHeader className="pb-4">
                <CardTitle className="flex items-center space-x-2 text-lg">
                  <CreditCard className="w-6 h-6" />
                  <span>Valor do Depósito</span>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                <div>
                  <label className="text-base font-medium mb-3 block">
                    Quantia em Reais (BRL)
                  </label>
                  <Input
                    type="number"
                    value={amount}
                    onChange={(e) => setAmount(e.target.value)}
                    placeholder="0,00"
                    className="text-2xl font-bold text-center h-16"
                    min="1"
                    step="0.01"
                  />
                </div>

                {/* Payment and Balance Display */}
                {currentAmount > 0 && (
                  <div className="space-y-3 p-4 rounded-lg bg-muted/50 border">
                    <div className="flex items-center space-x-2 mb-3">
                      <Info className="w-5 h-5 text-blue-600" />
                      <span className="text-base font-medium">
                        Resumo da Transação
                      </span>
                    </div>

                    <div className="space-y-2 text-base">
                      <div className="flex justify-between text-muted-foreground">
                        <span>Valor a pagar:</span>
                        <span>{formatCurrency(currentAmount)}</span>
                      </div>
                      <div className="flex justify-between text-muted-foreground">
                        <span>Taxa de processamento (3%):</span>
                        <span>{formatCurrency(fee)}</span>
                      </div>
                      <div className="h-px bg-border my-3"></div>
                      <div className="flex justify-between font-semibold text-lg">
                        <span>Valor a receber na conta:</span>
                        <span>{formatCurrency(balanceAmount)}</span>
                      </div>
                    </div>
                  </div>
                )}

                <Button
                  onClick={handleDeposit}
                  disabled={loading || currentAmount <= 0}
                  className="w-full py-4 rounded-xl transition-all duration-200 text-lg"
                >
                  {loading ? (
                    <div className="flex items-center space-x-2">
                      <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                      <span>Processando...</span>
                    </div>
                  ) : (
                    <div className="flex items-center space-x-2">
                      <QrCode className="w-5 h-5" />
                      <span>Gerar PIX</span>
                      <ArrowRight className="w-5 h-5" />
                    </div>
                  )}
                </Button>
              </CardContent>
            </Card>

            {/* Safety Notice */}
            <div className="flex items-start space-x-4 p-5 rounded-lg bg-amber-900/20 border border-amber-700">
              <AlertTriangle className="w-6 h-6 text-amber-400 mt-1 flex-shrink-0" />
              <div className="text-base text-amber-200">
                <p className="font-medium mb-2">Importante:</p>
                <p>
                  Seus fundos serão creditados automaticamente após a
                  confirmação do pagamento pelo Mercado Pago. O processo
                  geralmente leva alguns segundos.
                </p>
              </div>
            </div>
          </div>

          {/* Right Column - QR Code and Payment Info */}
          <div className="space-y-6">
            {/* QR Code Result */}
            {qrCode ? (
              <Card className="h-fit bg-gray-800 border-gray-700">
                <CardHeader className="text-center pb-4">
                  <CardTitle className="flex items-center justify-center space-x-2 text-xl text-white">
                    <QrCode className="w-6 h-6 text-green-400" />
                    <span>PIX Gerado com Sucesso</span>
                  </CardTitle>
                </CardHeader>
                <CardContent className="text-center space-y-6">
                  <div className="p-6 bg-gray-900 rounded-xl border border-gray-600">
                    {qrCodeBase64 ? (
                      <Image
                        src={`data:image/png;base64,${qrCodeBase64}`}
                        alt="QR Code PIX"
                        width={300}
                        height={300}
                        className="mx-auto"
                        style={{ maxWidth: "300px", width: "100%" }}
                      />
                    ) : (
                      <div className="w-64 h-64 mx-auto bg-gray-800 rounded-lg flex items-center justify-center border border-gray-600">
                        <div className="text-center space-y-4">
                          <QrCode className="w-20 h-20 text-gray-400 mx-auto" />
                          <div className="text-sm text-gray-400">
                            <p className="font-medium mb-2">PIX Data (Mock)</p>
                            <p className="text-xs break-all bg-gray-700 p-2 rounded text-gray-300">
                              {qrCode}
                            </p>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>

                  <div className="space-y-4">
                    <p className="text-base text-gray-300">
                      {qrCodeBase64
                        ? "Escaneie o QR Code com seu app bancário ou Mercado Pago para fazer o pagamento"
                        : "Digite um valor e clique em 'Gerar PIX' para criar o código de pagamento"}
                    </p>
                    <div className="p-3 bg-gray-800 rounded-lg border border-gray-700">
                      <p className="text-sm text-gray-300 mb-1">
                        ID do Pagamento:
                      </p>
                      <p className="text-base font-mono break-all text-white">
                        {paymentId}
                      </p>
                    </div>

                    {/* Payment Status */}
                    <div className="p-3 bg-gray-800 rounded-lg border border-gray-700">
                      <div className="flex items-center justify-between mb-2">
                        <p className="text-sm font-medium text-blue-400">
                          Status do Pagamento:
                        </p>
                        <div className="flex space-x-2">
                          <Button
                            onClick={checkPaymentStatus}
                            size="sm"
                            variant="outline"
                            className="h-7 px-2 text-xs"
                          >
                            <RefreshCw className="w-3 h-3 mr-1" />
                            Verificar
                          </Button>
                          <Button
                            onClick={() => {
                              toast({
                                title: "Status Check",
                                description: `Checking payment status for deposit ${depositId}`,
                              });
                              checkPaymentStatus();
                            }}
                            size="sm"
                            variant="secondary"
                            className="h-7 px-2 text-xs"
                          >
                            <Info className="w-3 h-3 mr-1" />
                            Debug
                          </Button>
                          <Button
                            onClick={async () => {
                              if (paymentId) {
                                try {
                                  const response = await fetch(
                                    `/api/deposits/${depositId}/status?force=true`
                                  );
                                  const data = await response.json();
                                  toast({
                                    title: "Direct Check",
                                    description: `Payment status: ${
                                      data.deposit?.paymentStatus || "unknown"
                                    }`,
                                  });
                                } catch {
                                  toast({
                                    title: "Error",
                                    description:
                                      "Failed to check payment directly",
                                    variant: "destructive",
                                  });
                                }
                              } else {
                                toast({
                                  title: "No Payment ID",
                                  description: "Payment ID not available yet",
                                  variant: "destructive",
                                });
                              }
                            }}
                            size="sm"
                            variant="outline"
                            className="h-7 px-2 text-xs"
                          >
                            <RefreshCw className="w-3 h-3 mr-1" />
                            Direct
                          </Button>
                        </div>
                      </div>
                      <div className="space-y-1">
                        <p className="text-xs text-blue-400">
                          <span className="font-medium">Mercado Pago:</span>{" "}
                          {paymentStatus || "pending"}
                        </p>
                        <p className="text-xs text-blue-400">
                          <span className="font-medium">Depósito:</span>{" "}
                          {depositStatus || "PENDING"}
                        </p>
                      </div>
                      {depositId && (
                        <div className="mt-2 p-2 bg-gray-800 rounded text-xs border border-gray-600">
                          <p className="text-gray-300">
                            <strong className="text-white">Deposit ID:</strong>{" "}
                            {depositId}
                          </p>
                          <p className="text-gray-300">
                            <strong className="text-white">Payment ID:</strong>{" "}
                            {paymentId || "N/A"}
                          </p>
                          <p className="text-gray-300">
                            <strong className="text-white">Last Check:</strong>{" "}
                            {new Date().toLocaleTimeString()}
                          </p>
                          <p className="text-gray-300">
                            <strong className="text-white">
                              Webhook Status:
                            </strong>{" "}
                            {paymentStatus === null
                              ? "Waiting for webhook"
                              : "Received"}
                          </p>
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div className="p-3 bg-gray-800 rounded-lg border border-gray-700">
                      <div className="flex items-center space-x-2 text-green-400 mb-2">
                        <CheckCircle className="w-4 h-4" />
                        <span>Valor</span>
                      </div>
                      <p className="font-semibold text-lg text-white">
                        {formatCurrency(currentAmount)}
                      </p>
                    </div>
                    <div className="p-3 bg-gray-800 rounded-lg border border-gray-700">
                      <div className="flex items-center space-x-2 text-blue-400 mb-2">
                        <Clock className="w-4 h-4" />
                        <span>Válido por</span>
                      </div>
                      <p className="font-semibold text-lg text-white">
                        30 minutos
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ) : (
              /* Placeholder when no QR code */
              <Card className="h-fit">
                <CardContent className="p-8 text-center">
                  <div className="w-32 h-32 mx-auto bg-muted rounded-full flex items-center justify-center mb-4">
                    <QrCode className="w-16 h-16 text-muted-foreground" />
                  </div>
                  <h3 className="text-lg font-medium text-muted-foreground mb-2">
                    QR Code PIX
                  </h3>
                  <p className="text-sm text-muted-foreground">
                    Digite um valor e clique em &quot;Gerar PIX&quot; para criar
                    o código de pagamento
                  </p>
                </CardContent>
              </Card>
            )}

            {/* Additional Payment Info */}
            <Card className="bg-gray-800 border-gray-700">
              <CardHeader>
                <CardTitle className="flex items-center space-x-2 text-white">
                  <Info className="w-5 h-5 text-blue-400" />
                  <span>Informações do Pagamento</span>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-300">Método:</span>
                  <span className="font-medium text-white">PIX</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-300">Instituição:</span>
                  <span className="font-medium text-white">Mercado Pago</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-300">Taxa:</span>
                  <span className="font-medium text-white">3%</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-300">Validade:</span>
                  <span className="font-medium text-white">30 minutos</span>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>

      {/* Confirmation Popup */}
      {showConfirmationPopup && confirmedDepositData && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-gray-800 rounded-xl max-w-md w-full max-h-[90vh] overflow-y-auto border border-gray-700">
            <div className="p-6">
              {/* Header */}
              <div className="text-center mb-6">
                <div className="w-16 h-16 bg-green-900 rounded-full flex items-center justify-center mx-auto mb-4">
                  <CheckCircle className="w-8 h-8 text-green-400" />
                </div>
                <h2 className="text-2xl font-bold text-green-400 mb-2">
                  Pagamento Confirmado! 🎉
                </h2>
                <p className="text-gray-300">
                  Seu depósito foi processado com sucesso
                </p>
              </div>

              {/* Deposit Details */}
              <div className="space-y-4 mb-6">
                <div className="p-4 bg-green-900/20 rounded-lg border border-green-700">
                  <h3 className="font-semibold text-green-400 mb-3 flex items-center">
                    <Info className="w-4 h-4 mr-2" />
                    Resumo da Transação
                  </h3>

                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-green-300">Valor pago:</span>
                      <span className="font-semibold text-green-400">
                        {formatCurrency(
                          Number(confirmedDepositData.amount || 0) +
                            Number(confirmedDepositData.fee || 0)
                        )}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-green-300">
                        Taxa de processamento (3%):
                      </span>
                      <span className="font-semibold text-green-400">
                        {formatCurrency(Number(confirmedDepositData.fee || 0))}
                      </span>
                    </div>
                    <div className="h-px bg-green-600 my-2"></div>
                    <div className="flex justify-between text-lg font-bold">
                      <span className="text-green-400">
                        Valor creditado na conta:
                      </span>
                      <span className="text-green-400">
                        {formatCurrency(Number(confirmedDepositData.amount))}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Transaction Info */}
                <div className="p-4 bg-blue-900/20 rounded-lg border border-blue-700">
                  <h3 className="font-semibold text-blue-400 mb-3 flex items-center">
                    <Info className="w-4 h-4 mr-2" />
                    Informações da Transação
                  </h3>

                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-blue-300">ID do Depósito:</span>
                      <span className="font-medium text-blue-400">
                        {confirmedDepositData.id}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-blue-300">ID do Pagamento:</span>
                      <span className="font-medium text-blue-400">
                        {confirmedDepositData.paymentId || "N/A"}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-blue-300">Status:</span>
                      <Badge
                        variant="secondary"
                        className="bg-green-900 text-green-300 border-green-700"
                      >
                        {confirmedDepositData.status}
                      </Badge>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-blue-300">
                        Data de Confirmação:
                      </span>
                      <span className="font-medium text-blue-400">
                        {new Date(
                          confirmedDepositData.confirmedAt ||
                            confirmedDepositData.updatedAt
                        ).toLocaleString("pt-BR")}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Balance Update */}
                <div className="p-4 bg-gray-700 rounded-lg border border-gray-600">
                  <h3 className="font-semibold text-white mb-3 flex items-center">
                    <Banknote className="w-4 h-4 mr-2" />
                    Atualização do Saldo
                  </h3>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-gray-300">Saldo anterior:</span>
                      <span className="font-medium text-gray-300">
                        {formatCurrency(
                          currentBalance - Number(confirmedDepositData.amount)
                        )}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-300">Depósito:</span>
                      <span className="font-medium text-green-400">
                        +{formatCurrency(Number(confirmedDepositData.amount))}
                      </span>
                    </div>
                    <div className="h-px bg-gray-600 my-2"></div>
                    <div className="flex justify-between text-lg font-bold">
                      <span className="text-white">Novo saldo:</span>
                      <span className="text-white">
                        {formatCurrency(currentBalance)}
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex space-x-3">
                <Button
                  onClick={() => {
                    setShowConfirmationPopup(false);
                    setConfirmedDepositData(null);
                    // Reload the page to refresh the state
                    window.location.reload();
                  }}
                  className="flex-1 bg-green-600 hover:bg-green-700"
                >
                  <CheckCircle className="w-4 h-4 mr-2" />
                  Entendi
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

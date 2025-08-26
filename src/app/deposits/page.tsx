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

  // Check payment status
  const checkPaymentStatus = useCallback(async () => {
    if (!depositId) return;

    try {
      const response = await fetch(`/api/deposits/${depositId}/status`);
      const data = await response.json();

      if (response.ok && data.success) {
        setPaymentStatus(data.deposit.paymentStatus || "pending");
        setDepositStatus(data.deposit.status || "PENDING");

        if (data.deposit.status === "CONFIRMED") {
          toast({
            title: "Payment Confirmed!",
            description: "Your deposit has been confirmed and balance updated!",
          });
        } else if (data.deposit.status === "REJECTED") {
          toast({
            title: "Payment Failed",
            description: "Your payment was not successful. Please try again.",
            variant: "destructive",
          });
        }
      }
    } catch (error) {
      console.error("Error checking payment status:", error);
    }
  }, [depositId, toast]);

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
          amount: total, // Send total amount including fee
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
          description: `PIX generated successfully! Total amount: ${formatCurrency(
            total
          )} (includes 3% fee)`,
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
  const calculateTotal = (amount: number) => amount + calculateFee(amount);

  const currentAmount = parseFloat(amount) || 0;
  const fee = calculateFee(currentAmount);
  const total = calculateTotal(currentAmount);

  return (
    <div className="min-h-screen bg-background text-foreground">
      <NavbarNew isLoggingOut={isLoggingOut} handleLogout={handleLogout} />

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

                {/* Fee Breakdown */}
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
                        <span>Valor solicitado:</span>
                        <span>{formatCurrency(currentAmount)}</span>
                      </div>
                      <div className="flex justify-between text-muted-foreground">
                        <span>Taxa de processamento (3%):</span>
                        <span>{formatCurrency(fee)}</span>
                      </div>
                      <div className="h-px bg-border my-3"></div>
                      <div className="flex justify-between font-semibold text-lg">
                        <span>Total a pagar:</span>
                        <span>{formatCurrency(total)}</span>
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
            <div className="flex items-start space-x-4 p-5 rounded-lg bg-amber-50 border border-amber-200">
              <AlertTriangle className="w-6 h-6 text-amber-600 mt-1 flex-shrink-0" />
              <div className="text-base text-amber-800">
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
              <Card className="h-fit">
                <CardHeader className="text-center pb-4">
                  <CardTitle className="flex items-center justify-center space-x-2 text-xl">
                    <QrCode className="w-6 h-6 text-green-600" />
                    <span>PIX Gerado com Sucesso</span>
                  </CardTitle>
                </CardHeader>
                <CardContent className="text-center space-y-6">
                  <div className="p-6 bg-white rounded-xl border">
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
                      <div className="w-64 h-64 mx-auto bg-muted rounded-lg flex items-center justify-center">
                        <div className="text-center space-y-4">
                          <QrCode className="w-20 h-20 text-muted-foreground mx-auto" />
                          <div className="text-sm text-muted-foreground">
                            <p className="font-medium mb-2">PIX Data (Mock)</p>
                            <p className="text-xs break-all bg-gray-100 p-2 rounded">
                              {qrCode}
                            </p>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>

                  <div className="space-y-4">
                    <p className="text-base text-muted-foreground">
                      {qrCodeBase64
                        ? "Escaneie o QR Code com seu app bancário ou Mercado Pago para fazer o pagamento"
                        : "Digite um valor e clique em 'Gerar PIX' para criar o código de pagamento"}
                    </p>
                    <div className="p-3 bg-muted rounded-lg">
                      <p className="text-sm text-muted-foreground mb-1">
                        ID do Pagamento:
                      </p>
                      <p className="text-base font-mono break-all">
                        {paymentId}
                      </p>
                    </div>

                                         {/* Payment Status */}
                     <div className="p-3 bg-blue-50 rounded-lg border border-blue-200">
                       <div className="flex items-center justify-between mb-2">
                         <p className="text-sm font-medium text-blue-700">
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
                         </div>
                       </div>
                       <div className="space-y-1">
                         <p className="text-xs text-blue-600">
                           <span className="font-medium">Mercado Pago:</span>{" "}
                           {paymentStatus || "pending"}
                         </p>
                         <p className="text-xs text-blue-600">
                           <span className="font-medium">Depósito:</span>{" "}
                           {depositStatus || "PENDING"}
                         </p>
                       </div>
                       {depositId && (
                         <div className="mt-2 p-2 bg-gray-100 rounded text-xs">
                           <p><strong>Deposit ID:</strong> {depositId}</p>
                           <p><strong>Payment ID:</strong> {paymentId || "N/A"}</p>
                         </div>
                       )}
                     </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div className="p-3 bg-green-50 rounded-lg border border-green-200">
                      <div className="flex items-center space-x-2 text-green-700 mb-2">
                        <CheckCircle className="w-4 h-4" />
                        <span>Valor</span>
                      </div>
                      <p className="font-semibold text-lg">
                        {formatCurrency(total)}
                      </p>
                    </div>
                    <div className="p-3 bg-blue-50 rounded-lg border border-blue-200">
                      <div className="flex items-center space-x-2 text-blue-700 mb-2">
                        <Clock className="w-4 h-4" />
                        <span>Válido por</span>
                      </div>
                      <p className="font-semibold text-lg">30 minutos</p>
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
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <Info className="w-5 h-5 text-blue-600" />
                  <span>Informações do Pagamento</span>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3 text-sm">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Método:</span>
                  <span className="font-medium">PIX</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Instituição:</span>
                  <span className="font-medium">Mercado Pago</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Taxa:</span>
                  <span className="font-medium">3%</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Validade:</span>
                  <span className="font-medium">30 minutos</span>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}

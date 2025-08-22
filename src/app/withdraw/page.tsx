"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import {
  ArrowUpRight,
  Banknote,
  Building2,
  Shield,
  Clock,
  Info,
  CheckCircle,
  CreditCard,
  Calculator,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import NavbarNew from "@/components/ui/navbar-new";

interface WithdrawFormData {
  amount: string;
  paymentMethod: string;
  bankAccount: {
    bankName: string;
    accountType: string;
    accountNumber: string;
    agency: string;
    cpf: string;
  };
}

export default function WithdrawPage() {
  const router = useRouter();
  const { toast } = useToast();
  const [isLoggingOut, setIsLoggingOut] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [totalBalance, setTotalBalance] = useState(0);

  const [formData, setFormData] = useState<WithdrawFormData>({
    amount: "",
    paymentMethod: "PIX",
    bankAccount: {
      bankName: "",
      accountType: "CHECKING",
      accountNumber: "",
      agency: "",
      cpf: "",
    },
  });

  // Format currency in Brazilian Real
  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat("pt-BR", {
      style: "currency",
      currency: "BRL",
    }).format(value);
  };

  // Calculate withdrawal fee (3% for withdrawals)
  const calculateFee = (amount: number) => {
    return amount * 0.03;
  };

  // Calculate total amount after fee
  const calculateTotal = (amount: number) => {
    return amount - calculateFee(amount);
  };

  // Fetch user balances
  useEffect(() => {
    const fetchBalances = async () => {
      try {
        const response = await fetch("/api/balance");
        if (response.ok) {
          const data = await response.json();

          // Calculate total balance in BRL
          const total =
            data.balances?.reduce(
              (sum: number, balance: { currency: string; amount: number }) => {
                if (balance.currency === "BRL") {
                  return sum + balance.amount;
                }
                return sum;
              },
              0
            ) || 0;
          setTotalBalance(total);
        }
      } catch (error) {
        console.error("Failed to fetch balances:", error);
      }
    };

    fetchBalances();
  }, []);

  const handleInputChange = (field: string, value: string) => {
    if (field === "amount") {
      setFormData((prev) => ({ ...prev, amount: value }));
    } else if (field.startsWith("bankAccount.")) {
      const bankField = field.replace("bankAccount.", "");
      setFormData((prev) => ({
        ...prev,
        bankAccount: {
          ...prev.bankAccount,
          [bankField]: value,
        },
      }));
    } else {
      setFormData((prev) => ({ ...prev, [field]: value }));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const amount = parseFloat(formData.amount);
    if (!amount || amount <= 0) {
      toast({
        title: "Valor inválido",
        description: "Por favor, insira um valor válido para saque.",
        variant: "destructive",
      });
      return;
    }

    if (amount > totalBalance) {
      toast({
        title: "Saldo insuficiente",
        description: "Você não possui saldo suficiente para este saque.",
        variant: "destructive",
      });
      return;
    }

    if (
      formData.paymentMethod === "BANK_TRANSFER" &&
      (!formData.bankAccount.bankName ||
        !formData.bankAccount.accountNumber ||
        !formData.bankAccount.agency ||
        !formData.bankAccount.cpf)
    ) {
      toast({
        title: "Dados bancários incompletos",
        description: "Por favor, preencha todos os dados bancários.",
        variant: "destructive",
      });
      return;
    }

    setIsSubmitting(true);

    try {
      const response = await fetch("/api/withdrawals", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          amount,
          paymentMethod: formData.paymentMethod,
          bankAccount:
            formData.paymentMethod === "BANK_TRANSFER"
              ? formData.bankAccount
              : undefined,
        }),
      });

      if (response.ok) {
        const data = await response.json();
        toast({
          title: "Saque solicitado com sucesso!",
          description: `Seu saque de ${formatCurrency(
            amount
          )} foi processado. ID: ${data.withdrawal.id}`,
        });

        // Reset form
        setFormData({
          amount: "",
          paymentMethod: "PIX",
          bankAccount: {
            bankName: "",
            accountType: "CHECKING",
            accountNumber: "",
            agency: "",
            cpf: "",
          },
        });
      } else {
        const errorData = await response.json();
        toast({
          title: "Erro ao processar saque",
          description: errorData.error || "Tente novamente mais tarde.",
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error("Withdrawal error:", error);
      toast({
        title: "Erro ao processar saque",
        description: "Tente novamente mais tarde.",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleLogout = () => {
    setIsLoggingOut(true);
    localStorage.removeItem("auth-session");
    localStorage.removeItem("user");
    router.push("/login");
  };

  const currentAmount = parseFloat(formData.amount) || 0;
  const fee = calculateFee(currentAmount);
  const total = calculateTotal(currentAmount);

  return (
    <div className="min-h-screen bg-background text-foreground">
      <NavbarNew isLoggingOut={isLoggingOut} handleLogout={handleLogout} />

      <div className="container mx-auto px-4 py-6 mobile-page-padding">
        {/* Header */}
        <div className="text-center mb-8 max-w-2xl mx-auto">
          <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-red-100 mb-4">
            <ArrowUpRight className="w-10 h-10 text-red-600" />
          </div>
          <h1 className="text-3xl font-bold text-foreground mb-2">
            Saque de Fundos
          </h1>
          <p className="text-muted-foreground text-lg">
            Transfira seus fundos para sua conta bancária ou carteira PIX
          </p>
        </div>

        {/* Main Content */}
        <div className="max-w-7xl mx-auto">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* Left Side - Withdrawal Form */}
            <div className="space-y-6">
              {/* Balance Info */}
              <Card className="bg-gradient-to-r from-red-50 to-orange-50 border-red-200">
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                      <div className="w-10 h-10 rounded-full bg-red-500 flex items-center justify-center">
                        <Banknote className="w-5 h-5 text-white" />
                      </div>
                      <div>
                        <p className="text-sm text-red-600 font-medium">
                          Saldo Disponível
                        </p>
                        <p className="text-2xl font-bold text-red-700">
                          {formatCurrency(totalBalance)}
                        </p>
                      </div>
                    </div>
                    <Badge
                      variant="secondary"
                      className="bg-red-100 text-red-700"
                    >
                      Disponível para Saque
                    </Badge>
                  </div>
                </CardContent>
              </Card>

              {/* Withdrawal Form */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center space-x-2">
                    <Calculator className="w-5 h-5" />
                    <span>Dados do Saque</span>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <form onSubmit={handleSubmit} className="space-y-6">
                    {/* Amount Input */}
                    <div className="space-y-2">
                      <label className="text-sm font-medium text-foreground">
                        Valor do Saque (BRL)
                      </label>
                      <Input
                        type="number"
                        step="0.01"
                        min="0"
                        max={totalBalance}
                        value={formData.amount}
                        onChange={(e) =>
                          handleInputChange("amount", e.target.value)
                        }
                        placeholder="0,00"
                        className="text-lg"
                        required
                      />
                      <p className="text-xs text-muted-foreground">
                        Máximo: {formatCurrency(totalBalance)}
                      </p>
                    </div>

                    {/* Payment Method */}
                    <div className="space-y-2">
                      <label className="text-sm font-medium text-foreground">
                        Método de Pagamento
                      </label>
                      <div className="grid grid-cols-2 gap-3">
                        <Button
                          type="button"
                          variant={
                            formData.paymentMethod === "PIX"
                              ? "default"
                              : "outline"
                          }
                          onClick={() =>
                            handleInputChange("paymentMethod", "PIX")
                          }
                          className="h-12"
                        >
                          <CreditCard className="w-4 h-4 mr-2" />
                          PIX
                        </Button>
                        <Button
                          type="button"
                          variant={
                            formData.paymentMethod === "BANK_TRANSFER"
                              ? "default"
                              : "outline"
                          }
                          onClick={() =>
                            handleInputChange("paymentMethod", "BANK_TRANSFER")
                          }
                          className="h-12"
                        >
                          <Building2 className="w-4 h-4 mr-2" />
                          Transferência Bancária
                        </Button>
                      </div>
                    </div>

                    {/* Bank Account Fields (only for bank transfer) */}
                    {formData.paymentMethod === "BANK_TRANSFER" && (
                      <div className="space-y-4 p-4 border border-muted rounded-lg bg-muted/20">
                        <h4 className="font-medium text-foreground">
                          Dados Bancários
                        </h4>

                        <div className="grid grid-cols-2 gap-3">
                          <div className="space-y-2">
                            <label className="text-xs font-medium text-muted-foreground">
                              Nome do Banco
                            </label>
                            <Input
                              value={formData.bankAccount.bankName}
                              onChange={(e) =>
                                handleInputChange(
                                  "bankAccount.bankName",
                                  e.target.value
                                )
                              }
                              placeholder="Ex: Banco do Brasil"
                              required
                            />
                          </div>
                          <div className="space-y-2">
                            <label className="text-xs font-medium text-muted-foreground">
                              Tipo de Conta
                            </label>
                            <select
                              value={formData.bankAccount.accountType}
                              onChange={(e) =>
                                handleInputChange(
                                  "bankAccount.accountType",
                                  e.target.value
                                )
                              }
                              className="w-full px-3 py-2 border border-input rounded-md bg-background text-foreground"
                            >
                              <option value="CHECKING">Conta Corrente</option>
                              <option value="SAVINGS">Conta Poupança</option>
                            </select>
                          </div>
                        </div>

                        <div className="grid grid-cols-2 gap-3">
                          <div className="space-y-2">
                            <label className="text-xs font-medium text-muted-foreground">
                              Agência
                            </label>
                            <Input
                              value={formData.bankAccount.agency}
                              onChange={(e) =>
                                handleInputChange(
                                  "bankAccount.agency",
                                  e.target.value
                                )
                              }
                              placeholder="0000"
                              required
                            />
                          </div>
                          <div className="space-y-2">
                            <label className="text-xs font-medium text-muted-foreground">
                              Número da Conta
                            </label>
                            <Input
                              value={formData.bankAccount.accountNumber}
                              onChange={(e) =>
                                handleInputChange(
                                  "bankAccount.accountNumber",
                                  e.target.value
                                )
                              }
                              placeholder="00000-0"
                              required
                            />
                          </div>
                        </div>

                        <div className="space-y-2">
                          <label className="text-xs font-medium text-muted-foreground">
                            CPF do Titular
                          </label>
                          <Input
                            value={formData.bankAccount.cpf}
                            onChange={(e) =>
                              handleInputChange(
                                "bankAccount.cpf",
                                e.target.value
                              )
                            }
                            placeholder="000.000.000-00"
                            required
                          />
                        </div>
                      </div>
                    )}

                    {/* Fee Breakdown */}
                    {currentAmount > 0 && (
                      <Card className="bg-muted/20 border-muted">
                        <CardContent className="p-4">
                          <div className="space-y-2">
                            <div className="flex justify-between text-sm">
                              <span className="text-muted-foreground">
                                Valor do Saque:
                              </span>
                              <span className="font-medium">
                                {formatCurrency(currentAmount)}
                              </span>
                            </div>
                            <div className="flex justify-between text-sm">
                              <span className="text-muted-foreground">
                                Taxa (3%):
                              </span>
                              <span className="text-red-600 font-medium">
                                -{formatCurrency(fee)}
                              </span>
                            </div>
                            <div className="border-t border-muted pt-2">
                              <div className="flex justify-between font-semibold">
                                <span>Valor Recebido:</span>
                                <span className="text-green-600">
                                  {formatCurrency(total)}
                                </span>
                              </div>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    )}

                    {/* Submit Button */}
                    <Button
                      type="submit"
                      disabled={
                        isSubmitting ||
                        currentAmount <= 0 ||
                        currentAmount > totalBalance
                      }
                      className="w-full h-12 text-lg font-medium"
                    >
                      {isSubmitting ? (
                        <>
                          <Clock className="w-4 h-4 mr-2 animate-spin" />
                          Processando...
                        </>
                      ) : (
                        <>
                          <ArrowUpRight className="w-4 h-4 mr-2" />
                          Solicitar Saque
                        </>
                      )}
                    </Button>
                  </form>
                </CardContent>
              </Card>
            </div>

            {/* Right Side - Information & Status */}
            <div className="space-y-6">
              {/* Processing Time Info */}
              <Card className="bg-blue-50 border-blue-200">
                <CardContent className="p-6">
                  <div className="flex items-start space-x-3">
                    <div className="w-10 h-10 rounded-full bg-blue-500 flex items-center justify-center">
                      <Clock className="w-5 h-5 text-white" />
                    </div>
                    <div>
                      <h3 className="font-semibold text-blue-900 mb-2">
                        Tempo de Processamento
                      </h3>
                      <div className="space-y-2 text-sm text-blue-800">
                        <div className="flex items-center space-x-2">
                          <CheckCircle className="w-4 h-4 text-green-500" />
                          <span>
                            <strong>PIX:</strong> 2-5 minutos
                          </span>
                        </div>
                        <div className="flex items-center space-x-2">
                          <Clock className="w-4 h-4 text-orange-500" />
                          <span>
                            <strong>Transferência Bancária:</strong> 1-2 dias
                            úteis
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Security Info */}
              <Card className="bg-green-50 border-green-200">
                <CardContent className="p-6">
                  <div className="flex items-start space-x-3">
                    <div className="w-10 h-10 rounded-full bg-green-500 flex items-center justify-center">
                      <Shield className="w-5 h-5 text-white" />
                    </div>
                    <div>
                      <h3 className="font-semibold text-green-900 mb-2">
                        Segurança Garantida
                      </h3>
                      <ul className="space-y-1 text-sm text-green-800">
                        <li>• Criptografia de ponta a ponta</li>
                        <li>• Verificação de identidade</li>
                        <li>• Monitoramento 24/7</li>
                        <li>• Conformidade com regulamentações</li>
                      </ul>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Important Notes */}
              <Card className="bg-amber-50 border-amber-200">
                <CardContent className="p-6">
                  <div className="flex items-start space-x-3">
                    <div className="w-10 h-10 rounded-full bg-amber-500 flex items-center justify-center">
                      <Info className="w-5 h-5 text-white" />
                    </div>
                    <div>
                      <h3 className="font-semibold text-amber-900 mb-2">
                        Informações Importantes
                      </h3>
                      <ul className="space-y-1 text-sm text-amber-800">
                        <li>• Taxa de 3% aplicada a todos os saques</li>
                        <li>• Valor mínimo: R$ 10,00</li>
                        <li>• Valor máximo: R$ 50.000,00 por dia</li>
                        <li>• Saques processados em horário comercial</li>
                        <li>
                          • Verifique os dados bancários antes de confirmar
                        </li>
                      </ul>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Recent Withdrawals Placeholder */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Últimos Saques</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-center py-8 text-muted-foreground">
                    <ArrowUpRight className="w-12 h-12 mx-auto mb-3 opacity-50" />
                    <p>Nenhum saque realizado ainda</p>
                    <p className="text-sm">Seus saques aparecerão aqui</p>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

"use client";

import React, { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { OTPInputComponent } from "@/components/ui/otp-input";
import { Phone, ArrowLeft, RefreshCw } from "lucide-react";

interface PhoneVerificationProps {
  phone: string;
  onSuccess?: () => void;
  onBack?: () => void;
  onError?: (error: string) => void;
  onResend?: () => void;
}

export function PhoneVerification({
  phone,
  onSuccess,
  onBack,
  onError,
  onResend,
}: PhoneVerificationProps) {
  const [verificationCode, setVerificationCode] = useState("");
  const [isVerifying, setIsVerifying] = useState(false);
  const [isResending, setIsResending] = useState(false);
  const [countdown, setCountdown] = useState(0);
  const { toast } = useToast();

  // Countdown timer for resend button
  useEffect(() => {
    if (countdown > 0) {
      const timer = setTimeout(() => setCountdown(countdown - 1), 1000);
      return () => clearTimeout(timer);
    }
  }, [countdown]);

  const verifyCode = async () => {
    if (!verificationCode || verificationCode.length !== 4) {
      toast({
        title: "Código inválido",
        description: "Por favor, digite o código de 4 dígitos",
        variant: "destructive",
      });
      return;
    }

    setIsVerifying(true);
    try {
      const response = await fetch("/api/auth/verify-phone", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          phone,
          code: verificationCode,
        }),
      });

      const data = await response.json();

      if (data.success) {
        toast({
          title: "Sucesso",
          description: "Número de telefone verificado com sucesso!",
        });
        onSuccess?.();
      } else {
        const errorMessage = data.error || "Código de verificação inválido";
        toast({
          title: "Erro",
          description: errorMessage,
          variant: "destructive",
        });
        onError?.(errorMessage);
        setVerificationCode("");
      }
    } catch {
      const errorMessage = "Falha ao verificar o código";
      toast({
        title: "Erro",
        description: errorMessage,
        variant: "destructive",
      });
      onError?.(errorMessage);
    } finally {
      setIsVerifying(false);
    }
  };

  const handleResendCode = async () => {
    if (countdown > 0) return;

    setIsResending(true);
    try {
      const response = await fetch("/api/auth/send-phone-verification", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          phone,
        }),
      });

      const data = await response.json();

      if (data.success) {
        toast({
          title: "Código reenviado",
          description: "Um novo código foi enviado para seu telefone",
        });
        setCountdown(60); // 60 seconds countdown
        onResend?.();
      } else {
        toast({
          title: "Erro",
          description: data.error || "Falha ao reenviar o código",
          variant: "destructive",
        });
      }
    } catch {
      toast({
        title: "Erro",
        description: "Falha ao reenviar o código",
        variant: "destructive",
      });
    } finally {
      setIsResending(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      verifyCode();
    }
  };

  return (
    <div className="max-w-md mx-auto space-y-6">
      <Card className="bg-black/60 border-gray-800/50 backdrop-blur-[15px]">
        <CardHeader className="text-center">
          <div className="flex justify-center mb-4">
            <Phone className="w-12 h-12 text-blue-500" />
          </div>
          <CardTitle className="text-white">Verificação de Telefone</CardTitle>
          <p className="text-gray-300">
            Digite o código de 4 dígitos enviado para
          </p>
          <p className="text-blue-300 font-mono">{phone}</p>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="space-y-4">
            <div className="text-center">
              <p className="text-sm text-gray-400">
                Digite o código de verificação que enviamos via SMS
              </p>
            </div>

            <OTPInputComponent
              value={verificationCode}
              onChange={setVerificationCode}
              numInputs={4}
              placeholder="0"
              isDisabled={isVerifying}
            />

            <Button
              onClick={verifyCode}
              disabled={isVerifying || verificationCode.length !== 4}
              className="w-full bg-white/10 hover:bg-white/20 text-white border border-white/20 hover:border-white/30 transition-all duration-200 h-12 text-base font-medium backdrop-blur-[10px]"
              onKeyDown={handleKeyPress}
            >
              {isVerifying ? "Verificando..." : "Verificar Código"}
            </Button>

            <div className="text-center">
              <button
                type="button"
                onClick={handleResendCode}
                disabled={isResending || countdown > 0}
                className="text-sm text-blue-300 hover:text-blue-200 underline disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isResending ? (
                  <>
                    <RefreshCw className="w-3 h-3 inline mr-1 animate-spin" />
                    Reenviando...
                  </>
                ) : countdown > 0 ? (
                  `Reenviar em ${countdown}s`
                ) : (
                  "Reenviar código"
                )}
              </button>
            </div>
          </div>

          {/* Back Button */}
          {onBack && (
            <div className="pt-4 border-t border-gray-700">
              <Button
                variant="outline"
                onClick={onBack}
                className="w-full bg-transparent border-gray-600 text-gray-300 hover:bg-gray-800/50"
              >
                <ArrowLeft className="w-4 h-4 mr-2" />
                Voltar
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Help Text */}
      <Card className="bg-black/40 border-gray-800/30 backdrop-blur-[10px]">
        <CardContent className="p-4">
          <div className="text-sm text-gray-400 space-y-2">
            <p>
              <strong className="text-gray-300">Problemas?</strong>
            </p>
            <ul className="list-disc list-inside space-y-1">
              <li>Verifique se o número está correto</li>
              <li>O código pode levar alguns minutos para chegar</li>
              <li>Verifique sua caixa de spam</li>
              <li>Se não receber, tente reenviar o código</li>
            </ul>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

export default PhoneVerification;

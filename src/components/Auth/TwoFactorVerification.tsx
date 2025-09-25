"use client";

import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { OTPInputComponent } from "@/components/ui/otp-input";
import { Shield, Key, AlertCircle, ArrowLeft } from "lucide-react";

interface TwoFactorVerificationProps {
  email: string;
  onSuccess?: () => void;
  onBack?: () => void;
  onError?: (error: string) => void;
}

export function TwoFactorVerification({
  email,
  onSuccess,
  onBack,
  onError,
}: TwoFactorVerificationProps) {
  const [verificationCode, setVerificationCode] = useState("");
  const [isVerifying, setIsVerifying] = useState(false);
  const [showBackupCode, setShowBackupCode] = useState(false);
  const [backupCode, setBackupCode] = useState("");
  const { toast } = useToast();

  const verifyCode = async () => {
    const code = showBackupCode ? backupCode : verificationCode;

    if (!code || (showBackupCode ? code.length < 8 : code.length !== 6)) {
      toast({
        title: "Invalid Code",
        description: showBackupCode
          ? "Please enter a valid backup code"
          : "Please enter a 6-digit verification code",
        variant: "destructive",
      });
      return;
    }

    setIsVerifying(true);
    try {
      const response = await fetch("/api/auth/2fa/verify", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          email,
          token: code.replace(/[-\s]/g, ""), // Remove dashes and spaces
        }),
      });

      const data = await response.json();

      if (data.success) {
        toast({
          title: "Success",
          description: "2FA verification successful",
        });
        onSuccess?.();
      } else {
        const errorMessage = data.error || "Invalid verification code";
        toast({
          title: "Error",
          description: errorMessage,
          variant: "destructive",
        });
        onError?.(errorMessage);

        // Clear the input
        if (showBackupCode) {
          setBackupCode("");
        } else {
          setVerificationCode("");
        }
      }
    } catch {
      const errorMessage = "Failed to verify 2FA code";
      toast({
        title: "Error",
        description: errorMessage,
        variant: "destructive",
      });
      onError?.(errorMessage);
    } finally {
      setIsVerifying(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      verifyCode();
    }
  };

  return (
    <div className="max-w-md mx-auto space-y-6">
      <Card>
        <CardHeader className="text-center">
          <div className="flex justify-center mb-4">
            <Shield className="w-12 h-12 text-blue-500" />
          </div>
          <CardTitle>Two-Factor Authentication</CardTitle>
          <p className="text-muted-foreground">
            Enter the verification code to continue
          </p>
        </CardHeader>
        <CardContent className="space-y-6">
          {!showBackupCode ? (
            // Regular 2FA Code Input
            <div className="space-y-4">
              <div className="text-center">
                <Key className="w-8 h-8 mx-auto text-blue-500 mb-2" />
                <p className="text-sm text-muted-foreground">
                  Enter the 6-digit code from your authenticator app
                </p>
              </div>

              <OTPInputComponent
                value={verificationCode}
                onChange={setVerificationCode}
                numInputs={6}
                placeholder="0"
                isDisabled={isVerifying}
              />

              <Button
                onClick={verifyCode}
                disabled={isVerifying || verificationCode.length !== 6}
                className="w-full"
                onKeyDown={handleKeyPress}
              >
                {isVerifying ? "Verifying..." : "Verify Code"}
              </Button>

              <div className="text-center">
                <button
                  type="button"
                  onClick={() => setShowBackupCode(true)}
                  className="text-sm text-blue-600 hover:text-blue-800 underline"
                >
                  Use a backup code instead
                </button>
              </div>
            </div>
          ) : (
            // Backup Code Input
            <div className="space-y-4">
              <div className="text-center">
                <AlertCircle className="w-8 h-8 mx-auto text-orange-500 mb-2" />
                <p className="text-sm text-muted-foreground">
                  Enter one of your backup codes
                </p>
              </div>

              <div>
                <input
                  type="text"
                  value={backupCode}
                  onChange={(e) => setBackupCode(e.target.value)}
                  placeholder="XXXX-XXXX"
                  disabled={isVerifying}
                  onKeyDown={handleKeyPress}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md text-center font-mono text-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>

              <Button
                onClick={verifyCode}
                disabled={isVerifying || backupCode.length < 8}
                className="w-full"
              >
                {isVerifying ? "Verifying..." : "Use Backup Code"}
              </Button>

              <div className="text-center">
                <button
                  type="button"
                  onClick={() => {
                    setShowBackupCode(false);
                    setBackupCode("");
                  }}
                  className="text-sm text-blue-600 hover:text-blue-800 underline"
                >
                  Use authenticator code instead
                </button>
              </div>
            </div>
          )}

          {/* Back Button */}
          {onBack && (
            <div className="pt-4 border-t">
              <Button variant="outline" onClick={onBack} className="w-full">
                <ArrowLeft className="w-4 h-4 mr-2" />
                Back to Login
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Help Text */}
      <Card>
        <CardContent className="p-4">
          <div className="text-sm text-muted-foreground space-y-2">
            <p>
              <strong>Having trouble?</strong>
            </p>
            <ul className="list-disc list-inside space-y-1">
              <li>Make sure your device&apos;s time is correct</li>
              <li>Try generating a new code in your authenticator app</li>
              <li>
                Use a backup code if you can&apos;t access your authenticator
              </li>
            </ul>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

export default TwoFactorVerification;

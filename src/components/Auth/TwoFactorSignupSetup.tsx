"use client";

import React, { useState } from "react";
import Image from "next/image";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { OTPInputComponent } from "@/components/ui/otp-input";
import {
  Shield,
  QrCode,
  Copy,
  Download,
  CheckCircle,
  AlertTriangle,
  Smartphone,
  Key,
} from "lucide-react";

interface SetupStep {
  id: string;
  title: string;
  description: string;
  completed: boolean;
}

interface TwoFactorSignupSetupProps {
  onComplete?: () => void;
  onCancel?: () => void;
}

export function TwoFactorSignupSetup({
  onComplete,
}: TwoFactorSignupSetupProps) {
  const [currentStep, setCurrentStep] = useState(0);
  const [qrCodeUrl, setQrCodeUrl] = useState("");
  const [backupCodes, setBackupCodes] = useState<string[]>([]);
  const [secret, setSecret] = useState("");
  const [verificationCode, setVerificationCode] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isVerifying, setIsVerifying] = useState(false);
  const { toast } = useToast();

  const steps: SetupStep[] = [
    {
      id: "install",
      title: "Install Authenticator App",
      description: "Download and install an authenticator app on your phone",
      completed: currentStep > 0,
    },
    {
      id: "scan",
      title: "Scan QR Code",
      description: "Scan the QR code with your authenticator app",
      completed: currentStep > 1,
    },
    {
      id: "verify",
      title: "Verify Setup",
      description: "Enter the 6-digit code from your authenticator app",
      completed: currentStep > 2,
    },
    {
      id: "backup",
      title: "Save Backup Codes",
      description: "Download and securely store your backup codes",
      completed: currentStep > 3,
    },
  ];

  const authenticatorApps = [
    { name: "Google Authenticator", platforms: ["iOS", "Android"] },
    { name: "Microsoft Authenticator", platforms: ["iOS", "Android"] },
    { name: "Authy", platforms: ["iOS", "Android", "Desktop"] },
    { name: "1Password", platforms: ["iOS", "Android", "Desktop"] },
  ];

  const initializeSetup = async () => {
    setIsLoading(true);
    try {
      const response = await fetch("/api/auth/2fa/setup", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
      });

      const data = await response.json();

      if (data.success) {
        setQrCodeUrl(data.data.qrCodeUrl);
        setBackupCodes(data.data.backupCodes);
        setSecret(data.data.secret);
        setCurrentStep(1);
      } else {
        toast({
          title: "Error",
          description: data.error || "Failed to initialize 2FA setup",
          variant: "destructive",
        });
      }
    } catch {
      toast({
        title: "Error",
        description: "Failed to initialize 2FA setup",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const verifySetup = async () => {
    if (verificationCode.length !== 6) {
      toast({
        title: "Invalid Code",
        description: "Please enter a 6-digit verification code",
        variant: "destructive",
      });
      return;
    }

    setIsVerifying(true);
    try {
      const response = await fetch("/api/auth/2fa/complete-signup", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ token: verificationCode }),
      });

      const data = await response.json();

      if (data.success) {
        setCurrentStep(3);
        toast({
          title: "Success",
          description: "Your account has been activated with 2FA!",
        });
      } else {
        toast({
          title: "Error",
          description: data.error || "Invalid verification code",
          variant: "destructive",
        });
        setVerificationCode("");
      }
    } catch {
      toast({
        title: "Error",
        description: "Failed to verify 2FA setup",
        variant: "destructive",
      });
      setVerificationCode("");
    } finally {
      setIsVerifying(false);
    }
  };

  const copySecret = () => {
    navigator.clipboard.writeText(secret);
    toast({
      title: "Copied",
      description: "Secret key copied to clipboard",
    });
  };

  const downloadBackupCodes = () => {
    const content = `BS Market - Two-Factor Authentication Backup Codes
Generated: ${new Date().toLocaleString()}

IMPORTANT: Store these codes securely. Each code can only be used once.

${backupCodes.map((code, index) => `${index + 1}. ${code}`).join("\n")}

These codes can be used to access your account if you lose access to your authenticator app.`;

    const blob = new Blob([content], { type: "text/plain" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "bs-market-2fa-backup-codes.txt";
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);

    toast({
      title: "Downloaded",
      description: "Backup codes downloaded successfully",
    });
    setCurrentStep(4);
  };

  const completeSetup = () => {
    toast({
      title: "Account Activated",
      description: "Welcome to BS Market! Your account is now secure with 2FA.",
    });
    onComplete?.();
  };

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      {/* Header */}
      <Card className="bg-white/10 border-white/20 backdrop-blur-[10px]">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-white">
            <Shield className="w-6 h-6 text-green-400" />
            Secure Your Account with 2FA
          </CardTitle>
          <p className="text-white/80">
            Two-factor authentication is required for all BS Market accounts
          </p>
        </CardHeader>
      </Card>

      {/* Progress Steps */}
      <Card className="bg-white/10 border-white/20 backdrop-blur-[10px]">
        <CardContent className="p-6">
          <div className="space-y-4">
            {steps.map((step, index) => (
              <div key={step.id} className="flex items-center gap-3">
                <div
                  className={`w-8 h-8 rounded-full flex items-center justify-center ${
                    step.completed
                      ? "bg-green-500 text-white"
                      : currentStep === index
                      ? "bg-blue-500 text-white"
                      : "bg-gray-200 text-gray-600"
                  }`}
                >
                  {step.completed ? (
                    <CheckCircle className="w-4 h-4" />
                  ) : (
                    <span className="text-sm font-semibold">{index + 1}</span>
                  )}
                </div>
                <div>
                  <h3 className="font-medium text-white">{step.title}</h3>
                  <p className="text-sm text-white/60">{step.description}</p>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Step Content */}
      {currentStep === 0 && (
        <Card className="bg-white/10 border-white/20 backdrop-blur-[10px]">
          <CardContent className="p-6">
            <div className="text-center space-y-6">
              <Smartphone className="w-16 h-16 mx-auto text-blue-400" />
              <div>
                <h3 className="text-lg font-semibold mb-2 text-white">
                  Install an Authenticator App
                </h3>
                <p className="text-white/80 mb-4">
                  Choose one of these popular authenticator apps:
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {authenticatorApps.map((app) => (
                  <Card
                    key={app.name}
                    className="p-4 bg-white/5 border-white/10"
                  >
                    <h4 className="font-medium mb-2 text-white">{app.name}</h4>
                    <div className="flex gap-1 flex-wrap">
                      {app.platforms.map((platform) => (
                        <Badge key={platform} variant="secondary">
                          {platform}
                        </Badge>
                      ))}
                    </div>
                  </Card>
                ))}
              </div>

              <Button
                onClick={initializeSetup}
                disabled={isLoading}
                className="w-full max-w-sm bg-blue-600 hover:bg-blue-700 text-white"
              >
                {isLoading ? "Setting up..." : "I have an authenticator app"}
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {currentStep === 1 && (
        <Card className="bg-white/10 border-white/20 backdrop-blur-[10px]">
          <CardContent className="p-6">
            <div className="text-center space-y-6">
              <QrCode className="w-16 h-16 mx-auto text-blue-400" />
              <div>
                <h3 className="text-lg font-semibold mb-2 text-white">
                  Scan QR Code
                </h3>
                <p className="text-white/80">
                  Open your authenticator app and scan this QR code
                </p>
              </div>

              {qrCodeUrl && (
                <div className="flex justify-center">
                  <Image
                    src={qrCodeUrl}
                    alt="2FA QR Code"
                    width={192}
                    height={192}
                    className="border rounded-lg bg-white p-2"
                  />
                </div>
              )}

              <div className="space-y-2">
                <p className="text-sm text-white/60">
                  Can&apos;t scan? Enter this code manually:
                </p>
                <div className="flex items-center justify-center gap-2">
                  <code className="bg-white/10 px-3 py-1 rounded text-sm font-mono text-white">
                    {secret}
                  </code>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={copySecret}
                    className="p-2 border-white/20 text-white hover:bg-white/10"
                  >
                    <Copy className="w-4 h-4" />
                  </Button>
                </div>
              </div>

              <Button
                onClick={() => setCurrentStep(2)}
                className="w-full max-w-sm bg-blue-600 hover:bg-blue-700 text-white"
              >
                I&apos;ve scanned the QR code
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {currentStep === 2 && (
        <Card className="bg-white/10 border-white/20 backdrop-blur-[10px]">
          <CardContent className="p-6">
            <div className="text-center space-y-6">
              <Key className="w-16 h-16 mx-auto text-blue-400" />
              <div>
                <h3 className="text-lg font-semibold mb-2 text-white">
                  Enter Verification Code
                </h3>
                <p className="text-white/80">
                  Enter the 6-digit code from your authenticator app
                </p>
              </div>

              <div className="space-y-4">
                <OTPInputComponent
                  value={verificationCode}
                  onChange={setVerificationCode}
                  numInputs={6}
                  placeholder="0"
                />
              </div>

              <Button
                onClick={verifySetup}
                disabled={isVerifying || verificationCode.length !== 6}
                className="w-full max-w-sm bg-green-600 hover:bg-green-700 text-white"
              >
                {isVerifying
                  ? "Activating Account..."
                  : "Activate Account with 2FA"}
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {currentStep === 3 && (
        <Card className="bg-white/10 border-white/20 backdrop-blur-[10px]">
          <CardContent className="p-6">
            <div className="text-center space-y-6">
              <Download className="w-16 h-16 mx-auto text-orange-400" />
              <div>
                <h3 className="text-lg font-semibold mb-2 text-white">
                  Save Backup Codes
                </h3>
                <div className="bg-orange-500/20 border border-orange-400/30 rounded-lg p-4 mb-4">
                  <div className="flex items-start gap-2">
                    <AlertTriangle className="w-5 h-5 text-orange-400 mt-0.5" />
                    <div className="text-left">
                      <p className="font-medium text-orange-300">Important!</p>
                      <p className="text-sm text-orange-200">
                        Store these backup codes securely. You&apos;ll need them
                        if you lose access to your authenticator app.
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2 max-w-sm mx-auto">
                {backupCodes.map((code, index) => (
                  <code
                    key={index}
                    className="bg-white/10 px-2 py-1 rounded text-sm font-mono text-white"
                  >
                    {code}
                  </code>
                ))}
              </div>

              <Button
                onClick={downloadBackupCodes}
                className="w-full max-w-sm bg-orange-600 hover:bg-orange-700 text-white"
              >
                <Download className="w-4 h-4 mr-2" />
                Download Backup Codes
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {currentStep === 4 && (
        <Card className="bg-white/10 border-white/20 backdrop-blur-[10px]">
          <CardContent className="p-6">
            <div className="text-center space-y-6">
              <CheckCircle className="w-16 h-16 mx-auto text-green-400" />
              <div>
                <h3 className="text-lg font-semibold mb-2 text-white">
                  Account Activated!
                </h3>
                <p className="text-white/80">
                  Your BS Market account has been successfully created and
                  secured with two-factor authentication. Welcome aboard!
                </p>
              </div>

              <div className="flex gap-3 justify-center">
                <Button
                  onClick={completeSetup}
                  className="bg-green-600 hover:bg-green-700 text-white"
                >
                  Continue to Dashboard
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Warning for cancellation */}
      {currentStep > 0 && currentStep < 4 && (
        <Card className="bg-red-500/20 border-red-400/30 backdrop-blur-[10px]">
          <CardContent className="p-4">
            <div className="flex items-start gap-2">
              <AlertTriangle className="w-5 h-5 text-red-400 mt-0.5" />
              <div className="text-left">
                <p className="font-medium text-red-300">Setup Required</p>
                <p className="text-sm text-red-200">
                  2FA setup is mandatory for all BS Market accounts. Your
                  account will remain inactive until this process is completed.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

export default TwoFactorSignupSetup;

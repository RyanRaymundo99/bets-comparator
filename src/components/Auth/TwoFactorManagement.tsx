"use client";

import React, { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { OTPInputComponent } from "@/components/ui/otp-input";
import { TwoFactorSetup } from "./TwoFactorSetup";
import {
  Shield,
  ShieldCheck,
  ShieldOff,
  Key,
  Download,
  RefreshCw,
  AlertTriangle,
  CheckCircle,
} from "lucide-react";

interface User2FAStatus {
  twoFactorEnabled: boolean;
  backupCodesCount: number;
}

export function TwoFactorManagement() {
  const [user2FA, setUser2FA] = useState<User2FAStatus | null>(null);
  const [showSetup, setShowSetup] = useState(false);
  const [showDisable, setShowDisable] = useState(false);
  const [showBackupCodes, setShowBackupCodes] = useState(false);
  const [backupCodes, setBackupCodes] = useState<string[]>([]);
  const [verificationCode, setVerificationCode] = useState("");
  const [password, setPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    fetchUser2FAStatus();
  }, []);

  const fetchUser2FAStatus = async () => {
    try {
      // This would typically come from your user API endpoint
      // For now, we'll check the backup codes endpoint
      const response = await fetch("/api/auth/2fa/backup-codes");
      const data = await response.json();

      if (response.ok) {
        setUser2FA({
          twoFactorEnabled: true,
          backupCodesCount: data.remainingCodes,
        });
      } else {
        setUser2FA({
          twoFactorEnabled: false,
          backupCodesCount: 0,
        });
      }
    } catch {
      setUser2FA({
        twoFactorEnabled: false,
        backupCodesCount: 0,
      });
    }
  };

  const disable2FA = async () => {
    if (!verificationCode || !password) {
      toast({
        title: "Error",
        description: "Please enter both your password and 2FA code",
        variant: "destructive",
      });
      return;
    }

    setIsLoading(true);
    try {
      const response = await fetch("/api/auth/2fa/disable", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          token: verificationCode,
          password,
        }),
      });

      const data = await response.json();

      if (data.success) {
        toast({
          title: "Success",
          description: "2FA has been disabled for your account",
        });
        setUser2FA({
          twoFactorEnabled: false,
          backupCodesCount: 0,
        });
        setShowDisable(false);
        setVerificationCode("");
        setPassword("");
      } else {
        toast({
          title: "Error",
          description: data.error || "Failed to disable 2FA",
          variant: "destructive",
        });
      }
    } catch {
      toast({
        title: "Error",
        description: "Failed to disable 2FA",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const generateNewBackupCodes = async () => {
    if (!verificationCode) {
      toast({
        title: "Error",
        description: "Please enter your 2FA code",
        variant: "destructive",
      });
      return;
    }

    setIsLoading(true);
    try {
      const response = await fetch("/api/auth/2fa/backup-codes", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          token: verificationCode,
        }),
      });

      const data = await response.json();

      if (data.success) {
        setBackupCodes(data.backupCodes);
        setUser2FA((prev) =>
          prev
            ? {
                ...prev,
                backupCodesCount: data.backupCodes.length,
              }
            : null
        );
        toast({
          title: "Success",
          description: "New backup codes generated",
        });
      } else {
        toast({
          title: "Error",
          description: data.error || "Failed to generate backup codes",
          variant: "destructive",
        });
      }
    } catch {
      toast({
        title: "Error",
        description: "Failed to generate backup codes",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
      setVerificationCode("");
    }
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
    a.download = `bs-market-2fa-backup-codes-${
      new Date().toISOString().split("T")[0]
    }.txt`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);

    toast({
      title: "Downloaded",
      description: "Backup codes downloaded successfully",
    });
  };

  if (showSetup) {
    return (
      <TwoFactorSetup
        onComplete={() => {
          setShowSetup(false);
          fetchUser2FAStatus();
        }}
        onCancel={() => setShowSetup(false)}
      />
    );
  }

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      {/* 2FA Status Card */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            {user2FA?.twoFactorEnabled ? (
              <ShieldCheck className="w-6 h-6 text-green-500" />
            ) : (
              <ShieldOff className="w-6 h-6 text-gray-500" />
            )}
            Two-Factor Authentication
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <div className="font-medium">
                Status:{" "}
                <Badge
                  variant={user2FA?.twoFactorEnabled ? "default" : "secondary"}
                >
                  {user2FA?.twoFactorEnabled ? "Enabled" : "Disabled"}
                </Badge>
              </div>
              <p className="text-sm text-muted-foreground mt-1">
                {user2FA?.twoFactorEnabled
                  ? "Your account is protected with 2FA"
                  : "Add an extra layer of security to your account"}
              </p>
            </div>
            {!user2FA?.twoFactorEnabled ? (
              <Button onClick={() => setShowSetup(true)}>
                <Shield className="w-4 h-4 mr-2" />
                Enable 2FA
              </Button>
            ) : (
              <Button
                variant="destructive"
                onClick={() => setShowDisable(true)}
              >
                <ShieldOff className="w-4 h-4 mr-2" />
                Disable 2FA
              </Button>
            )}
          </div>

          {user2FA?.twoFactorEnabled && (
            <div className="pt-4 border-t">
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium">Backup Codes</p>
                  <p className="text-sm text-muted-foreground">
                    {user2FA.backupCodesCount} codes remaining
                  </p>
                </div>
                <Button
                  variant="outline"
                  onClick={() => setShowBackupCodes(true)}
                >
                  <Key className="w-4 h-4 mr-2" />
                  Manage Backup Codes
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Disable 2FA Modal */}
      {showDisable && (
        <Card className="border-red-200">
          <CardHeader>
            <CardTitle className="text-red-600 flex items-center gap-2">
              <AlertTriangle className="w-5 h-5" />
              Disable Two-Factor Authentication
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="bg-red-50 border border-red-200 rounded-lg p-4">
              <p className="text-red-800 text-sm">
                <strong>Warning:</strong> Disabling 2FA will make your account
                less secure. You will only need your password to access your
                account.
              </p>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-2">
                  Current Password
                </label>
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Enter your current password"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">
                  2FA Code
                </label>
                <OTPInputComponent
                  value={verificationCode}
                  onChange={setVerificationCode}
                  numInputs={6}
                  placeholder="0"
                />
              </div>
            </div>

            <div className="flex gap-3">
              <Button
                variant="destructive"
                onClick={disable2FA}
                disabled={
                  isLoading || !password || verificationCode.length !== 6
                }
              >
                {isLoading ? "Disabling..." : "Disable 2FA"}
              </Button>
              <Button
                variant="outline"
                onClick={() => {
                  setShowDisable(false);
                  setPassword("");
                  setVerificationCode("");
                }}
              >
                Cancel
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Backup Codes Management */}
      {showBackupCodes && user2FA?.twoFactorEnabled && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Key className="w-5 h-5" />
              Backup Codes Management
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <p className="text-blue-800 text-sm">
                <strong>Current Status:</strong> You have{" "}
                {user2FA.backupCodesCount} backup codes remaining. Generate new
                codes if you&apos;re running low or want to refresh them.
              </p>
            </div>

            {backupCodes.length > 0 && (
              <div className="space-y-4">
                <h4 className="font-medium">Your New Backup Codes:</h4>
                <div className="grid grid-cols-2 gap-2">
                  {backupCodes.map((code, index) => (
                    <code
                      key={index}
                      className="bg-gray-100 px-2 py-1 rounded text-sm font-mono"
                    >
                      {code}
                    </code>
                  ))}
                </div>
                <Button onClick={downloadBackupCodes} className="w-full">
                  <Download className="w-4 h-4 mr-2" />
                  Download New Backup Codes
                </Button>
              </div>
            )}

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-2">
                  Enter 2FA Code to Generate New Backup Codes
                </label>
                <OTPInputComponent
                  value={verificationCode}
                  onChange={setVerificationCode}
                  numInputs={6}
                  placeholder="0"
                />
              </div>

              <div className="flex gap-3">
                <Button
                  onClick={generateNewBackupCodes}
                  disabled={isLoading || verificationCode.length !== 6}
                >
                  <RefreshCw className="w-4 h-4 mr-2" />
                  {isLoading ? "Generating..." : "Generate New Codes"}
                </Button>
                <Button
                  variant="outline"
                  onClick={() => {
                    setShowBackupCodes(false);
                    setVerificationCode("");
                    setBackupCodes([]);
                  }}
                >
                  Close
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Security Recommendations */}
      <Card>
        <CardHeader>
          <CardTitle className="text-sm">Security Recommendations</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3 text-sm text-muted-foreground">
            <div className="flex items-start gap-2">
              <CheckCircle className="w-4 h-4 text-green-500 mt-0.5 flex-shrink-0" />
              <span>
                Use a reputable authenticator app like Google Authenticator,
                Authy, or Microsoft Authenticator
              </span>
            </div>
            <div className="flex items-start gap-2">
              <CheckCircle className="w-4 h-4 text-green-500 mt-0.5 flex-shrink-0" />
              <span>
                Store your backup codes in a secure location separate from your
                authenticator device
              </span>
            </div>
            <div className="flex items-start gap-2">
              <CheckCircle className="w-4 h-4 text-green-500 mt-0.5 flex-shrink-0" />
              <span>
                Consider having backup authenticator devices configured
              </span>
            </div>
            <div className="flex items-start gap-2">
              <CheckCircle className="w-4 h-4 text-green-500 mt-0.5 flex-shrink-0" />
              <span>Regularly review and update your backup codes</span>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

export default TwoFactorManagement;

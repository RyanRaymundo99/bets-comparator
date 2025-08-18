"use client";

import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import NavbarNew from "@/components/ui/navbar-new";
import { useToast } from "@/hooks/use-toast";

export default function DepositsPage() {
  const [amount, setAmount] = useState("");
  const [loading, setLoading] = useState(false);
  const [qrCode, setQrCode] = useState("");
  const [qrCodeBase64, setQrCodeBase64] = useState("");
  const [paymentId, setPaymentId] = useState("");
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
        body: JSON.stringify({ amount: parseFloat(amount) }),
      });

      const data = await response.json();

      if (response.ok) {
        setQrCode(data.qrCode || "");
        setQrCodeBase64(data.qrCodeBase64 || "");
        setPaymentId(data.paymentId || "");
        toast({
          title: "Success",
          description: "Deposit request created successfully",
        });
      } else {
        toast({
          title: "Error",
          description: data.error || "Failed to create deposit",
          variant: "destructive",
        });
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Network error",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background text-foreground">
      <NavbarNew isLoggingOut={isLoggingOut} handleLogout={handleLogout} />
      <div className="container mx-auto px-4 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold mb-2">Deposit Funds</h1>
          <p className="text-muted-foreground">
            Add BRL to your account using Mercado Pago
          </p>
        </div>

        <div className="max-w-2xl mx-auto">
          <Card>
            <CardHeader>
              <CardTitle>Create Deposit</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <label className="text-sm font-medium">Amount (BRL)</label>
                <Input
                  type="number"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  placeholder="Enter amount in BRL"
                  className="mt-1"
                />
              </div>
              <Button
                onClick={handleDeposit}
                disabled={loading}
                className="w-full"
              >
                {loading ? "Creating..." : "Create Deposit"}
              </Button>
            </CardContent>
          </Card>

          {qrCode && (
            <Card className="mt-6">
              <CardHeader>
                <CardTitle>Payment QR Code</CardTitle>
              </CardHeader>
              <CardContent className="text-center">
                <div className="mb-4">
                  <p className="text-sm text-muted-foreground mb-2">
                    Scan this QR code with your Mercado Pago app
                  </p>
                  {qrCodeBase64 && (
                    <img
                      src={`data:image/png;base64,${qrCodeBase64}`}
                      alt="QR Code"
                      className="mx-auto border rounded-lg"
                      style={{ maxWidth: "200px" }}
                    />
                  )}
                </div>
                <div className="text-sm text-muted-foreground">
                  Payment ID: {paymentId}
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}

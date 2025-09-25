"use client";

import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { authClient } from "@/lib/auth-client";

export default function TestForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [testEmail, setTestEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [testingEmail, setTestingEmail] = useState(false);
  const { toast } = useToast();

  const testEmailSending = async () => {
    if (!testEmail) {
      toast({
        title: "Error",
        description: "Please enter an email address",
        variant: "destructive",
      });
      return;
    }

    setTestingEmail(true);
    try {
      const response = await fetch("/api/test-email", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ email: testEmail }),
      });

      const result = await response.json();

      if (result.success) {
        toast({
          title: "Success",
          description: "Test email sent successfully! Check your inbox.",
        });
      } else {
        toast({
          title: "Error",
          description: result.error || "Failed to send test email",
          variant: "destructive",
        });
      }
    } catch {
      toast({
        title: "Error",
        description: "Failed to send test email",
        variant: "destructive",
      });
    } finally {
      setTestingEmail(false);
    }
  };

  const testForgotPassword = async () => {
    if (!email) {
      toast({
        title: "Error",
        description: "Please enter an email address",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);
    try {
      const { error } = await authClient.forgetPassword({
        email: email,
        redirectTo: "/reset-password",
      });

      if (error) {
        toast({
          title: "Error",
          description: error.message,
          variant: "destructive",
        });
      } else {
        toast({
          title: "Success",
          description: "Password reset email sent! Check your inbox.",
        });
      }
    } catch {
      toast({
        title: "Error",
        description: "Failed to send password reset email",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background p-8">
      <div className="max-w-2xl mx-auto space-y-6">
        <h1 className="text-3xl font-bold text-center">
          Test Forgot Password Functionality
        </h1>

        {/* Test Email System */}
        <Card>
          <CardHeader>
            <CardTitle>Test Email System</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <Input
              type="email"
              placeholder="Enter email to test basic email sending"
              value={testEmail}
              onChange={(e) => setTestEmail(e.target.value)}
            />
            <Button
              onClick={testEmailSending}
              disabled={testingEmail}
              className="w-full"
            >
              {testingEmail ? "Sending Test Email..." : "Send Test Email"}
            </Button>
          </CardContent>
        </Card>

        {/* Test Forgot Password */}
        <Card>
          <CardHeader>
            <CardTitle>Test Forgot Password</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <Input
              type="email"
              placeholder="Enter email to test forgot password"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
            <Button
              onClick={testForgotPassword}
              disabled={loading}
              className="w-full"
            >
              {loading ? "Sending Reset Email..." : "Send Reset Email"}
            </Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Email Configuration Status</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2 text-sm">
              <p>
                <strong>Resend API:</strong>{" "}
                {process.env.NEXT_PUBLIC_HAS_RESEND
                  ? "✅ Configured"
                  : "❌ Not configured"}
              </p>
              <p>
                <strong>Gmail SMTP:</strong>{" "}
                {process.env.NEXT_PUBLIC_HAS_GMAIL
                  ? "✅ Configured"
                  : "❌ Not configured"}
              </p>
              <p>
                <strong>Development Mode:</strong> Local SMTP (MailDev/MailHog)
              </p>
            </div>
          </CardContent>
        </Card>

        <div className="text-center">
          <Button
            variant="outline"
            onClick={() => (window.location.href = "/forgot-password")}
          >
            Go to Actual Forgot Password Page
          </Button>
        </div>
      </div>
    </div>
  );
}

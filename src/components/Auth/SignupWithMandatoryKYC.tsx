"use client";

import React, { useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { signUpSchema } from "@/lib/schema/signupSchema";
import {
  CheckCircle,
  Upload,
  Camera,
  FileText,
  ArrowRight,
  ArrowLeft,
} from "lucide-react";

interface SignUpFormValues {
  name: string;
  email: string;
  phone: string;
  cpf: string;
  password: string;
  confirmPassword: string;
}

interface KYCDocumentData {
  documentFront: File;
  documentBack: File;
  documentSelfie: File;
}

const SignupWithMandatoryKYC = () => {
  const [currentStep, setCurrentStep] = useState<"info" | "kyc" | "success">(
    "info"
  );
  const [userData, setUserData] = useState<SignUpFormValues | null>(null);
  const [kycData, setKycData] = useState<KYCDocumentData | null>(null);
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);
  const { toast } = useToast();
  const router = useRouter();

  const form = useForm<SignUpFormValues>({
    resolver: zodResolver(signUpSchema),
    defaultValues: {
      name: "",
      email: "",
      phone: "",
      cpf: "",
      password: "",
      confirmPassword: "",
    },
  });

  const createAccount = useCallback(
    async (data: SignUpFormValues) => {
      try {
        setLoading(true);

        const response = await fetch("/api/auth/signup-with-verification", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            name: data.name,
            email: data.email,
            phone: data.phone,
            cpf: data.cpf,
            password: data.password,
          }),
        });

        const result = await response.json();

        if (response.ok) {
          setUserData(data);
          setCurrentStep("kyc");
          toast({
            title: "Account created!",
            description: "Now please complete your identity verification",
          });
        } else {
          toast({
            variant: "destructive",
            title: "Error creating account",
            description:
              result.error || "An error occurred while creating your account.",
          });
        }
      } catch (error) {
        console.error("Signup error:", error);
        toast({
          variant: "destructive",
          title: "Error creating account",
          description: "An unexpected error occurred",
        });
      } finally {
        setLoading(false);
      }
    },
    [toast]
  );

  const handleKYCSubmit = async () => {
    if (!kycData || !userData) return;

    try {
      setUploading(true);

      // Upload KYC documents
      const formData = new FormData();
      formData.append("documentFront", kycData.documentFront);
      formData.append("documentBack", kycData.documentBack);
      formData.append("documentSelfie", kycData.documentSelfie);

      const response = await fetch("/api/user/submit-kyc", {
        method: "POST",
        body: formData,
      });

      if (response.ok) {
        setCurrentStep("success");
        toast({
          title: "KYC Submitted!",
          description: "Your documents have been submitted for review",
        });
      } else {
        const errorData = await response.json();
        throw new Error(errorData.error || "Failed to submit KYC documents");
      }
    } catch (error) {
      console.error("KYC submission error:", error);
      toast({
        variant: "destructive",
        title: "KYC Submission Failed",
        description:
          error instanceof Error ? error.message : "Failed to submit documents",
      });
    } finally {
      setUploading(false);
    }
  };

  const handleFileSelect = (type: keyof KYCDocumentData, file: File) => {
    setKycData(
      (prev) =>
        ({
          ...prev,
          [type]: file,
        } as KYCDocumentData)
    );
  };

  const onSubmit = (data: SignUpFormValues) => {
    createAccount(data);
  };

  const renderStepIndicator = () => (
    <div className="mb-8">
      <div className="flex items-center justify-center space-x-4">
        <div
          className={`flex items-center space-x-2 ${
            currentStep === "info" ? "text-primary" : "text-muted-foreground"
          }`}
        >
          <div
            className={`w-8 h-8 rounded-full flex items-center justify-center ${
              currentStep === "info"
                ? "bg-primary text-primary-foreground"
                : "bg-muted"
            }`}
          >
            1
          </div>
          <span className="text-sm font-medium">Account Info</span>
        </div>
        <div className="w-8 h-px bg-border"></div>
        <div
          className={`flex items-center space-x-2 ${
            currentStep === "kyc" ? "text-primary" : "text-muted-foreground"
          }`}
        >
          <div
            className={`w-8 h-8 rounded-full flex items-center justify-center ${
              currentStep === "kyc"
                ? "bg-primary text-primary-foreground"
                : "bg-muted"
            }`}
          >
            2
          </div>
          <span className="text-sm font-medium">KYC Documents</span>
        </div>
        <div className="w-8 h-px bg-border"></div>
        <div
          className={`flex items-center space-x-2 ${
            currentStep === "success" ? "text-primary" : "text-muted-foreground"
          }`}
        >
          <div
            className={`w-8 h-8 rounded-full flex items-center justify-center ${
              currentStep === "success"
                ? "bg-primary text-primary-foreground"
                : "bg-muted"
            }`}
          >
            3
          </div>
          <span className="text-sm font-medium">Complete</span>
        </div>
      </div>
    </div>
  );

  if (currentStep === "success") {
    return (
      <Card className="w-full max-w-md mx-auto">
        <CardHeader className="text-center">
          <div className="mx-auto w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mb-4">
            <CheckCircle className="w-8 h-8 text-green-600" />
          </div>
          <CardTitle className="text-2xl">Account Created!</CardTitle>
          <p className="text-muted-foreground">
            Your account has been created and your KYC documents have been
            submitted for review. You will be notified once your account is
            approved.
          </p>
        </CardHeader>
        <CardContent>
          <Button
            onClick={() => router.push("/dashboard?kyc=pending")}
            className="w-full"
          >
            Go to Dashboard
          </Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="w-full max-w-md mx-auto">
      <CardHeader>
        <CardTitle className="text-2xl text-center">Create Account</CardTitle>
        <p className="text-muted-foreground text-center">
          Complete your registration with KYC verification
        </p>
        {renderStepIndicator()}
      </CardHeader>
      <CardContent>
        {currentStep === "info" && (
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <div>
              <Label htmlFor="name">Full Name</Label>
              <Input id="name" {...form.register("name")} className="mt-1" />
              {form.formState.errors.name && (
                <p className="text-sm text-red-600 mt-1">
                  {form.formState.errors.name.message}
                </p>
              )}
            </div>

            <div>
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                {...form.register("email")}
                className="mt-1"
              />
              {form.formState.errors.email && (
                <p className="text-sm text-red-600 mt-1">
                  {form.formState.errors.email.message}
                </p>
              )}
            </div>

            <div>
              <Label htmlFor="phone">Phone</Label>
              <Input id="phone" {...form.register("phone")} className="mt-1" />
              {form.formState.errors.phone && (
                <p className="text-sm text-red-600 mt-1">
                  {form.formState.errors.phone.message}
                </p>
              )}
            </div>

            <div>
              <Label htmlFor="cpf">CPF</Label>
              <Input id="cpf" {...form.register("cpf")} className="mt-1" />
              {form.formState.errors.cpf && (
                <p className="text-sm text-red-600 mt-1">
                  {form.formState.errors.cpf.message}
                </p>
              )}
            </div>

            <div>
              <Label htmlFor="password">Password</Label>
              <Input
                id="password"
                type="password"
                {...form.register("password")}
                className="mt-1"
              />
              {form.formState.errors.password && (
                <p className="text-sm text-red-600 mt-1">
                  {form.formState.errors.password.message}
                </p>
              )}
            </div>

            <div>
              <Label htmlFor="confirmPassword">Confirm Password</Label>
              <Input
                id="confirmPassword"
                type="password"
                {...form.register("confirmPassword")}
                className="mt-1"
              />
              {form.formState.errors.confirmPassword && (
                <p className="text-sm text-red-600 mt-1">
                  {form.formState.errors.confirmPassword.message}
                </p>
              )}
            </div>

            <Button type="submit" className="w-full" disabled={loading}>
              {loading ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                  Creating Account...
                </>
              ) : (
                <>
                  Create Account
                  <ArrowRight className="w-4 h-4 ml-2" />
                </>
              )}
            </Button>
          </form>
        )}

        {currentStep === "kyc" && (
          <div className="space-y-6">
            <div className="text-center">
              <h3 className="text-lg font-semibold mb-2">
                Identity Verification Required
              </h3>
              <p className="text-sm text-muted-foreground">
                Please upload your identity documents to complete your account
                setup.
              </p>
            </div>

            <div className="space-y-4">
              {/* Document Front */}
              <div>
                <Label>Document Front (ID Card/Passport)</Label>
                <div className="border-2 border-dashed border-gray-300 rounded-lg p-4 text-center">
                  {kycData?.documentFront ? (
                    <div className="space-y-2">
                      <FileText className="w-8 h-8 mx-auto text-green-500" />
                      <p className="text-sm text-green-600">
                        {kycData.documentFront.name}
                      </p>
                    </div>
                  ) : (
                    <div className="space-y-2">
                      <Upload className="w-8 h-8 mx-auto text-gray-400" />
                      <p className="text-sm text-gray-500">
                        Click to upload document front
                      </p>
                    </div>
                  )}
                </div>
                <input
                  type="file"
                  accept="image/*"
                  onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (file) handleFileSelect("documentFront", file);
                  }}
                  className="hidden"
                  id="front-upload"
                />
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() =>
                    document.getElementById("front-upload")?.click()
                  }
                  className="w-full mt-2"
                >
                  <Upload className="w-4 h-4 mr-2" />
                  Upload Document Front
                </Button>
              </div>

              {/* Document Back */}
              <div>
                <Label>Document Back (ID Card/Passport)</Label>
                <div className="border-2 border-dashed border-gray-300 rounded-lg p-4 text-center">
                  {kycData?.documentBack ? (
                    <div className="space-y-2">
                      <FileText className="w-8 h-8 mx-auto text-green-500" />
                      <p className="text-sm text-green-600">
                        {kycData.documentBack.name}
                      </p>
                    </div>
                  ) : (
                    <div className="space-y-2">
                      <Upload className="w-8 h-8 mx-auto text-gray-400" />
                      <p className="text-sm text-gray-500">
                        Click to upload document back
                      </p>
                    </div>
                  )}
                </div>
                <input
                  type="file"
                  accept="image/*"
                  onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (file) handleFileSelect("documentBack", file);
                  }}
                  className="hidden"
                  id="back-upload"
                />
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() =>
                    document.getElementById("back-upload")?.click()
                  }
                  className="w-full mt-2"
                >
                  <Upload className="w-4 h-4 mr-2" />
                  Upload Document Back
                </Button>
              </div>

              {/* Selfie */}
              <div>
                <Label>Selfie with Document</Label>
                <div className="border-2 border-dashed border-gray-300 rounded-lg p-4 text-center">
                  {kycData?.documentSelfie ? (
                    <div className="space-y-2">
                      <Camera className="w-8 h-8 mx-auto text-green-500" />
                      <p className="text-sm text-green-600">
                        {kycData.documentSelfie.name}
                      </p>
                    </div>
                  ) : (
                    <div className="space-y-2">
                      <Upload className="w-8 h-8 mx-auto text-gray-400" />
                      <p className="text-sm text-gray-500">
                        Click to upload selfie with document
                      </p>
                    </div>
                  )}
                </div>
                <input
                  type="file"
                  accept="image/*"
                  onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (file) handleFileSelect("documentSelfie", file);
                  }}
                  className="hidden"
                  id="selfie-upload"
                />
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() =>
                    document.getElementById("selfie-upload")?.click()
                  }
                  className="w-full mt-2"
                >
                  <Camera className="w-4 h-4 mr-2" />
                  Upload Selfie
                </Button>
              </div>
            </div>

            <div className="flex space-x-2">
              <Button
                variant="outline"
                onClick={() => setCurrentStep("info")}
                className="flex-1"
              >
                <ArrowLeft className="w-4 h-4 mr-2" />
                Back
              </Button>
              <Button
                onClick={handleKYCSubmit}
                disabled={
                  !kycData?.documentFront ||
                  !kycData?.documentBack ||
                  !kycData?.documentSelfie ||
                  uploading
                }
                className="flex-1"
              >
                {uploading ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                    Submitting...
                  </>
                ) : (
                  <>
                    Submit KYC
                    <ArrowRight className="w-4 h-4 ml-2" />
                  </>
                )}
              </Button>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default SignupWithMandatoryKYC;

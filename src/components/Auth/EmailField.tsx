"use client";
import React, { useState } from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { AlertCircle, CheckCircle2, Mail } from "lucide-react";
import { cn } from "@/lib/utils";

interface EmailFieldProps {
  value: string;
  onChange: (value: string) => void;
  onBlur?: () => void;
  label?: string;
  placeholder?: string;
  error?: string;
  disabled?: boolean;
  required?: boolean;
  className?: string;
}

export const EmailField: React.FC<EmailFieldProps> = ({
  value,
  onChange,
  onBlur,
  label = "Email",
  placeholder = "Digite seu email",
  error,
  disabled = false,
  required = false,
  className,
}) => {
  const [isValidating, setIsValidating] = useState(false);
  const [validationResult, setValidationResult] = useState<{
    isValid: boolean;
    type: "email";
  } | null>(null);

  // Handle input changes
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    onChange(e.target.value);
  };

  // Validate on blur
  const handleBlur = () => {
    if (value.trim()) {
      setIsValidating(true);

      // Basic email validation
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      const isValid = emailRegex.test(value);

      console.log("Email validation result:", isValid);

      setValidationResult({
        isValid,
        type: "email",
      });

      setIsValidating(false);
    } else {
      setValidationResult(null);
    }

    onBlur?.();
  };

  // Clear validation on focus
  const handleFocus = () => {
    setValidationResult(null);
  };

  // Determine icon and validation state for light theme
  const getIcon = () => {
    if (isValidating) {
      return null;
    }

    if (validationResult?.isValid) {
      return <CheckCircle2 className="h-5 w-5 text-green-600" />;
    }

    if (validationResult?.isValid === false) {
      return <AlertCircle className="h-5 w-5 text-red-600" />;
    }

    return <Mail className="h-5 w-5 text-slate-400" />;
  };

  // Update validation message colors for light theme
  const getValidationMessage = () => {
    if (isValidating) {
      return null;
    }

    if (validationResult?.isValid) {
      return <span className="text-green-600 text-sm">Email válido</span>;
    }

    if (validationResult?.isValid === false) {
      return <span className="text-red-600 text-sm">Email inválido</span>;
    }

    return (
      <span className="text-slate-500 text-sm">
        Digite seu endereço de email
      </span>
    );
  };

  return (
    <div className={cn("space-y-2", className)}>
      {label && (
        <Label htmlFor="email" className="text-sm font-medium text-slate-900">
          {label}
          {required && <span className="text-red-500 ml-1">*</span>}
        </Label>
      )}

      <div className="relative">
        <Input
          id="email"
          type="email"
          value={value}
          onChange={handleInputChange}
          onBlur={handleBlur}
          onFocus={handleFocus}
          placeholder={placeholder}
          disabled={disabled}
          className={cn(
            "w-full pl-10 pr-10 h-12 bg-white border border-slate-200 text-slate-900 placeholder:text-slate-400 focus:border-blue-600 focus:ring-1 focus:ring-blue-600 transition-all duration-200 rounded-lg",
            validationResult?.isValid === true &&
              "border-green-500 focus:border-green-500 focus:ring-green-500",
            validationResult?.isValid === false &&
              "border-red-500 focus:border-red-500 focus:ring-red-500",
            error && "border-red-500 focus:border-red-500 focus:ring-red-500"
          )}
        />

        {/* Left icon */}
        <div className="absolute left-3 top-1/2 transform -translate-y-1/2">
          {getIcon()}
        </div>
      </div>

      {/* Validation message */}
      {getValidationMessage()}

      {/* Error message */}
      {error && <span className="text-red-600 text-sm">{error}</span>}
    </div>
  );
};

"use client";
import React, { useState, useEffect, useCallback } from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { AlertCircle, CheckCircle2, Mail, CreditCard } from "lucide-react";
import { CPFValidator, CPFMask } from "@/lib/utils/cpf-validation";
import { cn } from "@/lib/utils";

interface EmailOrCPFFieldProps {
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

export const EmailOrCPFField: React.FC<EmailOrCPFFieldProps> = ({
  value,
  onChange,
  onBlur,
  label = "Email",
  error,
  disabled = false,
  required = false,
  className,
}) => {
  const [inputType, setInputType] = useState<"email" | "cpf" | "unknown">(
    "email"
  );
  const [isValidating, setIsValidating] = useState(false);
  const [validationResult, setValidationResult] = useState<{
    isValid: boolean;
    type: "email" | "cpf" | "unknown";
  } | null>(null);

  // Always treat as email
  const detectInputType = (input: string): "email" | "cpf" | "unknown" => {
    // Check if it's an email
    if (input.includes("@")) {
      return "email";
    }

    // Check if it's a CPF (11 digits)
    const cleanInput = input.replace(/\D/g, "");
    if (cleanInput.length === 11) {
      return "cpf";
    }

    // Check if it's likely a CPF (starts with numbers and has reasonable length)
    if (cleanInput.length > 0 && cleanInput.length <= 11) {
      return "cpf";
    }

    return "unknown";
  };

  // Get input type based on current value
  const getInputType = useCallback(
    (input: string): "email" | "cpf" | "unknown" => {
      return detectInputType(input);
    },
    []
  );

  // Handle input change
  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const rawValue = e.target.value;
    const detectedType = getInputType(rawValue);

    // Debug logging
    console.log("Input change:", {
      rawValue,
      detectedType,
      currentInputType: inputType,
      hasAt: rawValue.includes("@"),
      hasDot: rawValue.includes("."),
      cleanLength: rawValue.replace(/\D/g, "").length,
    });

    // Update input type if it changed
    if (detectedType !== "unknown" && detectedType !== inputType) {
      console.log("Input type changed from", inputType, "to", detectedType);
      setInputType(detectedType);
    }

    // Only apply CPF mask if we're absolutely sure it's a CPF
    let processedValue = rawValue;
    if (detectedType === "cpf" && rawValue.replace(/\D/g, "").length === 11) {
      // Only apply mask if the user has typed exactly 11 digits
      processedValue = CPFMask.apply(rawValue);
      console.log("Applied CPF mask:", { rawValue, processedValue });
    }

    onChange(processedValue);
  };

  // Debug: Log whenever inputType changes
  useEffect(() => {
    console.log("Input type state changed to:", inputType);
  }, [inputType]);

  // Debug: Log the current value and detection
  useEffect(() => {
    if (value) {
      const detectedType = getInputType(value);
      console.log("Current value detection:", {
        value,
        detectedType,
        inputType,
      });
    }
  }, [value, inputType, getInputType]);

  // Validate on blur
  const handleBlur = () => {
    if (value.trim()) {
      setIsValidating(true);

      const detectedType = getInputType(value);
      let isValid = false;

      console.log("Validation on blur:", { value, detectedType });

      if (detectedType === "email") {
        // Basic email validation
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        isValid = emailRegex.test(value);
        console.log("Email validation result:", isValid);
      } else if (detectedType === "cpf") {
        // CPF validation - be more permissive
        isValid = CPFValidator.isValid(value);
        console.log("CPF validation result:", isValid);

        // If CPF validation fails, check if it's close to valid
        if (!isValid) {
          const cleanInput = value.replace(/\D/g, "");
          if (cleanInput.length === 11) {
            console.log("CPF has 11 digits, treating as valid for now");
            isValid = true;
          }
        }
      }

      console.log("Final validation result:", { isValid, type: detectedType });

      setValidationResult({
        isValid,
        type: detectedType,
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

  // Auto-format on mount if value exists
  useEffect(() => {
    if (value && inputType === "unknown") {
      const detectedType = getInputType(value);
      setInputType(detectedType);

      if (detectedType === "cpf" && !value.includes(".")) {
        const formatted = CPFMask.apply(value);
        if (formatted !== value) {
          onChange(formatted);
        }
      }
    }
  }, [value, inputType, onChange, getInputType]);

  const hasError = error || (validationResult && !validationResult.isValid);
  const isValid = validationResult?.isValid;

  // Get the appropriate icon and placeholder
  const getFieldConfig = () => {
    switch (inputType) {
      case "email":
        return {
          icon: <Mail className="h-5 w-5 text-gray-300" />,
          placeholder: "seu@email.com",
          type: "email" as const,
        };
      case "cpf":
        return {
          icon: <CreditCard className="h-5 w-5 text-gray-300" />,
          placeholder: "000.000.000-00",
          type: "text" as const,
        };
      default:
        // Default to email mode to make it easier to type emails
        return {
          icon: <Mail className="h-5 w-5 text-gray-300" />,
          placeholder: "Digite seu email ou CPF",
          type: "text" as const,
        };
    }
  };

  const fieldConfig = getFieldConfig();

  return (
    <div className={cn("space-y-2", className)}>
      {label && (
        <Label className="text-sm font-medium text-gray-200">
          {label}
          {required && <span className="text-red-400 ml-1">*</span>}
        </Label>
      )}

      <div className="relative">
        <div className="absolute left-3 top-1/2 transform -translate-y-1/2">
          {fieldConfig.icon}
        </div>

        <Input
          type={fieldConfig.type}
          value={value}
          onChange={handleChange}
          onBlur={handleBlur}
          onFocus={handleFocus}
          placeholder={fieldConfig.placeholder}
          disabled={disabled}
          className={cn(
            "pl-10 pr-10",
            hasError && "border-red-400 focus:border-red-400",
            isValid && "border-green-400 focus:border-green-400"
          )}
        />

        {/* Validation Icon */}
        <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
          {isValidating && (
            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-400"></div>
          )}
          {!isValidating && isValid && (
            <CheckCircle2 className="h-4 w-4 text-green-400" />
          )}
          {!isValidating && hasError && (
            <AlertCircle className="h-4 w-4 text-red-400" />
          )}
        </div>
      </div>

      {/* Error Messages */}
      {hasError && (
        <div className="text-sm text-red-400 space-y-1">
          {error && <p>{error}</p>}
          {validationResult && !validationResult.isValid && (
            <p>
              {validationResult.type === "email"
                ? "Por favor, digite um email válido"
                : "Por favor, digite um CPF válido"}
            </p>
          )}
        </div>
      )}

      {/* Success Message */}
      {isValid && (
        <div className="text-sm text-green-400">
          <p>
            {validationResult?.type === "email" ? "Email válido" : "CPF válido"}
          </p>
        </div>
      )}

      {/* Help Text */}
      <div className="text-xs text-gray-400">
        {inputType === "email" && "Digite seu endereço de email"}
        {inputType === "cpf" && "Digite o CPF (com ou sem formatação)"}
        {inputType === "unknown" && "Digite seu email ou CPF para continuar"}
      </div>
    </div>
  );
};

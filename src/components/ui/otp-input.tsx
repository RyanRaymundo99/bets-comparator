"use client";

import React from "react";
import OTPInput from "react-otp-input";
import { cn } from "@/lib/utils";

interface OTPInputComponentProps {
  value: string;
  onChange: (value: string) => void;
  numInputs?: number;
  placeholder?: string;
  isDisabled?: boolean;
  hasErrored?: boolean;
  className?: string;
}

export function OTPInputComponent({
  value,
  onChange,
  numInputs = 6,
  placeholder = "",
  isDisabled = false,
  hasErrored = false,
  className,
}: OTPInputComponentProps) {
  return (
    <div className={cn("flex justify-center", className)}>
      <OTPInput
        value={value}
        onChange={onChange}
        numInputs={numInputs}
        renderSeparator={<span className="mx-1"></span>}
        renderInput={(props) => (
          <input
            {...props}
            disabled={isDisabled}
            placeholder={placeholder}
            className={cn(
              "w-12 h-12 text-center text-lg font-semibold",
              "border-2 rounded-md",
              "focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent",
              "transition-all duration-200",
              hasErrored
                ? "border-red-500 bg-red-50"
                : "border-gray-300 hover:border-gray-400",
              isDisabled && "bg-gray-100 cursor-not-allowed opacity-50",
              "dark:bg-gray-800 dark:border-gray-600 dark:text-white"
            )}
          />
        )}
        inputType="text"
        shouldAutoFocus
      />
    </div>
  );
}

export default OTPInputComponent;


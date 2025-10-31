"use client";

import { Eye, EyeOff, Check, X } from "lucide-react";
import { useState } from "react";
import { Control, FieldValues, Path } from "react-hook-form";
import {
  FormField,
  FormItem,
  FormLabel,
  FormControl,
  FormMessage,
  FormDescription,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";

type PasswordFieldProps<T extends FieldValues = FieldValues> = {
  control: Control<T>;
  name: Path<T>;
  label: string;
  placeholder: string;
  description?: string;
};

export function PasswordField<T extends FieldValues = FieldValues>({
  control,
  name,
  label,
  placeholder,
  description,
}: PasswordFieldProps<T>) {
  const [showPassword, setShowPassword] = useState(false);

  const passwordRequirements = [
    {
      test: (pwd: string) => pwd.length >= 6 && pwd.length <= 20,
      message: "Entre 6 e 20 caracteres",
    },
    {
      test: (pwd: string) => /[a-z]/.test(pwd),
      message: "Pelo menos uma letra minúscula",
    },
    {
      test: (pwd: string) => /[A-Z]/.test(pwd),
      message: "Pelo menos uma letra maiúscula",
    },
    {
      test: (pwd: string) => /[0-9]/.test(pwd),
      message: "Pelo menos um número",
    },
    {
      test: (pwd: string) => /[!@#$%^&*(),.?":{}|<>]/.test(pwd),
      message: "Pelo menos um caractere especial",
    },
  ];

  return (
    <FormField
      control={control}
      name={name}
      render={({ field }) => {
        const password = field.value || "";
        return (
          <FormItem>
            <FormLabel className="text-gray-200 font-medium mb-2 block">
              {label}
            </FormLabel>
            <FormControl>
              <div className="relative">
                <Input
                  {...field}
                  type={showPassword ? "text" : "password"}
                  placeholder={placeholder}
                  className="pl-4 pr-12 bg-black/60 border-gray-800/50 text-white placeholder-gray-400 backdrop-blur-[15px] relative overflow-hidden focus:outline-none focus:ring-0 focus:border-gray-800/50"
                  style={{
                    boxShadow:
                      "inset 0 2px 4px 0 rgba(0, 0, 0, 0.5), inset 0 1px 0 0 rgba(255, 255, 255, 0.05)",
                    backgroundColor: "rgba(0, 0, 0, 0.6)",
                  }}
                />
                {/* Glass effect for input */}
                <div className="absolute inset-0 bg-gradient-to-br from-black/40 via-transparent to-gray-900/20 opacity-70 pointer-events-none rounded-md"></div>
                <div className="absolute top-0 left-0 w-full h-px bg-gradient-to-r from-transparent via-gray-700/30 to-transparent"></div>
                <div className="absolute top-0 left-0 w-px h-full bg-gradient-to-b from-transparent via-gray-700/20 to-transparent"></div>

                <button
                  type="button"
                  tabIndex={-1}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-300 hover:text-white transition-colors z-10 bg-black/50 hover:bg-gray-900/60 border border-gray-800/50 hover:border-gray-700/50 rounded-md p-1 backdrop-blur-[10px]"
                  onClick={() => setShowPassword((prev) => !prev)}
                  style={{
                    boxShadow: "inset 0 1px 0 0 rgba(255, 255, 255, 0.05)",
                  }}
                >
                  {/* Glass effect for button */}
                  <div className="absolute inset-0 bg-gradient-to-br from-black/30 via-transparent to-gray-900/20 opacity-60 pointer-events-none rounded-md"></div>
                  <div className="absolute top-0 left-0 w-full h-px bg-gradient-to-r from-transparent via-gray-700/25 to-transparent"></div>

                  {showPassword ? (
                    <EyeOff className="h-4 w-4 relative z-10" />
                  ) : (
                    <Eye className="h-4 w-4 relative z-10" />
                  )}
                </button>
              </div>
            </FormControl>
            {description && (
              <FormDescription className="text-gray-400 text-sm mt-1">
                {description}
              </FormDescription>
            )}
            {password && (
              <div className="mt-2 space-y-1">
                {passwordRequirements.map((requirement, index) => {
                  const isValid = requirement.test(password);
                  return (
                    <div
                      key={index}
                      className="flex items-center gap-2 text-xs"
                    >
                      {isValid ? (
                        <Check className="h-3 w-3 text-green-500" />
                      ) : (
                        <X className="h-3 w-3 text-red-500" />
                      )}
                      <span
                        className={
                          isValid ? "text-green-400" : "text-gray-400"
                        }
                      >
                        {requirement.message}
                      </span>
                    </div>
                  );
                })}
              </div>
            )}
            <FormMessage className="text-red-300" />
          </FormItem>
        );
      }}
    />
  );
}

type ConfirmPasswordFieldProps<T extends FieldValues = FieldValues> = {
  control: Control<T>;
  name: Path<T>;
  passwordValue: string;
  label: string;
  placeholder: string;
};

export function ConfirmPasswordField<T extends FieldValues = FieldValues>({
  control,
  name,
  passwordValue,
  label,
  placeholder,
}: ConfirmPasswordFieldProps<T>) {
  const [showPassword, setShowPassword] = useState(false);

  return (
    <FormField
      control={control}
      name={name}
      render={({ field }) => {
        const passwordsMatch = field.value === passwordValue && field.value !== "";
        return (
          <FormItem>
            <FormLabel className="text-gray-200 font-medium mb-2 block">
              {label}
            </FormLabel>
            <FormControl>
              <div className="relative">
                <Input
                  {...field}
                  type={showPassword ? "text" : "password"}
                  placeholder={placeholder}
                  className="pl-4 pr-12 bg-black/60 border-gray-800/50 text-white placeholder-gray-400 backdrop-blur-[15px] relative overflow-hidden focus:outline-none focus:ring-0 focus:border-gray-800/50"
                  style={{
                    boxShadow:
                      "inset 0 2px 4px 0 rgba(0, 0, 0, 0.5), inset 0 1px 0 0 rgba(255, 255, 255, 0.05)",
                    backgroundColor: "rgba(0, 0, 0, 0.6)",
                  }}
                />
                {/* Glass effect for input */}
                <div className="absolute inset-0 bg-gradient-to-br from-black/40 via-transparent to-gray-900/20 opacity-70 pointer-events-none rounded-md"></div>
                <div className="absolute top-0 left-0 w-full h-px bg-gradient-to-r from-transparent via-gray-700/30 to-transparent"></div>
                <div className="absolute top-0 left-0 w-px h-full bg-gradient-to-b from-transparent via-gray-700/20 to-transparent"></div>

                <button
                  type="button"
                  tabIndex={-1}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-300 hover:text-white transition-colors z-10 bg-black/50 hover:bg-gray-900/60 border border-gray-800/50 hover:border-gray-700/50 rounded-md p-1 backdrop-blur-[10px]"
                  onClick={() => setShowPassword((prev) => !prev)}
                  style={{
                    boxShadow: "inset 0 1px 0 0 rgba(255, 255, 255, 0.05)",
                  }}
                >
                  {/* Glass effect for button */}
                  <div className="absolute inset-0 bg-gradient-to-br from-black/30 via-transparent to-gray-900/20 opacity-60 pointer-events-none rounded-md"></div>
                  <div className="absolute top-0 left-0 w-full h-px bg-gradient-to-r from-transparent via-gray-700/25 to-transparent"></div>

                  {showPassword ? (
                    <EyeOff className="h-4 w-4 relative z-10" />
                  ) : (
                    <Eye className="h-4 w-4 relative z-10" />
                  )}
                </button>
              </div>
            </FormControl>
            {field.value && (
              <div className="mt-2 flex items-center gap-2 text-xs">
                {passwordsMatch ? (
                  <>
                    <Check className="h-3 w-3 text-green-500" />
                    <span className="text-green-400">As senhas coincidem</span>
                  </>
                ) : (
                  <>
                    <X className="h-3 w-3 text-red-500" />
                    <span className="text-red-400">As senhas não coincidem</span>
                  </>
                )}
              </div>
            )}
            <FormMessage className="text-red-300" />
          </FormItem>
        );
      }}
    />
  );
}

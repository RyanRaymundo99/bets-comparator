"use client";
import { Eye, EyeOff } from "lucide-react";
import {
  FormField,
  FormItem,
  FormLabel,
  FormControl,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { useState } from "react";
import { Control, FieldValues, Path } from "react-hook-form";

// Generic type for InputFieldProps
// Default to FieldValues if not specified

type InputFieldProps<T extends FieldValues = FieldValues> = {
  control: Control<T>;
  name: Path<T>;
  label: string;
  placeholder: string;
  type: "email" | "password" | "text";
  icon?: React.ReactNode;
  showPasswordToggle?: boolean;
  labelPosition?: "top" | "bottom";
};

export function InputField<T extends FieldValues = FieldValues>({
  control,
  name,
  label,
  placeholder,
  type,
  icon,
  showPasswordToggle = false,
  labelPosition = "bottom",
}: InputFieldProps<T>) {
  const [showPassword, setShowPassword] = useState(false);
  const [isTyping, setIsTyping] = useState(false);

  return (
    <FormField
      control={control}
      name={name}
      render={({ field }) => (
        <FormItem>
          {labelPosition === "top" && (
            <FormLabel className="text-slate-900 font-medium mb-2 block">
              {label}
            </FormLabel>
          )}
          <FormControl>
            <div className="relative">
              {icon && (
                <span className="absolute left-3 top-1/2 -translate-y-1/2 z-10">
                  <div className="text-slate-400 transition-colors duration-200">
                    {icon}
                  </div>
                </span>
              )}
              <Input
                {...field}
                type={
                  type === "password"
                    ? showPassword
                      ? "text"
                      : "password"
                    : type
                }
                placeholder={placeholder}
                className={`pl-10 pr-10 bg-white border border-slate-200 text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-1 focus:ring-blue-600 focus:border-blue-600 rounded-lg transition-all duration-200 ${
                  showPasswordToggle ? "pr-16" : ""
                }`}
                onFocus={() => setIsTyping(true)}
                onBlur={() => setIsTyping(false)}
                onChange={(e) => {
                  field.onChange(e);
                  setIsTyping(e.target.value.length > 0);
                }}
              />

              {showPasswordToggle && type === "password" && (
                <button
                  type="button"
                  tabIndex={-1}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 transition-colors z-10 rounded-md p-1"
                  onClick={() => setShowPassword((prev) => !prev)}
                >
                  {showPassword ? (
                    <EyeOff className="h-4 w-4" />
                  ) : (
                    <Eye className="h-4 w-4" />
                  )}
                </button>
              )}
            </div>
          </FormControl>
          {labelPosition === "bottom" && (
            <FormLabel className="text-slate-900 font-medium mt-2 block">
              {label}
            </FormLabel>
          )}
          <FormMessage className="text-red-600" />
        </FormItem>
      )}
    />
  );
}

// CheckboxField for boolean fields

type CheckboxFieldProps<T extends FieldValues = FieldValues> = {
  control: Control<T>;
  name: Path<T>;
  label: string;
};

export function CheckboxField<T extends FieldValues = FieldValues>({
  control,
  name,
  label,
}: CheckboxFieldProps<T>) {
  return (
    <FormField
      control={control}
      name={name}
      render={({ field }) => (
        <FormItem className="flex flex-row items-center space-x-3 space-y-0">
          <FormControl>
            <Checkbox
              checked={field.value}
              onCheckedChange={field.onChange}
              className="border-slate-300 data-[state=checked]:bg-blue-600 data-[state=checked]:border-blue-600 bg-white"
            />
          </FormControl>
          <FormLabel className="font-normal text-slate-900">{label}</FormLabel>
        </FormItem>
      )}
    />
  );
}

"use client";

import React from "react";
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";
import { useRouter } from "next/navigation";

interface BackToDashboardButtonProps {
  className?: string;
}

export default function BackToDashboardButton({ 
  className = "" 
}: BackToDashboardButtonProps) {
  const router = useRouter();

  const handleBackToDashboard = () => {
    router.push("/admin");
  };

  return (
    <Button
      onClick={handleBackToDashboard}
      variant="outline"
      className={`border-gray-700 text-gray-300 hover:bg-gray-800 hover:text-white hover:border-gray-600 transition-all duration-200 ${className}`}
    >
      <ArrowLeft className="w-4 h-4 mr-2" />
      Voltar para o Dashboard
    </Button>
  );
}

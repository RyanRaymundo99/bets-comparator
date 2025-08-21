"use client";
import React from "react";
import { CheckCircle2, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";

interface SuccessPopupProps {
  isOpen: boolean;
  onClose: () => void;
  title?: string;
  message?: string;
  showApprovalStatus?: boolean;
}

export const SuccessPopup: React.FC<SuccessPopupProps> = ({
  isOpen,
  onClose,
  title = "Conta criada com sucesso!",
  message = "Sua conta foi criada e está aguardando aprovação.",
  showApprovalStatus = true,
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <Card className="w-full max-w-md bg-background border border-border shadow-lg">
        <CardContent className="p-6">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center space-x-3">
              <div className="flex-shrink-0">
                <CheckCircle2 className="h-8 w-8 text-green-500" />
              </div>
              <div>
                <h3 className="text-lg font-semibold text-foreground">
                  {title}
                </h3>
              </div>
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={onClose}
              className="h-8 w-8 p-0"
            >
              <X className="h-4 w-4" />
            </Button>
          </div>

          <div className="space-y-4">
            <p className="text-sm text-muted-foreground leading-relaxed">
              {message}
            </p>

            {showApprovalStatus && (
              <div className="bg-yellow-500/10 border border-yellow-500/20 rounded-lg p-4">
                <div className="flex items-center space-x-2">
                  <div className="w-2 h-2 bg-yellow-500 rounded-full animate-pulse"></div>
                  <span className="text-sm font-medium text-yellow-600">
                    Status: Aguardando Aprovação
                  </span>
                </div>
                <p className="text-xs text-yellow-600/80 mt-1">
                  Nossa equipe irá revisar sua conta em breve.
                </p>
              </div>
            )}

            <div className="flex flex-col space-y-2">
              <Button
                onClick={onClose}
                className="w-full bg-primary hover:bg-primary/90"
              >
                Entendi
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

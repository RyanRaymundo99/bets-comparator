"use client";

import React from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Clock, CheckCircle, XCircle, AlertCircle, X } from "lucide-react";

interface KYCBannerProps {
  status: "PENDING" | "APPROVED" | "REJECTED";
  onDismiss?: () => void;
  showDismiss?: boolean;
}

export const KYCBanner: React.FC<KYCBannerProps> = ({
  status,
  onDismiss,
  showDismiss = true,
}) => {
  const getStatusConfig = () => {
    switch (status) {
      case "PENDING":
        return {
          icon: <Clock className="w-5 h-5" />,
          title: "Account Under Review",
          message:
            "Your account is being processed. You will be notified soon as your documentation has been approved or disapproved.",
          badge: (
            <Badge
              variant="secondary"
              className="bg-yellow-100 text-yellow-800 border-yellow-200"
            >
              <Clock className="w-3 h-3 mr-1" />
              Under Review
            </Badge>
          ),
          bgColor: "bg-yellow-50 border-yellow-200",
          textColor: "text-yellow-800",
        };
      case "APPROVED":
        return {
          icon: <CheckCircle className="w-5 h-5" />,
          title: "Account Approved",
          message:
            "Congratulations! Your account has been approved and you can now access all features.",
          badge: (
            <Badge
              variant="secondary"
              className="bg-green-100 text-green-800 border-green-200"
            >
              <CheckCircle className="w-3 h-3 mr-1" />
              Approved
            </Badge>
          ),
          bgColor: "bg-green-50 border-green-200",
          textColor: "text-green-800",
        };
      case "REJECTED":
        return {
          icon: <XCircle className="w-5 h-5" />,
          title: "Account Rejected",
          message:
            "Your account verification was rejected. Please contact support for more information.",
          badge: (
            <Badge
              variant="secondary"
              className="bg-red-100 text-red-800 border-red-200"
            >
              <XCircle className="w-3 h-3 mr-1" />
              Rejected
            </Badge>
          ),
          bgColor: "bg-red-50 border-red-200",
          textColor: "text-red-800",
        };
      default:
        return {
          icon: <AlertCircle className="w-5 h-5" />,
          title: "Unknown Status",
          message: "Your account status is unknown. Please contact support.",
          badge: (
            <Badge
              variant="secondary"
              className="bg-gray-100 text-gray-800 border-gray-200"
            >
              <AlertCircle className="w-3 h-3 mr-1" />
              Unknown
            </Badge>
          ),
          bgColor: "bg-gray-50 border-gray-200",
          textColor: "text-gray-800",
        };
    }
  };

  const config = getStatusConfig();

  return (
    <Card className={`mb-6 ${config.bgColor} border-2`}>
      <CardContent className="p-4">
        <div className="flex items-start justify-between">
          <div className="flex items-start space-x-3">
            <div className={`${config.textColor} mt-1`}>{config.icon}</div>
            <div className="flex-1">
              <div className="flex items-center space-x-2 mb-2">
                <h3 className={`font-semibold ${config.textColor}`}>
                  {config.title}
                </h3>
                {config.badge}
              </div>
              <p className={`text-sm ${config.textColor} opacity-90`}>
                {config.message}
              </p>
            </div>
          </div>
          {showDismiss && onDismiss && (
            <Button
              variant="ghost"
              size="sm"
              onClick={onDismiss}
              className={`${config.textColor} hover:bg-white/50`}
            >
              <X className="w-4 h-4" />
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  );
};

export default KYCBanner;

import React from "react";
import Image from "next/image";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";
import Link from "next/link";

interface AuthLayoutProps {
  children: React.ReactNode;
  title: string;
  description: React.ReactNode;
  showLogo?: boolean;
  showBackButton?: boolean;
  onBack?: () => void;
}

const AuthLayout = ({
  children,
  title,
  description,
  showLogo = false,
  showBackButton = false,
  onBack,
}: AuthLayoutProps) => {
  return (
    <div className="min-h-screen flex items-center justify-center bg-white relative overflow-hidden">
      <div className="relative z-10 w-full max-w-md p-6">
        <Card className="border border-slate-200 bg-white shadow-sm rounded-xl relative overflow-hidden">
          <CardHeader className="space-y-1 pb-6 relative z-10">
            {showLogo && (
              <div className="text-center">
                <Link href="/" className="inline-block">
                  <div className="h-24 ml-8 overflow-hidden flex items-center">
                    <Image
                      src="/shortname-logo.svg"
                      alt="Bets Comparator"
                      width={200}
                      height={200}
                    />
                  </div>
                </Link>
              </div>
            )}
            {showBackButton && onBack && (
              <div className="flex items-center justify-between">
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={onBack}
                  className="mr-2 text-slate-600 hover:text-slate-900 hover:bg-slate-50"
                >
                  <ArrowLeft className="h-4 w-4" />
                </Button>
                <CardTitle className="text-2xl font-bold flex-1 text-center text-slate-900">
                  {title}
                </CardTitle>
                <div className="w-10" /> {/* Spacer for centering */}
              </div>
            )}
            {!showBackButton && title && (
              <CardTitle className="text-2xl font-bold text-center text-slate-900">
                {title}
              </CardTitle>
            )}
            {description && (
              <CardDescription className="text-center text-slate-600">
                {description}
              </CardDescription>
            )}
          </CardHeader>
          <CardContent className="pt-0 relative z-10">{children}</CardContent>
        </Card>
      </div>
    </div>
  );
};

export { AuthLayout };

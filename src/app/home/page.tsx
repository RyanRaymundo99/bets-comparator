"use client";

import React, { useState, useRef, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Building2,
  Star,
  TrendingUp,
  TrendingDown,
  Minus,
  ArrowRight,
  ExternalLink,
  ChevronRight,
  ChevronDown,
  LogOut,
  BarChart3,
  CheckCircle2,
  XCircle,
  Globe,
  MapPin,
  FileText,
  Hash,
} from "lucide-react";
import Image from "next/image";
import { useFetch } from "@/hooks/use-fetch";
import { useToast } from "@/hooks/use-toast";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import Link from "next/link";
import {
  PARAMETER_CATEGORIES,
  PARAMETER_DEFINITIONS,
  getParametersByCategory,
} from "@/lib/parameter-definitions";
// import ChatInterface from "@/components/ui/chat-interface";
// import AIInsights from "@/components/ui/ai-insights";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

interface HomeData {
  bet: {
    id: string;
    name: string;
    company?: string | null;
    url?: string | null;
    domain?: string | null;
    cnpj?: string | null;
    status?: string | null;
    scope?: string | null;
    platformType?: string | null;
    region?: string | null;
    license?: string | null;
    betId?: string | null;
    logo?: string | null;
    coverImage?: string | null;
  };
  rating: {
    overall: number;
    score: number;
    stars: number;
  };
  ranking: {
    position: number;
    total: number;
    top10: Array<{
      id: string;
      name: string;
      score: number;
      position: number;
      logo?: string | null;
      betId?: string | null;
    }>;
    aboveCurrent: Array<{
      id: string;
      name: string;
      score: number;
      position: number;
      logo?: string | null;
      betId?: string | null;
    }>;
    belowCurrent: Array<{
      id: string;
      name: string;
      score: number;
      position: number;
      logo?: string | null;
      betId?: string | null;
    }>;
    allRanking?: Array<{
      id: string;
      name: string;
      score: number;
      position: number;
      logo?: string | null;
      betId?: string | null;
    }>;
  };
  parameters: Array<{
    id: string;
    name: string;
    category?: string | null;
    value: string;
    unit?: string | null;
    trend: "up" | "down" | "stable";
    type?: string | null;
    valueRating?: number | null;
  }>;
}

interface ParameterDetailModalProps {
  parameter: HomeData["parameters"][0] | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

function ParameterDetailModal({
  parameter,
  open,
  onOpenChange,
}: ParameterDetailModalProps) {
  if (!parameter) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto bg-white border border-slate-200 rounded-2xl">
        <DialogHeader>
          <DialogTitle className="text-2xl font-bold text-slate-900">
            {parameter.name}
          </DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <div className="p-4 bg-slate-50 rounded-xl border border-slate-200">
            <div className="text-sm text-slate-600 mb-2 font-medium">
              Valor Atual
            </div>
            <div className="text-2xl font-bold text-slate-900">
              {parameter.type === 'rating' && parameter.valueRating !== null && parameter.valueRating !== undefined
                ? `${Number(parameter.valueRating).toFixed(1)}/5`
                : `${parameter.value} ${parameter.unit || ""}`}
            </div>
          </div>
          {parameter.category && (
            <div className="p-4 bg-white rounded-xl border border-slate-200">
              <div className="text-sm text-slate-600 mb-1 font-medium">
                Categoria
              </div>
              <div className="text-base font-semibold text-slate-900">
                {parameter.category}
              </div>
            </div>
          )}
          {parameter.type && (
            <div className="p-4 bg-white rounded-xl border border-slate-200">
              <div className="text-sm text-slate-600 mb-1 font-medium">
                Tipo
              </div>
              <div className="text-base font-semibold text-slate-900 capitalize">
                {parameter.type}
              </div>
            </div>
          )}
          <div className="p-4 bg-blue-50 rounded-xl border border-blue-200">
            <div className="text-sm text-blue-700 italic">
              Histórico e gráficos detalhados serão implementados em breve.
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

export default function HomePage() {
  const router = useRouter();
  const { toast } = useToast();
  const [selectedParameter, setSelectedParameter] = useState<
    HomeData["parameters"][0] | null
  >(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isRankingExpanded, setIsRankingExpanded] = useState(false);
  const [dominantColor, setDominantColor] = useState<string>("rgb(0, 0, 0)"); // Default to black, will be detected from iframe
  const [isDarkTheme, setIsDarkTheme] = useState<boolean>(true); // Track if we need dark theme
  const iframeRef = useRef<HTMLIFrameElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  const { data, loading, error } = useFetch<HomeData>("/api/user/home", {
    immediate: true,
    showToast: true,
    errorMessage: "Falha ao carregar dados da home",
    onError: () => {
      // If user doesn't have a linked bet, redirect to setup
      router.push("/setup");
    },
  });

  const handleParameterClick = (parameter: HomeData["parameters"][0]) => {
    setSelectedParameter(parameter);
    setIsModalOpen(true);
  };

  const handleCompare = () => {
    router.push("/dashboard");
  };

  const renderStars = (rating: number) => {
    // Cap rating at 5
    const clampedRating = Math.max(0, Math.min(Number(rating), 5));
    const fullStars = Math.floor(clampedRating);
    const partialFill = clampedRating - fullStars; // Decimal exato (ex: 0.1, 0.2, 0.5)
    const emptyStars = 5 - fullStars - (partialFill > 0 ? 1 : 0);

    return (
      <div className="flex items-center gap-1">
        {/* Estrelas completas */}
        {Array.from({ length: fullStars }).map((_, i) => (
          <Star
            key={`full-${i}`}
            className="w-5 h-5 text-yellow-500 fill-yellow-500"
          />
        ))}
        {/* Estrela parcial com preenchimento proporcional */}
        {partialFill > 0 && (
          <div className="relative w-5 h-5">
            <Star className="w-5 h-5 text-gray-300 fill-gray-300" />
            <div
              className="absolute inset-0 overflow-hidden"
              style={{ width: `${partialFill * 100}%` }}
            >
              <Star className="w-5 h-5 text-yellow-500 fill-yellow-500" />
            </div>
          </div>
        )}
        {/* Estrelas vazias */}
        {Array.from({ length: emptyStars }).map((_, i) => (
          <Star
            key={`empty-${i}`}
            className="w-5 h-5 text-gray-300 fill-gray-300"
          />
        ))}
      </div>
    );
  };

  const getTrendIcon = (trend: "up" | "down" | "stable") => {
    switch (trend) {
      case "up":
        return <TrendingUp className="w-5 h-5 text-green-600" />;
      case "down":
        return <TrendingDown className="w-5 h-5 text-red-600" />;
      default:
        return <Minus className="w-5 h-5 text-gray-400" />;
    }
  };

  // Helper to convert RGB to RGBA
  const rgbToRgba = (rgb: string, alpha: number): string => {
    const match = rgb.match(/\d+/g);
    if (match && match.length >= 3) {
      return `rgba(${match[0]}, ${match[1]}, ${match[2]}, ${alpha})`;
    }
    return rgb;
  };

  // Extract dominant color using server-side API (works for cross-origin iframes)
  useEffect(() => {
    if (!data?.bet?.url) return;

    const maxRetries = 3;

    const extractColor = async (attempt: number = 0) => {
      try {
        // First, try client-side detection for same-origin iframes (wait a bit for iframe to load)
        if (iframeRef.current && attempt > 0) {
          try {
            const iframe = iframeRef.current;
            // Wait a bit for iframe to fully load
            await new Promise((resolve) => setTimeout(resolve, 1000));

            const iframeDoc =
              iframe.contentDocument || iframe.contentWindow?.document;
            if (iframeDoc && iframeDoc.body) {
              const body = iframeDoc.body;
              const computedStyle = window.getComputedStyle(body);
              const bgColor = computedStyle.backgroundColor;

              if (
                bgColor &&
                bgColor !== "rgba(0, 0, 0, 0)" &&
                bgColor !== "transparent"
              ) {
                const rgbMatch = bgColor.match(/\d+/g);
                if (rgbMatch && rgbMatch.length >= 3) {
                  const r = parseInt(rgbMatch[0]);
                  const g = parseInt(rgbMatch[1]);
                  const b = parseInt(rgbMatch[2]);
                  const brightness = (r * 299 + g * 587 + b * 114) / 1000;

                  let finalColor: string;
                  if (brightness > 200) {
                    finalColor = `rgb(255, 255, 255)`;
                    setIsDarkTheme(false);
                  } else if (brightness > 128) {
                    const lightR = Math.min(255, Math.floor(r * 1.1));
                    const lightG = Math.min(255, Math.floor(g * 1.1));
                    const lightB = Math.min(255, Math.floor(b * 1.1));
                    finalColor = `rgb(${lightR}, ${lightG}, ${lightB})`;
                    setIsDarkTheme(false);
                  } else if (brightness < 50) {
                    finalColor = `rgb(0, 0, 0)`;
                    setIsDarkTheme(true);
                  } else {
                    const darkR = Math.max(0, Math.floor(r * 0.9));
                    const darkG = Math.max(0, Math.floor(g * 0.9));
                    const darkB = Math.max(0, Math.floor(b * 0.9));
                    finalColor = `rgb(${darkR}, ${darkG}, ${darkB})`;
                    setIsDarkTheme(true);
                  }
                  setDominantColor(finalColor);
                  return;
                }
              }
            }
          } catch (e) {
            // Same-origin detection failed, continue to server-side
          }
        }

        // Use server-side API for cross-origin iframes
        if (!data.bet.url) return;
        const response = await fetch(
          `/api/analyze-website-color?url=${encodeURIComponent(data.bet.url)}`
        );
        if (response.ok) {
          const result = await response.json();
          if (result.success && result.data) {
            console.log("Color detected:", result.data);
            setDominantColor(result.data.color);
            setIsDarkTheme(result.data.isDark);
            return;
          }
        } else {
          console.debug("API response not OK:", response.status);
        }
      } catch (error) {
        console.debug("Color extraction failed:", error);
      }

      // Retry if we haven't exceeded max retries
      if (attempt < maxRetries) {
        setTimeout(() => extractColor(attempt + 1), 2000 * (attempt + 1));
        return;
      }

      // Final fallback: Default to black (user indicated iframe is black)
      console.debug("Color extraction: Using default black");
      setDominantColor(`rgb(0, 0, 0)`);
      setIsDarkTheme(true);
    };

    // Extract color when URL is available - try immediately and also after iframe loads
    extractColor(0);

    // Also try after iframe loads
    if (iframeRef.current) {
      const iframe = iframeRef.current;
      const handleLoad = () => {
        setTimeout(() => extractColor(1), 1000);
      };
      iframe.addEventListener("load", handleLoad);

      return () => {
        iframe.removeEventListener("load", handleLoad);
      };
    }
  }, [data?.bet?.url]);

  if (loading) {
    return (
      <div className="min-h-screen bg-white text-slate-800 flex items-center justify-center">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-16 w-16 border-4 border-blue-100 border-t-blue-600 mb-6"></div>
          <p className="text-slate-700 font-semibold text-lg">Carregando...</p>
        </div>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="min-h-screen bg-white text-slate-800 flex items-center justify-center">
        <Card className="max-w-md">
          <CardContent className="p-8 text-center">
            <Building2 className="w-16 h-16 text-slate-400 mx-auto mb-4" />
            <h3 className="text-xl font-bold text-slate-900 mb-2">
              Erro ao carregar dados
            </h3>
            <p className="text-slate-600 mb-6">
              Não foi possível carregar os dados da sua casa de apostas.
            </p>
            <Button
              onClick={() => router.push("/setup")}
              className="bg-blue-600 hover:bg-blue-700 text-white"
            >
              Configurar Casa
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  const { bet, rating, ranking, parameters } = data;

  const handleLogout = () => {
    document.cookie =
      "better-auth.session=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;";
    localStorage.removeItem("auth-user");
    localStorage.removeItem("auth-session");
    router.push("/login");
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
        {/* Navigation Header */}
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-4">
            <Link href="/dashboard">
              <Button
                variant="outline"
                className="bg-white border border-slate-200 text-slate-700 hover:bg-slate-50 hover:border-slate-300 rounded-xl shadow-sm"
              >
                <BarChart3 className="w-4 h-4 mr-2" />
                Dashboard
              </Button>
            </Link>
          </div>
          <Button
            onClick={handleLogout}
            variant="outline"
            className="bg-white border border-slate-200 text-slate-700 hover:bg-red-50 hover:text-red-600 hover:border-red-300 rounded-xl shadow-sm"
          >
            <LogOut className="w-4 h-4 mr-2" />
            Sair
          </Button>
        </div>
        {/* Main Content Section - Card and Ranking Side by Side */}
        <div className="flex flex-col lg:flex-row gap-6 lg:gap-8">
          {/* Main Card */}
          <Card
            className={`border shadow-lg rounded-2xl overflow-hidden flex-1 transition-colors duration-1000 ${
              isDarkTheme ? "border-slate-700" : "border-slate-200"
            }`}
            style={{ backgroundColor: dominantColor }}
          >
            {/* Cover Image with Logo Overlay */}
            <div className="relative">
              {/* Cover/Iframe Area - Always show the blue cover, iframe if URL available */}
              <div className="relative w-full h-64 md:h-80 lg:h-96 xl:h-[500px] bg-gradient-to-br from-blue-600 to-blue-700 overflow-hidden">
                {/* Hidden canvas for color extraction */}
                <canvas ref={canvasRef} className="hidden" />

                {bet.url ? (
                  <>
                    <iframe
                      ref={iframeRef}
                      src={
                        bet.url.startsWith("http://") ||
                        bet.url.startsWith("https://")
                          ? bet.url
                          : `https://${bet.url}`
                      }
                      className="w-full h-full border-0"
                      title={`${bet.name} Website`}
                      allow="fullscreen"
                      sandbox="allow-same-origin allow-scripts allow-forms allow-popups allow-popups-to-escape-sandbox"
                    />
                    {/* Color extraction overlay - uses CSS filters to sample iframe colors */}
                    <div
                      className="absolute bottom-0 left-1/2 transform -translate-x-1/2 w-32 h-32 pointer-events-none opacity-0"
                      style={{
                        filter: "blur(60px) saturate(2)",
                        mixBlendMode: "multiply",
                        background: "inherit",
                      }}
                      id="color-extractor"
                    />
                    {/* Gradient fade overlay that transitions from iframe to extracted color */}
                    <div
                      className="absolute inset-0 pointer-events-none"
                      style={{
                        background: `linear-gradient(to bottom, transparent 0%, transparent 35%, ${rgbToRgba(
                          dominantColor,
                          0.2
                        )} 60%, ${rgbToRgba(
                          dominantColor,
                          0.5
                        )} 75%, ${rgbToRgba(
                          dominantColor,
                          0.85
                        )} 90%, ${dominantColor} 100%)`,
                        backdropFilter: "blur(0.5px)",
                      }}
                    />
                    {/* Subtle vignette effect for depth */}
                    <div
                      className="absolute inset-0 pointer-events-none"
                      style={{
                        background: `radial-gradient(ellipse 80% 50% at center, transparent 0%, ${rgbToRgba(
                          dominantColor,
                          0.15
                        )} 100%)`,
                      }}
                    />
                    {/* Edge fade for seamless transition */}
                    <div
                      className="absolute bottom-0 left-0 right-0 h-20 pointer-events-none"
                      style={{
                        background: `linear-gradient(to bottom, transparent, ${dominantColor})`,
                      }}
                    />
                  </>
                ) : bet.coverImage ? (
                  <Image
                    src={bet.coverImage}
                    alt={`${bet.name} cover`}
                    fill
                    className="object-cover"
                    priority
                    sizes="100vw"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center">
                    <div className="text-center text-white/80">
                      <Building2 className="w-16 h-16 mx-auto mb-2 opacity-50" />
                      <p className="text-sm">Cover Area</p>
                    </div>
                  </div>
                )}
              </div>

              {/* Logo Overlay (Facebook-style) */}
              <div className="absolute -bottom-12 md:-bottom-16 left-6 md:left-8 z-20">
                {bet.logo ? (
                  <div
                    className={`relative w-28 h-28 md:w-36 md:h-36 rounded-full overflow-hidden border-4 shadow-2xl ring-4 ${
                      isDarkTheme
                        ? "border-slate-900 bg-slate-900 ring-slate-800/50"
                        : "border-white bg-white ring-slate-200/50"
                    }`}
                  >
                    <Image
                      src={bet.logo}
                      alt={`${bet.name} logo`}
                      fill
                      className="object-cover"
                      priority
                    />
                  </div>
                ) : (
                  <div
                    className={`relative w-28 h-28 md:w-36 md:h-36 rounded-full bg-gradient-to-br from-blue-600 to-blue-700 flex items-center justify-center shadow-2xl border-4 ring-4 ${
                      isDarkTheme
                        ? "border-slate-900 ring-slate-800/50"
                        : "border-white ring-slate-200/50"
                    }`}
                  >
                    <Building2 className="w-14 h-14 md:w-20 md:h-20 text-white" />
                  </div>
                )}
              </div>
            </div>

            <CardContent className="p-6 md:p-8 pt-24 md:pt-28 relative">
              {/* Subtle gradient overlay at the top of content to blend with iframe */}
              <div
                className="absolute top-0 left-0 right-0 h-32 pointer-events-none z-0"
                style={{
                  background: `linear-gradient(to bottom, ${rgbToRgba(
                    dominantColor,
                    0.95
                  )} 0%, ${rgbToRgba(
                    dominantColor,
                    0.98
                  )} 50%, transparent 100%)`,
                }}
              />
              {/* Left Side - Name, Rating, AI Insights & Chat */}
              <div className="flex-1 space-y-4 relative z-10">
                <div>
                  <div className="flex items-center gap-3 mb-2">
                    <h1
                      className={`text-3xl md:text-4xl font-bold ${
                        isDarkTheme ? "text-white" : "text-slate-900"
                      }`}
                    >
                      {bet.name}
                    </h1>
                    {bet.betId && (
                      <span
                        className={`text-lg md:text-xl font-mono font-semibold px-3 py-1 rounded-lg ${
                          isDarkTheme
                            ? "bg-slate-800 text-slate-200 border border-slate-700"
                            : "bg-slate-100 text-slate-700 border border-slate-300"
                        }`}
                      >
                        {bet.betId}
                      </span>
                    )}
                  </div>
                  {bet.company && (
                    <p
                      className={`text-base md:text-lg ${
                        isDarkTheme ? "text-slate-300" : "text-slate-600"
                      }`}
                    >
                      {bet.company}
                    </p>
                  )}
                  {bet.url && (
                    <a
                      href={bet.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className={`inline-flex items-center gap-2 transition-colors text-sm mt-2 ${
                        isDarkTheme
                          ? "text-blue-400 hover:text-blue-300"
                          : "text-blue-600 hover:text-blue-700"
                      }`}
                    >
                      <span className="truncate max-w-xs">{bet.url}</span>
                      <ExternalLink className="w-4 h-4 flex-shrink-0" />
                    </a>
                  )}

                  {/* Additional Info Badges */}
                  <div className="flex flex-wrap gap-2 mt-3">
                    {/* Status */}
                    {bet.status && (
                      <div
                        className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold ${
                          bet.status === "Funcionando"
                            ? "bg-green-100 text-green-700 border border-green-200"
                            : "bg-red-100 text-red-700 border border-red-200"
                        }`}
                      >
                        {bet.status === "Funcionando" ? (
                          <CheckCircle2 className="w-3.5 h-3.5" />
                        ) : (
                          <XCircle className="w-3.5 h-3.5" />
                        )}
                        {bet.status}
                      </div>
                    )}

                    {/* Platform Type */}
                    {bet.platformType && (
                      <div className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-blue-100 text-blue-700 border border-blue-200 text-xs font-semibold">
                        <Building2 className="w-3.5 h-3.5" />
                        {bet.platformType}
                      </div>
                    )}

                    {/* Scope */}
                    {bet.scope && (
                      <div className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-purple-100 text-purple-700 border border-purple-200 text-xs font-semibold">
                        <Globe className="w-3.5 h-3.5" />
                        {bet.scope}
                      </div>
                    )}

                    {/* Region */}
                    {bet.region && (
                      <div
                        className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold border ${
                          isDarkTheme
                            ? "bg-slate-800 text-slate-200 border-slate-700"
                            : "bg-slate-100 text-slate-700 border-slate-200"
                        }`}
                      >
                        <MapPin className="w-3.5 h-3.5" />
                        {bet.region}
                      </div>
                    )}
                  </div>

                  {/* Additional Details */}
                  <div
                    className={`grid grid-cols-1 sm:grid-cols-2 gap-3 mt-4 pt-4 border-t ${
                      isDarkTheme ? "border-slate-700" : "border-slate-200"
                    }`}
                  >
                    {/* CNPJ */}
                    {bet.cnpj && (
                      <div className="flex items-start gap-2">
                        <FileText
                          className={`w-4 h-4 mt-0.5 flex-shrink-0 ${
                            isDarkTheme ? "text-slate-500" : "text-slate-400"
                          }`}
                        />
                        <div>
                          <div
                            className={`text-xs font-medium ${
                              isDarkTheme ? "text-slate-400" : "text-slate-500"
                            }`}
                          >
                            CNPJ
                          </div>
                          <div
                            className={`text-sm font-semibold ${
                              isDarkTheme ? "text-white" : "text-slate-900"
                            }`}
                          >
                            {bet.cnpj}
                          </div>
                        </div>
                      </div>
                    )}

                    {/* License */}
                    {bet.license && (
                      <div className="flex items-start gap-2">
                        <FileText
                          className={`w-4 h-4 mt-0.5 flex-shrink-0 ${
                            isDarkTheme ? "text-slate-500" : "text-slate-400"
                          }`}
                        />
                        <div>
                          <div
                            className={`text-xs font-medium ${
                              isDarkTheme ? "text-slate-400" : "text-slate-500"
                            }`}
                          >
                            Licença
                          </div>
                          <div
                            className={`text-sm font-semibold ${
                              isDarkTheme ? "text-white" : "text-slate-900"
                            }`}
                          >
                            {bet.license}
                          </div>
                        </div>
                      </div>
                    )}

                    {/* Bet ID */}
                    {bet.betId && (
                      <div className="flex items-start gap-2">
                        <Hash
                          className={`w-4 h-4 mt-0.5 flex-shrink-0 ${
                            isDarkTheme ? "text-slate-500" : "text-slate-400"
                          }`}
                        />
                        <div>
                          <div
                            className={`text-xs font-medium ${
                              isDarkTheme ? "text-slate-400" : "text-slate-500"
                            }`}
                          >
                            ID da Casa
                          </div>
                          <div
                            className={`text-sm font-semibold font-mono ${
                              isDarkTheme ? "text-white" : "text-slate-900"
                            }`}
                          >
                            {bet.betId}
                          </div>
                        </div>
                      </div>
                    )}

                    {/* Domain */}
                    {bet.domain && (
                      <div className="flex items-start gap-2">
                        <Globe
                          className={`w-4 h-4 mt-0.5 flex-shrink-0 ${
                            isDarkTheme ? "text-slate-500" : "text-slate-400"
                          }`}
                        />
                        <div>
                          <div
                            className={`text-xs font-medium ${
                              isDarkTheme ? "text-slate-400" : "text-slate-500"
                            }`}
                          >
                            Domínio
                          </div>
                          <div
                            className={`text-sm font-semibold ${
                              isDarkTheme ? "text-white" : "text-slate-900"
                            }`}
                          >
                            {bet.domain}
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                </div>

                <div className="flex flex-wrap items-center gap-4">
                  {/* Overall Rating */}
                  <div className="flex items-center gap-3">
                    <div
                      className={`text-3xl font-bold ${
                        isDarkTheme ? "text-white" : "text-slate-900"
                      }`}
                    >
                      {rating.overall.toFixed(1)}
                    </div>
                    <div
                      className={
                        isDarkTheme ? "text-slate-300" : "text-slate-600"
                      }
                    >
                      / 5
                    </div>
                  </div>

                  {/* Stars */}
                  {renderStars(rating.stars)}

                  {/* Ranking */}
                  <div
                    className={
                      isDarkTheme ? "text-slate-300" : "text-slate-600"
                    }
                  >
                    <span
                      className={`font-semibold ${
                        isDarkTheme ? "text-white" : "text-slate-900"
                      }`}
                    >
                      {ranking.position}°
                    </span>{" "}
                    lugar entre{" "}
                    <span
                      className={`font-semibold ${
                        isDarkTheme ? "text-white" : "text-slate-900"
                      }`}
                    >
                      {ranking.total}
                    </span>{" "}
                    casas avaliadas
                  </div>
                </div>

                {/* Compare Button - Inside the card */}
                <div
                  className={`pt-4 mt-4 border-t ${
                    isDarkTheme ? "border-slate-700" : "border-slate-200"
                  }`}
                >
                  <Button
                    onClick={handleCompare}
                    size="lg"
                    className="w-full bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white font-bold text-base md:text-lg px-6 py-4 rounded-xl shadow-lg hover:shadow-xl transition-all duration-200"
                  >
                    <span>COMPARAR COM OUTRAS CASAS</span>
                    <ArrowRight className="w-5 h-5 ml-2" />
                  </Button>
                </div>

                {/* AI Insights and Chat Section - Below the button, inside the card */}
                {/* 
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mt-6 pt-6 border-t border-slate-200">
                    <div>
                      <AIInsights betId={bet.id} betName={bet.name} />
                    </div>
                    <div>
                      <ChatInterface
                        context={{
                          betName: bet.name,
                          position: ranking.position,
                          total: ranking.total,
                          score: rating.score,
                          rating: rating.overall,
                        }}
                      />
                    </div>
                  </div>
                  */}
              </div>
            </CardContent>
          </Card>

          {/* Right Side - Ranking Panel - Outside main card */}
          <div className="lg:w-80 flex-shrink-0">
            <Card className="bg-slate-50 border border-slate-200 rounded-xl">
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-lg font-bold text-slate-900">
                    Ranking
                  </CardTitle>
                  <div className="text-xs font-semibold text-slate-500 bg-white px-2 py-1 rounded">
                    TOP 10
                  </div>
                </div>
                {/* Quick Stats */}
                <div className="mt-3 grid grid-cols-2 gap-2">
                  <div className="bg-white rounded-lg p-2 border border-slate-200">
                    <div className="text-xs text-slate-500">Sua Posição</div>
                    <div className="text-lg font-bold text-blue-600">
                      #{ranking.position}
                    </div>
                  </div>
                  <div className="bg-white rounded-lg p-2 border border-slate-200">
                    <div className="text-xs text-slate-500">Pontuação</div>
                    <div className="text-lg font-bold text-slate-900">
                      {rating.score}
                    </div>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                {!isRankingExpanded ? (
                  <>
                    {/* Top 10 */}
                    <div>
                      <div className="flex items-center justify-between mb-2">
                        <div className="text-xs font-semibold text-slate-600 uppercase tracking-wider">
                          Top 10
                        </div>
                        <div className="text-xs text-slate-500">
                          {ranking.total} casas
                        </div>
                      </div>
                      <div className="space-y-1.5 max-h-64 overflow-y-auto">
                        {ranking.top10.map((item, index) => (
                          <div
                            key={item.id}
                            className={`flex items-center justify-between p-2.5 rounded-lg transition-all ${
                              item.id === bet.id
                                ? "bg-blue-100 border-2 border-blue-500 shadow-sm"
                                : index < 3
                                ? "bg-gradient-to-r from-yellow-50 to-orange-50 border border-yellow-200 hover:shadow-sm"
                                : "bg-white border border-slate-200 hover:bg-slate-50"
                            }`}
                          >
                            <div className="flex items-center gap-2 flex-1 min-w-0">
                              <span
                                className={`text-sm font-bold flex-shrink-0 ${
                                  item.id === bet.id
                                    ? "text-blue-700"
                                    : index < 3
                                    ? "text-yellow-600"
                                    : "text-slate-700"
                                }`}
                              >
                                #{item.position}
                              </span>
                              {item.logo ? (
                                <div className="relative w-6 h-6 rounded-full overflow-hidden flex-shrink-0 border border-slate-200">
                                  <Image
                                    src={item.logo}
                                    alt={item.name}
                                    fill
                                    className="object-cover"
                                    sizes="24px"
                                    unoptimized
                                  />
                                </div>
                              ) : null}
                              <span
                                className={`text-sm truncate ${
                                  item.id === bet.id
                                    ? "font-semibold text-blue-900"
                                    : index < 3
                                    ? "font-medium text-slate-900"
                                    : "text-slate-900"
                                }`}
                              >
                                {item.name}
                              </span>
                            </div>
                            <span
                              className={`text-xs font-semibold flex-shrink-0 ml-2 ${
                                item.id === bet.id
                                  ? "text-blue-700"
                                  : index < 3
                                  ? "text-yellow-600"
                                  : "text-slate-600"
                              }`}
                            >
                              {item.score}
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* 3 Above Current (if position > 3) */}
                    {ranking.position > 3 &&
                      ranking.aboveCurrent.length > 0 && (
                        <div>
                          <div className="text-xs font-semibold text-slate-600 uppercase tracking-wider mb-2">
                            3 Acima de Você
                          </div>
                          <div className="space-y-2">
                            {ranking.aboveCurrent.map((item) => (
                              <div
                                key={item.id}
                                className="flex items-center justify-between p-2 rounded-lg bg-white border border-slate-200"
                              >
                                <div className="flex items-center gap-2 flex-1 min-w-0">
                                  <span className="text-sm font-bold text-slate-700 flex-shrink-0">
                                    #{item.position}
                                  </span>
                                  {item.logo ? (
                                    <div className="relative w-6 h-6 rounded-full overflow-hidden flex-shrink-0 border border-slate-200">
                                      <Image
                                        src={item.logo}
                                        alt={item.name}
                                        fill
                                        className="object-cover"
                                        sizes="24px"
                                        unoptimized
                                      />
                                    </div>
                                  ) : null}
                                  <span className="text-sm text-slate-900 truncate">
                                    {item.name}
                                  </span>
                                </div>
                                <span className="text-xs font-semibold text-slate-600 flex-shrink-0 ml-2">
                                  {item.score}
                                </span>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}

                    {/* Principais Concorrentes */}
                    {(ranking.aboveCurrent.length > 0 ||
                      ranking.belowCurrent.length > 0) && (
                      <div>
                        <div className="text-xs font-semibold text-slate-600 uppercase tracking-wider mb-2">
                          PRINCIPAIS CONCORRENTES
                        </div>
                        <div className="space-y-2">
                          {/* Above Current */}
                          {ranking.aboveCurrent.map((item) => (
                            <div
                              key={item.id}
                              className="flex items-center justify-between p-2 rounded-lg bg-white border border-slate-200"
                            >
                              <div className="flex items-center gap-2 flex-1 min-w-0">
                                <span className="text-sm font-bold text-slate-700 flex-shrink-0">
                                  #{item.position}
                                </span>
                                {item.logo ? (
                                  <div className="relative w-6 h-6 rounded-full overflow-hidden flex-shrink-0 border border-slate-200">
                                    <Image
                                      src={item.logo}
                                      alt={item.name}
                                      fill
                                      className="object-cover"
                                      sizes="24px"
                                      unoptimized
                                    />
                                  </div>
                                ) : null}
                                <span className="text-sm text-slate-900 truncate">
                                  {item.name}
                                </span>
                              </div>
                              <span className="text-xs font-semibold text-slate-600 flex-shrink-0 ml-2">
                                {item.score}
                              </span>
                            </div>
                          ))}

                          {/* Current Position Highlight */}
                          <div className="p-2 rounded-lg bg-blue-100 border-2 border-blue-500">
                            <div className="flex items-center justify-between">
                              <div className="flex items-center gap-2">
                                <span className="text-sm font-bold text-blue-700">
                                  #{ranking.position}
                                </span>
                                <span className="text-sm font-semibold text-blue-900 truncate">
                                  {bet.name}
                                </span>
                              </div>
                              <span className="text-xs font-semibold text-blue-700">
                                {rating.score}
                              </span>
                            </div>
                          </div>

                          {/* Below Current */}
                          {ranking.belowCurrent.map((item) => (
                            <div
                              key={item.id}
                              className="flex items-center justify-between p-2 rounded-lg bg-white border border-slate-200"
                            >
                              <div className="flex items-center gap-2 flex-1 min-w-0">
                                <span className="text-sm font-bold text-slate-700 flex-shrink-0">
                                  #{item.position}
                                </span>
                                {item.logo ? (
                                  <div className="relative w-6 h-6 rounded-full overflow-hidden flex-shrink-0 border border-slate-200">
                                    <Image
                                      src={item.logo}
                                      alt={item.name}
                                      fill
                                      className="object-cover"
                                      sizes="24px"
                                      unoptimized
                                    />
                                  </div>
                                ) : null}
                                <span className="text-sm text-slate-900 truncate">
                                  {item.name}
                                </span>
                              </div>
                              <span className="text-xs font-semibold text-slate-600 flex-shrink-0 ml-2">
                                {item.score}
                              </span>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Current Position Highlight (only if no above/below) */}
                    {ranking.aboveCurrent.length === 0 &&
                      ranking.belowCurrent.length === 0 && (
                        <div className="pt-2 border-t border-slate-200">
                          <div className="text-xs font-semibold text-blue-600 uppercase tracking-wider mb-2">
                            Sua Posição
                          </div>
                          <div className="p-2 rounded-lg bg-blue-100 border-2 border-blue-500">
                            <div className="flex items-center justify-between">
                              <div className="flex items-center gap-2">
                                <span className="text-sm font-bold text-blue-700">
                                  #{ranking.position}
                                </span>
                                <span className="text-sm font-semibold text-blue-900 truncate">
                                  {bet.name}
                                </span>
                              </div>
                              <span className="text-xs font-semibold text-blue-700">
                                {rating.score}
                              </span>
                            </div>
                          </div>
                        </div>
                      )}

                    {/* Quick Insights */}
                    {ranking.position > 10 && (
                      <div className="pt-2 border-t border-slate-200">
                        <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
                          <div className="text-xs font-semibold text-blue-900 mb-1">
                            💡 Insights
                          </div>
                          <div className="text-xs text-blue-700 space-y-1">
                            <div>
                              Você está{" "}
                              <span className="font-semibold">
                                {ranking.position - 1}
                              </span>{" "}
                              posições atrás do Top 10
                            </div>
                            {ranking.aboveCurrent.length > 0 && (
                              <div>
                                Próximo alvo:{" "}
                                <span className="font-semibold">
                                  {ranking.aboveCurrent[0].name}
                                </span>{" "}
                                ({ranking.aboveCurrent[0].score} pts)
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    )}

                    {/* Expand Button */}
                    {ranking.allRanking && ranking.allRanking.length > 0 && (
                      <div className="pt-2 border-t border-slate-200">
                        <Button
                          onClick={() => setIsRankingExpanded(true)}
                          variant="outline"
                          className="w-full border-slate-300 text-slate-700 hover:bg-slate-100 rounded-lg text-sm"
                        >
                          Ver Ranking Completo ({ranking.total} casas)
                          <ChevronDown className="w-4 h-4 ml-2" />
                        </Button>
                      </div>
                    )}
                  </>
                ) : (
                  <>
                    {/* Full Ranking */}
                    <div>
                      <div className="flex items-center justify-between mb-2">
                        <div className="text-xs font-semibold text-slate-600 uppercase tracking-wider">
                          Ranking Completo
                        </div>
                        <Button
                          onClick={() => setIsRankingExpanded(false)}
                          variant="ghost"
                          size="sm"
                          className="h-6 px-2 text-xs text-slate-600 hover:text-slate-900"
                        >
                          Fechar
                        </Button>
                      </div>
                      <div className="space-y-2 max-h-96 overflow-y-auto">
                        {ranking.allRanking?.map((item) => (
                          <div
                            key={item.id}
                            className={`flex items-center justify-between p-2 rounded-lg ${
                              item.id === bet.id
                                ? "bg-blue-100 border-2 border-blue-500"
                                : "bg-white border border-slate-200"
                            }`}
                          >
                            <div className="flex items-center gap-2">
                              <span
                                className={`text-sm font-bold ${
                                  item.id === bet.id
                                    ? "text-blue-700"
                                    : "text-slate-700"
                                }`}
                              >
                                #{item.position}
                              </span>
                              <span
                                className={`text-sm truncate ${
                                  item.id === bet.id
                                    ? "font-semibold text-blue-900"
                                    : "text-slate-900"
                                }`}
                              >
                                {item.name}
                              </span>
                            </div>
                            <span
                              className={`text-xs font-semibold ${
                                item.id === bet.id
                                  ? "text-blue-700"
                                  : "text-slate-600"
                              }`}
                            >
                              {item.score}
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>
                  </>
                )}
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Parameters Table - Organized by Category */}
        {parameters.length > 0 ? (
          <div className="space-y-8">
            <h2 className="text-2xl font-bold text-slate-900">Parâmetros</h2>
            {PARAMETER_CATEGORIES.map((category) => {
              // Get all defined parameters in this category
              const categoryDefs = getParametersByCategory(category);

              if (categoryDefs.length === 0) return null;

              return (
                <Card
                  key={category}
                  className="bg-white border border-slate-200 shadow-sm rounded-xl overflow-hidden"
                >
                  <CardContent className="p-0">
                    {/* Category Header */}
                    <div className="bg-gradient-to-r from-blue-50 to-purple-50 px-6 py-4 border-b border-slate-200">
                      <div className="flex items-center justify-between flex-wrap gap-3">
                        <div className="flex items-center gap-3">
                          <div className="w-1 h-8 bg-gradient-to-b from-blue-500 to-purple-500 rounded-full" />
                          <h3 className="text-xl font-bold text-slate-900">
                            {category}
                          </h3>
                          <span className="text-sm text-slate-500 font-normal">
                            ({categoryDefs.length} parâmetros)
                          </span>
                        </div>

                        {/* Nota Geral da Categoria */}
                        {(() => {
                          const categoryRatingParam = parameters.find(
                            (p) => p.name === `__category_rating_${category}`
                          );
                          const categoryRating =
                            categoryRatingParam?.valueRating
                              ? Number(categoryRatingParam.valueRating)
                              : null;

                          if (categoryRating === null) return null;

                          return (
                            <div className="flex items-center gap-2 bg-white rounded-lg px-3 py-1.5 border border-slate-200 shadow-sm">
                              <span className="text-sm font-medium text-slate-600">
                                Nota Geral:
                              </span>
                              <div className="flex items-center gap-0.5">
                                {Array.from({ length: 5 }).map((_, i) => {
                                  const fullStars = Math.floor(categoryRating);
                                  const partialFill =
                                    categoryRating - fullStars;

                                  if (i < fullStars) {
                                    return (
                                      <Star
                                        key={i}
                                        className="w-4 h-4 text-yellow-500 fill-yellow-500"
                                      />
                                    );
                                  } else if (
                                    i === fullStars &&
                                    partialFill > 0
                                  ) {
                                    return (
                                      <div key={i} className="relative w-4 h-4">
                                        <Star className="w-4 h-4 text-gray-300 fill-gray-300" />
                                        <div
                                          className="absolute inset-0 overflow-hidden"
                                          style={{
                                            width: `${partialFill * 100}%`,
                                          }}
                                        >
                                          <Star className="w-4 h-4 text-yellow-500 fill-yellow-500" />
                                        </div>
                                      </div>
                                    );
                                  } else {
                                    return (
                                      <Star
                                        key={i}
                                        className="w-4 h-4 text-gray-300 fill-gray-300"
                                      />
                                    );
                                  }
                                })}
                              </div>
                              <span className="text-sm font-bold text-slate-900">
                                {categoryRating.toFixed(1)}/5
                              </span>
                            </div>
                          );
                        })()}
                      </div>
                    </div>

                    {/* Table */}
                    <div className="overflow-x-auto">
                      <Table>
                        <TableHeader>
                          <TableRow className="bg-slate-50 border-b border-slate-200">
                            <TableHead className="w-[300px] font-semibold text-slate-900">
                              Parâmetro
                            </TableHead>
                            <TableHead className="font-semibold text-slate-900">
                              Valor
                            </TableHead>
                            <TableHead className="w-[100px] font-semibold text-slate-900 text-center">
                              Tendência
                            </TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {categoryDefs.map((paramDef) => {
                            const existingParam = parameters.find(
                              (p) => p.name === paramDef.name
                            );
                            const param = existingParam || {
                              id: null,
                              name: paramDef.name,
                              category: paramDef.category,
                              value: "-",
                              unit: paramDef.unit,
                              trend: "stable" as const,
                              type: paramDef.type,
                            };

                            return (
                              <TableRow
                                key={paramDef.name}
                                className="hover:bg-slate-50 cursor-pointer border-b border-slate-200"
                                onClick={() =>
                                  param.id && handleParameterClick(param)
                                }
                              >
                                <TableCell className="font-medium text-slate-900">
                                  <div>
                                    <div>{param.name}</div>
                                    {paramDef.description && (
                                      <div className="text-xs text-slate-500 mt-1">
                                        {paramDef.description}
                                      </div>
                                    )}
                                  </div>
                                </TableCell>
                                <TableCell>
                                  <div className="flex items-center gap-2">
                                    {(() => {
                                      // Check if it's a rating type
                                      const isRating =
                                        param.type === "rating" ||
                                        paramDef?.type === "rating";
                                      if (isRating) {
                                        let ratingValue =
                                          typeof param.value === "string"
                                            ? parseFloat(param.value)
                                            : Number(param.value);
                                        // Cap rating at 5
                                        ratingValue = Math.min(
                                          5,
                                          Math.max(0, ratingValue)
                                        );
                                        if (
                                          !isNaN(ratingValue) &&
                                          ratingValue >= 0 &&
                                          ratingValue <= 5
                                        ) {
                                          const clampedRating = Math.max(
                                            0,
                                            Math.min(ratingValue, 5)
                                          );
                                          const fullStars =
                                            Math.floor(clampedRating);
                                          const partialFill =
                                            clampedRating - fullStars;
                                          const emptyStars =
                                            5 -
                                            fullStars -
                                            (partialFill > 0 ? 1 : 0);

                                          return (
                                            <div className="flex items-center gap-1.5">
                                              {/* Estrelas completas */}
                                              {Array.from({
                                                length: fullStars,
                                              }).map((_, i) => (
                                                <Star
                                                  key={`full-${i}`}
                                                  className="w-4 h-4 text-yellow-500 fill-yellow-500"
                                                />
                                              ))}
                                              {/* Estrela parcial com preenchimento proporcional */}
                                              {partialFill > 0 && (
                                                <div className="relative w-4 h-4">
                                                  <Star className="w-4 h-4 text-gray-300 fill-gray-300" />
                                                  <div
                                                    className="absolute inset-0 overflow-hidden"
                                                    style={{
                                                      width: `${
                                                        partialFill * 100
                                                      }%`,
                                                    }}
                                                  >
                                                    <Star className="w-4 h-4 text-yellow-500 fill-yellow-500" />
                                                  </div>
                                                </div>
                                              )}
                                              {/* Estrelas vazias */}
                                              {Array.from({
                                                length: emptyStars,
                                              }).map((_, i) => (
                                                <Star
                                                  key={`empty-${i}`}
                                                  className="w-4 h-4 text-gray-300 fill-gray-300"
                                                />
                                              ))}
                                              <span className="ml-1 text-sm font-medium text-slate-700">
                                                {clampedRating.toFixed(1)}
                                              </span>
                                            </div>
                                          );
                                        }
                                      }

                                      // Check for "Sim" (Yes)
                                      const valueStr = String(param.value || "")
                                        .toLowerCase()
                                        .trim();
                                      if (
                                        valueStr === "sim" ||
                                        valueStr === "yes" ||
                                        valueStr === "true"
                                      ) {
                                        return (
                                          <span className="inline-flex items-center px-2.5 py-1 rounded-full text-sm font-semibold bg-green-100 text-green-700 border border-green-200">
                                            <CheckCircle2 className="w-3.5 h-3.5 mr-1" />
                                            Sim
                                          </span>
                                        );
                                      }

                                      // Check for "Não" (No)
                                      if (
                                        valueStr === "não" ||
                                        valueStr === "nao" ||
                                        valueStr === "no" ||
                                        valueStr === "false"
                                      ) {
                                        return (
                                          <span className="inline-flex items-center px-2.5 py-1 rounded-full text-sm font-semibold bg-red-100 text-red-700 border border-red-200">
                                            <XCircle className="w-3.5 h-3.5 mr-1" />
                                            Não
                                          </span>
                                        );
                                      }

                                      // Empty/missing values
                                      if (
                                        param.value === "-" ||
                                        !param.value ||
                                        param.value === "null" ||
                                        param.value === "undefined"
                                      ) {
                                        return (
                                          <span className="text-slate-400 italic text-sm">
                                            -
                                          </span>
                                        );
                                      }

                                      // Default display
                                      return (
                                        <span className="text-base font-medium text-slate-900">
                                          {param.value}
                                          {param.unit && ` ${param.unit}`}
                                        </span>
                                      );
                                    })()}
                                  </div>
                                </TableCell>
                                <TableCell className="text-center">
                                  {getTrendIcon(param.trend)}
                                </TableCell>
                              </TableRow>
                            );
                          })}
                        </TableBody>
                      </Table>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        ) : (
          <Card className="bg-white border border-slate-200 rounded-2xl shadow-sm">
            <CardContent className="p-8 text-center">
              <Building2 className="w-16 h-16 text-slate-400 mx-auto mb-4" />
              <h3 className="text-xl font-bold text-slate-900 mb-2">
                Nenhum parâmetro cadastrado
              </h3>
              <p className="text-slate-600">
                Os parâmetros da sua casa de apostas ainda não foram
                configurados.
              </p>
            </CardContent>
          </Card>
        )}
      </div>

      {/* Parameter Detail Modal */}
      <ParameterDetailModal
        parameter={selectedParameter}
        open={isModalOpen}
        onOpenChange={setIsModalOpen}
      />
    </div>
  );
}

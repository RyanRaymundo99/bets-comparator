"use client";
import React, { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  ChevronDown,
  LogOut,
  Timer,
  Menu,
  X,
  Home,
  TrendingUp,
  Wallet,
  CreditCard,
  BarChart3,
  FileText,
  Calculator,
} from "lucide-react";
import CalculatorModal from "./calculator-modal";

// Import translations type for type safety
const NAV_LINKS = [
  { label: "Início", href: "/dashboard" },
  { label: "Negociar", href: "#", dropdown: true },
  { label: "Depositar", href: "/depositar" },
  { label: "Sacar", href: "/sacar" },
  { label: "Pagar", href: "/pagar" },
  { label: "Portfólio", href: "/portfolio" },
  { label: "Transações", href: "/extrato" },
];

const NEGOCIAR_OPTIONS = [
  {
    title: "Negociação básica",
    desc: "Negocie criptoativos com agilidade e segurança",
    icon: null,
    href: "/negociacao-basica",
  },
  {
    title: "Negociação avançada",
    desc: "Negocie criptoativos com as ferramentas mais avançadas do mercado",
    icon: null,
    href: "/negociacao-avancada",
  },
  // {
  //   title: "Negociação maximizada",
  //   desc: "Maximize suas negociações de criptoativos e aumente o potencial de retorno",
  //   icon: null,
  //   href: "/negociacao-maxima",
  // },
  {
    title: "OTC",
    desc: "Negocie altos valores com liquidez, agilidade e segurança",
    icon: null,
    href: "/otc",
  },
];

interface NavbarProps {
  isLoggingOut: boolean;
  handleLogout: () => void;
}

export default function Navbar({ isLoggingOut, handleLogout }: NavbarProps) {
  const [showCalculator, setShowCalculator] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isNegociarOpen, setIsNegociarOpen] = useState(false);

  // Close mobile menu when screen size changes
  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth >= 768) {
        setIsMobileMenuOpen(false);
        setIsNegociarOpen(false);
      }
    };

    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  // Prevent body scroll when mobile menu is open
  useEffect(() => {
    if (isMobileMenuOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "unset";
    }

    return () => {
      document.body.style.overflow = "unset";
    };
  }, [isMobileMenuOpen]);

  const handleNavigation = (href: string) => {
    if (href.startsWith("/")) {
      window.location.href = window.location.origin + href;
    } else {
      window.location.href = window.location.origin + "/" + href;
    }
  };

  const handleCalculatorOpen = () => {
    setShowCalculator(true);
  };

  const handleCalculatorClose = () => {
    setShowCalculator(false);
  };

  const toggleMobileMenu = () => {
    setIsMobileMenuOpen(!isMobileMenuOpen);
    setIsNegociarOpen(false);
  };

  const toggleNegociar = () => {
    setIsNegociarOpen(!isNegociarOpen);
  };

  const handleMobileNavigation = (href: string) => {
    handleNavigation(href);
    setIsMobileMenuOpen(false);
    setIsNegociarOpen(false);
  };

  return (
    <>
      <header className="w-full bg-black/60 border-b border-white/10 backdrop-blur-[20px] flex items-center justify-between px-6 py-3 relative z-50">
        <div className="flex items-center gap-6">
          {/* Logo */}
          <div
            className="flex items-center gap-2 cursor-pointer hover:opacity-80 transition-opacity"
            onClick={() => handleNavigation("/dashboard")}
          >
            <div className="w-8 h-8 bg-white/10 rounded-lg flex items-center justify-center border border-white/20">
              <span className="text-sm font-bold text-white">📈</span>
            </div>
            <span className="text-lg font-bold text-white">Build Strategy</span>
          </div>
          {/* Desktop Navigation */}
          <nav className="hidden md:flex gap-6 relative">
            {NAV_LINKS.map((link) =>
              link.dropdown ? (
                <DropdownMenu key={link.label}>
                  <DropdownMenuTrigger asChild>
                    <button className="text-white/80 hover:text-blue-300 font-medium transition-colors flex items-center gap-1 focus:outline-none">
                      {link.label} <ChevronDown className="w-4 h-4" />
                    </button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent
                    className="w-80 bg-black/90 border border-white/20 backdrop-blur-[20px] relative overflow-hidden"
                    sideOffset={8}
                  >
                    {/* Mirror effect overlay */}
                    <div className="absolute inset-0 bg-gradient-to-br from-white/10 via-transparent to-white/5 opacity-50"></div>
                    <div className="absolute top-0 left-0 w-full h-px bg-gradient-to-r from-transparent via-white/20 to-transparent"></div>
                    <div className="absolute top-0 left-0 w-px h-full bg-gradient-to-b from-transparent via-white/20 to-transparent"></div>

                    <div className="relative z-10 p-2">
                      {NEGOCIAR_OPTIONS.map((opt) => (
                        <DropdownMenuItem
                          key={opt.title}
                          className="flex gap-3 items-start hover:bg-white/10 rounded-lg p-3 cursor-pointer transition-colors focus:bg-white/10 focus:text-white"
                          onClick={() => handleNavigation(opt.href)}
                        >
                          {opt.icon && <span>{opt.icon}</span>}
                          <div>
                            <div className="font-semibold text-base text-white">
                              {opt.title}
                            </div>
                            <div className="text-sm text-gray-300">
                              {opt.desc}
                            </div>
                          </div>
                        </DropdownMenuItem>
                      ))}
                    </div>
                  </DropdownMenuContent>
                </DropdownMenu>
              ) : (
                <a
                  key={link.label}
                  href={link.href}
                  className="text-white/80 hover:text-blue-300 font-medium transition-colors"
                >
                  {link.label}
                </a>
              )
            )}
          </nav>
        </div>
        {/* Header Actions */}
        <div className="flex items-center gap-4">
          {/* Desktop Actions */}
          <div className="hidden md:flex items-center gap-4">
            <Button
              variant="ghost"
              size="sm"
              onClick={handleLogout}
              disabled={isLoggingOut}
              className="gap-2 text-white hover:text-blue-300 hover:bg-white/10"
            >
              <LogOut className="w-4 h-4" />
              {isLoggingOut ? "Saindo..." : "Sair"}
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={handleCalculatorOpen}
              title="Calculadora de Conversão"
              className="text-white hover:text-blue-300 hover:bg-white/10"
            >
              <Timer className="w-4 h-4" />
            </Button>
          </div>

          {/* Mobile Menu Button */}
          <Button
            variant="ghost"
            size="sm"
            onClick={toggleMobileMenu}
            className="md:hidden text-white hover:text-blue-300 hover:bg-white/10 p-2"
          >
            {isMobileMenuOpen ? (
              <X className="w-6 h-6" />
            ) : (
              <Menu className="w-6 h-6" />
            )}
          </Button>
        </div>
      </header>

      {/* Mobile Menu Overlay */}
      {isMobileMenuOpen && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-40 md:hidden">
          <div className="absolute inset-0" onClick={toggleMobileMenu}></div>
        </div>
      )}

      {/* Mobile Menu */}
      <div
        className={`fixed top-0 right-0 h-full w-80 bg-black/95 border-l border-white/10 backdrop-blur-[20px] z-50 transform transition-transform duration-300 ease-in-out md:hidden ${
          isMobileMenuOpen ? "translate-x-0" : "translate-x-full"
        }`}
      >
        {/* Mobile Menu Header */}
        <div className="flex items-center justify-between p-6 border-b border-white/10">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-white/10 rounded-lg flex items-center justify-center border border-white/20">
              <span className="text-sm font-bold text-white">📈</span>
            </div>
            <span className="text-lg font-bold text-white">Menu</span>
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={toggleMobileMenu}
            className="text-white hover:text-blue-300 hover:bg-white/10 p-2"
          >
            <X className="w-6 h-6" />
          </Button>
        </div>

        {/* Mobile Menu Content */}
        <div className="flex flex-col h-full">
          <nav className="flex-1 p-6 space-y-2">
            {/* Main Navigation Items */}
            <div className="space-y-1">
              <button
                onClick={() => handleMobileNavigation("/dashboard")}
                className="w-full flex items-center gap-3 p-3 rounded-lg text-white/80 hover:text-white hover:bg-white/10 transition-all duration-200 group"
              >
                <Home className="w-5 h-5 group-hover:text-blue-300 transition-colors" />
                <span className="font-medium">Início</span>
              </button>

              {/* Negociar with submenu */}
              <div className="space-y-1">
                <button
                  onClick={toggleNegociar}
                  className="w-full flex items-center justify-between p-3 rounded-lg text-white/80 hover:text-white hover:bg-white/10 transition-all duration-200 group"
                >
                  <div className="flex items-center gap-3">
                    <TrendingUp className="w-5 h-5 group-hover:text-blue-300 transition-colors" />
                    <span className="font-medium">Negociar</span>
                  </div>
                  <ChevronDown
                    className={`w-4 h-4 transition-transform duration-200 ${
                      isNegociarOpen ? "rotate-180" : ""
                    }`}
                  />
                </button>

                {/* Negociar Submenu */}
                <div
                  className={`overflow-hidden transition-all duration-300 ${
                    isNegociarOpen
                      ? "max-h-96 opacity-100"
                      : "max-h-0 opacity-0"
                  }`}
                >
                  <div className="pl-8 space-y-1">
                    {NEGOCIAR_OPTIONS.map((option) => (
                      <button
                        key={option.title}
                        onClick={() => handleMobileNavigation(option.href)}
                        className="w-full flex items-start gap-3 p-3 rounded-lg text-white/60 hover:text-white hover:bg-white/5 transition-all duration-200 text-left"
                      >
                        <div className="flex-1">
                          <div className="font-medium text-sm">
                            {option.title}
                          </div>
                          <div className="text-xs text-gray-400 mt-1">
                            {option.desc}
                          </div>
                        </div>
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              <button
                onClick={() => handleMobileNavigation("/depositar")}
                className="w-full flex items-center gap-3 p-3 rounded-lg text-white/80 hover:text-white hover:bg-white/10 transition-all duration-200 group"
              >
                <Wallet className="w-5 h-5 group-hover:text-blue-300 transition-colors" />
                <span className="font-medium">Depositar</span>
              </button>

              <button
                onClick={() => handleMobileNavigation("/sacar")}
                className="w-full flex items-center gap-3 p-3 rounded-lg text-white/80 hover:text-white hover:bg-white/10 transition-all duration-200 group"
              >
                <CreditCard className="w-5 h-5 group-hover:text-blue-300 transition-colors" />
                <span className="font-medium">Sacar</span>
              </button>

              <button
                onClick={() => handleMobileNavigation("/pagar")}
                className="w-full flex items-center gap-3 p-3 rounded-lg text-white/80 hover:text-white hover:bg-white/10 transition-all duration-200 group"
              >
                <CreditCard className="w-5 h-5 group-hover:text-blue-300 transition-colors" />
                <span className="font-medium">Pagar</span>
              </button>

              <button
                onClick={() => handleMobileNavigation("/portfolio")}
                className="w-full flex items-center gap-3 p-3 rounded-lg text-white/80 hover:text-white hover:bg-white/10 transition-all duration-200 group"
              >
                <BarChart3 className="w-5 h-5 group-hover:text-blue-300 transition-colors" />
                <span className="font-medium">Portfólio</span>
              </button>

              <button
                onClick={() => handleMobileNavigation("/extrato")}
                className="w-full flex items-center gap-3 p-3 rounded-lg text-white/80 hover:text-white hover:bg-white/10 transition-all duration-200 group"
              >
                <FileText className="w-5 h-5 group-hover:text-blue-300 transition-colors" />
                <span className="font-medium">Transações</span>
              </button>
            </div>
          </nav>

          {/* Mobile Menu Footer */}
          <div className="p-6 border-t border-white/10 space-y-3">
            <button
              onClick={handleCalculatorOpen}
              className="w-full flex items-center gap-3 p-3 rounded-lg text-white/80 hover:text-white hover:bg-white/10 transition-all duration-200 group"
            >
              <Calculator className="w-5 h-5 group-hover:text-blue-300 transition-colors" />
              <span className="font-medium">Calculadora</span>
            </button>

            <button
              onClick={handleLogout}
              disabled={isLoggingOut}
              className="w-full flex items-center gap-3 p-3 rounded-lg text-red-400 hover:text-red-300 hover:bg-red-500/10 transition-all duration-200 group"
            >
              <LogOut className="w-5 h-5" />
              <span className="font-medium">
                {isLoggingOut ? "Saindo..." : "Sair"}
              </span>
            </button>
          </div>
        </div>
      </div>

      {/* Calculator Modal - Rendered outside navbar to avoid z-index conflicts */}
      <CalculatorModal
        isOpen={showCalculator}
        onClose={handleCalculatorClose}
      />
    </>
  );
}

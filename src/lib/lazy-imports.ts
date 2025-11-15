/**
 * Lazy import utilities for code splitting
 * Reduces initial bundle size by loading components on demand
 */

import dynamic from "next/dynamic";

/**
 * Lazy load Recharts components (large library ~200KB)
 * Use these instead of direct imports to reduce initial bundle
 * 
 * Note: These are dynamically imported to reduce initial bundle size.
 * The components will be loaded only when actually used.
 * 
 * Usage: Import the entire recharts module lazily when needed
 */
export const loadRecharts = () => import("recharts");

/**
 * Lazy load heavy components
 */
export const LazyComponents = {
  CalculatorModal: dynamic(
    () => import("@/components/ui/calculator-modal"),
    { ssr: false }
  ),
  WelcomeTutorial: dynamic(
    () => import("@/components/ui/welcome-tutorial").then((mod) => mod.WelcomeTutorial),
    { ssr: false }
  ),
  StarfallBackground: dynamic(
    () => import("@/components/ui/starfall-background"),
    { ssr: false }
  ),
};

/**
 * Lazy load admin components (only load when needed)
 */
export const LazyAdminComponents = {
  NotificationBell: dynamic(
    () => import("@/components/admin/NotificationBell"),
    { ssr: false }
  ),
};


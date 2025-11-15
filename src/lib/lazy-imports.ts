/**
 * Lazy import utilities for code splitting
 * Reduces initial bundle size by loading components on demand
 */

import dynamic from "next/dynamic";

/**
 * Lazy load Recharts components (large library ~200KB)
 * Use these instead of direct imports to reduce initial bundle
 */
export const LazyRecharts = {
  AreaChart: dynamic(
    () => import("recharts").then((mod) => ({ default: mod.AreaChart })),
    { ssr: false }
  ) as React.ComponentType<any>,
  Area: dynamic(
    () => import("recharts").then((mod) => ({ default: mod.Area })),
    { ssr: false }
  ) as React.ComponentType<any>,
  XAxis: dynamic(
    () => import("recharts").then((mod) => ({ default: mod.XAxis })),
    { ssr: false }
  ) as React.ComponentType<any>,
  YAxis: dynamic(
    () => import("recharts").then((mod) => ({ default: mod.YAxis })),
    { ssr: false }
  ) as React.ComponentType<any>,
  CartesianGrid: dynamic(
    () => import("recharts").then((mod) => ({ default: mod.CartesianGrid })),
    { ssr: false }
  ) as React.ComponentType<any>,
  Tooltip: dynamic(
    () => import("recharts").then((mod) => ({ default: mod.Tooltip })),
    { ssr: false }
  ) as React.ComponentType<any>,
  ResponsiveContainer: dynamic(
    () => import("recharts").then((mod) => ({ default: mod.ResponsiveContainer })),
    { ssr: false }
  ) as React.ComponentType<any>,
  Legend: dynamic(
    () => import("recharts").then((mod) => ({ default: mod.Legend })),
    { ssr: false }
  ) as React.ComponentType<any>,
};

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


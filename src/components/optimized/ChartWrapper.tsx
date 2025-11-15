"use client";

import { Suspense } from "react";
import dynamic from "next/dynamic";

// Lazy load the entire chart component
const LazyChart = dynamic(
  () =>
    import("recharts").then((mod) => {
      const { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } = mod;
      return function Chart({
        data,
        dataKey,
        className,
      }: {
        data: unknown[];
        dataKey: string;
        className?: string;
      }) {
        return (
          <ResponsiveContainer width="100%" height={300} className={className}>
            <AreaChart data={data}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="date" />
              <YAxis />
              <Tooltip />
              <Area type="monotone" dataKey={dataKey} stroke="#8884d8" fill="#8884d8" />
            </AreaChart>
          </ResponsiveContainer>
        );
      };
    }),
  {
    ssr: false,
    loading: () => <div className="h-64 flex items-center justify-center">Loading chart...</div>,
  }
);

interface ChartWrapperProps {
  data: unknown[];
  dataKey: string;
  className?: string;
}

/**
 * Optimized chart wrapper that lazy loads Recharts
 * Reduces initial bundle size by ~200KB
 */
export function ChartWrapper({ data, dataKey, className }: ChartWrapperProps) {
  return (
    <Suspense fallback={<div className="h-64 flex items-center justify-center">Loading chart...</div>}>
      <LazyChart data={data} dataKey={dataKey} className={className} />
    </Suspense>
  );
}


import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Production optimizations for Vercel
  // Remove standalone output for Vercel compatibility
  // output: "standalone",

  // Image optimization
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "bitcoin.org",
        port: "",
        pathname: "/img/**",
      },
      {
        protocol: "https",
        hostname: "*.vercel.app",
        port: "",
        pathname: "/uploads/**",
      },
    ],
    formats: ["image/webp", "image/avif"],
    minimumCacheTTL: 60,
  },

  // Security headers
  async headers() {
    return [
      {
        source: "/(.*)",
        headers: [
          {
            key: "X-Frame-Options",
            value: "DENY",
          },
          {
            key: "X-Content-Type-Options",
            value: "nosniff",
          },
          {
            key: "Referrer-Policy",
            value: "strict-origin-when-cross-origin",
          },
          {
            key: "X-XSS-Protection",
            value: "1; mode=block",
          },
          {
            key: "Strict-Transport-Security",
            value: "max-age=31536000; includeSubDomains",
          },
        ],
      },
    ];
  },

  // Performance optimizations
  experimental: {
    optimizePackageImports: [
      "lucide-react",
      "@radix-ui/react-icons",
      "@radix-ui/react-avatar",
      "@radix-ui/react-checkbox",
      "@radix-ui/react-dialog",
      "@radix-ui/react-dropdown-menu",
      "@radix-ui/react-label",
      "@radix-ui/react-navigation-menu",
      "@radix-ui/react-progress",
      "@radix-ui/react-select",
      "@radix-ui/react-separator",
      "@radix-ui/react-slot",
      "@radix-ui/react-tabs",
      "@radix-ui/react-toast",
    ],
    // Enable partial prerendering for better performance
    ppr: false, // Can enable when stable
  },

  // Server external packages
  serverExternalPackages: ["@prisma/client", "prisma"],

  // Compiler optimizations
  compiler: {
    removeConsole: process.env.NODE_ENV === "production",
  },

  // Bundle optimization
  swcMinify: true,

  // Compression (enabled by default in production)
  compress: true,

  // Webpack optimizations
  webpack: (config, { isServer, dev }) => {
    if (!isServer) {
      config.resolve.fallback = {
        ...config.resolve.fallback,
        fs: false,
        net: false,
        tls: false,
      };

      // Optimize bundle splitting
      if (!dev) {
        config.optimization = {
          ...config.optimization,
          splitChunks: {
            chunks: "all",
            cacheGroups: {
              default: false,
              vendors: false,
              // Vendor chunk for large libraries
              vendor: {
                name: "vendor",
                chunks: "all",
                test: /node_modules/,
                priority: 20,
              },
              // Separate chunk for Radix UI
              radix: {
                name: "radix",
                test: /[\\/]node_modules[\\/]@radix-ui[\\/]/,
                chunks: "all",
                priority: 30,
              },
              // Separate chunk for Recharts (large library)
              recharts: {
                name: "recharts",
                test: /[\\/]node_modules[\\/]recharts[\\/]/,
                chunks: "all",
                priority: 30,
              },
              // Common chunk for shared code
              common: {
                name: "common",
                minChunks: 2,
                chunks: "all",
                priority: 10,
                reuseExistingChunk: true,
              },
            },
          },
        };
      }
    }
    return config;
  },

  // Environment variables
  env: {
    CUSTOM_KEY: process.env.CUSTOM_KEY,
  },
};

export default nextConfig;

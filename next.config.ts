import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Production optimizations
  // output: "standalone", // Disabled due to Windows symlink issues

  // Image optimization
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "bitcoin.org",
        port: "",
        pathname: "/img/**",
      },
    ],
    formats: ["image/webp", "image/avif"],
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
        ],
      },
    ];
  },

  // Performance optimizations
  experimental: {
    optimizePackageImports: ["lucide-react", "@radix-ui/react-icons"],
  },

  // Compiler optimizations
  compiler: {
    removeConsole: process.env.NODE_ENV === "production",
  },
};

export default nextConfig;

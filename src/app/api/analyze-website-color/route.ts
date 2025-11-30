import { NextRequest } from "next/server";
import { withErrorHandling, successResponse, badRequestResponse } from "@/lib/api-response";

// Analyze a website's dominant color by fetching it server-side
export const GET = withErrorHandling(async (request: NextRequest) => {
  const { searchParams } = new URL(request.url);
  const url = searchParams.get("url");

  if (!url) {
    return badRequestResponse("URL parameter is required");
  }

  try {
    // Normalize URL
    let normalizedUrl = url;
    if (!url.startsWith("http://") && !url.startsWith("https://")) {
      normalizedUrl = `https://${url}`;
    }

    // Fetch the website HTML
    const response = await fetch(normalizedUrl, {
      headers: {
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36",
      },
      redirect: "follow",
    });

    if (!response.ok) {
      // If fetch fails, return default black
      return successResponse({
        color: "rgb(0, 0, 0)",
        brightness: 0,
        isDark: true,
      });
    }

    const html = await response.text();

    // Extract background color from inline styles and meta tags
    // Look for common background color patterns
    const bgColorPatterns = [
      /background-color:\s*rgb\((\d+),\s*(\d+),\s*(\d+)\)/gi,
      /background-color:\s*#([0-9a-fA-F]{6})/gi,
      /background:\s*rgb\((\d+),\s*(\d+),\s*(\d+)\)/gi,
      /background:\s*#([0-9a-fA-F]{6})/gi,
      /bg-color["']?\s*[:=]\s*["']?#([0-9a-fA-F]{6})/gi,
    ];

    let detectedColor: { r: number; g: number; b: number } | null = null;

    // Try to find background color in HTML
    for (const pattern of bgColorPatterns) {
      const matches = Array.from(html.matchAll(pattern));
      if (matches.length > 0) {
        const match = matches[0];
        if (match[1] && match[2] && match[3]) {
          // RGB format
          detectedColor = {
            r: parseInt(match[1]),
            g: parseInt(match[2]),
            b: parseInt(match[3]),
          };
          break;
        } else if (match[1]) {
          // Hex format
          const hex = match[1];
          detectedColor = {
            r: parseInt(hex.substring(0, 2), 16),
            g: parseInt(hex.substring(2, 4), 16),
            b: parseInt(hex.substring(4, 6), 16),
          };
          break;
        }
      }
    }

    // Check for common dark/light keywords
    const darkKeywords = /dark|black|night|darker/i;
    const lightKeywords = /light|white|bright|lighter/i;

    if (!detectedColor) {
      // If no color found, check for keywords
      if (darkKeywords.test(html)) {
        return successResponse({
          color: "rgb(0, 0, 0)",
          brightness: 0,
          isDark: true,
        });
      } else if (lightKeywords.test(html)) {
        return successResponse({
          color: "rgb(255, 255, 255)",
          brightness: 255,
          isDark: false,
        });
      }
    }

    // Calculate brightness
    if (detectedColor) {
      const brightness = (detectedColor.r * 299 + detectedColor.g * 587 + detectedColor.b * 114) / 1000;
      const isDark = brightness < 128;

      // Adjust color slightly for better contrast
      let finalColor = detectedColor;
      if (brightness > 200) {
        // Very light - use white
        finalColor = { r: 255, g: 255, b: 255 };
      } else if (brightness < 50) {
        // Very dark - use black
        finalColor = { r: 0, g: 0, b: 0 };
      } else if (isDark) {
        // Dark - slightly darken
        finalColor = {
          r: Math.max(0, Math.floor(detectedColor.r * 0.9)),
          g: Math.max(0, Math.floor(detectedColor.g * 0.9)),
          b: Math.max(0, Math.floor(detectedColor.b * 0.9)),
        };
      } else {
        // Light - slightly lighten
        finalColor = {
          r: Math.min(255, Math.floor(detectedColor.r * 1.1)),
          g: Math.min(255, Math.floor(detectedColor.g * 1.1)),
          b: Math.min(255, Math.floor(detectedColor.b * 1.1)),
        };
      }

      return successResponse({
        color: `rgb(${finalColor.r}, ${finalColor.g}, ${finalColor.b})`,
        brightness,
        isDark,
      });
    }

    // Default fallback - check if URL suggests dark theme
    const urlLower = normalizedUrl.toLowerCase();
    if (urlLower.includes("dark") || urlLower.includes("night")) {
      return successResponse({
        color: "rgb(0, 0, 0)",
        brightness: 0,
        isDark: true,
      });
    }

    // Default to white for most websites
    return successResponse({
      color: "rgb(255, 255, 255)",
      brightness: 255,
      isDark: false,
    });
  } catch (error) {
    // On error, return default black
    return successResponse({
      color: "rgb(0, 0, 0)",
      brightness: 0,
      isDark: true,
    });
  }
});


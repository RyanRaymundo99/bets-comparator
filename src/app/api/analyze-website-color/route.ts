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

    // Early detection for well-known sites
    const urlLower = normalizedUrl.toLowerCase();
    if (urlLower.includes('wikipedia.org') || urlLower.includes('wikipedia')) {
      return successResponse({
        color: "rgb(255, 255, 255)",
        brightness: 255,
        isDark: false,
      });
    }

    // Extract background color from inline styles, CSS, and meta tags
    // Look for common background color patterns
    const bgColorPatterns = [
      // Inline styles
      /background-color:\s*rgb\((\d+),\s*(\d+),\s*(\d+)\)/gi,
      /background-color:\s*#([0-9a-fA-F]{6})/gi,
      /background:\s*rgb\((\d+),\s*(\d+),\s*(\d+)\)/gi,
      /background:\s*#([0-9a-fA-F]{6})/gi,
      // CSS variables
      /--bg-color["']?\s*[:=]\s*["']?#([0-9a-fA-F]{6})/gi,
      /--background-color["']?\s*[:=]\s*["']?#([0-9a-fA-F]{3,6})/gi,
      // Body tag styles
      /<body[^>]*style=["'][^"']*background[^"']*:?\s*#([0-9a-fA-F]{6})/gi,
      /<body[^>]*style=["'][^"']*background[^"']*:?\s*rgb\((\d+),\s*(\d+),\s*(\d+)\)/gi,
      // Common CSS classes that indicate dark/light themes
      /class=["'][^"']*\b(dark|black|night|dark-mode|dark-theme)\b/gi,
      /class=["'][^"']*\b(light|white|bright|light-mode|light-theme)\b/gi,
      // Meta theme-color
      /<meta[^>]*name=["']theme-color["'][^>]*content=["']#([0-9a-fA-F]{6})/gi,
      // Common dark background colors
      /#000000|#000|rgb\(0,\s*0,\s*0\)|black/gi,
      // Common light background colors
      /#ffffff|#fff|rgb\(255,\s*255,\s*255\)|white/gi,
    ];

    let detectedColor: { r: number; g: number; b: number } | null = null;
    let foundDarkKeyword = false;
    let foundLightKeyword = false;

    // Try to find background color in HTML
    for (const pattern of bgColorPatterns) {
      const matches = Array.from(html.matchAll(pattern));
      if (matches.length > 0) {
        const match = matches[0];
        
        // Check for dark/light keywords
        if (pattern.source.includes('dark|black|night')) {
          foundDarkKeyword = true;
          continue;
        }
        if (pattern.source.includes('light|white|bright')) {
          foundLightKeyword = true;
          continue;
        }
        
        if (match[1] && match[2] && match[3]) {
          // RGB format
          detectedColor = {
            r: parseInt(match[1]),
            g: parseInt(match[2]),
            b: parseInt(match[3]),
          };
          break;
        } else if (match[1]) {
          // Hex format (3 or 6 digits)
          const hex = match[1];
          if (hex.length === 3) {
            // Expand 3-digit hex to 6-digit
            detectedColor = {
              r: parseInt(hex[0] + hex[0], 16),
              g: parseInt(hex[1] + hex[1], 16),
              b: parseInt(hex[2] + hex[2], 16),
            };
          } else if (hex.length === 6) {
            detectedColor = {
              r: parseInt(hex.substring(0, 2), 16),
              g: parseInt(hex.substring(2, 4), 16),
              b: parseInt(hex.substring(4, 6), 16),
            };
          }
          if (detectedColor) break;
        }
      }
    }

    // Check for common dark/light keywords in HTML content
    const darkKeywords = /dark|black|night|darker|dark-mode|dark-theme/i;
    const lightKeywords = /light|white|bright|lighter|light-mode|light-theme/i;
    
    // Count occurrences of dark/light keywords
    const darkMatches = html.match(darkKeywords);
    const lightMatches = html.match(lightKeywords);
    const darkCount = darkMatches ? darkMatches.length : 0;
    const lightCount = lightMatches ? lightMatches.length : 0;

    if (!detectedColor) {
      // If no color found, check for keywords (prefer class-based detection)
      if (foundDarkKeyword || darkCount > lightCount) {
        return successResponse({
          color: "rgb(0, 0, 0)",
          brightness: 0,
          isDark: true,
        });
      } else if (foundLightKeyword || lightCount > darkCount) {
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
    if (urlLower.includes("dark") || urlLower.includes("night") || urlLower.includes("black")) {
      return successResponse({
        color: "rgb(0, 0, 0)",
        brightness: 0,
        isDark: true,
      });
    }

    // Check for common website patterns in HTML content
    // Wikipedia and many sites use white backgrounds
    const isCommonLightSite = 
      html.includes('wikipedia') ||
      html.includes('Wikimedia') ||
      html.includes('mw-body') ||
      html.includes('mw-page-container');
    
    if (isCommonLightSite) {
      return successResponse({
        color: "rgb(255, 255, 255)",
        brightness: 255,
        isDark: false,
      });
    }

    // Check for common dark website patterns in HTML
    const hasDarkIndicators = 
      html.includes('dark') || 
      html.includes('black') ||
      html.includes('bg-dark') ||
      html.includes('theme-dark') ||
      html.includes('dark-mode');
    
    const hasLightIndicators = 
      html.includes('light') || 
      html.includes('white') ||
      html.includes('bg-light') ||
      html.includes('theme-light') ||
      html.includes('light-mode');

    // If we have strong dark indicators and no light indicators, use black
    if (hasDarkIndicators && !hasLightIndicators) {
      return successResponse({
        color: "rgb(0, 0, 0)",
        brightness: 0,
        isDark: true,
      });
    }

    // Check if HTML suggests a light background (most websites are light)
    // Look for common light background indicators
    const hasLightBackground = 
      html.includes('background') && html.includes('fff') ||
      html.includes('background') && html.includes('white') ||
      html.includes('bg-white') ||
      html.includes('background-color: white') ||
      html.includes('background-color: #fff');

    if (hasLightBackground || hasLightIndicators) {
      return successResponse({
        color: "rgb(255, 255, 255)",
        brightness: 255,
        isDark: false,
      });
    }

    // Default to black for unknown sites (user indicated iframe is often black)
    return successResponse({
      color: "rgb(0, 0, 0)",
      brightness: 0,
      isDark: true,
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

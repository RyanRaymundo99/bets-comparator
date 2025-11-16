import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

export async function middleware(request: NextRequest) {
  // Add security headers for all requests
  const response = NextResponse.next();
  
  // Security headers
  response.headers.set('X-Frame-Options', 'DENY');
  response.headers.set('X-Content-Type-Options', 'nosniff');
  response.headers.set('Referrer-Policy', 'strict-origin-when-cross-origin');
  
  // For admin routes, we'll do a basic cookie check
  // Full verification will be done in the page component (which can use Prisma)
  if (request.nextUrl.pathname.startsWith("/admin")) {
    // Skip middleware for admin login page and API routes
    if (
      request.nextUrl.pathname === "/admin/login" ||
      request.nextUrl.pathname.startsWith("/api/")
    ) {
      return response;
    }

    // Basic check: if no cookie at all, redirect to login
    // The page component will do the full verification
    const sessionToken = request.cookies.get("better-auth.session")?.value;
    
    if (!sessionToken) {
      console.log("Middleware: No session cookie, redirecting to login");
      return NextResponse.redirect(new URL("/admin/login", request.url));
    }

    // Cookie exists, let the page component verify it properly
    console.log("Middleware: Session cookie present, allowing through for page verification");
    return response;
  }

  return response;
}

export const config = {
  matcher: ["/admin/:path*"],
};

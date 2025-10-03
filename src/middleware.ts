import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

export async function middleware(request: NextRequest) {
  // Check if the request is for admin routes
  if (request.nextUrl.pathname.startsWith("/admin")) {
    // Skip middleware for admin login page and API routes
    if (
      request.nextUrl.pathname === "/admin/login" ||
      request.nextUrl.pathname.startsWith("/api/")
    ) {
      return NextResponse.next();
    }

    try {
      // Get session token from cookies
      const sessionToken = request.cookies.get("better-auth.session")?.value;
      console.log(
        "Middleware - Session token:",
        sessionToken ? "present" : "missing"
      );

      if (!sessionToken) {
        console.log("Middleware - No session token, redirecting to login");
        return NextResponse.redirect(new URL("/admin/login", request.url));
      }

      // Verify session by calling our API endpoint
      const baseUrl = request.nextUrl.origin;
      const verifyResponse = await fetch(
        `${baseUrl}/api/auth/verify-admin-session`,
        {
          headers: {
            cookie: `better-auth.session=${sessionToken}`,
          },
        }
      );

      if (!verifyResponse.ok) {
        console.log(
          "Middleware - Session verification failed, redirecting to login"
        );
        return NextResponse.redirect(new URL("/admin/login", request.url));
      }

      const verifyData = await verifyResponse.json();

      if (!verifyData.valid) {
        console.log(
          "Middleware - Invalid session or not admin, redirecting to login"
        );
        return NextResponse.redirect(new URL("/admin/login", request.url));
      }

      console.log("Middleware - Admin access granted");
      // User is authenticated admin, allow access
      return NextResponse.next();
    } catch (error) {
      console.error("Middleware error:", error);
      return NextResponse.redirect(new URL("/admin/login", request.url));
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/admin/:path*"],
};

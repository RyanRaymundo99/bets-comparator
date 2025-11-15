/**
 * Navigation utilities
 * Centralized navigation helpers
 */

/**
 * Navigate to a route (client-side only)
 */
export function navigateTo(path: string, hardRedirect: boolean = false): void {
  if (typeof window === "undefined") return;

  if (hardRedirect) {
    // Force hard redirect (useful after login to ensure cookies are set)
    window.location.href = path;
  } else {
    // Use Next.js router if available
    if (typeof window !== "undefined" && (window as { router?: unknown }).router) {
      // This would require router to be passed, so for now use hard redirect
      window.location.href = path;
    } else {
      window.location.href = path;
    }
  }
}

/**
 * Navigate with delay (useful for showing success messages before redirect)
 */
export async function navigateWithDelay(
  path: string,
  delayMs: number = 500,
  hardRedirect: boolean = true
): Promise<void> {
  await new Promise((resolve) => setTimeout(resolve, delayMs));
  navigateTo(path, hardRedirect);
}

/**
 * Logout helper - clears auth data and redirects
 */
export function logout(redirectTo: string = "/login"): void {
  // Clear cookies
  document.cookie =
    "better-auth.session=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;";

  // Clear localStorage
  if (typeof window !== "undefined") {
    localStorage.removeItem("auth-user");
    localStorage.removeItem("auth-session");
  }

  // Redirect
  navigateTo(redirectTo, true);
}


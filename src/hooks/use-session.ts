import { useState, useEffect } from "react";
import { useFetch } from "./use-fetch";

interface SessionData {
  authenticated: boolean;
  user?: {
    id: string;
    email: string;
    name: string;
  };
  sessionId?: string;
  expiresAt?: string;
}

interface UseSessionOptions {
  onAuthenticated?: (user: SessionData["user"]) => void;
  onUnauthenticated?: () => void;
  redirectTo?: string;
}

/**
 * Hook for checking authentication session
 * Replaces repetitive session checking code
 */
export function useSession(options: UseSessionOptions = {}) {
  const { onAuthenticated, onUnauthenticated, redirectTo } = options;
  const [isAuthenticated, setIsAuthenticated] = useState<boolean | null>(null);

  const { data, loading, error } = useFetch<SessionData>(
    "/api/auth/validate-session",
    {
      immediate: true,
      showToast: false,
      onSuccess: (data) => {
        const authenticated = data?.authenticated || false;
        setIsAuthenticated(authenticated);

        if (authenticated && data.user) {
          onAuthenticated?.(data.user);
        } else {
          onUnauthenticated?.();
          if (redirectTo && typeof window !== "undefined") {
            window.location.href = redirectTo;
          }
        }
      },
    }
  );

  return {
    isAuthenticated,
    user: data?.user,
    loading,
    error,
    sessionId: data?.sessionId,
    expiresAt: data?.expiresAt,
  };
}


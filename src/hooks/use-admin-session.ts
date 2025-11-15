import { useFetch } from "./use-fetch";
import { useRouter } from "next/navigation";
import { useEffect } from "react";

interface AdminSessionData {
  valid: boolean;
  user?: {
    id: string;
    name: string;
    email: string;
    role: string;
  };
  error?: string;
}

interface UseAdminSessionOptions {
  redirectTo?: string;
  onValid?: (user: AdminSessionData["user"]) => void;
}

/**
 * Hook for checking admin session
 * Automatically redirects if not admin
 */
export function useAdminSession(options: UseAdminSessionOptions = {}) {
  const { redirectTo = "/admin/login", onValid } = options;
  const router = useRouter();

  const { data, loading } = useFetch<AdminSessionData>(
    "/api/auth/verify-admin-session",
    {
      immediate: true,
      showToast: false,
      onSuccess: (data) => {
        if (data?.valid && data.user) {
          onValid?.(data.user);
        } else if (data && !data.valid) {
          router.push(redirectTo);
        }
      },
    }
  );

  return {
    isValid: data?.valid || false,
    user: data?.user,
    loading,
    error: data?.error,
  };
}


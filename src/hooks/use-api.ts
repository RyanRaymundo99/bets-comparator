import { useState, useCallback } from "react";
import { useToast } from "@/hooks/use-toast";

interface UseApiOptions<T> {
  onSuccess?: (data: T) => void;
  onError?: (error: string) => void;
  showToast?: boolean;
  successMessage?: string;
  errorMessage?: string;
}

interface UseApiReturn<T> {
  data: T | null;
  loading: boolean;
  error: string | null;
  execute: (...args: unknown[]) => Promise<T | null>;
  reset: () => void;
}

/**
 * Reusable hook for API calls with loading, error, and toast handling
 */
export function useApi<T = unknown>(
  apiCall: (...args: unknown[]) => Promise<Response>,
  options: UseApiOptions<T> = {}
): UseApiReturn<T> {
  const { onSuccess, onError, showToast = true, successMessage, errorMessage } = options;
  const { toast } = useToast();
  const [data, setData] = useState<T | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const execute = useCallback(
    async (...args: unknown[]): Promise<T | null> => {
      setLoading(true);
      setError(null);

      try {
        const response = await apiCall(...args);
        const result = await response.json();

        if (response.ok && result.success) {
          setData(result.data || result);
          onSuccess?.(result.data || result);

          if (showToast && successMessage) {
            toast({
              title: "Success",
              description: successMessage,
            });
          }

          return result.data || result;
        } else {
          const errorMsg = result.error || errorMessage || "An error occurred";
          setError(errorMsg);
          onError?.(errorMsg);

          if (showToast) {
            toast({
              variant: "destructive",
              title: "Error",
              description: errorMsg,
            });
          }

          return null;
        }
      } catch (err) {
        const errorMsg =
          err instanceof Error ? err.message : errorMessage || "An error occurred";
        setError(errorMsg);
        onError?.(errorMsg);

        if (showToast) {
          toast({
            variant: "destructive",
            title: "Error",
            description: errorMsg,
          });
        }

        return null;
      } finally {
        setLoading(false);
      }
    },
    [apiCall, onSuccess, onError, showToast, successMessage, errorMessage, toast]
  );

  const reset = useCallback(() => {
    setData(null);
    setError(null);
    setLoading(false);
  }, []);

  return { data, loading, error, execute, reset };
}


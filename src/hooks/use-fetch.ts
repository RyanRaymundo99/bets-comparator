import { useState, useEffect, useCallback } from "react";
import { useToast } from "@/hooks/use-toast";

interface UseFetchOptions<T> {
  immediate?: boolean;
  onSuccess?: (data: T) => void;
  onError?: (error: string) => void;
  showToast?: boolean;
  errorMessage?: string;
  dependencies?: unknown[];
}

interface UseFetchReturn<T> {
  data: T | null;
  loading: boolean;
  error: string | null;
  refetch: () => Promise<void>;
}

/**
 * Reusable hook for fetching data with useEffect
 * Replaces repetitive fetch patterns in components
 */
export function useFetch<T = unknown>(
  url: string | (() => string) | null,
  options: UseFetchOptions<T> = {}
): UseFetchReturn<T> {
  const {
    immediate = true,
    onSuccess,
    onError,
    showToast = false,
    errorMessage,
    dependencies = [],
  } = options;
  const { toast } = useToast();
  const [data, setData] = useState<T | null>(null);
  const [loading, setLoading] = useState(immediate);
  const [error, setError] = useState<string | null>(null);

  const fetchData = useCallback(async () => {
    if (!url) return;

    const fetchUrl = typeof url === "function" ? url() : url;
    if (!fetchUrl) return;

    setLoading(true);
    setError(null);

    try {
      const response = await fetch(fetchUrl);
      const result = await response.json();

      if (response.ok && result.success !== false) {
        const fetchedData = result.data || result;
        setData(fetchedData);
        onSuccess?.(fetchedData);
      } else {
        const errorMsg = result.error || errorMessage || "Failed to fetch data";
        setError(errorMsg);
        onError?.(errorMsg);

        if (showToast) {
          toast({
            variant: "destructive",
            title: "Error",
            description: errorMsg,
          });
        }
      }
    } catch (err) {
      const errorMsg =
        err instanceof Error ? err.message : errorMessage || "Failed to fetch data";
      setError(errorMsg);
      onError?.(errorMsg);

      if (showToast) {
        toast({
          variant: "destructive",
          title: "Error",
          description: errorMsg,
        });
      }
    } finally {
      setLoading(false);
    }
  }, [url, onSuccess, onError, showToast, errorMessage, toast]);

  useEffect(() => {
    if (immediate) {
      fetchData();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [immediate, fetchData, ...dependencies]);

  return {
    data,
    loading,
    error,
    refetch: fetchData,
  };
}


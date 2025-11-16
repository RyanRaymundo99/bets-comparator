import { useState, useEffect, useCallback, useRef, useMemo } from "react";
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
  
  // Track URLs we've successfully fetched
  const fetchedUrlsRef = useRef<Set<string>>(new Set());
  const lastFetchedUrlRef = useRef<string | null>(null);
  const isFetchingRef = useRef(false);
  const has401Ref = useRef<Set<string>>(new Set());
  
  // Store callbacks in refs
  const onSuccessRef = useRef(onSuccess);
  const onErrorRef = useRef(onError);
  const showToastRef = useRef(showToast);
  const errorMessageRef = useRef(errorMessage);
  const toastRef = useRef(toast);
  
  // Update refs when values change (this effect should not cause re-renders)
  useEffect(() => {
    onSuccessRef.current = onSuccess;
    onErrorRef.current = onError;
    showToastRef.current = showToast;
    errorMessageRef.current = errorMessage;
    toastRef.current = toast;
  }, [onSuccess, onError, showToast, errorMessage, toast]);

  // Serialize dependencies to create a stable key
  const depsKey = JSON.stringify(dependencies);
  
  // Compute URL - memoize based on dependencies
  const currentUrl = useMemo(() => {
    if (!url) return null;
    return typeof url === "function" ? url() : url;
  }, typeof url === "function" ? [depsKey] : [url]);

  // Track previous URL to detect actual changes
  const prevUrlRef = useRef<string | null>(null);

  // Fetch function - created once and stored in ref
  const fetchDataRef = useRef<((fetchUrl: string) => Promise<void>) | null>(null);
  
  if (!fetchDataRef.current) {
    fetchDataRef.current = async (fetchUrl: string) => {
      if (!fetchUrl) return;
      
      // Skip if currently fetching this URL
      if (isFetchingRef.current && lastFetchedUrlRef.current === fetchUrl) {
        return;
      }

      // Skip if we got a 401 for this URL
      if (has401Ref.current.has(fetchUrl)) {
        return;
      }

      isFetchingRef.current = true;
      lastFetchedUrlRef.current = fetchUrl;
      setError(null);
      setLoading(true);

      try {
        const response = await fetch(fetchUrl);
        const result = await response.json();

        if (response.ok && result.success !== false) {
          const fetchedData = result.data || result;
          setData(fetchedData);
          setLoading(false);
          onSuccessRef.current?.(fetchedData);
          fetchedUrlsRef.current.add(fetchUrl);
          has401Ref.current.delete(fetchUrl);
        } else {
          const errorMsg = result.error || errorMessageRef.current || "Failed to fetch data";
          setError(errorMsg);
          onErrorRef.current?.(errorMsg);

          if (response.status === 401) {
            has401Ref.current.add(fetchUrl);
          }

          if (showToastRef.current) {
            toastRef.current({
              variant: "destructive",
              title: "Error",
              description: errorMsg,
            });
          }
        }
      } catch (err) {
        const errorMsg =
          err instanceof Error ? err.message : errorMessageRef.current || "Failed to fetch data";
        setError(errorMsg);
        onErrorRef.current?.(errorMsg);

        if (showToastRef.current) {
          toastRef.current({
            variant: "destructive",
            title: "Error",
            description: errorMsg,
          });
        }
      } finally {
        setLoading(false);
        isFetchingRef.current = false;
      }
    };
  }

  const refetch = useCallback(async () => {
    if (currentUrl && fetchDataRef.current) {
      fetchedUrlsRef.current.delete(currentUrl);
      has401Ref.current.delete(currentUrl);
      lastFetchedUrlRef.current = null;
      await fetchDataRef.current(currentUrl);
    }
  }, [currentUrl]);

  // Main effect - ONLY triggers fetches, NEVER updates state
  useEffect(() => {
    if (!immediate || !currentUrl || !fetchDataRef.current) {
      return;
    }
    
    // Check if URL actually changed
    const urlChanged = prevUrlRef.current !== currentUrl;
    if (!urlChanged) {
      return;
    }
    
    // Update previous URL ref
    prevUrlRef.current = currentUrl;
    
    // Skip if we've already successfully fetched this exact URL
    if (fetchedUrlsRef.current.has(currentUrl)) {
      return;
    }
    
    // Skip if we're currently fetching this URL
    if (isFetchingRef.current && lastFetchedUrlRef.current === currentUrl) {
      return;
    }
    
    // Fetch the new URL
    fetchDataRef.current(currentUrl);
  }, [immediate, currentUrl]);

  return {
    data,
    loading,
    error,
    refetch,
  };
}

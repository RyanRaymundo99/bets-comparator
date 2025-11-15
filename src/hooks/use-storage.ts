import { useState, useEffect, useCallback } from "react";
import {
  getStorageItem,
  setStorageItem,
  removeStorageItem,
  setStorageObject,
} from "@/lib/storage";

/**
 * Hook for localStorage with reactive state
 */
export function useStorage<T = string>(
  key: string,
  initialValue?: T
): [T | null, (value: T | null) => void, () => void] {
  const [storedValue, setStoredValue] = useState<T | null>(() => {
    if (typeof window === "undefined") {
      return initialValue ?? null;
    }

    try {
      const item = getStorageItem(key);
      if (item === null) return initialValue ?? null;

      // Try to parse as JSON, fallback to string
      try {
        return JSON.parse(item) as T;
      } catch {
        return (item as unknown as T) ?? initialValue ?? null;
      }
    } catch {
      return initialValue ?? null;
    }
  });

  const setValue = useCallback(
    (value: T | null) => {
      try {
        setStoredValue(value);
        if (value === null) {
          removeStorageItem(key);
        } else if (typeof value === "string") {
          setStorageItem(key, value);
        } else {
          setStorageObject(key, value);
        }
      } catch {
        // Silently fail - storage might be disabled
      }
    },
    [key]
  );

  const removeValue = useCallback(() => {
    try {
      setStoredValue(null);
      removeStorageItem(key);
    } catch {
      // Silently fail - storage might be disabled
    }
  }, [key]);

  // Listen for changes from other tabs/windows
  useEffect(() => {
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === key && e.newValue !== null) {
        try {
          setStoredValue(JSON.parse(e.newValue) as T);
        } catch {
          setStoredValue(e.newValue as unknown as T);
        }
      } else if (e.key === key && e.newValue === null) {
        setStoredValue(null);
      }
    };

    window.addEventListener("storage", handleStorageChange);
    return () => window.removeEventListener("storage", handleStorageChange);
  }, [key]);

  return [storedValue, setValue, removeValue];
}

/**
 * Hook for boolean storage (e.g., dismissed banners)
 */
export function useStorageBoolean(
  key: string,
  defaultValue: boolean = false
): [boolean, (value: boolean) => void, () => void] {
  const [value, setValue, removeValue] = useStorage<boolean>(key, defaultValue);

  const setBoolean = useCallback(
    (newValue: boolean) => {
      setValue(newValue);
    },
    [setValue]
  );

  return [value ?? defaultValue, setBoolean, removeValue];
}


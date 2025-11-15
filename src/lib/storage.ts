/**
 * Safe localStorage utilities with error handling
 * Replaces direct localStorage access throughout the codebase
 */

/**
 * Get item from localStorage safely
 */
export function getStorageItem(key: string): string | null {
  if (typeof window === "undefined") return null;
  try {
    return localStorage.getItem(key);
  } catch {
    return null;
  }
}

/**
 * Set item in localStorage safely
 */
export function setStorageItem(key: string, value: string): boolean {
  if (typeof window === "undefined") return false;
  try {
    localStorage.setItem(key, value);
    return true;
  } catch {
    return false;
  }
}

/**
 * Remove item from localStorage safely
 */
export function removeStorageItem(key: string): boolean {
  if (typeof window === "undefined") return false;
  try {
    localStorage.removeItem(key);
    return true;
  } catch {
    return false;
  }
}

/**
 * Get JSON object from localStorage
 */
export function getStorageObject<T>(key: string): T | null {
  const item = getStorageItem(key);
  if (!item) return null;
  try {
    return JSON.parse(item) as T;
  } catch {
    return null;
  }
}

/**
 * Set JSON object in localStorage
 */
export function setStorageObject<T>(key: string, value: T): boolean {
  try {
    const json = JSON.stringify(value);
    return setStorageItem(key, json);
  } catch {
    return false;
  }
}

/**
 * Check if a key exists in localStorage
 */
export function hasStorageItem(key: string): boolean {
  return getStorageItem(key) !== null;
}

/**
 * Clear all localStorage (use with caution)
 */
export function clearStorage(): boolean {
  if (typeof window === "undefined") return false;
  try {
    localStorage.clear();
    return true;
  } catch {
    return false;
  }
}


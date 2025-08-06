// Session management utilities
import {
  safeLocalStorageGet,
  safeLocalStorageSet,
  safeLocalStorageRemove,
} from "./utils";

export interface UserSession {
  email: string;
  name: string;
  role: string;
  timestamp: number;
}
const SESSION_KEY = "dev-session";
const USER_KEY = "dev-user";

export class SessionManager {
  /**
   * Create a new user session
   */
  static createSession(userData: Omit<UserSession, "timestamp">): void {
    const sessionData: UserSession = {
      ...userData,
      timestamp: Date.now(),
    };

    // Store in localStorage
    safeLocalStorageSet(SESSION_KEY, "true");
    safeLocalStorageSet(USER_KEY, JSON.stringify(sessionData));

    // Set secure cookie (no expiration)
    document.cookie = `${SESSION_KEY}=true; path=/; SameSite=Strict`;
  }

  /**
   * Get current session data
   */
  static getSession(): UserSession | null {
    try {
      const sessionExists = safeLocalStorageGet(SESSION_KEY);
      const userDataStr = safeLocalStorageGet(USER_KEY);

      if (sessionExists !== "true" || !userDataStr) {
        return null;
      }

      const userData: UserSession = JSON.parse(userDataStr);
      return userData;
    } catch (error) {
      console.error("Error parsing session data:", error);
      this.clearSession();
      return null;
    }
  }

  /**
   * Check if session is valid
   */
  static isSessionValid(): boolean {
    return this.getSession() !== null;
  }

  /**
   * Clear session data
   */
  static clearSession(): void {
    safeLocalStorageRemove(SESSION_KEY);
    safeLocalStorageRemove(USER_KEY);

    // Clear cookie
    document.cookie = `${SESSION_KEY}=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT`;
  }

  /**
   * Get session info for display
   */
  static getSessionInfo(): {
    isValid: boolean;
    user?: UserSession;
  } {
    const session = this.getSession();

    return {
      isValid: session !== null,
      user: session || undefined,
    };
  }
}

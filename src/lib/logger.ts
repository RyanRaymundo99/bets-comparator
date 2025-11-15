/**
 * Centralized logging utility
 * Replaces console.log/error throughout the codebase
 */

type LogLevel = "debug" | "info" | "warn" | "error";

interface LogContext {
  [key: string]: unknown;
}

class Logger {
  private isDevelopment = process.env.NODE_ENV === "development";

  private log(level: LogLevel, message: string, context?: LogContext) {
    const timestamp = new Date().toISOString();
    const logEntry = {
      timestamp,
      level,
      message,
      ...(context && { context }),
    };

    // In production, only log errors and warnings
    if (!this.isDevelopment && (level === "debug" || level === "info")) {
      return;
    }

    switch (level) {
      case "debug":
        console.debug(`[DEBUG] ${message}`, context || "");
        break;
      case "info":
        console.log(`[INFO] ${message}`, context || "");
        break;
      case "warn":
        console.warn(`[WARN] ${message}`, context || "");
        break;
      case "error":
        console.error(`[ERROR] ${message}`, context || "");
        break;
    }
  }

  debug(message: string, context?: LogContext) {
    this.log("debug", message, context);
  }

  info(message: string, context?: LogContext) {
    this.log("info", message, context);
  }

  warn(message: string, context?: LogContext) {
    this.log("warn", message, context);
  }

  error(message: string, error?: Error | unknown, context?: LogContext) {
    const errorContext = {
      ...context,
      ...(error instanceof Error
        ? {
            errorMessage: error.message,
            errorStack: error.stack,
            errorName: error.name,
          }
        : { error }),
    };
    this.log("error", message, errorContext);
  }
}

export const logger = new Logger();


/**
 * Standardized Logger
 * Provides consistent logging with environment-based verbosity
 */

const isDev = import.meta.env.DEV;

/**
 * Create a logger for a specific context
 */
export function createLogger(context) {
  return {
    error: (message, data) => {
      if (!isDev) return;
      const timestamp = new Date().toISOString();
      console.error(`[${timestamp}] [ERROR] [${context}]`, message, data);
    },
    warn: (message, data) => {
      if (!isDev) return;
      const timestamp = new Date().toISOString();
      console.warn(`[${timestamp}] [WARN] [${context}]`, message, data);
    },
    info: (message, data) => {
      if (!isDev) return;
      const timestamp = new Date().toISOString();
      console.log(`[${timestamp}] [INFO] [${context}]`, message, data);
    },
    debug: (message, data) => {
      if (!isDev) return;
      const timestamp = new Date().toISOString();
      console.log(`[${timestamp}] [DEBUG] [${context}]`, message, data);
    },
  };
}

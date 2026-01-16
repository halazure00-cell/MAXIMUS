/**
 * Standardized Logger
 * Provides consistent logging with environment-based verbosity
 */

const isDev = import.meta.env.DEV;

const LogLevel = {
  ERROR: 0,
  WARN: 1,
  INFO: 2,
  DEBUG: 3,
};

const currentLevel = isDev ? LogLevel.DEBUG : LogLevel.WARN;

/**
 * Format log message with timestamp and context
 */
function formatMessage(level, context, message, data) {
  const timestamp = new Date().toISOString();
  const prefix = `[${timestamp}] [${level}] [${context}]`;
  
  if (data !== undefined) {
    return [prefix, message, data];
  }
  return [prefix, message];
}

/**
 * Log error
 */
export function logError(context, message, data) {
  if (currentLevel >= LogLevel.ERROR) {
    console.error(...formatMessage('ERROR', context, message, data));
  }
}

/**
 * Log warning
 */
export function logWarn(context, message, data) {
  if (currentLevel >= LogLevel.WARN) {
    console.warn(...formatMessage('WARN', context, message, data));
  }
}

/**
 * Log info
 */
export function logInfo(context, message, data) {
  if (currentLevel >= LogLevel.INFO) {
    console.log(...formatMessage('INFO', context, message, data));
  }
}

/**
 * Log debug
 */
export function logDebug(context, message, data) {
  if (currentLevel >= LogLevel.DEBUG) {
    console.log(...formatMessage('DEBUG', context, message, data));
  }
}

/**
 * Create a logger for a specific context
 */
export function createLogger(context) {
  return {
    error: (message, data) => logError(context, message, data),
    warn: (message, data) => logWarn(context, message, data),
    info: (message, data) => logInfo(context, message, data),
    debug: (message, data) => logDebug(context, message, data),
  };
}

/**
 * Log performance metric
 */
export function logPerformance(context, label, durationMs) {
  if (currentLevel >= LogLevel.INFO) {
    console.log(`[PERF] [${context}] ${label}: ${durationMs.toFixed(2)}ms`);
  }
}

/**
 * Create a performance timer
 */
export function startTimer(context, label) {
  const start = performance.now();
  
  return () => {
    const end = performance.now();
    logPerformance(context, label, end - start);
  };
}

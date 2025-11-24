/**
 * Logger Utility
 * 
 * Provides logging functionality that automatically disables in production builds.
 * This helps keep the console clean in production while maintaining debugging
 * capabilities during development.
 * 
 * @example
 * ```typescript
 * import { logger } from '@/utils/logger';
 * 
 * logger.log('User logged in:', userData);
 * logger.group('Calculation Steps');
 * logger.log('Step 1: Calculate total');
 * logger.groupEnd();
 * ```
 */

const isDevelopment = import.meta.env.DEV;

/**
 * Logger object with methods that mirror console API
 * but only execute in development mode
 */
export const logger = {
  /**
   * Log a message to the console (dev only)
   */
  log: (...args: any[]): void => {
    if (isDevelopment) {
      console.log(...args);
    }
  },

  /**
   * Log an error message (always shown, even in production)
   */
  error: (...args: any[]): void => {
    console.error(...args);
  },

  /**
   * Log a warning message (dev only)
   */
  warn: (...args: any[]): void => {
    if (isDevelopment) {
      console.warn(...args);
    }
  },

  /**
   * Log an info message (dev only)
   */
  info: (...args: any[]): void => {
    if (isDevelopment) {
      console.info(...args);
    }
  },

  /**
   * Start a collapsible group in the console (dev only)
   */
  group: (label: string): void => {
    if (isDevelopment) {
      console.group(label);
    }
  },

  /**
   * Start a collapsed group in the console (dev only)
   */
  groupCollapsed: (label: string): void => {
    if (isDevelopment) {
      console.groupCollapsed(label);
    }
  },

  /**
   * End the current console group (dev only)
   */
  groupEnd: (): void => {
    if (isDevelopment) {
      console.groupEnd();
    }
  },

  /**
   * Clear the console (dev only)
   */
  clear: (): void => {
    if (isDevelopment) {
      console.clear();
    }
  },

  /**
   * Log a table (dev only)
   */
  table: (data: any): void => {
    if (isDevelopment) {
      console.table(data);
    }
  },

  /**
   * Start a timer (dev only)
   */
  time: (label: string): void => {
    if (isDevelopment) {
      console.time(label);
    }
  },

  /**
   * End a timer and log the elapsed time (dev only)
   */
  timeEnd: (label: string): void => {
    if (isDevelopment) {
      console.timeEnd(label);
    }
  },
};

/**
 * Type-safe logger for specific modules
 * Adds a prefix to all log messages for easier filtering
 * 
 * @example
 * ```typescript
 * const calcLogger = createModuleLogger('Calculations');
 * calcLogger.log('Total:', total); // Logs: "[Calculations] Total: 100"
 * ```
 */
export const createModuleLogger = (moduleName: string) => ({
  log: (...args: any[]) => logger.log(`[${moduleName}]`, ...args),
  error: (...args: any[]) => logger.error(`[${moduleName}]`, ...args),
  warn: (...args: any[]) => logger.warn(`[${moduleName}]`, ...args),
  info: (...args: any[]) => logger.info(`[${moduleName}]`, ...args),
  group: (label: string) => logger.group(`[${moduleName}] ${label}`),
  groupCollapsed: (label: string) => logger.groupCollapsed(`[${moduleName}] ${label}`),
  groupEnd: () => logger.groupEnd(),
});

export default logger;

/**
 * Logging utility for production-safe logging
 * Removes debug logs in production while keeping errors
 */

const isDevelopment = process.env.NODE_ENV === 'development';

export const logger = {
  /**
   * Log debug information (only in development)
   */
  debug: (...args) => {
    if (isDevelopment) {
      console.log('[DEBUG]', ...args);
    }
  },

  /**
   * Log informational messages (only in development)
   */
  info: (...args) => {
    if (isDevelopment) {
      console.info('[INFO]', ...args);
    }
  },

  /**
   * Log warnings (always logged)
   */
  warn: (...args) => {
    console.warn('[WARN]', ...args);
  },

  /**
   * Log errors (always logged)
   */
  error: (...args) => {
    console.error('[ERROR]', ...args);
  },
};

export default logger;

/**
 * Debug configuration for development vs production
 * Set ENABLE_VERBOSE_LOGGING to false for production builds
 */

/**
 * Enable verbose console logging for debugging
 * Set to false in production for better performance
 * Currently disabled by default to optimize OSC message sending
 */
export const ENABLE_VERBOSE_LOGGING = false // Set to true only for debugging

/**
 * Conditional logging utility - only logs if verbose logging is enabled
 */
export const debugLog = (...args: any[]) => {
  if (ENABLE_VERBOSE_LOGGING) {
    console.log(...args)
  }
}

/**
 * Always log errors regardless of debug mode
 */
export const errorLog = (...args: any[]) => {
  console.error(...args)
}

/**
 * Always log warnings regardless of debug mode
 */
export const warnLog = (...args: any[]) => {
  console.warn(...args)
}

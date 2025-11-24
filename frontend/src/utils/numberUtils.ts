/**
 * Number Utilities
 * 
 * Type-safe utilities for number conversions and operations.
 * Helps prevent NaN and undefined issues in calculations.
 */

/**
 * Safely convert a value to a number with a default fallback
 * 
 * @param value - The value to convert to a number
 * @param defaultValue - The default value to return if conversion fails (default: 0)
 * @returns A valid number or the default value
 * 
 * @example
 * ```typescript
 * safeNumber("123")      // 123
 * safeNumber("abc")      // 0
 * safeNumber(null)       // 0
 * safeNumber(undefined)  // 0
 * safeNumber("", 10)     // 10
 * ```
 */
export const safeNumber = (value: unknown, defaultValue = 0): number => {
  if (value === null || value === undefined || value === '') {
    return defaultValue;
  }

  const num = Number(value);
  return Number.isNaN(num) ? defaultValue : num;
};

/**
 * Safely convert a value to a string
 * 
 * @param value - The value to convert to a string
 * @param defaultValue - The default value to return if value is null/undefined (default: '')
 * @returns A string or the default value
 * 
 * @example
 * ```typescript
 * safeString(123)        // "123"
 * safeString(null)       // ""
 * safeString(undefined)  // ""
 * safeString(null, "N/A") // "N/A"
 * ```
 */
export const safeString = (value: unknown, defaultValue = ''): string => {
  if (value === null || value === undefined) {
    return defaultValue;
  }
  return String(value);
};

/**
 * Format a number to a fixed number of decimal places
 * Returns null if the input is not a valid number
 * 
 * @param value - The value to format
 * @param decimals - Number of decimal places (default: 2)
 * @returns Formatted number string or null
 * 
 * @example
 * ```typescript
 * formatNumber(123.456, 2)    // "123.46"
 * formatNumber(123.456, 0)    // "123"
 * formatNumber("abc", 2)      // null
 * formatNumber(null, 2)       // null
 * ```
 */
export const formatNumber = (value: unknown, decimals = 2): string | null => {
  const num = safeNumber(value, NaN);
  if (Number.isNaN(num)) {
    return null;
  }
  return num.toFixed(decimals);
};

/**
 * Clamp a number between a minimum and maximum value
 * 
 * @param value - The value to clamp
 * @param min - Minimum value
 * @param max - Maximum value
 * @returns Clamped number
 * 
 * @example
 * ```typescript
 * clamp(5, 0, 10)    // 5
 * clamp(-5, 0, 10)   // 0
 * clamp(15, 0, 10)   // 10
 * ```
 */
export const clamp = (value: number, min: number, max: number): number => {
  return Math.min(Math.max(value, min), max);
};

/**
 * Check if a value is a valid number (not NaN, not Infinity)
 * 
 * @param value - The value to check
 * @returns true if the value is a valid number
 * 
 * @example
 * ```typescript
 * isValidNumber(123)        // true
 * isValidNumber("123")      // false (it's a string)
 * isValidNumber(NaN)        // false
 * isValidNumber(Infinity)   // false
 * ```
 */
export const isValidNumber = (value: unknown): value is number => {
  return typeof value === 'number' && !Number.isNaN(value) && Number.isFinite(value);
};

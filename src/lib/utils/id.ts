/**
 * ID Conversion Utilities
 *
 * This module provides type-safe utilities for converting between string IDs
 * (used in the application/API layer) and numeric IDs (used in IndexedDB).
 *
 * The local-first architecture uses IndexedDB with auto-incrementing numeric IDs,
 * while the UI and API layers use string IDs for consistency with potential
 * future Supabase/UUID integration.
 */

/**
 * Converts a string ID to a numeric ID for IndexedDB operations.
 *
 * @param id - The string ID to convert
 * @returns The numeric ID, or null if conversion fails
 *
 * @example
 * const numId = toNumericId("123"); // 123
 * const invalid = toNumericId("abc"); // null
 * const empty = toNumericId(""); // null
 */
export function toNumericId(id: string | undefined | null): number | null {
  if (!id) return null;
  const num = parseInt(id, 10);
  return isNaN(num) ? null : num;
}

/**
 * Converts a string ID to a numeric ID, throwing if invalid.
 * Use this when the ID is required and should always be valid.
 *
 * @param id - The string ID to convert
 * @param context - Optional context for error message (e.g., "group_id")
 * @returns The numeric ID
 * @throws Error if ID is invalid
 *
 * @example
 * const numId = toNumericIdOrThrow("123"); // 123
 * const invalid = toNumericIdOrThrow("abc"); // throws Error
 */
export function toNumericIdOrThrow(id: string | undefined | null, context?: string): number {
  const numId = toNumericId(id);
  if (numId === null) {
    const contextStr = context ? ` for ${context}` : '';
    throw new Error(`Invalid ID${contextStr}: ${id}`);
  }
  return numId;
}

/**
 * Converts a numeric ID to a string ID for API/UI layer.
 *
 * @param id - The numeric ID to convert
 * @returns The string ID, or null if input is undefined/null
 *
 * @example
 * const strId = toStringId(123); // "123"
 * const empty = toStringId(undefined); // null
 */
export function toStringId(id: number | undefined | null): string | null {
  if (id === undefined || id === null) return null;
  return String(id);
}

/**
 * Converts a numeric ID to a string ID, with a fallback value.
 * Useful for required ID fields where null is not acceptable.
 *
 * @param id - The numeric ID to convert
 * @param fallback - The fallback value if ID is null/undefined (default: "")
 * @returns The string ID or fallback
 *
 * @example
 * const strId = toStringIdOr(123); // "123"
 * const empty = toStringIdOr(undefined); // ""
 * const custom = toStringIdOr(undefined, "new"); // "new"
 */
export function toStringIdOr(id: number | undefined | null, fallback: string = ''): string {
  return toStringId(id) ?? fallback;
}

/**
 * Type guard to check if a value is a valid numeric ID.
 *
 * @param value - The value to check
 * @returns True if value is a positive integer
 *
 * @example
 * isValidNumericId(123); // true
 * isValidNumericId(-1); // false
 * isValidNumericId(0); // false
 * isValidNumericId(1.5); // false
 */
export function isValidNumericId(value: unknown): value is number {
  return typeof value === 'number' && Number.isInteger(value) && value > 0;
}

/**
 * Type guard to check if a string represents a valid numeric ID.
 *
 * @param value - The string to check
 * @returns True if string can be converted to a valid numeric ID
 *
 * @example
 * isValidStringId("123"); // true
 * isValidStringId("abc"); // false
 * isValidStringId(""); // false
 * isValidStringId("-1"); // false
 */
export function isValidStringId(value: string | undefined | null): boolean {
  if (!value) return false;
  const num = parseInt(value, 10);
  return !isNaN(num) && num > 0 && String(num) === value;
}

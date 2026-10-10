import crypto from 'crypto';

/**
 * Timing-safe comparison of two strings using crypto.timingSafeEqual.
 * Prevents timing attacks on token comparisons.
 */
export function safeCompare(a: string, b: string): boolean {
  if (a.length !== b.length) return false;
  return crypto.timingSafeEqual(Buffer.from(a), Buffer.from(b));
}

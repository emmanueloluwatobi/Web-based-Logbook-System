/**
 * In-memory sliding window rate limiter for unauthenticated server actions and public routes.
 * Tracks requests per identifier (IP address, email, or composite key) across a rolling time window.
 */

interface RateLimitRecord {
  timestamps: number[];
}

const rateLimitStore = new Map<string, RateLimitRecord>();

// Periodic cleanup to avoid memory growth in long-running processes
if (typeof setInterval !== "undefined") {
  const timer = setInterval(() => {
    const now = Date.now();
    for (const [key, record] of rateLimitStore.entries()) {
      record.timestamps = record.timestamps.filter((ts) => now - ts < 10 * 60 * 1000);
      if (record.timestamps.length === 0) {
        rateLimitStore.delete(key);
      }
    }
  }, 5 * 60 * 1000);

  timer.unref?.();
}

export interface RateLimitConfig {
  limit: number; // Maximum allowed requests
  windowMs: number; // Rolling window in milliseconds
}

export interface RateLimitResult {
  allowed: boolean;
  remaining: number;
  resetMs: number;
}

/**
 * Checks if an action with the specified key exceeds rate limit limits.
 */
export function checkRateLimit(
  key: string,
  config: RateLimitConfig = { limit: 5, windowMs: 60_000 }
): RateLimitResult {
  const now = Date.now();
  const record = rateLimitStore.get(key) || { timestamps: [] };

  // Remove timestamps outside current window
  record.timestamps = record.timestamps.filter((ts) => now - ts < config.windowMs);

  if (record.timestamps.length >= config.limit) {
    const oldestTimestamp = record.timestamps[0];
    const resetMs = config.windowMs - (now - oldestTimestamp);
    return { allowed: false, remaining: 0, resetMs: Math.max(0, resetMs) };
  }

  record.timestamps.push(now);
  rateLimitStore.set(key, record);

  return {
    allowed: true,
    remaining: config.limit - record.timestamps.length,
    resetMs: config.windowMs,
  };
}

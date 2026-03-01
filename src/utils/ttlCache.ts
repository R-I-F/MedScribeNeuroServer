/**
 * In-memory TTL cache. Use for short-lived, per-tenant caching (e.g. academic ranking, event dashboard).
 * Entries expire after ttlMs; expired entries are removed on next get.
 */

export interface ITtlCacheEntry<T> {
  value: T;
  expiresAt: number;
}

export interface ITtlCache<T> {
  get(key: string): T | undefined;
  set(key: string, value: T, ttlMs: number): void;
  invalidate(key: string): void;
}

/**
 * Creates a new TTL cache instance. Each instance has its own key-value store.
 * Use one instance per cached data type (e.g. academic points map, events dashboard list).
 */
export function createTtlCache<T>(): ITtlCache<T> {
  const store = new Map<string, ITtlCacheEntry<T>>();

  return {
    get(key: string): T | undefined {
      const entry = store.get(key);
      if (!entry) return undefined;
      if (Date.now() > entry.expiresAt) {
        store.delete(key);
        return undefined;
      }
      return entry.value;
    },

    set(key: string, value: T, ttlMs: number): void {
      store.set(key, {
        value,
        expiresAt: Date.now() + ttlMs,
      });
    },

    invalidate(key: string): void {
      store.delete(key);
    },
  };
}

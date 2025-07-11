interface CacheItem<T> {
  data: T;
  timestamp: number;
  ttl: number; // Time to live in milliseconds
}

class CacheManager {
  private cache = new Map<string, CacheItem<any>>();
  private defaultTTL = 5 * 60 * 1000; // 5 minutes

  set<T>(key: string, data: T, ttl?: number): void {
    const item: CacheItem<T> = {
      data,
      timestamp: Date.now(),
      ttl: ttl || this.defaultTTL
    };
    
    this.cache.set(key, item);
  }

  get<T>(key: string): T | null {
    const item = this.cache.get(key);
    
    if (!item) {
      return null;
    }

    // Check if item has expired
    if (Date.now() - item.timestamp > item.ttl) {
      this.cache.delete(key);
      return null;
    }

    return item.data as T;
  }

  has(key: string): boolean {
    const item = this.cache.get(key);
    
    if (!item) {
      return false;
    }

    // Check if item has expired
    if (Date.now() - item.timestamp > item.ttl) {
      this.cache.delete(key);
      return false;
    }

    return true;
  }

  delete(key: string): boolean {
    return this.cache.delete(key);
  }

  clear(): void {
    this.cache.clear();
  }

  // Clear expired items
  cleanup(): void {
    const now = Date.now();
    
    for (const [key, item] of this.cache.entries()) {
      if (now - item.timestamp > item.ttl) {
        this.cache.delete(key);
      }
    }
  }

  // Get cache statistics
  getStats(): {
    size: number;
    keys: string[];
    memoryUsage: number;
  } {
    return {
      size: this.cache.size,
      keys: Array.from(this.cache.keys()),
      memoryUsage: JSON.stringify(Array.from(this.cache.entries())).length
    };
  }

  // Create cache key from parameters
  createKey(prefix: string, params?: Record<string, any>): string {
    if (!params) {
      return prefix;
    }

    const sortedParams = Object.keys(params)
      .sort()
      .map(key => `${key}=${JSON.stringify(params[key])}`)
      .join('&');

    return `${prefix}?${sortedParams}`;
  }
}

// Create singleton instance
export const cache = new CacheManager();

// React hook for cached API calls
import { useState, useEffect, useCallback } from 'react';

export interface UseCachedDataOptions<T> {
  key: string;
  fetcher: () => Promise<T>;
  ttl?: number;
  dependencies?: any[];
  enabled?: boolean;
}

export function useCachedData<T>({
  key,
  fetcher,
  ttl,
  dependencies = [],
  enabled = true
}: UseCachedDataOptions<T>) {
  const [data, setData] = useState<T | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  const fetchData = useCallback(async (useCache = true) => {
    if (!enabled) return;

    setIsLoading(true);
    setError(null);

    try {
      // Check cache first
      if (useCache && cache.has(key)) {
        const cachedData = cache.get<T>(key);
        if (cachedData) {
          setData(cachedData);
          setIsLoading(false);
          return cachedData;
        }
      }

      // Fetch fresh data
      const freshData = await fetcher();
      
      // Cache the result
      cache.set(key, freshData, ttl);
      setData(freshData);
      
      return freshData;
    } catch (err) {
      setError(err as Error);
      throw err;
    } finally {
      setIsLoading(false);
    }
  }, [key, fetcher, ttl, enabled]);

  const invalidate = useCallback(() => {
    cache.delete(key);
  }, [key]);

  const refresh = useCallback(() => {
    return fetchData(false);
  }, [fetchData]);

  useEffect(() => {
    fetchData();
  }, [fetchData, ...dependencies]);

  return {
    data,
    isLoading,
    error,
    refresh,
    invalidate,
    fetchData
  };
}

// Utility for batch cache operations
export class BatchCache {
  private operations: Array<() => void> = [];

  add(operation: () => void): void {
    this.operations.push(operation);
  }

  execute(): void {
    this.operations.forEach(op => op());
    this.operations = [];
  }

  clear(): void {
    this.operations = [];
  }
}

// Cache invalidation patterns
export const CacheKeys = {
  TRANSACTIONS: 'transactions',
  CATEGORIES: 'categories',
  BUDGETS: 'budgets',
  STATS: 'stats',
  
  // Helper methods
  transactions: (filters?: any) => cache.createKey(CacheKeys.TRANSACTIONS, filters),
  categories: (type?: string) => cache.createKey(CacheKeys.CATEGORIES, { type }),
  budgets: (filters?: any) => cache.createKey(CacheKeys.BUDGETS, filters),
  stats: (period?: string) => cache.createKey(CacheKeys.STATS, { period }),
};

// Cache invalidation helpers
export const invalidateRelatedCaches = {
  onTransactionChange: () => {
    cache.delete(CacheKeys.TRANSACTIONS);
    cache.delete(CacheKeys.STATS);
    cache.delete(CacheKeys.BUDGETS);
  },
  
  onCategoryChange: () => {
    cache.delete(CacheKeys.CATEGORIES);
    cache.delete(CacheKeys.TRANSACTIONS);
  },
  
  onBudgetChange: () => {
    cache.delete(CacheKeys.BUDGETS);
  }
};

export default cache;

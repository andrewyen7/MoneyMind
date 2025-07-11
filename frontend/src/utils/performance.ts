interface PerformanceMetric {
  name: string;
  startTime: number;
  endTime?: number;
  duration?: number;
  metadata?: Record<string, any>;
}

class PerformanceMonitor {
  private metrics: Map<string, PerformanceMetric> = new Map();
  private completedMetrics: PerformanceMetric[] = [];

  // Start timing an operation
  start(name: string, metadata?: Record<string, any>): void {
    const metric: PerformanceMetric = {
      name,
      startTime: performance.now(),
      metadata
    };
    
    this.metrics.set(name, metric);
  }

  // End timing an operation
  end(name: string): number | null {
    const metric = this.metrics.get(name);
    
    if (!metric) {
      console.warn(`Performance metric "${name}" not found`);
      return null;
    }

    const endTime = performance.now();
    const duration = endTime - metric.startTime;

    const completedMetric: PerformanceMetric = {
      ...metric,
      endTime,
      duration
    };

    this.completedMetrics.push(completedMetric);
    this.metrics.delete(name);

    // Log slow operations in development
    if (process.env.NODE_ENV === 'development' && duration > 1000) {
      console.warn(`Slow operation detected: ${name} took ${duration.toFixed(2)}ms`);
    }

    return duration;
  }

  // Measure a function execution
  async measure<T>(name: string, fn: () => Promise<T>, metadata?: Record<string, any>): Promise<T> {
    this.start(name, metadata);
    try {
      const result = await fn();
      return result;
    } finally {
      this.end(name);
    }
  }

  // Measure a synchronous function
  measureSync<T>(name: string, fn: () => T, metadata?: Record<string, any>): T {
    this.start(name, metadata);
    try {
      const result = fn();
      return result;
    } finally {
      this.end(name);
    }
  }

  // Get all completed metrics
  getMetrics(): PerformanceMetric[] {
    return [...this.completedMetrics];
  }

  // Get metrics by name pattern
  getMetricsByPattern(pattern: RegExp): PerformanceMetric[] {
    return this.completedMetrics.filter(metric => pattern.test(metric.name));
  }

  // Get average duration for operations with the same name
  getAverageDuration(name: string): number | null {
    const metrics = this.completedMetrics.filter(m => m.name === name);
    
    if (metrics.length === 0) {
      return null;
    }

    const totalDuration = metrics.reduce((sum, m) => sum + (m.duration || 0), 0);
    return totalDuration / metrics.length;
  }

  // Clear all metrics
  clear(): void {
    this.metrics.clear();
    this.completedMetrics = [];
  }

  // Get performance summary
  getSummary(): {
    totalOperations: number;
    averageDuration: number;
    slowestOperation: PerformanceMetric | null;
    fastestOperation: PerformanceMetric | null;
  } {
    const operations = this.completedMetrics.filter(m => m.duration !== undefined);
    
    if (operations.length === 0) {
      return {
        totalOperations: 0,
        averageDuration: 0,
        slowestOperation: null,
        fastestOperation: null
      };
    }

    const durations = operations.map(m => m.duration!);
    const totalDuration = durations.reduce((sum, d) => sum + d, 0);
    const averageDuration = totalDuration / durations.length;

    const slowestOperation = operations.reduce((slowest, current) => 
      (current.duration! > slowest.duration!) ? current : slowest
    );

    const fastestOperation = operations.reduce((fastest, current) => 
      (current.duration! < fastest.duration!) ? current : fastest
    );

    return {
      totalOperations: operations.length,
      averageDuration,
      slowestOperation,
      fastestOperation
    };
  }
}

// Create singleton instance
export const performanceMonitor = new PerformanceMonitor();

// React hook for measuring component render performance
import { useEffect, useRef } from 'react';

export function useRenderPerformance(componentName: string) {
  const renderCount = useRef(0);
  const lastRenderTime = useRef(performance.now());

  useEffect(() => {
    renderCount.current++;
    const currentTime = performance.now();
    const timeSinceLastRender = currentTime - lastRenderTime.current;
    
    if (renderCount.current > 1) {
      performanceMonitor.start(`${componentName}-render-${renderCount.current}`);
      performanceMonitor.end(`${componentName}-render-${renderCount.current}`);
    }
    
    lastRenderTime.current = currentTime;

    // Log excessive re-renders in development
    if (process.env.NODE_ENV === 'development' && renderCount.current > 10) {
      console.warn(`Component ${componentName} has rendered ${renderCount.current} times`);
    }
  });

  return {
    renderCount: renderCount.current,
    resetCount: () => { renderCount.current = 0; }
  };
}

// Hook for measuring API call performance
export function useApiPerformance() {
  const measureApiCall = async <T>(
    name: string,
    apiCall: () => Promise<T>,
    metadata?: Record<string, any>
  ): Promise<T> => {
    return performanceMonitor.measure(`api-${name}`, apiCall, metadata);
  };

  return { measureApiCall };
}

// Debounce utility for performance optimization
export function debounce<T extends (...args: any[]) => any>(
  func: T,
  wait: number,
  immediate = false
): (...args: Parameters<T>) => void {
  let timeout: NodeJS.Timeout | null = null;

  return function executedFunction(...args: Parameters<T>) {
    const later = () => {
      timeout = null;
      if (!immediate) func(...args);
    };

    const callNow = immediate && !timeout;

    if (timeout) clearTimeout(timeout);
    timeout = setTimeout(later, wait);

    if (callNow) func(...args);
  };
}

// Throttle utility for performance optimization
export function throttle<T extends (...args: any[]) => any>(
  func: T,
  limit: number
): (...args: Parameters<T>) => void {
  let inThrottle: boolean;

  return function executedFunction(this: any, ...args: Parameters<T>) {
    if (!inThrottle) {
      func.apply(this, args);
      inThrottle = true;
      setTimeout(() => inThrottle = false, limit);
    }
  };
}

// Lazy loading utility
export function createLazyComponent<T extends React.ComponentType<any>>(
  importFunc: () => Promise<{ default: T }>,
  fallback?: React.ComponentType
) {
  const LazyComponent = React.lazy(importFunc);

  return (props: React.ComponentProps<T>) => {
    const fallbackElement = fallback ? React.createElement(fallback) : React.createElement('div', {}, 'Loading...');

    return React.createElement(
      React.Suspense,
      { fallback: fallbackElement },
      React.createElement(LazyComponent, props)
    );
  };
}

// Memory usage monitoring
export function getMemoryUsage(): {
  usedJSHeapSize: number;
  totalJSHeapSize: number;
  jsHeapSizeLimit: number;
} | null {
  if ('memory' in performance) {
    const memory = (performance as any).memory;
    return {
      usedJSHeapSize: memory.usedJSHeapSize,
      totalJSHeapSize: memory.totalJSHeapSize,
      jsHeapSizeLimit: memory.jsHeapSizeLimit
    };
  }
  return null;
}

// Bundle size analyzer (development only)
export function analyzeBundleSize() {
  if (process.env.NODE_ENV === 'development') {
    const scripts = Array.from(document.querySelectorAll('script[src]'));
    const styles = Array.from(document.querySelectorAll('link[rel="stylesheet"]'));
    
    console.group('Bundle Analysis');
    console.log('Scripts:', scripts.map(s => (s as HTMLScriptElement).src));
    console.log('Styles:', styles.map(s => (s as HTMLLinkElement).href));
    console.groupEnd();
  }
}

import React from 'react';

export default performanceMonitor;

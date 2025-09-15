"use client";

import { useEffect, useRef } from 'react';

interface PerformanceMetrics {
  renderTime: number;
  memoryUsage?: number;
  componentName: string;
}

export const usePerformanceMonitor = (componentName: string) => {
  const renderStartTime = useRef<number>(0);
  const renderCount = useRef<number>(0);

  useEffect(() => {
    renderStartTime.current = performance.now();
    renderCount.current += 1;

    return () => {
      const renderTime = performance.now() - renderStartTime.current;
      
      // Only log in development and for slow renders
      if (process.env.NODE_ENV === 'development' && renderTime > 16) {
        console.warn(`🐌 Slow render detected in ${componentName}:`, {
          renderTime: `${renderTime.toFixed(2)}ms`,
          renderCount: renderCount.current,
          memoryUsage: (performance as any).memory?.usedJSHeapSize
        });
      }
    };
  });

  // Log performance metrics
  const logMetrics = (metrics: Partial<PerformanceMetrics>) => {
    if (process.env.NODE_ENV === 'development') {
      console.log(`📊 Performance metrics for ${componentName}:`, {
        ...metrics,
        timestamp: new Date().toISOString()
      });
    }
  };

  return { logMetrics };
};

import { WorkingWalletService } from './workingWalletService';

interface PerformanceMetrics {
  loadTime: number;
  cacheHitRate: number;
  apiCallCount: number;
  errorRate: number;
  lastOptimization: number;
}

class PerformanceOptimizer {
  private static instance: PerformanceOptimizer;
  private metrics: PerformanceMetrics = {
    loadTime: 0,
    cacheHitRate: 0,
    apiCallCount: 0,
    errorRate: 0,
    lastOptimization: 0
  };
  
  private cache = new Map<string, { data: any; timestamp: number; ttl: number }>();
  private pendingRequests = new Map<string, Promise<any>>();
  private readonly DEFAULT_TTL = 2 * 60 * 1000; // 2 minutes
  private readonly MAX_CACHE_SIZE = 100;

  static getInstance(): PerformanceOptimizer {
    if (!PerformanceOptimizer.instance) {
      PerformanceOptimizer.instance = new PerformanceOptimizer();
    }
    return PerformanceOptimizer.instance;
  }

  /**
   * Optimized data fetching with intelligent caching
   */
  async fetchWithOptimization<T>(
    key: string,
    fetchFn: () => Promise<T>,
    ttl: number = this.DEFAULT_TTL
  ): Promise<T> {
    const startTime = performance.now();
    
    try {
      // Check cache first
      const cached = this.getFromCache(key);
      if (cached) {
        this.metrics.cacheHitRate = (this.metrics.cacheHitRate + 1) / 2;
        return cached;
      }

      // Check if request is already in progress
      if (this.pendingRequests.has(key)) {
        return await this.pendingRequests.get(key)!;
      }

      // Create new request
      const requestPromise = this.executeFetch(key, fetchFn, ttl);
      this.pendingRequests.set(key, requestPromise);

      const result = await requestPromise;
      this.pendingRequests.delete(key);
      
      // Update metrics
      this.metrics.loadTime = performance.now() - startTime;
      this.metrics.apiCallCount++;
      
      return result;
    } catch (error) {
      this.pendingRequests.delete(key);
      this.metrics.errorRate = (this.metrics.errorRate + 1) / 2;
      throw error;
    }
  }

  private async executeFetch<T>(
    key: string,
    fetchFn: () => Promise<T>,
    ttl: number
  ): Promise<T> {
    const result = await fetchFn();
    this.setCache(key, result, ttl);
    return result;
  }

  /**
   * Get data from cache
   */
  private getFromCache<T>(key: string): T | null {
    const cached = this.cache.get(key);
    if (!cached) return null;

    const now = Date.now();
    if (now - cached.timestamp > cached.ttl) {
      this.cache.delete(key);
      return null;
    }

    return cached.data;
  }

  /**
   * Set data in cache
   */
  private setCache<T>(key: string, data: T, ttl: number): void {
    // Implement LRU eviction if cache is full
    if (this.cache.size >= this.MAX_CACHE_SIZE) {
      const firstKey = this.cache.keys().next().value;
      this.cache.delete(firstKey);
    }

    this.cache.set(key, {
      data,
      timestamp: Date.now(),
      ttl
    });
  }

  /**
   * Preload critical data
   */
  async preloadCriticalData(userId: string): Promise<void> {
    if (!userId) return;

    const preloadTasks = [
      this.fetchWithOptimization(
        `wallet_${userId}`,
        () => WorkingWalletService.getWalletData(userId),
        5 * 60 * 1000 // 5 minutes for wallet data
      ),
      this.fetchWithOptimization(
        `collections_${userId}`,
        () => WorkingWalletService.getCollectionHistory(userId),
        2 * 60 * 1000 // 2 minutes for collections
      )
    ];

    try {
      await Promise.allSettled(preloadTasks);
      console.log('✅ Critical data preloaded successfully');
    } catch (error) {
      console.error('❌ Error preloading critical data:', error);
    }
  }

  /**
   * Optimize bundle loading
   */
  optimizeBundleLoading(): void {
    if (typeof window === 'undefined') return;

    // Preload critical routes
    const criticalRoutes = ['/dashboard', '/profile', '/withdrawal'];
    
    criticalRoutes.forEach(route => {
      // Use requestIdleCallback for non-critical preloading
      if ('requestIdleCallback' in window) {
        requestIdleCallback(() => {
          // Preload route components
          import(`@/pages${route === '/dashboard' ? '/Index' : route.charAt(0).toUpperCase() + route.slice(1)}`);
        });
      }
    });
  }

  /**
   * Optimize images and assets
   */
  optimizeAssets(): void {
    if (typeof window === 'undefined') return;

    // Lazy load images
    const images = document.querySelectorAll('img[data-src]');
    const imageObserver = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          const img = entry.target as HTMLImageElement;
          img.src = img.dataset.src || '';
          img.removeAttribute('data-src');
          imageObserver.unobserve(img);
        }
      });
    });

    images.forEach(img => imageObserver.observe(img));
  }

  /**
   * Optimize memory usage
   */
  optimizeMemory(): void {
    // Clear old cache entries
    const now = Date.now();
    for (const [key, value] of this.cache.entries()) {
      if (now - value.timestamp > value.ttl) {
        this.cache.delete(key);
      }
    }

    // Force garbage collection if available
    if ('gc' in window && typeof (window as any).gc === 'function') {
      (window as any).gc();
    }
  }

  /**
   * Get performance metrics
   */
  getMetrics(): PerformanceMetrics {
    return { ...this.metrics };
  }

  /**
   * Clear cache
   */
  clearCache(): void {
    this.cache.clear();
    this.pendingRequests.clear();
  }

  /**
   * Optimize for mobile
   */
  optimizeForMobile(): void {
    if (typeof window === 'undefined') return;

    // Reduce animation complexity on mobile
    if (window.innerWidth < 768) {
      document.documentElement.style.setProperty('--animation-duration', '0.2s');
    }

    // Optimize touch events
    document.addEventListener('touchstart', () => {}, { passive: true });
    document.addEventListener('touchmove', () => {}, { passive: true });
  }

  /**
   * Setup performance monitoring
   */
  setupPerformanceMonitoring(): void {
    if (typeof window === 'undefined') return;

    // Monitor long tasks
    if ('PerformanceObserver' in window) {
      const observer = new PerformanceObserver((list) => {
        for (const entry of list.getEntries()) {
          if (entry.duration > 50) {
            console.warn('Long task detected:', entry.duration + 'ms');
          }
        }
      });
      
      try {
        observer.observe({ entryTypes: ['longtask'] });
      } catch (error) {
        console.log('Long task monitoring not supported');
      }
    }

    // Monitor memory usage
    if ('memory' in performance) {
      setInterval(() => {
        const memory = (performance as any).memory;
        if (memory.usedJSHeapSize > 50 * 1024 * 1024) { // 50MB
          console.warn('High memory usage detected');
          this.optimizeMemory();
        }
      }, 30000); // Check every 30 seconds
    }
  }

  /**
   * Initialize all optimizations
   */
  initialize(): void {
    this.optimizeBundleLoading();
    this.optimizeAssets();
    this.optimizeForMobile();
    this.setupPerformanceMonitoring();
    
    // Periodic cleanup
    setInterval(() => {
      this.optimizeMemory();
    }, 5 * 60 * 1000); // Every 5 minutes
  }
}

export const performanceOptimizer = PerformanceOptimizer.getInstance();
export default performanceOptimizer;

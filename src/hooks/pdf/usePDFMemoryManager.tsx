
import { useRef, useCallback, useEffect } from 'react';

interface MemoryStats {
  blobUrls: number;
  cacheSize: number;
  memoryUsage: string;
}

export const usePDFMemoryManager = (maxCachedPages: number = 15) => {
  const blobUrlsRef = useRef<Set<string>>(new Set());
  const cacheRef = useRef<Map<number, string>>(new Map());
  const memoryCheckInterval = useRef<NodeJS.Timeout | null>(null);

  // Track memory usage
  const getMemoryStats = useCallback((): MemoryStats => {
    const stats: MemoryStats = {
      blobUrls: blobUrlsRef.current.size,
      cacheSize: cacheRef.current.size,
      memoryUsage: 'Unknown'
    };

    // Try to get memory info if available
    if ('memory' in performance) {
      const memory = (performance as any).memory;
      const usedMB = Math.round(memory.usedJSHeapSize / 1048576);
      const totalMB = Math.round(memory.totalJSHeapSize / 1048576);
      stats.memoryUsage = `${usedMB}MB / ${totalMB}MB`;
    }

    return stats;
  }, []);

  // Clean up old blob URLs
  const cleanupOldBlobs = useCallback(() => {
    if (cacheRef.current.size <= maxCachedPages) return;

    const sortedEntries = Array.from(cacheRef.current.entries())
      .sort(([a], [b]) => a - b); // Sort by page number

    const toRemove = sortedEntries.slice(0, sortedEntries.length - maxCachedPages);
    
    toRemove.forEach(([pageNumber, url]) => {
      if (url.startsWith('blob:')) {
        console.log(`🗑️ Cleaning up blob URL for page ${pageNumber}`);
        URL.revokeObjectURL(url);
        blobUrlsRef.current.delete(url);
      }
      cacheRef.current.delete(pageNumber);
    });

    const stats = getMemoryStats();
    console.log(`🧹 Memory cleanup completed: ${stats.blobUrls} blobs, ${stats.cacheSize} cached pages, ${stats.memoryUsage}`);
  }, [maxCachedPages, getMemoryStats]);

  // Add blob URL to tracking
  const trackBlobUrl = useCallback((url: string) => {
    if (url.startsWith('blob:')) {
      blobUrlsRef.current.add(url);
      console.log(`🔗 Tracking blob URL: ${url} (total: ${blobUrlsRef.current.size})`);
    }
  }, []);

  // Set page URL with memory management
  const setPageUrl = useCallback((pageNumber: number, url: string) => {
    // Clean up old URL if exists
    const oldUrl = cacheRef.current.get(pageNumber);
    if (oldUrl && oldUrl.startsWith('blob:')) {
      URL.revokeObjectURL(oldUrl);
      blobUrlsRef.current.delete(oldUrl);
    }

    // Set new URL
    cacheRef.current.set(pageNumber, url);
    trackBlobUrl(url);

    // Trigger cleanup if needed
    cleanupOldBlobs();
  }, [trackBlobUrl, cleanupOldBlobs]);

  // Get page URL
  const getPageUrl = useCallback((pageNumber: number): string | null => {
    return cacheRef.current.get(pageNumber) || null;
  }, []);

  // Check if page is loaded
  const isPageLoaded = useCallback((pageNumber: number): boolean => {
    return cacheRef.current.has(pageNumber);
  }, []);

  // Complete cleanup
  const cleanup = useCallback(() => {
    console.log(`🧹 Starting complete PDF memory cleanup...`);
    
    // Clear memory check interval
    if (memoryCheckInterval.current) {
      clearInterval(memoryCheckInterval.current);
      memoryCheckInterval.current = null;
    }

    // Revoke all blob URLs
    blobUrlsRef.current.forEach(url => {
      console.log(`🗑️ Revoking blob URL: ${url}`);
      URL.revokeObjectURL(url);
    });

    // Clear all references
    blobUrlsRef.current.clear();
    cacheRef.current.clear();

    const finalStats = getMemoryStats();
    console.log(`✅ Complete cleanup finished: ${finalStats.memoryUsage}`);
  }, [getMemoryStats]);

  // Start periodic memory monitoring
  useEffect(() => {
    memoryCheckInterval.current = setInterval(() => {
      const stats = getMemoryStats();
      console.log(`📊 PDF Memory stats: ${stats.blobUrls} blobs, ${stats.cacheSize} pages, ${stats.memoryUsage}`);
      
      // Auto-cleanup if too many blobs
      if (stats.blobUrls > maxCachedPages * 1.5) {
        console.log(`⚠️ Too many blob URLs (${stats.blobUrls}), triggering cleanup...`);
        cleanupOldBlobs();
      }
    }, 30000); // Check every 30 seconds

    return () => {
      if (memoryCheckInterval.current) {
        clearInterval(memoryCheckInterval.current);
      }
    };
  }, [maxCachedPages, getMemoryStats, cleanupOldBlobs]);

  // Cleanup on unmount
  useEffect(() => {
    return cleanup;
  }, [cleanup]);

  return {
    setPageUrl,
    getPageUrl,
    isPageLoaded,
    cleanup,
    getMemoryStats,
    cacheSize: () => cacheRef.current.size,
    cacheRef // For compatibility with existing code
  };
};


import { useCallback, useEffect } from 'react';
import { usePDFMemoryManager } from './usePDFMemoryManager';

export const usePDFCacheManager = (maxCachedPages: number = 15) => {
  const memoryManager = usePDFMemoryManager(maxCachedPages);

  // Enhanced logging
  const getPageUrl = useCallback((pageNumber: number): string | null => {
    const url = memoryManager.getPageUrl(pageNumber);
    console.log(`📋 Enhanced getPageUrl(${pageNumber}): ${url ? 'found' : 'not found'}`);
    return url;
  }, [memoryManager]);

  const isPageLoaded = useCallback((pageNumber: number): boolean => {
    const loaded = memoryManager.isPageLoaded(pageNumber);
    console.log(`🔍 Enhanced isPageLoaded(${pageNumber}): ${loaded}`);
    return loaded;
  }, [memoryManager]);

  const setPageUrl = useCallback((pageNumber: number, url: string) => {
    console.log(`✅ Enhanced setPageUrl(${pageNumber}): ${url}`);
    memoryManager.setPageUrl(pageNumber, url);
  }, [memoryManager]);

  const getCacheSize = useCallback((): number => {
    return memoryManager.cacheSize();
  }, [memoryManager]);

  const cleanup = useCallback(() => {
    console.log(`🧹 Enhanced PDF cache cleanup`);
    memoryManager.cleanup();
  }, [memoryManager]);

  // Log memory stats periodically
  useEffect(() => {
    const interval = setInterval(() => {
      const stats = memoryManager.getMemoryStats();
      console.log(`📊 Enhanced cache stats: ${stats.cacheSize} pages, ${stats.blobUrls} blobs, ${stats.memoryUsage}`);
    }, 60000); // Every minute

    return () => clearInterval(interval);
  }, [memoryManager]);

  return {
    cacheRef: memoryManager.cacheRef,
    getPageUrl,
    isPageLoaded,
    setPageUrl,
    getCacheSize,
    cleanup
  };
};

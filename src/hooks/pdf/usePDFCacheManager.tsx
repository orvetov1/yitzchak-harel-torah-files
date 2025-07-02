
import { useRef, useCallback, useEffect } from 'react';

export const usePDFCacheManager = () => {
  const cacheRef = useRef<Map<number, string>>(new Map());
  const blobUrlsRef = useRef<Set<string>>(new Set());

  const getPageUrl = useCallback((pageNumber: number): string | null => {
    const url = cacheRef.current.get(pageNumber) || null;
    console.log(`📋 getPageUrl(${pageNumber}): ${url ? 'found' : 'not found'}`);
    return url;
  }, []);

  const isPageLoaded = useCallback((pageNumber: number): boolean => {
    const loaded = cacheRef.current.has(pageNumber);
    console.log(`🔍 isPageLoaded(${pageNumber}): ${loaded}`);
    return loaded;
  }, []);

  const setPageUrl = useCallback((pageNumber: number, url: string) => {
    console.log(`✅ setPageUrl(${pageNumber}): ${url}`);
    cacheRef.current.set(pageNumber, url);
    
    // Track blob URLs for cleanup
    if (url.startsWith('blob:')) {
      blobUrlsRef.current.add(url);
      console.log(`🔗 Tracking blob URL for cleanup: ${url}`);
    }
  }, []);

  const getCacheSize = useCallback((): number => {
    return cacheRef.current.size;
  }, []);

  const cleanup = useCallback(() => {
    console.log(`🧹 Cleaning up PDF cache - ${cacheRef.current.size} cached pages, ${blobUrlsRef.current.size} blob URLs`);
    
    // Revoke all blob URLs
    blobUrlsRef.current.forEach(url => {
      console.log(`🗑️ Revoking blob URL: ${url}`);
      URL.revokeObjectURL(url);
    });
    
    // Clear all references
    cacheRef.current.clear();
    blobUrlsRef.current.clear();
    
    console.log(`✅ Cache cleanup completed`);
  }, []);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      console.log(`🏁 usePDFCacheManager unmounting - performing cleanup`);
      cleanup();
    };
  }, [cleanup]);

  return {
    cacheRef,
    getPageUrl,
    isPageLoaded,
    setPageUrl,
    getCacheSize,
    cleanup
  };
};

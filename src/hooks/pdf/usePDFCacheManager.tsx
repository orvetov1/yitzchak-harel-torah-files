
import { useRef, useCallback, useEffect } from 'react';

export const usePDFCacheManager = () => {
  const cacheRef = useRef<Map<number, string>>(new Map());

  const getPageUrl = useCallback((pageNumber: number) => {
    const url = cacheRef.current.get(pageNumber) || null;
    console.log(`📋 getPageUrl(${pageNumber}): ${url ? 'found' : 'not found'}`);
    return url;
  }, []);

  const isPageLoaded = useCallback((pageNumber: number) => {
    const loaded = cacheRef.current.has(pageNumber);
    console.log(`🔍 isPageLoaded(${pageNumber}): ${loaded}`);
    return loaded;
  }, []);

  const setPageUrl = useCallback((pageNumber: number, url: string) => {
    console.log(`✅ setPageUrl(${pageNumber}): ${url}`);
    cacheRef.current.set(pageNumber, url);
  }, []);

  const cleanup = useCallback(() => {
    console.log('🧹 Cleaning up PDF cache');
    // Revoke all blob URLs
    cacheRef.current.forEach(url => {
      if (url.startsWith('blob:')) {
        URL.revokeObjectURL(url);
      }
    });
    cacheRef.current.clear();
  }, []);

  return {
    cacheRef,
    getPageUrl,
    isPageLoaded,
    setPageUrl,
    cleanup
  };
};

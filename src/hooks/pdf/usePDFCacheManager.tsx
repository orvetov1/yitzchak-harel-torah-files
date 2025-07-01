
import { useRef, useCallback } from 'react';

export const usePDFCacheManager = () => {
  const cacheRef = useRef<Map<number, string>>(new Map());

  const getPageUrl = useCallback((pageNumber: number) => {
    return cacheRef.current.get(pageNumber) || null;
  }, []);

  const isPageLoaded = useCallback((pageNumber: number) => {
    return cacheRef.current.has(pageNumber);
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
    cleanup
  };
};

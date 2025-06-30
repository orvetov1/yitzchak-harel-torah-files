
import { useRef, useCallback } from 'react';

export const usePDFTimeout = () => {
  const loadingTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const loadingStartTime = useRef<number>(0);

  const calculateTimeout = useCallback((fileSize: number): number => {
    if (fileSize <= 1024 * 1024) return 8000; // 8s for ≤1MB
    if (fileSize <= 3 * 1024 * 1024) return 12000; // 12s for 1-3MB
    if (fileSize <= 5 * 1024 * 1024) return 18000; // 18s for 3-5MB
    return 25000; // 25s for >5MB
  }, []);

  const startTimeout = useCallback((fileSize: number, onTimeout: () => void) => {
    const timeoutDuration = calculateTimeout(fileSize);
    console.log(`⏲️ Setting timeout for ${timeoutDuration}ms based on file size ${Math.round(fileSize/1024)}KB`);
    
    loadingTimeoutRef.current = setTimeout(onTimeout, timeoutDuration);
    loadingStartTime.current = Date.now();
  }, [calculateTimeout]);

  const clearTimeout = useCallback(() => {
    if (loadingTimeoutRef.current) {
      clearTimeout(loadingTimeoutRef.current);
      loadingTimeoutRef.current = null;
    }
  }, []);

  const extendTimeout = useCallback((fileSize: number, onTimeout: () => void) => {
    const extensionTime = calculateTimeout(fileSize);
    loadingTimeoutRef.current = setTimeout(() => {
      const totalWaitTime = Date.now() - loadingStartTime.current;
      console.log(`⏰ Extended timeout reached after ${totalWaitTime}ms total`);
      onTimeout();
    }, extensionTime);
  }, [calculateTimeout]);

  const getElapsedTime = useCallback(() => {
    return Date.now() - loadingStartTime.current;
  }, []);

  return {
    startTimeout,
    clearTimeout,
    extendTimeout,
    getElapsedTime,
    calculateTimeout
  };
};

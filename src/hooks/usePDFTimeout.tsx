
import { useRef, useCallback } from 'react';

export const usePDFTimeout = () => {
  const loadingTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const loadingStartTime = useRef<number>(0);

  const calculateTimeout = useCallback((fileSize: number): number => {
    // More conservative timeouts based on real-world testing
    if (fileSize <= 512 * 1024) return 6000; // 6s for ≤512KB
    if (fileSize <= 1024 * 1024) return 10000; // 10s for ≤1MB
    if (fileSize <= 3 * 1024 * 1024) return 15000; // 15s for 1-3MB
    if (fileSize <= 5 * 1024 * 1024) return 22000; // 22s for 3-5MB
    if (fileSize <= 10 * 1024 * 1024) return 35000; // 35s for 5-10MB
    return 45000; // 45s for >10MB
  }, []);

  const startTimeout = useCallback((fileSize: number, onTimeout: () => void) => {
    const timeoutDuration = calculateTimeout(fileSize);
    const sizeKB = Math.round(fileSize / 1024);
    console.log(`⏲️ Setting timeout for ${timeoutDuration}ms based on file size ${sizeKB}KB`);
    
    loadingTimeoutRef.current = setTimeout(() => {
      const elapsedTime = Date.now() - loadingStartTime.current;
      console.log(`⏰ PDF loading timeout reached after ${elapsedTime}ms (expected ${timeoutDuration}ms)`);
      onTimeout();
    }, timeoutDuration);
    loadingStartTime.current = Date.now();
  }, [calculateTimeout]);

  const clearPDFTimeout = useCallback(() => {
    if (loadingTimeoutRef.current) {
      clearTimeout(loadingTimeoutRef.current);
      loadingTimeoutRef.current = null;
    }
  }, []);

  const extendTimeout = useCallback((fileSize: number, onTimeout: () => void) => {
    clearPDFTimeout();
    const extensionTime = calculateTimeout(fileSize) * 0.75; // 75% of original timeout for extension
    console.log(`⏰ Extending timeout by ${extensionTime}ms`);
    
    loadingTimeoutRef.current = setTimeout(() => {
      const totalWaitTime = Date.now() - loadingStartTime.current;
      console.log(`⏰ Extended timeout reached after ${totalWaitTime}ms total`);
      onTimeout();
    }, extensionTime);
  }, [calculateTimeout, clearPDFTimeout]);

  const getElapsedTime = useCallback(() => {
    return Date.now() - loadingStartTime.current;
  }, []);

  const getRemainingTime = useCallback((fileSize: number) => {
    const elapsed = getElapsedTime();
    const total = calculateTimeout(fileSize);
    return Math.max(0, total - elapsed);
  }, [getElapsedTime, calculateTimeout]);

  return {
    startTimeout,
    clearTimeout: clearPDFTimeout,
    extendTimeout,
    getElapsedTime,
    getRemainingTime,
    calculateTimeout
  };
};

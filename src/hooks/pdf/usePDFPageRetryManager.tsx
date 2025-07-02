
import { useRef } from 'react';

export const usePDFPageRetryManager = () => {
  const retryCountRef = useRef<Map<number, number>>(new Map());

  const getRetryCount = (pageNumber: number): number => {
    return retryCountRef.current.get(pageNumber) || 0;
  };

  const incrementRetryCount = (pageNumber: number): number => {
    const currentRetries = getRetryCount(pageNumber);
    const newCount = currentRetries + 1;
    retryCountRef.current.set(pageNumber, newCount);
    return newCount;
  };

  const resetRetryCount = (pageNumber: number) => {
    retryCountRef.current.delete(pageNumber);
  };

  const hasExceededMaxRetries = (pageNumber: number, maxRetries: number): boolean => {
    return getRetryCount(pageNumber) >= maxRetries;
  };

  const scheduleRetry = (
    pageNumber: number,
    retryFunction: () => void,
    maxRetries: number
  ) => {
    const currentRetries = getRetryCount(pageNumber);
    if (currentRetries < maxRetries - 1) {
      const delay = Math.min(1000 * Math.pow(2, currentRetries), 5000); // Exponential backoff, max 5s
      console.log(`🔄 Retrying page ${pageNumber} in ${delay}ms...`);
      setTimeout(retryFunction, delay);
    }
  };

  const cleanup = () => {
    retryCountRef.current.clear();
  };

  return {
    getRetryCount,
    incrementRetryCount,
    resetRetryCount,
    hasExceededMaxRetries,
    scheduleRetry,
    cleanup
  };
};

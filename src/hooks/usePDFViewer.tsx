
import { useState, useCallback, useEffect, useRef } from 'react';
import { usePDFPerformance } from './usePDFPerformance';

export const usePDFViewer = (fileUrl: string, isOpen: boolean) => {
  const [numPages, setNumPages] = useState<number>(0);
  const [pageNumber, setPageNumber] = useState<number>(1);
  const [scale, setScale] = useState<number>(1.0);
  const [loading, setLoading] = useState<boolean>(true);
  const [loadingProgress, setLoadingProgress] = useState<number>(0);
  const [error, setError] = useState<string | null>(null);
  const [pageLoading, setPageLoading] = useState<boolean>(false);
  const [fileSize, setFileSize] = useState<number>(0);
  const [waitingForUser, setWaitingForUser] = useState<boolean>(false);
  
  const loadingTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const progressIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const performanceTrackingRef = useRef<any>(null);

  const {
    startPerformanceTracking,
    endPerformanceTracking,
    getCachedDocument,
    preloadNextPages,
    getOptimalTimeout,
    getPerformanceInsights
  } = usePDFPerformance();

  // Get file size for better UX and performance optimization
  const checkFileSize = useCallback(async (url: string) => {
    try {
      const response = await fetch(url, { method: 'HEAD' });
      const size = parseInt(response.headers.get('Content-Length') || '0');
      setFileSize(size);
      console.log(`PDF file size: ${Math.round(size / 1024)}KB`);
      return size;
    } catch (error) {
      console.log('Could not determine file size');
      return 0;
    }
  }, []);

  const onDocumentLoadSuccess = useCallback(({ numPages }: { numPages: number }) => {
    console.log('PDF loaded successfully with', numPages, 'pages (optimized local loading)');
    setNumPages(numPages);
    setLoading(false);
    setLoadingProgress(100);
    setError(null);
    setWaitingForUser(false);
    
    // Complete performance tracking
    if (performanceTrackingRef.current) {
      endPerformanceTracking(performanceTrackingRef.current, numPages);
      performanceTrackingRef.current = null;
    }
    
    // Clear all timers
    if (loadingTimeoutRef.current) {
      clearTimeout(loadingTimeoutRef.current);
      loadingTimeoutRef.current = null;
    }
    if (progressIntervalRef.current) {
      clearInterval(progressIntervalRef.current);
      progressIntervalRef.current = null;
    }
    
    // Start preloading next pages
    if (numPages > 1) {
      setTimeout(() => {
        preloadNextPages(fileUrl, 1, numPages);
      }, 500);
    }
  }, [fileUrl, endPerformanceTracking, preloadNextPages]);

  const onDocumentLoadError = useCallback((error: Error) => {
    console.error('Error loading PDF with optimized local worker:', error);
    
    // Enhanced error detection
    const errorMessage = error.message.toLowerCase();
    if (errorMessage.includes('network') || errorMessage.includes('fetch')) {
      setError('שגיאת רשת - אנא בדוק את החיבור לאינטרנט');
    } else if (errorMessage.includes('invalid') || errorMessage.includes('corrupt')) {
      setError('קובץ PDF פגום או לא תקין');
    } else if (errorMessage.includes('password') || errorMessage.includes('encrypted')) {
      setError('קובץ PDF מוגן בסיסמה - לא ניתן לצפות');
    } else {
      setError('שגיאה בטעינת הקובץ - נסה טעינה פשוטה');
    }
    
    setLoading(false);
    setLoadingProgress(0);
    setWaitingForUser(false);
    
    // Clear timers
    if (loadingTimeoutRef.current) {
      clearTimeout(loadingTimeoutRef.current);
      loadingTimeoutRef.current = null;
    }
    if (progressIntervalRef.current) {
      clearInterval(progressIntervalRef.current);
      progressIntervalRef.current = null;
    }
    
    // Clear performance tracking
    performanceTrackingRef.current = null;
  }, []);

  const onDocumentLoadProgress = useCallback(({ loaded, total }: { loaded: number; total: number }) => {
    if (total > 0) {
      const progress = Math.min((loaded / total) * 100, 100);
      setLoadingProgress(progress);
      
      // Clear simulation when real progress takes over
      if (progressIntervalRef.current && progress > 10) {
        clearInterval(progressIntervalRef.current);
        progressIntervalRef.current = null;
        console.log('Real progress detected, stopping simulation');
      }
      
      console.log(`Optimized loading progress: ${Math.round(progress)}%`);
    }
  }, []);

  const continueWaiting = useCallback(() => {
    console.log('User chose to continue waiting (optimized timeout)');
    setWaitingForUser(false);
    // Extend timeout based on file size
    const extendedTimeout = Math.max(2000, getOptimalTimeout(fileSize) * 1.5);
    loadingTimeoutRef.current = setTimeout(() => {
      setWaitingForUser(true);
    }, extendedTimeout);
  }, [fileSize, getOptimalTimeout]);

  const handleLoadingTimeout = useCallback(() => {
    console.log('PDF loading timeout reached (optimized)');
    setWaitingForUser(true);
  }, []);

  const cancelLoading = useCallback(() => {
    console.log('Loading cancelled by user');
    setError('הטעינה בוטלה');
    setLoading(false);
    setLoadingProgress(0);
    setWaitingForUser(false);
    
    // Clear all timers
    if (loadingTimeoutRef.current) {
      clearTimeout(loadingTimeoutRef.current);
      loadingTimeoutRef.current = null;
    }
    if (progressIntervalRef.current) {
      clearInterval(progressIntervalRef.current);
      progressIntervalRef.current = null;
    }
    
    performanceTrackingRef.current = null;
  }, []);

  const retryLoading = useCallback(async () => {
    console.log('Retrying PDF load with optimizations for:', fileUrl);
    setError(null);
    setLoading(true);
    setLoadingProgress(0);
    setWaitingForUser(false);
    
    // Get file size for optimization
    const size = await checkFileSize(fileUrl);
    
    // Start performance tracking
    performanceTrackingRef.current = startPerformanceTracking(fileUrl, size);
    
    // Optimized timeout based on file size and local resources
    const timeoutDuration = getOptimalTimeout(size);
    console.log(`Setting optimized timeout for ${timeoutDuration}ms (file: ${Math.round(size / 1024)}KB)`);
    
    loadingTimeoutRef.current = setTimeout(handleLoadingTimeout, timeoutDuration);
    
    // Very fast progress simulation for local resources
    let progress = 0;
    let step = 0;
    
    const updateProgress = () => {
      step++;
      
      // Aggressive progress for local resources with dynamic adjustment
      if (size > 2 * 1024 * 1024) {
        // Large files - slower simulation
        progress += step < 4 ? 15 : step < 8 ? 8 : 2;
      } else {
        // Small/medium files - very fast simulation
        progress += step < 3 ? 30 : step < 5 ? 15 : 3;
      }
      
      if (progress > 95) {
        progress = 95;
      }
      
      setLoadingProgress(progress);
      console.log(`Optimized simulation progress: ${progress}%`);
      
      if (progress < 95) {
        progressIntervalRef.current = setTimeout(updateProgress, size > 2 * 1024 * 1024 ? 300 : 150);
      }
    };
    
    // Start simulation
    progressIntervalRef.current = setTimeout(updateProgress, 100);
  }, [fileUrl, checkFileSize, startPerformanceTracking, getOptimalTimeout, handleLoadingTimeout]);

  // Enhanced navigation with preloading
  const goToPrevPage = () => {
    const newPage = Math.max(1, pageNumber - 1);
    setPageNumber(newPage);
    // Preload previous pages
    if (newPage > 1) {
      setTimeout(() => preloadNextPages(fileUrl, newPage - 1, numPages), 200);
    }
  };

  const goToNextPage = () => {
    const newPage = Math.min(numPages, pageNumber + 1);
    setPageNumber(newPage);
    // Preload next pages
    setTimeout(() => preloadNextPages(fileUrl, newPage, numPages), 200);
  };

  const zoomIn = () => {
    setScale(prev => Math.min(3.0, prev + 0.2));
  };

  const zoomOut = () => {
    setScale(prev => Math.max(0.5, prev - 0.2));
  };

  const setPage = (page: number) => {
    if (page >= 1 && page <= numPages) {
      setPageNumber(page);
      // Preload around the new page
      setTimeout(() => preloadNextPages(fileUrl, page, numPages), 300);
    }
  };

  // Reset state when opening with enhanced caching
  useEffect(() => {
    if (isOpen) {
      console.log('PDF viewer opened for:', fileUrl, '(performance optimized)');
      setPageNumber(1);
      setScale(1.0);
      setError(null);
      setWaitingForUser(false);
      
      // Check cache first
      const cached = getCachedDocument(fileUrl);
      if (cached) {
        console.log('Using cached PDF data with performance metrics');
        setNumPages(cached.numPages);
        setLoading(false);
        setLoadingProgress(100);
      } else {
        retryLoading();
      }
      
      // Log performance insights
      const insights = getPerformanceInsights();
      if (insights) {
        console.log('PDF Performance Insights:', insights);
      }
    } else {
      // Clear timers when closing
      if (loadingTimeoutRef.current) {
        clearTimeout(loadingTimeoutRef.current);
        loadingTimeoutRef.current = null;
      }
      if (progressIntervalRef.current) {
        clearInterval(progressIntervalRef.current);
        progressIntervalRef.current = null;
      }
      performanceTrackingRef.current = null;
    }
  }, [isOpen, fileUrl, retryLoading, getCachedDocument, getPerformanceInsights]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (loadingTimeoutRef.current) {
        clearTimeout(loadingTimeoutRef.current);
      }
      if (progressIntervalRef.current) {
        clearInterval(progressIntervalRef.current);
      }
    };
  }, []);

  return {
    numPages,
    pageNumber,
    scale,
    loading,
    loadingProgress,
    error,
    pageLoading,
    fileSize,
    waitingForUser,
    setPageLoading,
    onDocumentLoadSuccess,
    onDocumentLoadError,
    onDocumentLoadProgress,
    goToPrevPage,
    goToNextPage,
    zoomIn,
    zoomOut,
    setPage,
    cancelLoading,
    retryLoading,
    continueWaiting
  };
};

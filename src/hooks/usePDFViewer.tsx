
import { useState, useCallback, useEffect, useRef } from 'react';

interface DocumentCache {
  [key: string]: {
    numPages: number;
    loadedAt: number;
  };
}

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
  const [loadingPhase, setLoadingPhase] = useState<string>('');
  
  const cacheRef = useRef<DocumentCache>({});
  const loadingTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const progressIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const loadingStartTime = useRef<number>(0);

  // Enhanced timeout calculation based on file size
  const calculateTimeout = useCallback((fileSize: number): number => {
    if (fileSize <= 1024 * 1024) return 8000; // 8s for ≤1MB
    if (fileSize <= 3 * 1024 * 1024) return 12000; // 12s for 1-3MB
    if (fileSize <= 5 * 1024 * 1024) return 18000; // 18s for 3-5MB
    return 25000; // 25s for >5MB
  }, []);

  // Get file size with detailed logging
  const checkFileSize = useCallback(async (url: string) => {
    try {
      const startTime = Date.now();
      const response = await fetch(url, { method: 'HEAD' });
      const networkTime = Date.now() - startTime;
      const size = parseInt(response.headers.get('Content-Length') || '0');
      setFileSize(size);
      
      const sizeKB = Math.round(size / 1024);
      const sizeMB = Math.round(size / (1024 * 1024) * 10) / 10;
      console.log(`PDF file size: ${sizeKB}KB (${sizeMB}MB), network check took ${networkTime}ms`);
      console.log(`Calculated timeout: ${calculateTimeout(size)}ms for this file size`);
    } catch (error) {
      console.warn('Could not determine file size, using default timeout');
    }
  }, [calculateTimeout]);

  const onDocumentLoadSuccess = useCallback(({ numPages }: { numPages: number }) => {
    const loadTime = Date.now() - loadingStartTime.current;
    console.log(`✅ PDF loaded successfully with ${numPages} pages in ${loadTime}ms`);
    setNumPages(numPages);
    setLoading(false);
    setLoadingProgress(100);
    setError(null);
    setWaitingForUser(false);
    setLoadingPhase('');
    
    // Clear all timers
    if (loadingTimeoutRef.current) {
      clearTimeout(loadingTimeoutRef.current);
      loadingTimeoutRef.current = null;
    }
    if (progressIntervalRef.current) {
      clearInterval(progressIntervalRef.current);
      progressIntervalRef.current = null;
    }
    
    // Cache document info
    cacheRef.current[fileUrl] = {
      numPages,
      loadedAt: Date.now()
    };
  }, [fileUrl]);

  const onDocumentLoadError = useCallback((error: Error) => {
    const loadTime = Date.now() - loadingStartTime.current;
    console.error(`❌ Error loading PDF after ${loadTime}ms:`, error);
    setError('שגיאה בטעינת הקובץ - אנא נסה שוב');
    setLoading(false);
    setLoadingProgress(0);
    setWaitingForUser(false);
    setLoadingPhase('');
    
    // Clear timers
    if (loadingTimeoutRef.current) {
      clearTimeout(loadingTimeoutRef.current);
      loadingTimeoutRef.current = null;
    }
    if (progressIntervalRef.current) {
      clearInterval(progressIntervalRef.current);
      progressIntervalRef.current = null;
    }
  }, []);

  const onDocumentLoadProgress = useCallback(({ loaded, total }: { loaded: number; total: number }) => {
    if (total > 0) {
      const progress = Math.min((loaded / total) * 100, 100);
      const loadTime = Date.now() - loadingStartTime.current;
      setLoadingProgress(progress);
      
      // Update loading phase based on progress
      if (progress < 50) {
        setLoadingPhase('מוריד קובץ...');
      } else if (progress < 80) {
        setLoadingPhase('מעבד תוכן...');
      } else {
        setLoadingPhase('מסיים עיבוד...');
      }
      
      // Clear simulation when real progress takes over
      if (progressIntervalRef.current && progress > 10) {
        clearInterval(progressIntervalRef.current);
        progressIntervalRef.current = null;
        console.log(`🔄 Real progress detected (${Math.round(progress)}%), stopping simulation after ${loadTime}ms`);
      }
      
      console.log(`📊 Real loading progress: ${Math.round(progress)}% (${Math.round(loaded/1024)}KB/${Math.round(total/1024)}KB)`);
    }
  }, []);

  const continueWaiting = useCallback(() => {
    const currentWaitTime = Date.now() - loadingStartTime.current;
    console.log(`⏳ User chose to continue waiting (current wait: ${currentWaitTime}ms)`);
    setWaitingForUser(false);
    
    // Extend timeout by the original timeout duration
    const extensionTime = calculateTimeout(fileSize);
    loadingTimeoutRef.current = setTimeout(() => {
      const totalWaitTime = Date.now() - loadingStartTime.current;
      console.log(`⏰ Extended timeout reached after ${totalWaitTime}ms total`);
      setWaitingForUser(true);
    }, extensionTime);
  }, [fileSize, calculateTimeout]);

  const handleLoadingTimeout = useCallback(() => {
    const loadTime = Date.now() - loadingStartTime.current;
    console.log(`⏰ PDF loading timeout reached after ${loadTime}ms`);
    setWaitingForUser(true);
  }, []);

  const cancelLoading = useCallback(() => {
    const loadTime = Date.now() - loadingStartTime.current;
    console.log(`🚫 Loading cancelled by user after ${loadTime}ms`);
    setError('הטעינה בוטלה');
    setLoading(false);
    setLoadingProgress(0);
    setWaitingForUser(false);
    setLoadingPhase('');
    
    // Clear all timers
    if (loadingTimeoutRef.current) {
      clearTimeout(loadingTimeoutRef.current);
      loadingTimeoutRef.current = null;
    }
    if (progressIntervalRef.current) {
      clearInterval(progressIntervalRef.current);
      progressIntervalRef.current = null;
    }
  }, []);

  const retryLoading = useCallback(() => {
    loadingStartTime.current = Date.now();
    console.log(`🔄 Starting PDF load for: ${fileUrl}`);
    setError(null);
    setLoading(true);
    setLoadingProgress(0);
    setWaitingForUser(false);
    setLoadingPhase('מתחיל טעינה...');
    
    // Check file size first
    checkFileSize(fileUrl);
    
    // Calculate timeout based on file size
    const timeoutDuration = calculateTimeout(fileSize);
    console.log(`⏲️ Setting timeout for ${timeoutDuration}ms based on file size ${Math.round(fileSize/1024)}KB`);
    
    loadingTimeoutRef.current = setTimeout(handleLoadingTimeout, timeoutDuration);
    
    // Realistic progress simulation
    let progress = 0;
    let step = 0;
    
    const updateProgress = () => {
      step++;
      
      // More realistic simulation - slower and stops at 90%
      if (step <= 3) {
        progress += 15; // 0->45% in first 3 steps (1.5s)
      } else if (step <= 6) {
        progress += 10; // 45->75% in next 3 steps (1.5s)
      } else if (step <= 10) {
        progress += 3; // 75->87% in next 4 steps (2s)
      } else {
        progress += 0.5; // Slow crawl to 90% max
      }
      
      if (progress > 90) {
        progress = 90; // Cap at 90% to leave room for real progress
      }
      
      setLoadingProgress(progress);
      
      // Update phase based on simulated progress
      if (progress < 30) {
        setLoadingPhase('מוריד קובץ...');
      } else if (progress < 70) {
        setLoadingPhase('מעבד תוכן...');
      } else {
        setLoadingPhase('מסיים עיבוד...');
      }
      
      console.log(`📈 Simulated progress: ${Math.round(progress)}%`);
      
      if (progress < 90) {
        progressIntervalRef.current = setTimeout(updateProgress, 500); // Slower simulation
      }
    };
    
    // Start simulation after a brief delay
    progressIntervalRef.current = setTimeout(updateProgress, 200);
  }, [fileUrl, fileSize, handleLoadingTimeout, checkFileSize, calculateTimeout]);

  // Navigation functions
  const goToPrevPage = () => {
    setPageNumber(prev => Math.max(1, prev - 1));
  };

  const goToNextPage = () => {
    setPageNumber(prev => Math.min(numPages, prev + 1));
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
    }
  };

  // Reset state when opening
  useEffect(() => {
    if (isOpen) {
      console.log(`🚀 PDF viewer opened for: ${fileUrl}`);
      setPageNumber(1);
      setScale(1.0);
      setError(null);
      setWaitingForUser(false);
      setLoadingPhase('');
      
      // Check cache first
      const cached = cacheRef.current[fileUrl];
      if (cached && Date.now() - cached.loadedAt < 5 * 60 * 1000) { // 5 minutes cache
        console.log('📋 Using cached PDF data');
        setNumPages(cached.numPages);
        setLoading(false);
        setLoadingProgress(100);
      } else {
        retryLoading();
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
    }
  }, [isOpen, fileUrl, retryLoading]);

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
    loadingPhase,
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

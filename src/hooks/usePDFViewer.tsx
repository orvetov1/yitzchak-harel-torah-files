
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
  
  const cacheRef = useRef<DocumentCache>({});
  const loadingTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const progressIntervalRef = useRef<NodeJS.Timeout | null>(null);

  // Get file size for better UX
  const checkFileSize = useCallback(async (url: string) => {
    try {
      const response = await fetch(url, { method: 'HEAD' });
      const size = parseInt(response.headers.get('Content-Length') || '0');
      setFileSize(size);
      console.log(`PDF file size: ${Math.round(size / 1024)}KB`);
    } catch (error) {
      console.log('Could not determine file size');
    }
  }, []);

  const onDocumentLoadSuccess = useCallback(({ numPages }: { numPages: number }) => {
    setNumPages(numPages);
    setLoading(false);
    setLoadingProgress(100);
    setError(null);
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
    
    // Cache document info
    cacheRef.current[fileUrl] = {
      numPages,
      loadedAt: Date.now()
    };

    console.log(`PDF loaded successfully: ${numPages} pages`);
  }, [fileUrl]);

  const onDocumentLoadError = useCallback((error: Error) => {
    console.error('Error loading PDF:', error);
    setError('שגיאה בטעינת הקובץ - נסה שוב או פתח בטאב חדש');
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
  }, []);

  const onDocumentLoadProgress = useCallback(({ loaded, total }: { loaded: number; total: number }) => {
    if (total > 0) {
      const progress = Math.min((loaded / total) * 100, 100);
      setLoadingProgress(progress);
      
      // Clear simulation when real progress takes over
      if (progressIntervalRef.current && progress > 10) {
        clearInterval(progressIntervalRef.current);
        progressIntervalRef.current = null;
      }
      
      console.log(`Real loading progress: ${Math.round(progress)}%`);
    }
  }, []);

  const continueWaiting = useCallback(() => {
    setWaitingForUser(false);
    // Extend timeout for another 15 seconds
    loadingTimeoutRef.current = setTimeout(() => {
      setWaitingForUser(true);
    }, 15000);
  }, []);

  const handleLoadingTimeout = useCallback(() => {
    console.warn('PDF loading taking longer than expected');
    setWaitingForUser(true);
  }, []);

  const cancelLoading = useCallback(() => {
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
  }, []);

  const retryLoading = useCallback(() => {
    setError(null);
    setLoading(true);
    setLoadingProgress(0);
    setWaitingForUser(false);
    
    // Check file size first
    checkFileSize(fileUrl);
    
    // Set timeout - shorter for smaller files
    const timeoutDuration = fileSize > 1024 * 1024 ? 10000 : 7000; // 10s for >1MB, 7s for smaller
    loadingTimeoutRef.current = setTimeout(handleLoadingTimeout, timeoutDuration);
    
    // Start smart progress simulation
    let progress = 0;
    let incrementSpeed = 1;
    
    const updateProgress = () => {
      // Slow down as we approach higher percentages
      if (progress < 30) {
        incrementSpeed = Math.random() * 8 + 4; // 4-12% jumps
      } else if (progress < 60) {
        incrementSpeed = Math.random() * 5 + 2; // 2-7% jumps
      } else if (progress < 90) {
        incrementSpeed = Math.random() * 3 + 1; // 1-4% jumps
      } else {
        incrementSpeed = Math.random() * 1 + 0.5; // 0.5-1.5% jumps
      }
      
      progress += incrementSpeed;
      
      // Don't cap at 85% anymore - let it reach close to 100%
      if (progress > 98) {
        progress = 98; // Stop just before 100% to let real progress finish
      }
      
      setLoadingProgress(progress);
      
      if (progress < 98) {
        progressIntervalRef.current = setTimeout(updateProgress, 200);
      }
    };
    
    progressIntervalRef.current = setTimeout(updateProgress, 100);
  }, [fileUrl, fileSize, handleLoadingTimeout, checkFileSize]);

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
      setPageNumber(1);
      setScale(1.0);
      setError(null);
      setWaitingForUser(false);
      
      // Check cache first
      const cached = cacheRef.current[fileUrl];
      if (cached && Date.now() - cached.loadedAt < 5 * 60 * 1000) { // 5 minutes cache
        setNumPages(cached.numPages);
        setLoading(false);
        setLoadingProgress(100);
        console.log('Using cached PDF data');
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

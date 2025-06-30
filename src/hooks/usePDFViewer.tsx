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
    console.log('PDF loaded successfully with', numPages, 'pages (using local worker)');
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
  }, [fileUrl]);

  const onDocumentLoadError = useCallback((error: Error) => {
    console.error('Error loading PDF with local worker:', error);
    setError('שגיאה בטעינת הקובץ - אנא נסה שוב');
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
      if (progressIntervalRef.current && progress > 5) {
        clearInterval(progressIntervalRef.current);
        progressIntervalRef.current = null;
        console.log('Real progress detected, stopping simulation');
      }
      
      console.log(`Real loading progress: ${Math.round(progress)}%`);
    }
  }, []);

  const continueWaiting = useCallback(() => {
    console.log('User chose to continue waiting');
    setWaitingForUser(false);
    // Extend timeout for another 5 seconds (reduced from 10)
    loadingTimeoutRef.current = setTimeout(() => {
      setWaitingForUser(true);
    }, 5000);
  }, []);

  const handleLoadingTimeout = useCallback(() => {
    console.log('PDF loading timeout reached');
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
  }, []);

  const retryLoading = useCallback(() => {
    console.log('Retrying PDF load for:', fileUrl, '(using local worker)');
    setError(null);
    setLoading(true);
    setLoadingProgress(0);
    setWaitingForUser(false);
    
    // Check file size first
    checkFileSize(fileUrl);
    
    // Much shorter timeouts since we're using local resources
    const timeoutDuration = fileSize > 2 * 1024 * 1024 ? 4000 : 2000; // 4s for >2MB, 2s for smaller
    console.log(`Setting timeout for ${timeoutDuration}ms (local worker)`);
    
    loadingTimeoutRef.current = setTimeout(handleLoadingTimeout, timeoutDuration);
    
    // Very fast progress simulation for local loading
    let progress = 0;
    let step = 0;
    
    const updateProgress = () => {
      step++;
      
      // Very aggressive progress for local resources
      if (step < 3) {
        progress += 25; // 0->75% in 0.6 seconds
      } else if (step < 6) {
        progress += 12; // 75->99% in 0.6 seconds
      } else {
        progress += 1; // Stay at 99%
      }
      
      if (progress > 99) {
        progress = 99;
      }
      
      setLoadingProgress(progress);
      console.log(`Simulated progress (local): ${progress}%`);
      
      if (progress < 99) {
        progressIntervalRef.current = setTimeout(updateProgress, 200);
      }
    };
    
    // Start simulation immediately
    progressIntervalRef.current = setTimeout(updateProgress, 50);
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
      console.log('PDF viewer opened for:', fileUrl, '(local worker mode)');
      setPageNumber(1);
      setScale(1.0);
      setError(null);
      setWaitingForUser(false);
      
      // Check cache first
      const cached = cacheRef.current[fileUrl];
      if (cached && Date.now() - cached.loadedAt < 5 * 60 * 1000) { // 5 minutes cache
        console.log('Using cached PDF data');
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

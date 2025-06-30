
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
  
  const cacheRef = useRef<DocumentCache>({});
  const loadingTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const progressTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  const onDocumentLoadSuccess = useCallback(({ numPages }: { numPages: number }) => {
    setNumPages(numPages);
    setLoading(false);
    setLoadingProgress(100);
    setError(null);
    
    // Clear all timeouts
    if (loadingTimeoutRef.current) {
      clearTimeout(loadingTimeoutRef.current);
      loadingTimeoutRef.current = null;
    }
    if (progressTimeoutRef.current) {
      clearTimeout(progressTimeoutRef.current);
      progressTimeoutRef.current = null;
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
    setError('שגיאה בטעינת הקובץ - נסה לפתוח בטאב חדש');
    setLoading(false);
    setLoadingProgress(0);
    
    // Clear timeouts
    if (loadingTimeoutRef.current) {
      clearTimeout(loadingTimeoutRef.current);
      loadingTimeoutRef.current = null;
    }
    if (progressTimeoutRef.current) {
      clearTimeout(progressTimeoutRef.current);
      progressTimeoutRef.current = null;
    }
  }, []);

  const onDocumentLoadProgress = useCallback(({ loaded, total }: { loaded: number; total: number }) => {
    if (total > 0) {
      const progress = Math.min((loaded / total) * 100, 100);
      setLoadingProgress(progress);
      
      // Clear progress timeout if we have real progress
      if (progressTimeoutRef.current) {
        clearTimeout(progressTimeoutRef.current);
        progressTimeoutRef.current = null;
      }
      
      console.log(`Loading progress: ${Math.round(progress)}%`);
    }
  }, []);

  const handleLoadingTimeout = useCallback(() => {
    console.warn('PDF loading timeout - forcing completion or error');
    setError('טעינת הקובץ נמשכת יותר מדי - נסה לפתוח בטאב חדש');
    setLoading(false);
    setLoadingProgress(0);
  }, []);

  const cancelLoading = useCallback(() => {
    setError('הטעינה בוטלה');
    setLoading(false);
    setLoadingProgress(0);
    
    // Clear all timeouts
    if (loadingTimeoutRef.current) {
      clearTimeout(loadingTimeoutRef.current);
      loadingTimeoutRef.current = null;
    }
    if (progressTimeoutRef.current) {
      clearTimeout(progressTimeoutRef.current);
      progressTimeoutRef.current = null;
    }
  }, []);

  const retryLoading = useCallback(() => {
    setError(null);
    setLoading(true);
    setLoadingProgress(0);
    
    // Set loading timeout
    loadingTimeoutRef.current = setTimeout(handleLoadingTimeout, 30000);
    
    // Set fallback progress for better UX
    let progress = 0;
    const updateProgress = () => {
      progress += Math.random() * 8 + 2;
      if (progress > 85) {
        progress = 85; // Stop at 85% to let real progress take over
      }
      setLoadingProgress(progress);
      
      if (progress < 85) {
        progressTimeoutRef.current = setTimeout(updateProgress, 200);
      }
    };
    
    progressTimeoutRef.current = setTimeout(updateProgress, 100);
  }, [handleLoadingTimeout]);

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
      // Clear timeouts when closing
      if (loadingTimeoutRef.current) {
        clearTimeout(loadingTimeoutRef.current);
        loadingTimeoutRef.current = null;
      }
      if (progressTimeoutRef.current) {
        clearTimeout(progressTimeoutRef.current);
        progressTimeoutRef.current = null;
      }
    }
  }, [isOpen, fileUrl, retryLoading]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (loadingTimeoutRef.current) {
        clearTimeout(loadingTimeoutRef.current);
      }
      if (progressTimeoutRef.current) {
        clearTimeout(progressTimeoutRef.current);
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
    retryLoading
  };
};

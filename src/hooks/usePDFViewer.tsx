
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
  const loadingIntervalRef = useRef<NodeJS.Timeout | null>(null);

  // Simulate loading progress for better UX
  const simulateLoadingProgress = useCallback(() => {
    setLoadingProgress(0);
    let progress = 0;
    
    loadingIntervalRef.current = setInterval(() => {
      progress += Math.random() * 15;
      if (progress > 90) {
        progress = 90;
      }
      setLoadingProgress(progress);
    }, 100);
  }, []);

  const onDocumentLoadSuccess = useCallback(({ numPages }: { numPages: number }) => {
    setNumPages(numPages);
    setLoading(false);
    setLoadingProgress(100);
    setError(null);
    
    // Cache document info
    cacheRef.current[fileUrl] = {
      numPages,
      loadedAt: Date.now()
    };

    // Clear loading interval
    if (loadingIntervalRef.current) {
      clearInterval(loadingIntervalRef.current);
      loadingIntervalRef.current = null;
    }

    console.log(`PDF loaded successfully: ${numPages} pages`);
  }, [fileUrl]);

  const onDocumentLoadError = useCallback((error: Error) => {
    console.error('Error loading PDF:', error);
    setError('שגיאה בטעינת הקובץ');
    setLoading(false);
    setLoadingProgress(0);
    
    if (loadingIntervalRef.current) {
      clearInterval(loadingIntervalRef.current);
      loadingIntervalRef.current = null;
    }
  }, []);

  const onDocumentLoadProgress = useCallback(({ loaded, total }: { loaded: number; total: number }) => {
    if (total > 0) {
      const progress = (loaded / total) * 100;
      setLoadingProgress(Math.min(progress, 90));
    }
  }, []);

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
        setLoading(true);
        setLoadingProgress(0);
        simulateLoadingProgress();
      }
    }
  }, [isOpen, fileUrl, simulateLoadingProgress]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (loadingIntervalRef.current) {
        clearInterval(loadingIntervalRef.current);
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
    setPage
  };
};

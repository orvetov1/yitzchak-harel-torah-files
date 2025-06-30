import { useState, useCallback, useEffect } from 'react';
import { usePDFTimeout } from './usePDFTimeout';
import { usePDFProgressSimulation } from './usePDFProgressSimulation';
import { usePDFCache } from './usePDFCache';
import { usePDFPerformance } from './usePDFPerformance';
import { usePDFComplexity } from './usePDFComplexity';

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
  const [loadingStage, setLoadingStage] = useState<'downloading' | 'processing' | 'rendering' | 'complete'>('downloading');
  
  const { startTimeout, clearTimeout, extendTimeout, getElapsedTime } = usePDFTimeout();
  const { startProgressSimulation, clearProgressSimulation } = usePDFProgressSimulation();
  const { getCachedDocument, setCachedDocument } = usePDFCache();
  const { 
    startDownloadTimer, 
    markDownloadComplete, 
    startProcessingTimer, 
    markProcessingComplete, 
    getMetrics, 
    setFileInfo, 
    reset: resetMetrics 
  } = usePDFPerformance();
  const { analyzeComplexity } = usePDFComplexity();

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
      console.log(`📏 PDF file size: ${sizeKB}KB (${sizeMB}MB), network check took ${networkTime}ms`);
      
      // Analyze complexity based on file size
      const complexity = analyzeComplexity(size);
      setFileInfo(size, complexity.estimatedComplexity);
      
      return size;
    } catch (error) {
      console.warn('⚠️ Could not determine file size, using default timeout');
      return 0;
    }
  }, [analyzeComplexity, setFileInfo]);

  const onProcessingStart = useCallback(() => {
    console.log('🔄 PDF.js processing started');
    setLoadingStage('processing');
    setLoadingPhase('מעבד תוכן PDF...');
    markDownloadComplete();
    startProcessingTimer();
  }, [markDownloadComplete, startProcessingTimer]);

  const onDocumentLoadSuccess = useCallback(({ numPages }: { numPages: number }) => {
    const loadTime = getElapsedTime();
    console.log(`✅ PDF loaded successfully with ${numPages} pages in ${loadTime}ms`);
    
    setNumPages(numPages);
    setLoading(false);
    setLoadingProgress(100);
    setError(null);
    setWaitingForUser(false);
    setLoadingPhase('');
    setLoadingStage('complete');
    
    // Mark processing as complete
    markProcessingComplete(true);
    
    // Log final metrics
    const metrics = getMetrics();
    if (metrics) {
      console.log('📊 Final Performance Metrics:', metrics);
    }
    
    // Clear all timers
    clearTimeout();
    clearProgressSimulation();
    
    // Cache document info with performance data
    setCachedDocument(fileUrl, numPages);
  }, [fileUrl, getElapsedTime, clearTimeout, clearProgressSimulation, setCachedDocument, markProcessingComplete, getMetrics]);

  const onDocumentLoadError = useCallback((error: Error) => {
    const loadTime = getElapsedTime();
    console.error(`❌ Error loading PDF after ${loadTime}ms:`, error);
    console.error('❌ Full error object:', JSON.stringify({
      name: error.name,
      message: error.message,
      stack: error.stack
    }, null, 2));
    
    // Determine error type for better UX
    let errorMessage = 'שגיאה בטעינת הקובץ';
    let errorType = 'unknown';
    
    if (error.message.includes('Invalid PDF')) {
      errorMessage = 'קובץ PDF פגום או לא תקין';
      errorType = 'invalid-pdf';
    } else if (error.message.includes('network')) {
      errorMessage = 'שגיאת רשת - אנא בדוק את החיבור שלך';
      errorType = 'network';
    } else if (error.message.includes('password')) {
      errorMessage = 'קובץ PDF מוגן בסיסמה';
      errorType = 'password';
    } else if (error.message.includes('timeout')) {
      errorMessage = 'הקובץ לוקח יותר מדי זמן לטעינה';
      errorType = 'timeout';
    }
    
    setError(`${errorMessage} - אנא נסה שוב`);
    setLoading(false);
    setLoadingProgress(0);
    setWaitingForUser(false);
    setLoadingPhase('');
    setLoadingStage('downloading');
    
    // Mark processing as failed
    markProcessingComplete(false, errorType);
    
    // Clear timers
    clearTimeout();
    clearProgressSimulation();
  }, [getElapsedTime, clearTimeout, clearProgressSimulation, markProcessingComplete]);

  const onDocumentLoadProgress = useCallback(({ loaded, total }: { loaded: number; total: number }) => {
    if (total > 0) {
      const progress = Math.min((loaded / total) * 100, 100);
      const loadTime = getElapsedTime();
      setLoadingProgress(progress);
      setLoadingStage('downloading');
      
      // Update loading phase based on progress
      if (progress < 30) {
        setLoadingPhase('מוריד קובץ...');
      } else if (progress < 70) {
        setLoadingPhase('מוריד נתונים...');
      } else if (progress < 95) {
        setLoadingPhase('מסיים הורדה...');
      } else {
        setLoadingPhase('מכין לעיבוד...');
      }
      
      // Clear simulation when real progress takes over
      if (progress > 10) {
        clearProgressSimulation();
        console.log(`🔄 Real download progress detected (${Math.round(progress)}%), stopping simulation after ${loadTime}ms`);
      }
      
      console.log(`📊 Real download progress: ${Math.round(progress)}% (${Math.round(loaded/1024)}KB/${Math.round(total/1024)}KB)`);
    }
  }, [getElapsedTime, clearProgressSimulation]);

  const continueWaiting = useCallback(() => {
    const currentWaitTime = getElapsedTime();
    console.log(`⏳ User chose to continue waiting (current wait: ${currentWaitTime}ms)`);
    setWaitingForUser(false);
    
    // Extend timeout
    extendTimeout(fileSize, () => setWaitingForUser(true));
  }, [fileSize, getElapsedTime, extendTimeout]);

  const handleLoadingTimeout = useCallback(() => {
    const loadTime = getElapsedTime();
    console.log(`⏰ PDF loading timeout reached after ${loadTime}ms`);
    setWaitingForUser(true);
  }, [getElapsedTime]);

  const cancelLoading = useCallback(() => {
    const loadTime = getElapsedTime();
    console.log(`🚫 Loading cancelled by user after ${loadTime}ms`);
    setError('הטעינה בוטלה');
    setLoading(false);
    setLoadingProgress(0);
    setWaitingForUser(false);
    setLoadingPhase('');
    setLoadingStage('downloading');
    
    // Clear all timers
    clearTimeout();
    clearProgressSimulation();
  }, [getElapsedTime, clearTimeout, clearProgressSimulation]);

  const retryLoading = useCallback(() => {
    console.log(`🔄 Starting PDF load for: ${fileUrl}`);
    setError(null);
    setLoading(true);
    setLoadingProgress(0);
    setWaitingForUser(false);
    setLoadingPhase('מתחיל טעינה...');
    setLoadingStage('downloading');
    
    // Reset performance metrics
    resetMetrics();
    startDownloadTimer();
    
    // Check file size first
    checkFileSize(fileUrl).then((size) => {
      // Start timeout and progress simulation
      startTimeout(size || fileSize, handleLoadingTimeout);
      startProgressSimulation(setLoadingProgress, setLoadingPhase);
    });
  }, [fileUrl, fileSize, checkFileSize, startTimeout, handleLoadingTimeout, startProgressSimulation, resetMetrics, startDownloadTimer]);

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
      setLoadingStage('downloading');
      
      // Check cache first
      const cached = getCachedDocument(fileUrl);
      if (cached) {
        console.log('📋 Using cached PDF data');
        setNumPages(cached.numPages);
        setLoading(false);
        setLoadingProgress(100);
        setLoadingStage('complete');
      } else {
        retryLoading();
      }
    } else {
      // Clear timers when closing
      clearTimeout();
      clearProgressSimulation();
      resetMetrics();
    }
  }, [isOpen, fileUrl, retryLoading, getCachedDocument, clearTimeout, clearProgressSimulation, resetMetrics]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      clearTimeout();
      clearProgressSimulation();
    };
  }, [clearTimeout, clearProgressSimulation]);

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
    loadingStage,
    setPageLoading,
    onDocumentLoadSuccess,
    onDocumentLoadError,
    onDocumentLoadProgress,
    onProcessingStart,
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

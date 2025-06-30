import { useState, useCallback, useEffect } from 'react';
import { usePDFTimeout } from './usePDFTimeout';
import { usePDFProgressSimulation } from './usePDFProgressSimulation';
import { usePDFCache } from './usePDFCache';
import { usePDFPerformance } from './usePDFPerformance';
import { usePDFComplexity } from './usePDFComplexity';
import { usePDFDebug } from './usePDFDebug';
import { usePDFFallback, FallbackStrategy } from './usePDFFallback';

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
  const [fallbackSuggestion, setFallbackSuggestion] = useState<FallbackStrategy | null>(null);
  
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
  const { 
    debugMode, 
    setDebugMode, 
    startTimer, 
    endTimer, 
    logRealProgress, 
    analyzeResourceUsage, 
    analyzePDFStructure, 
    setWorkerStatus, 
    setFailurePoint, 
    reset: resetDebug,
    getDebugSummary 
  } = usePDFDebug();
  const { suggestFallback, executeFallback } = usePDFFallback();

  // Get file size with detailed logging and analysis
  const checkFileSize = useCallback(async (url: string) => {
    try {
      startTimer('file-size-check');
      const response = await fetch(url, { method: 'HEAD' });
      const networkTime = endTimer('file-size-check');
      const size = parseInt(response.headers.get('Content-Length') || '0');
      setFileSize(size);
      
      const sizeKB = Math.round(size / 1024);
      const sizeMB = Math.round(size / (1024 * 1024) * 10) / 10;
      console.log(`📏 PDF file size: ${sizeKB}KB (${sizeMB}MB), network check took ${networkTime}ms`);
      
      // Analyze complexity and PDF structure
      const complexity = analyzeComplexity(size);
      const structure = analyzePDFStructure(size);
      setFileInfo(size, complexity.estimatedComplexity);
      
      // Resource usage check
      analyzeResourceUsage();
      
      return size;
    } catch (error) {
      console.warn('⚠️ Could not determine file size, using default timeout');
      setFailurePoint('download');
      return 0;
    }
  }, [analyzeComplexity, analyzePDFStructure, setFileInfo, startTimer, endTimer, analyzeResourceUsage, setFailurePoint]);

  const onProcessingStart = useCallback(() => {
    console.log('🔄 PDF.js processing started');
    startTimer('pdf-processing');
    setLoadingStage('processing');
    setLoadingPhase('מעבד תוכן PDF...');
    setWorkerStatus('working');
    markDownloadComplete();
    startProcessingTimer();
  }, [markDownloadComplete, startProcessingTimer, startTimer, setWorkerStatus]);

  const onDocumentLoadSuccess = useCallback(({ numPages }: { numPages: number }) => {
    const processingTime = endTimer('pdf-processing');
    const totalTime = getElapsedTime();
    console.log(`✅ PDF loaded successfully with ${numPages} pages`);
    console.log(`⏱️ Processing took ${processingTime}ms, total time ${totalTime}ms`);
    
    setNumPages(numPages);
    setLoading(false);
    setLoadingProgress(100);
    setError(null);
    setWaitingForUser(false);
    setLoadingPhase('');
    setLoadingStage('complete');
    setWorkerStatus('idle');
    setFallbackSuggestion(null);
    
    // Log final progress
    logRealProgress(100);
    
    // Mark processing as complete
    markProcessingComplete(true);
    
    // Log final metrics and debug summary
    const metrics = getMetrics();
    const debugSummary = getDebugSummary();
    if (metrics) {
      console.log('📊 Final Performance Metrics:', metrics);
    }
    console.log('🔍 Debug Summary:', debugSummary);
    
    // Clear all timers
    clearTimeout();
    clearProgressSimulation();
    
    // Cache document info with performance data
    setCachedDocument(fileUrl, numPages);
  }, [fileUrl, getElapsedTime, endTimer, clearTimeout, clearProgressSimulation, setCachedDocument, markProcessingComplete, getMetrics, logRealProgress, getDebugSummary, setWorkerStatus]);

  const onDocumentLoadError = useCallback((error: Error) => {
    const processingTime = endTimer('pdf-processing');
    const totalTime = getElapsedTime();
    console.error(`❌ Error loading PDF after ${totalTime}ms (processing: ${processingTime}ms)`);
    console.error('❌ Full error object:', {
      name: error.name,
      message: error.message,
      stack: debugMode ? error.stack : '[hidden]'
    });
    
    // Enhanced error analysis
    let errorMessage = 'שגיאה בטעינת הקובץ';
    let errorType = 'unknown';
    let suggestedFallback: FallbackStrategy = 'download-only';
    
    if (error.message.includes('Invalid PDF') || error.message.includes('corrupted')) {
      errorMessage = 'קובץ PDF פגום או לא תקין';
      errorType = 'invalid-pdf';
      suggestedFallback = 'new-tab';
      setFailurePoint('parsing');
    } else if (error.message.includes('network') || error.message.includes('fetch')) {
      errorMessage = 'שגיאת רשת - אנא בדוק את החיבור שלך';
      errorType = 'network';
      suggestedFallback = 'new-tab';
      setFailurePoint('download');
    } else if (error.message.includes('password') || error.message.includes('encrypted')) {
      errorMessage = 'קובץ PDF מוגן בסיסמה';
      errorType = 'password';
      suggestedFallback = 'download-only';
      setFailurePoint('parsing');
    } else if (error.message.includes('timeout') || error.message.includes('time')) {
      errorMessage = 'הקובץ לוקח יותר מדי זמן לטעינה';
      errorType = 'timeout';
      suggestedFallback = 'simple-load';
      setFailurePoint('timeout');
    } else if (error.message.includes('memory') || error.message.includes('heap')) {
      errorMessage = 'הקובץ גדול מדי לעיבוד';
      errorType = 'memory-error';
      suggestedFallback = 'page-by-page';
      setFailurePoint('rendering');
    } else {
      // Check debug data for more clues
      const debugSummary = getDebugSummary();
      if (debugSummary.progressStalled) {
        errorType = 'processing-stalled';
        suggestedFallback = 'simple-load';
        setFailurePoint('rendering');
      } else {
        setFailurePoint('parsing');
      }
    }
    
    setError(`${errorMessage} - ${errorType !== 'unknown' ? 'נסה פתרון חלופי' : 'אנא נסה שוב'}`);
    setLoading(false);
    setLoadingProgress(0);
    setWaitingForUser(false);
    setLoadingPhase('');
    setLoadingStage('downloading');
    setWorkerStatus('error');
    setFallbackSuggestion(suggestedFallback);
    
    // Mark processing as failed
    markProcessingComplete(false, errorType);
    
    // Clear timers
    clearTimeout();
    clearProgressSimulation();
  }, [getElapsedTime, endTimer, clearTimeout, clearProgressSimulation, markProcessingComplete, debugMode, getDebugSummary, setFailurePoint, setWorkerStatus]);

  const onDocumentLoadProgress = useCallback(({ loaded, total }: { loaded: number; total: number }) => {
    if (total > 0) {
      const progress = Math.min((loaded / total) * 100, 100);
      const loadTime = getElapsedTime();
      setLoadingProgress(progress);
      setLoadingStage('downloading');
      
      // Log real progress for debugging
      logRealProgress(progress);
      
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
  }, [getElapsedTime, clearProgressSimulation, logRealProgress]);

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
    
    // Analyze what type of timeout this is
    const debugSummary = getDebugSummary();
    let suggestedFallback: FallbackStrategy = 'simple-load';
    
    if (debugSummary.progressStalled && debugSummary.finalProgress < 100) {
      suggestedFallback = 'new-tab'; // Download didn't complete
      setFailurePoint('download');
    } else if (debugSummary.finalProgress >= 100) {
      suggestedFallback = 'simple-load'; // Processing is stuck
      setFailurePoint('rendering');
    }
    
    setFallbackSuggestion(suggestedFallback);
    setWaitingForUser(true);
  }, [getElapsedTime, getDebugSummary, setFailurePoint]);

  const cancelLoading = useCallback(() => {
    const loadTime = getElapsedTime();
    console.log(`🚫 Loading cancelled by user after ${loadTime}ms`);
    setError('הטעינה בוטלה');
    setLoading(false);
    setLoadingProgress(0);
    setWaitingForUser(false);
    setLoadingPhase('');
    setLoadingStage('downloading');
    setFallbackSuggestion(null);
    
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
    setFallbackSuggestion(null);
    
    // Reset all metrics and debug data
    resetMetrics();
    resetDebug();
    startDownloadTimer();
    startTimer('total-load');
    
    // Check file size first
    checkFileSize(fileUrl).then((size) => {
      // Start timeout and progress simulation (only if not in debug mode)
      startTimeout(size || fileSize, handleLoadingTimeout);
      if (!debugMode) {
        startProgressSimulation(setLoadingProgress, setLoadingPhase);
      }
    });
  }, [fileUrl, fileSize, checkFileSize, startTimeout, handleLoadingTimeout, startProgressSimulation, resetMetrics, resetDebug, startDownloadTimer, startTimer, debugMode]);

  const executeFallbackStrategy = useCallback(async (strategy?: FallbackStrategy) => {
    const fallbackToUse = strategy || fallbackSuggestion;
    if (!fallbackToUse) return null;
    
    try {
      const result = await executeFallback(fallbackToUse, {
        fileUrl,
        fileName: 'document.pdf', // You might want to pass this as a prop
        failureType: 'unknown'
      });
      
      if (result.type === 'simple-options') {
        // Return simplified options for retry
        return result.options;
      }
      
      console.log(`✅ Fallback executed: ${result.message}`);
      return result;
    } catch (error) {
      console.error('❌ Fallback strategy failed:', error);
      return null;
    }
  }, [fallbackSuggestion, executeFallback, fileUrl]);

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
      setFallbackSuggestion(null);
      
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
      resetDebug();
    }
  }, [isOpen, fileUrl, retryLoading, getCachedDocument, clearTimeout, clearProgressSimulation, resetMetrics, resetDebug]);

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
    fallbackSuggestion,
    debugMode,
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
    continueWaiting,
    executeFallbackStrategy,
    setDebugMode
  };
};

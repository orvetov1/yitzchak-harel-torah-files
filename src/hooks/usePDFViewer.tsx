
import { useCallback, useEffect } from 'react';
import { usePDFTimeout } from './usePDFTimeout';
import { usePDFProgressSimulation } from './usePDFProgressSimulation';
import { usePDFCache } from './usePDFCache';
import { usePDFPerformance } from './usePDFPerformance';
import { usePDFComplexity } from './usePDFComplexity';
import { usePDFNavigation } from './usePDFNavigation';
import { usePDFLoadingState } from './usePDFLoadingState';
import { usePDFEventHandlers } from './usePDFEventHandlers';

export const usePDFViewer = (fileUrl: string, isOpen: boolean) => {
  const navigation = usePDFNavigation();
  const loadingState = usePDFLoadingState();
  
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
      loadingState.setFileSize(size);
      
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
  }, [analyzeComplexity, setFileInfo, loadingState.setFileSize]);

  const eventHandlers = usePDFEventHandlers({
    fileUrl,
    fileSize: loadingState.fileSize,
    setLoadingStage: loadingState.setLoadingStage,
    setLoadingPhase: loadingState.setLoadingPhase,
    setLoadingProgress: loadingState.setLoadingProgress,
    setLoadingSuccess: loadingState.setLoadingSuccess,
    setLoadingError: loadingState.setLoadingError,
    setCachedDocument,
    setNumPages: navigation.setNumPages,
    clearTimeout,
    clearProgressSimulation,
    getElapsedTime
  });

  const continueWaiting = useCallback(() => {
    const currentWaitTime = getElapsedTime();
    console.log(`⏳ User chose to continue waiting (current wait: ${currentWaitTime}ms)`);
    loadingState.setWaitingForUser(false);
    
    // Extend timeout
    extendTimeout(loadingState.fileSize, () => loadingState.setWaitingForUser(true));
  }, [loadingState.fileSize, getElapsedTime, extendTimeout, loadingState.setWaitingForUser]);

  const handleLoadingTimeout = useCallback(() => {
    const loadTime = getElapsedTime();
    console.log(`⏰ PDF loading timeout reached after ${loadTime}ms`);
    loadingState.setWaitingForUser(true);
  }, [getElapsedTime, loadingState.setWaitingForUser]);

  const cancelLoading = useCallback(() => {
    const loadTime = getElapsedTime();
    console.log(`🚫 Loading cancelled by user after ${loadTime}ms`);
    loadingState.setLoadingError('הטעינה בוטלה');
    
    // Clear all timers
    clearTimeout();
    clearProgressSimulation();
  }, [getElapsedTime, clearTimeout, clearProgressSimulation, loadingState.setLoadingError]);

  const retryLoading = useCallback(() => {
    console.log(`🔄 Starting PDF load for: ${fileUrl}`);
    loadingState.resetLoadingState();
    loadingState.setLoadingPhase('מתחיל טעינה...');
    
    // Reset performance metrics
    resetMetrics();
    startDownloadTimer();
    
    // Check file size first
    checkFileSize(fileUrl).then((size) => {
      // Start timeout and progress simulation
      startTimeout(size || loadingState.fileSize, handleLoadingTimeout);
      startProgressSimulation(loadingState.setLoadingProgress, loadingState.setLoadingPhase);
    });
  }, [
    fileUrl, 
    loadingState, 
    checkFileSize, 
    startTimeout, 
    handleLoadingTimeout, 
    startProgressSimulation, 
    resetMetrics, 
    startDownloadTimer
  ]);

  // Reset state when opening
  useEffect(() => {
    if (isOpen) {
      console.log(`🚀 PDF viewer opened for: ${fileUrl}`);
      navigation.resetNavigation();
      loadingState.setError(null);
      loadingState.setWaitingForUser(false);
      loadingState.setLoadingPhase('');
      loadingState.setLoadingStage('downloading');
      
      // Check cache first
      const cached = getCachedDocument(fileUrl);
      if (cached) {
        console.log('📋 Using cached PDF data');
        navigation.setNumPages(cached.numPages);
        loadingState.setLoadingSuccess();
      } else {
        retryLoading();
      }
    } else {
      // Clear timers when closing
      clearTimeout();
      clearProgressSimulation();
      resetMetrics();
    }
  }, [isOpen, fileUrl, retryLoading, getCachedDocument, clearTimeout, clearProgressSimulation, resetMetrics, navigation, loadingState]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      clearTimeout();
      clearProgressSimulation();
    };
  }, [clearTimeout, clearProgressSimulation]);

  return {
    // Navigation
    numPages: navigation.numPages,
    pageNumber: navigation.pageNumber,
    scale: navigation.scale,
    goToPrevPage: navigation.goToPrevPage,
    goToNextPage: navigation.goToNextPage,
    zoomIn: navigation.zoomIn,
    zoomOut: navigation.zoomOut,
    setPage: navigation.setPage,
    
    // Loading state
    loading: loadingState.loading,
    loadingProgress: loadingState.loadingProgress,
    error: loadingState.error,
    pageLoading: loadingState.pageLoading,
    fileSize: loadingState.fileSize,
    waitingForUser: loadingState.waitingForUser,
    loadingPhase: loadingState.loadingPhase,
    loadingStage: loadingState.loadingStage,
    setPageLoading: loadingState.setPageLoading,
    
    // Event handlers
    onDocumentLoadSuccess: eventHandlers.onDocumentLoadSuccess,
    onDocumentLoadError: eventHandlers.onDocumentLoadError,
    onDocumentLoadProgress: eventHandlers.onDocumentLoadProgress,
    onProcessingStart: eventHandlers.onProcessingStart,
    
    // Actions
    cancelLoading,
    retryLoading,
    continueWaiting
  };
};

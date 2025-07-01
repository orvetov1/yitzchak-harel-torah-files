
import { useCallback } from 'react';
import { usePDFComplexity } from './usePDFComplexity';
import { usePDFPerformance } from './usePDFPerformance';

interface EventHandlersProps {
  fileUrl: string;
  fileSize: number;
  setLoadingStage: (stage: 'downloading' | 'processing' | 'rendering' | 'complete') => void;
  setLoadingPhase: (phase: string) => void;
  setLoadingProgress: (progress: number) => void;
  setLoadingSuccess: () => void;
  setLoadingError: (error: string) => void;
  setCachedDocument: (url: string, numPages: number) => void;
  setNumPages: (pages: number) => void;
  clearTimeout: () => void;
  clearProgressSimulation: () => void;
  getElapsedTime: () => number;
}

export const usePDFEventHandlers = ({
  fileUrl,
  fileSize,
  setLoadingStage,
  setLoadingPhase,
  setLoadingProgress,
  setLoadingSuccess,
  setLoadingError,
  setCachedDocument,
  setNumPages,
  clearTimeout,
  clearProgressSimulation,
  getElapsedTime
}: EventHandlersProps) => {
  const { analyzeComplexity } = usePDFComplexity();
  const { 
    markDownloadComplete, 
    startProcessingTimer, 
    markProcessingComplete, 
    getMetrics, 
    setFileInfo 
  } = usePDFPerformance();

  const onProcessingStart = useCallback(() => {
    console.log('🔄 PDF.js processing started');
    setLoadingStage('processing');
    setLoadingPhase('מעבד תוכן PDF...');
    markDownloadComplete();
    startProcessingTimer();
  }, [markDownloadComplete, startProcessingTimer, setLoadingStage, setLoadingPhase]);

  const onDocumentLoadSuccess = useCallback(({ numPages }: { numPages: number }) => {
    const loadTime = getElapsedTime();
    console.log(`✅ PDF loaded successfully with ${numPages} pages in ${loadTime}ms`);
    
    setNumPages(numPages);
    setLoadingSuccess();
    
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
  }, [
    fileUrl, 
    getElapsedTime, 
    clearTimeout, 
    clearProgressSimulation, 
    setCachedDocument, 
    markProcessingComplete, 
    getMetrics,
    setNumPages,
    setLoadingSuccess
  ]);

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
    
    setLoadingError(`${errorMessage} - אנא נסה שוב`);
    
    // Mark processing as failed
    markProcessingComplete(false, errorType);
    
    // Clear timers
    clearTimeout();
    clearProgressSimulation();
  }, [getElapsedTime, clearTimeout, clearProgressSimulation, markProcessingComplete, setLoadingError]);

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
  }, [getElapsedTime, clearProgressSimulation, setLoadingProgress, setLoadingStage, setLoadingPhase]);

  return {
    onProcessingStart,
    onDocumentLoadSuccess,
    onDocumentLoadError,
    onDocumentLoadProgress
  };
};


import { useRef, useCallback, useState } from 'react';

interface PDFDebugData {
  downloadTime?: number;
  processingTime?: number;
  realProgressEvents: { progress: number; timestamp: number }[];
  resourceUsage: { cpu?: number; memory?: number };
  pdfStructure?: {
    hasImages: boolean;
    hasVectorGraphics: boolean;
    isScanned: boolean;
    pageComplexity: 'simple' | 'medium' | 'complex';
  };
  failurePoint?: 'download' | 'parsing' | 'rendering' | 'timeout';
  workerStatus: 'idle' | 'working' | 'error';
}

export const usePDFDebug = () => {
  const [debugData, setDebugData] = useState<PDFDebugData>({
    realProgressEvents: [],
    resourceUsage: {},
    workerStatus: 'idle'
  });
  const [debugMode, setDebugMode] = useState(false);
  const timersRef = useRef<{ [key: string]: number }>({});

  const startTimer = useCallback((name: string) => {
    timersRef.current[name] = Date.now();
    console.log(`🔍 Debug Timer Started: ${name}`);
  }, []);

  const endTimer = useCallback((name: string) => {
    if (timersRef.current[name]) {
      const duration = Date.now() - timersRef.current[name];
      console.log(`⏱️ Debug Timer Ended: ${name} - ${duration}ms`);
      
      setDebugData(prev => ({
        ...prev,
        [`${name}Time`]: duration
      }));
      
      return duration;
    }
    return 0;
  }, []);

  const logRealProgress = useCallback((progress: number) => {
    const timestamp = Date.now();
    console.log(`📊 Real PDF Progress: ${Math.round(progress)}% at ${timestamp}`);
    
    setDebugData(prev => ({
      ...prev,
      realProgressEvents: [...prev.realProgressEvents, { progress, timestamp }]
    }));
  }, []);

  const analyzeResourceUsage = useCallback(() => {
    if ('memory' in performance && 'getEntriesByType' in performance) {
      try {
        // @ts-ignore - experimental API
        const memInfo = (performance as any).memory;
        const resourceUsage = {
          memory: memInfo ? Math.round(memInfo.usedJSHeapSize / 1024 / 1024) : 0
        };
        
        setDebugData(prev => ({
          ...prev,
          resourceUsage
        }));
        
        console.log(`💾 Resource Usage: ${resourceUsage.memory}MB`);
      } catch (error) {
        console.warn('⚠️ Could not analyze resource usage');
      }
    }
  }, []);

  const analyzePDFStructure = useCallback((fileSize: number, numPages: number = 1) => {
    const avgPageSize = fileSize / numPages;
    const sizeKB = fileSize / 1024;
    
    // Heuristic analysis
    const structure = {
      hasImages: sizeKB > 500, // > 500KB likely has images
      hasVectorGraphics: avgPageSize > 200 * 1024, // > 200KB per page
      isScanned: sizeKB > 1000 && (fileSize / numPages) > 800 * 1024, // Large file with big pages
      pageComplexity: avgPageSize > 500 * 1024 ? 'complex' as const : 
                     avgPageSize > 200 * 1024 ? 'medium' as const : 'simple' as const
    };
    
    setDebugData(prev => ({
      ...prev,
      pdfStructure: structure
    }));
    
    console.log(`🔍 PDF Structure Analysis:`, structure);
    return structure;
  }, []);

  const setWorkerStatus = useCallback((status: 'idle' | 'working' | 'error') => {
    setDebugData(prev => ({
      ...prev,
      workerStatus: status
    }));
    console.log(`⚙️ PDF Worker Status: ${status}`);
  }, []);

  const setFailurePoint = useCallback((point: 'download' | 'parsing' | 'rendering' | 'timeout') => {
    setDebugData(prev => ({
      ...prev,
      failurePoint: point
    }));
    console.error(`❌ PDF Loading Failed at: ${point}`);
  }, []);

  const reset = useCallback(() => {
    timersRef.current = {};
    setDebugData({
      realProgressEvents: [],
      resourceUsage: {},
      workerStatus: 'idle'
    });
  }, []);

  const getDebugSummary = useCallback(() => {
    const { realProgressEvents, pdfStructure, failurePoint } = debugData;
    
    const summary = {
      totalRealProgressEvents: realProgressEvents.length,
      finalProgress: realProgressEvents.length > 0 ? 
        realProgressEvents[realProgressEvents.length - 1].progress : 0,
      progressStalled: realProgressEvents.length > 0 && 
        realProgressEvents[realProgressEvents.length - 1].progress < 100,
      likelyIssue: failurePoint || (pdfStructure?.isScanned ? 'scanned-pdf' : 
                   pdfStructure?.pageComplexity === 'complex' ? 'complex-pdf' : 'unknown')
    };
    
    console.log(`📋 Debug Summary:`, summary);
    return summary;
  }, [debugData]);

  return {
    debugMode,
    setDebugMode,
    debugData,
    startTimer,
    endTimer,
    logRealProgress,
    analyzeResourceUsage,
    analyzePDFStructure,
    setWorkerStatus,
    setFailurePoint,
    reset,
    getDebugSummary
  };
};

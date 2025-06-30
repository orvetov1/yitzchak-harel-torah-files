
import { useRef, useCallback } from 'react';
import { PDFPerformanceMetrics } from '../types/pdfViewer';

export const usePDFPerformance = () => {
  const metricsRef = useRef<Partial<PDFPerformanceMetrics>>({});
  const timersRef = useRef<{
    downloadStart?: number;
    processingStart?: number;
    totalStart?: number;
  }>({});

  const startDownloadTimer = useCallback(() => {
    const now = Date.now();
    timersRef.current.downloadStart = now;
    timersRef.current.totalStart = now;
    metricsRef.current = { downloadTime: 0, processingTime: 0, totalTime: 0 };
    console.time('PDF-Download');
    console.time('PDF-Total');
  }, []);

  const markDownloadComplete = useCallback(() => {
    if (timersRef.current.downloadStart) {
      const downloadTime = Date.now() - timersRef.current.downloadStart;
      metricsRef.current.downloadTime = downloadTime;
      console.timeEnd('PDF-Download');
      console.log(`📥 PDF Download completed in ${downloadTime}ms`);
    }
  }, []);

  const startProcessingTimer = useCallback(() => {
    timersRef.current.processingStart = Date.now();
    console.time('PDF-Processing');
    console.log('🔄 Starting PDF.js processing...');
  }, []);

  const markProcessingComplete = useCallback((success: boolean, errorType?: string) => {
    if (timersRef.current.processingStart) {
      const processingTime = Date.now() - timersRef.current.processingStart;
      metricsRef.current.processingTime = processingTime;
      console.timeEnd('PDF-Processing');
      console.log(`⚙️ PDF Processing ${success ? 'completed' : 'failed'} in ${processingTime}ms`);
    }

    if (timersRef.current.totalStart) {
      const totalTime = Date.now() - timersRef.current.totalStart;
      metricsRef.current.totalTime = totalTime;
      metricsRef.current.success = success;
      metricsRef.current.errorType = errorType;
      console.timeEnd('PDF-Total');
      console.log(`📊 Total PDF load time: ${totalTime}ms (Success: ${success})`);
    }
  }, []);

  const getMetrics = useCallback((): PDFPerformanceMetrics | null => {
    const metrics = metricsRef.current;
    if (metrics.totalTime && metrics.downloadTime !== undefined && metrics.processingTime !== undefined) {
      return {
        downloadTime: metrics.downloadTime,
        processingTime: metrics.processingTime,
        totalTime: metrics.totalTime,
        fileSize: metrics.fileSize || 0,
        complexity: metrics.complexity || 'unknown',
        success: metrics.success || false,
        errorType: metrics.errorType
      };
    }
    return null;
  }, []);

  const setFileInfo = useCallback((fileSize: number, complexity: string) => {
    metricsRef.current.fileSize = fileSize;
    metricsRef.current.complexity = complexity;
  }, []);

  const reset = useCallback(() => {
    timersRef.current = {};
    metricsRef.current = {};
  }, []);

  return {
    startDownloadTimer,
    markDownloadComplete,
    startProcessingTimer,
    markProcessingComplete,
    getMetrics,
    setFileInfo,
    reset
  };
};

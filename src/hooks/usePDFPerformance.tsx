
import { useState, useCallback, useRef, useEffect } from 'react';

interface PDFPerformanceMetrics {
  loadStartTime: number;
  loadEndTime: number;
  fileSize: number;
  loadDuration: number;
  pagesLoaded: number;
}

interface PDFCache {
  [key: string]: {
    numPages: number;
    loadedAt: number;
    metrics: PDFPerformanceMetrics;
    preloadedPages?: number[];
  };
}

export const usePDFPerformance = () => {
  const [metrics, setMetrics] = useState<PDFPerformanceMetrics[]>([]);
  const cacheRef = useRef<PDFCache>({});
  const preloadQueueRef = useRef<Set<string>>(new Set());

  const startPerformanceTracking = useCallback((fileUrl: string, fileSize: number) => {
    const startTime = performance.now();
    console.log(`Performance tracking started for ${fileUrl} (${Math.round(fileSize / 1024)}KB)`);
    
    return {
      fileUrl,
      startTime,
      fileSize
    };
  }, []);

  const endPerformanceTracking = useCallback((trackingData: any, numPages: number) => {
    const endTime = performance.now();
    const duration = endTime - trackingData.startTime;
    
    const newMetric: PDFPerformanceMetrics = {
      loadStartTime: trackingData.startTime,
      loadEndTime: endTime,
      fileSize: trackingData.fileSize,
      loadDuration: duration,
      pagesLoaded: numPages
    };

    setMetrics(prev => [...prev.slice(-9), newMetric]); // Keep last 10 metrics
    
    // Cache the result
    cacheRef.current[trackingData.fileUrl] = {
      numPages,
      loadedAt: Date.now(),
      metrics: newMetric
    };

    console.log(`Performance tracking completed:
      File: ${trackingData.fileUrl}
      Duration: ${Math.round(duration)}ms
      Size: ${Math.round(trackingData.fileSize / 1024)}KB
      Pages: ${numPages}
      Speed: ${Math.round(trackingData.fileSize / 1024 / (duration / 1000))}KB/s`);

    return newMetric;
  }, []);

  const getCachedDocument = useCallback((fileUrl: string) => {
    const cached = cacheRef.current[fileUrl];
    if (cached && Date.now() - cached.loadedAt < 10 * 60 * 1000) { // 10 minutes cache
      console.log(`Using cached PDF data for ${fileUrl}`);
      return cached;
    }
    return null;
  }, []);

  const preloadNextPages = useCallback((fileUrl: string, currentPage: number, totalPages: number) => {
    if (preloadQueueRef.current.has(fileUrl)) return;
    
    const pagesToPreload = [];
    // Preload next 2 pages
    for (let i = 1; i <= 2; i++) {
      if (currentPage + i <= totalPages) {
        pagesToPreload.push(currentPage + i);
      }
    }
    
    if (pagesToPreload.length > 0) {
      preloadQueueRef.current.add(fileUrl);
      console.log(`Preloading pages ${pagesToPreload.join(', ')} for ${fileUrl}`);
      
      // Simple preload simulation - in a full implementation, 
      // this would actually preload the page renders
      setTimeout(() => {
        preloadQueueRef.current.delete(fileUrl);
        console.log(`Preloading completed for ${fileUrl}`);
      }, 1000);
    }
  }, []);

  const getOptimalTimeout = useCallback((fileSize: number) => {
    const fileSizeMB = fileSize / (1024 * 1024);
    
    if (fileSizeMB > 5) {
      return 3000; // 3 seconds for very large files
    } else if (fileSizeMB > 2) {
      return 2000; // 2 seconds for medium files
    } else {
      return 1000; // 1 second for small files (local resources)
    }
  }, []);

  const getPerformanceInsights = useCallback(() => {
    if (metrics.length === 0) return null;
    
    const avgLoadTime = metrics.reduce((sum, m) => sum + m.loadDuration, 0) / metrics.length;
    const avgFileSize = metrics.reduce((sum, m) => sum + m.fileSize, 0) / metrics.length;
    const avgSpeed = avgFileSize / 1024 / (avgLoadTime / 1000); // KB/s
    
    return {
      averageLoadTime: Math.round(avgLoadTime),
      averageFileSize: Math.round(avgFileSize / 1024),
      averageSpeed: Math.round(avgSpeed),
      totalFilesLoaded: metrics.length,
      recommendation: avgLoadTime > 3000 ? 'Consider optimizing PDF files' : 'Performance is good'
    };
  }, [metrics]);

  // Cleanup old cache entries periodically
  useEffect(() => {
    const cleanup = setInterval(() => {
      const now = Date.now();
      const keys = Object.keys(cacheRef.current);
      
      keys.forEach(key => {
        if (now - cacheRef.current[key].loadedAt > 20 * 60 * 1000) { // 20 minutes
          delete cacheRef.current[key];
          console.log(`Cleaned up old cache entry for ${key}`);
        }
      });
    }, 5 * 60 * 1000); // Run every 5 minutes

    return () => clearInterval(cleanup);
  }, []);

  return {
    startPerformanceTracking,
    endPerformanceTracking,
    getCachedDocument,
    preloadNextPages,
    getOptimalTimeout,
    getPerformanceInsights,
    metrics
  };
};

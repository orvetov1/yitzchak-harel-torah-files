
import { useRef, useCallback } from 'react';
import { DocumentCache } from '../types/pdfViewer';

export const usePDFCache = () => {
  const cacheRef = useRef<DocumentCache>({});

  const getCachedDocument = useCallback((fileUrl: string) => {
    const cached = cacheRef.current[fileUrl];
    if (cached && Date.now() - cached.loadedAt < 5 * 60 * 1000) { // 5 minutes cache
      console.log('📋 Using cached PDF data');
      return cached;
    }
    return null;
  }, []);

  const setCachedDocument = useCallback((fileUrl: string, numPages: number) => {
    cacheRef.current[fileUrl] = {
      numPages,
      loadedAt: Date.now()
    };
  }, []);

  return {
    getCachedDocument,
    setCachedDocument
  };
};

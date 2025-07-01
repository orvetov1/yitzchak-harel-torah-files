
import { useState, useCallback, useRef } from 'react';

interface RangeLoaderOptions {
  chunkSize?: number;
  maxRetries?: number;
}

interface RangeLoadState {
  loadedRanges: Array<{ start: number; end: number }>;
  totalSize: number;
  isSupported: boolean;
  error: string | null;
}

export const usePDFRangeLoader = (fileUrl: string, options: RangeLoaderOptions = {}) => {
  const { chunkSize = 64 * 1024, maxRetries = 3 } = options; // 64KB chunks
  const [state, setState] = useState<RangeLoadState>({
    loadedRanges: [],
    totalSize: 0,
    isSupported: false,
    error: null
  });
  
  const abortControllerRef = useRef<AbortController | null>(null);
  const cacheRef = useRef<Map<string, ArrayBuffer>>(new Map());

  const checkRangeSupport = useCallback(async (): Promise<boolean> => {
    try {
      console.log('🔍 Checking Range Request support for:', fileUrl);
      const response = await fetch(fileUrl, { 
        method: 'HEAD',
        headers: { 'Range': 'bytes=0-1' }
      });
      
      const acceptRanges = response.headers.get('Accept-Ranges');
      const contentRange = response.headers.get('Content-Range');
      const totalSize = parseInt(response.headers.get('Content-Length') || '0');
      
      const isSupported = acceptRanges === 'bytes' || contentRange !== null;
      
      console.log('📊 Range support check:', {
        acceptRanges,
        contentRange,
        totalSize,
        isSupported,
        status: response.status
      });

      setState(prev => ({
        ...prev,
        totalSize,
        isSupported,
        error: null
      }));

      return isSupported;
    } catch (error) {
      console.error('❌ Range support check failed:', error);
      setState(prev => ({
        ...prev,
        error: 'Failed to check range support',
        isSupported: false
      }));
      return false;
    }
  }, [fileUrl]);

  const loadRange = useCallback(async (start: number, end: number): Promise<ArrayBuffer | null> => {
    const rangeKey = `${start}-${end}`;
    
    // Check cache first
    if (cacheRef.current.has(rangeKey)) {
      console.log('📋 Using cached range:', rangeKey);
      return cacheRef.current.get(rangeKey)!;
    }

    try {
      abortControllerRef.current = new AbortController();
      
      console.log(`📥 Loading range: bytes=${start}-${end}`);
      
      const response = await fetch(fileUrl, {
        headers: {
          'Range': `bytes=${start}-${end}`
        },
        signal: abortControllerRef.current.signal
      });

      if (!response.ok) {
        throw new Error(`Range request failed: ${response.status}`);
      }

      const buffer = await response.arrayBuffer();
      
      // Cache the loaded range
      cacheRef.current.set(rangeKey, buffer);
      
      // Update loaded ranges
      setState(prev => ({
        ...prev,
        loadedRanges: [...prev.loadedRanges, { start, end }],
        error: null
      }));

      console.log(`✅ Range loaded successfully: ${buffer.byteLength} bytes`);
      return buffer;
      
    } catch (error) {
      if (error instanceof Error && error.name === 'AbortError') {
        console.log('🚫 Range loading aborted');
        return null;
      }
      
      console.error('❌ Range loading failed:', error);
      setState(prev => ({
        ...prev,
        error: `Failed to load range ${start}-${end}`
      }));
      return null;
    }
  }, [fileUrl]);

  const loadInitialChunk = useCallback(async (): Promise<ArrayBuffer | null> => {
    const isSupported = await checkRangeSupport();
    
    if (!isSupported) {
      console.log('⚠️ Range requests not supported, falling back to full download');
      return null;
    }

    // Load first chunk which should contain PDF header and initial pages
    return loadRange(0, chunkSize - 1);
  }, [checkRangeSupport, loadRange, chunkSize]);

  const cancelLoading = useCallback(() => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
      abortControllerRef.current = null;
    }
  }, []);

  const clearCache = useCallback(() => {
    cacheRef.current.clear();
    setState(prev => ({
      ...prev,
      loadedRanges: [],
      error: null
    }));
  }, []);

  return {
    state,
    checkRangeSupport,
    loadRange,
    loadInitialChunk,
    cancelLoading,
    clearCache
  };
};

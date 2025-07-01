
import { useState, useCallback, useRef, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';

interface LazyLoadState {
  loadedPages: Map<number, string>; // pageNumber -> blob URL
  preloadedPages: Set<number>;
  isLoading: boolean;
  currentPage: number;
  totalPages: number;
  loadingPages: Set<number>;
  error: string | null;
}

interface LazyLoadOptions {
  preloadDistance?: number; // Number of pages to preload ahead/behind
  maxCachedPages?: number; // Maximum pages to keep in memory
  useVirtualScrolling?: boolean;
}

export const usePDFLazyLoader = (
  pdfFileId: string,
  options: LazyLoadOptions = {}
) => {
  const {
    preloadDistance = 2,
    maxCachedPages = 10,
    useVirtualScrolling = true
  } = options;

  const [state, setState] = useState<LazyLoadState>({
    loadedPages: new Map(),
    preloadedPages: new Set(),
    isLoading: false,
    currentPage: 1,
    totalPages: 0,
    loadingPages: new Set(),
    error: null
  });

  const cacheRef = useRef<Map<number, string>>(new Map());
  const abortControllersRef = useRef<Map<number, AbortController>>(new Map());

  // Load page data (either from split pages or range request)
  const loadPageData = useCallback(async (pageNumber: number): Promise<string | null> => {
    // Check if already cached
    if (cacheRef.current.has(pageNumber)) {
      return cacheRef.current.get(pageNumber)!;
    }

    // Check if already loading
    if (state.loadingPages.has(pageNumber)) {
      return null;
    }

    try {
      setState(prev => ({
        ...prev,
        loadingPages: new Set([...prev.loadingPages, pageNumber])
      }));

      // First, try to get from split pages
      const { data: pageData, error: pageError } = await supabase
        .from('pdf_pages')
        .select('file_path')
        .eq('pdf_file_id', pdfFileId)
        .eq('page_number', pageNumber)
        .single();

      let blobUrl: string;

      if (pageData && !pageError) {
        // Use split page
        const { data: fileData, error: downloadError } = await supabase.storage
          .from('pdf-files')
          .download(pageData.file_path);

        if (downloadError || !fileData) {
          throw new Error(`Failed to download page ${pageNumber}`);
        }

        blobUrl = URL.createObjectURL(fileData);
      } else {
        // Fallback to range request from main PDF
        const { data: pdfFile } = await supabase
          .from('pdf_files')
          .select('file_path')
          .eq('id', pdfFileId)
          .single();

        if (!pdfFile) {
          throw new Error('PDF file not found');
        }

        // This is a simplified range request - in reality you'd need to calculate byte ranges
        const response = await fetch(pdfFile.file_path);
        const blob = await response.blob();
        blobUrl = URL.createObjectURL(blob);
      }

      // Cache the result
      cacheRef.current.set(pageNumber, blobUrl);

      // Clean up old cache if needed
      if (cacheRef.current.size > maxCachedPages) {
        const oldestPage = Math.min(...cacheRef.current.keys());
        const oldUrl = cacheRef.current.get(oldestPage);
        if (oldUrl) {
          URL.revokeObjectURL(oldUrl);
          cacheRef.current.delete(oldestPage);
        }
      }

      setState(prev => ({
        ...prev,
        loadedPages: new Map([...prev.loadedPages, [pageNumber, blobUrl]]),
        loadingPages: new Set([...prev.loadingPages].filter(p => p !== pageNumber))
      }));

      return blobUrl;

    } catch (error) {
      console.error(`❌ Failed to load page ${pageNumber}:`, error);
      setState(prev => ({
        ...prev,
        error: `Failed to load page ${pageNumber}`,
        loadingPages: new Set([...prev.loadingPages].filter(p => p !== pageNumber))
      }));
      return null;
    }
  }, [pdfFileId, maxCachedPages, state.loadingPages]);

  // Preload surrounding pages
  const preloadPages = useCallback(async (centerPage: number) => {
    const pagesToPreload = [];
    
    for (let i = -preloadDistance; i <= preloadDistance; i++) {
      const pageNum = centerPage + i;
      if (pageNum >= 1 && pageNum <= state.totalPages && 
          !state.loadedPages.has(pageNum) && 
          !state.preloadedPages.has(pageNum)) {
        pagesToPreload.push(pageNum);
      }
    }

    // Load pages in parallel
    const preloadPromises = pagesToPreload.map(async (pageNum) => {
      setState(prev => ({
        ...prev,
        preloadedPages: new Set([...prev.preloadedPages, pageNum])
      }));
      return loadPageData(pageNum);
    });

    await Promise.all(preloadPromises);
  }, [preloadDistance, state.totalPages, state.loadedPages, state.preloadedPages, loadPageData]);

  // Navigate to page with smart preloading
  const goToPage = useCallback(async (pageNumber: number) => {
    if (pageNumber < 1 || pageNumber > state.totalPages) return;

    setState(prev => ({ ...prev, currentPage: pageNumber, isLoading: true }));

    // Load current page
    await loadPageData(pageNumber);

    // Preload surrounding pages
    await preloadPages(pageNumber);

    setState(prev => ({ ...prev, isLoading: false }));
  }, [state.totalPages, loadPageData, preloadPages]);

  // Initialize total pages count
  useEffect(() => {
    const initializePagesCount = async () => {
      try {
        const { data, error } = await supabase
          .from('pdf_files')
          .select('num_pages_total')
          .eq('id', pdfFileId)
          .single();

        if (error) throw error;

        setState(prev => ({
          ...prev,
          totalPages: data.num_pages_total || 1
        }));

        // Load first page immediately
        if (data.num_pages_total && data.num_pages_total > 0) {
          goToPage(1);
        }

      } catch (error) {
        console.error('❌ Failed to get pages count:', error);
        setState(prev => ({
          ...prev,
          error: 'Failed to initialize PDF'
        }));
      }
    };

    if (pdfFileId) {
      initializePagesCount();
    }
  }, [pdfFileId, goToPage]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      // Revoke all blob URLs
      cacheRef.current.forEach(url => URL.revokeObjectURL(url));
      cacheRef.current.clear();
      
      // Abort all ongoing requests
      abortControllersRef.current.forEach(controller => controller.abort());
      abortControllersRef.current.clear();
    };
  }, []);

  return {
    ...state,
    goToPage,
    loadPageData,
    preloadPages,
    getPageUrl: (pageNumber: number) => state.loadedPages.get(pageNumber) || null,
    isPageLoaded: (pageNumber: number) => state.loadedPages.has(pageNumber),
    isPageLoading: (pageNumber: number) => state.loadingPages.has(pageNumber)
  };
};

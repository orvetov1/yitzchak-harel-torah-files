
import { useState, useCallback, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { usePDFPageLoader } from './pdf/usePDFPageLoader';
import { usePDFPreloader } from './pdf/usePDFPreloader';
import { usePDFCacheManager } from './pdf/usePDFCacheManager';

interface LazyLoadState {
  loadedPages: Map<number, string>;
  isLoading: boolean;
  currentPage: number;
  totalPages: number;
  error: string | null;
}

interface LazyLoadOptions {
  preloadDistance?: number;
  maxCachedPages?: number;
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
    isLoading: false,
    currentPage: 1,
    totalPages: 0,
    error: null
  });

  const { cacheRef, getPageUrl, isPageLoaded, setPageUrl, cleanup: cleanupCache, getCacheSize } = usePDFCacheManager();
  const { loadPageData, loadingPages, error: pageLoaderError, cleanup: cleanupLoader } = usePDFPageLoader(pdfFileId);
  const { preloadPages } = usePDFPreloader(preloadDistance, state.totalPages, state.loadedPages);

  // Sync cache with state - this is crucial for the UI to update
  useEffect(() => {
    const cacheSize = getCacheSize();
    console.log(`🔄 Syncing cache state: cache size=${cacheSize}, currentPage=${state.currentPage}`);
    
    // Create a new Map from the current cache
    const newLoadedPages = new Map<number, string>();
    for (let i = 1; i <= state.totalPages; i++) {
      const url = getPageUrl(i);
      if (url) {
        newLoadedPages.set(i, url);
      }
    }
    
    setState(prev => ({
      ...prev,
      loadedPages: newLoadedPages,
      error: pageLoaderError
    }));
  }, [getCacheSize, getPageUrl, state.totalPages, pageLoaderError]);

  // Navigate to page with smart preloading
  const goToPage = useCallback(async (pageNumber: number) => {
    console.log(`🎯 goToPage called with pageNumber: ${pageNumber}, current: ${state.currentPage}, total: ${state.totalPages}`);
    
    if (pageNumber < 1 || (state.totalPages > 0 && pageNumber > state.totalPages)) {
      console.log(`❌ Invalid page number: ${pageNumber}`);
      return;
    }

    // Update current page immediately
    setState(prev => ({ ...prev, currentPage: pageNumber, isLoading: true }));

    try {
      // Load current page
      const url = await loadPageData(pageNumber, cacheRef, maxCachedPages, setPageUrl);
      console.log(`✅ Page ${pageNumber} loaded with URL: ${url ? 'available' : 'null'}`);

      // Preload surrounding pages
      await preloadPages(pageNumber, (page) => loadPageData(page, cacheRef, maxCachedPages, setPageUrl));

      setState(prev => ({ ...prev, isLoading: false }));
    } catch (error) {
      console.error(`❌ Failed to load page ${pageNumber}:`, error);
      setState(prev => ({ 
        ...prev, 
        isLoading: false, 
        error: `Failed to load page ${pageNumber}` 
      }));
    }
  }, [loadPageData, preloadPages, maxCachedPages, setPageUrl, state.currentPage, state.totalPages]);

  // Initialize total pages count
  useEffect(() => {
    if (!pdfFileId) return;
    
    const initializePagesCount = async () => {
      console.log(`🚀 Initializing pages count for pdfFileId: ${pdfFileId}`);
      try {
        const { data, error } = await supabase
          .from('pdf_files')
          .select('num_pages_total')
          .eq('id', pdfFileId)
          .single();

        if (error) throw error;

        const totalPages = data.num_pages_total || 1;
        console.log(`📊 Total pages found: ${totalPages}`);

        setState(prev => ({
          ...prev,
          totalPages: totalPages,
          isLoading: true
        }));

        // Load first page immediately
        if (totalPages > 0) {
          console.log(`🎯 Loading first page automatically`);
          await loadPageData(1, cacheRef, maxCachedPages, setPageUrl);
          setState(prev => ({ ...prev, isLoading: false }));
        }

      } catch (error) {
        console.error('❌ Failed to get pages count:', error);
        setState(prev => ({
          ...prev,
          error: 'Failed to initialize PDF',
          isLoading: false
        }));
      }
    };

    initializePagesCount();
  }, [pdfFileId, loadPageData, maxCachedPages, setPageUrl]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      cleanupCache();
      cleanupLoader();
    };
  }, [cleanupCache, cleanupLoader]);

  return {
    ...state,
    goToPage,
    loadPageData: (pageNumber: number) => loadPageData(pageNumber, cacheRef, maxCachedPages, setPageUrl),
    preloadPages: (pageNumber: number) => preloadPages(pageNumber, (page) => loadPageData(page, cacheRef, maxCachedPages, setPageUrl)),
    getPageUrl,
    isPageLoaded,
    isPageLoading: (pageNumber: number) => loadingPages.has(pageNumber)
  };
};

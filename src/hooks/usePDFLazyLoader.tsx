
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

  const { cacheRef, getPageUrl, isPageLoaded, cleanup: cleanupCache } = usePDFCacheManager();
  const { loadPageData, loadingPages, error: pageLoaderError, cleanup: cleanupLoader } = usePDFPageLoader(pdfFileId);
  const { preloadPages } = usePDFPreloader(preloadDistance, state.totalPages, state.loadedPages);

  // Sync cache with state
  useEffect(() => {
    setState(prev => ({
      ...prev,
      loadedPages: new Map(cacheRef.current),
      error: pageLoaderError
    }));
  }, [cacheRef.current.size, pageLoaderError]);

  // Navigate to page with smart preloading
  const goToPage = useCallback(async (pageNumber: number) => {
    console.log(`🎯 goToPage called with pageNumber: ${pageNumber}, current: ${state.currentPage}, total: ${state.totalPages}`);
    
    if (pageNumber < 1 || (state.totalPages > 0 && pageNumber > state.totalPages)) {
      console.log(`❌ Invalid page number: ${pageNumber}`);
      return;
    }

    // Only update if page actually changed
    if (pageNumber !== state.currentPage) {
      console.log(`📄 Changing page from ${state.currentPage} to ${pageNumber}`);
      setState(prev => ({ ...prev, currentPage: pageNumber, isLoading: true }));

      // Load current page
      await loadPageData(pageNumber, cacheRef, maxCachedPages);

      // Preload surrounding pages
      await preloadPages(pageNumber, (page) => loadPageData(page, cacheRef, maxCachedPages));

      setState(prev => ({ ...prev, isLoading: false }));
    }
  }, [state.currentPage, state.totalPages, loadPageData, preloadPages, maxCachedPages]);

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
          totalPages: totalPages
        }));

        // Load first page immediately
        if (totalPages > 0) {
          console.log(`🎯 Loading first page automatically`);
          loadPageData(1, cacheRef, maxCachedPages);
        }

      } catch (error) {
        console.error('❌ Failed to get pages count:', error);
        setState(prev => ({
          ...prev,
          error: 'Failed to initialize PDF'
        }));
      }
    };

    initializePagesCount();
  }, [pdfFileId, loadPageData, maxCachedPages]);

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
    loadPageData: (pageNumber: number) => loadPageData(pageNumber, cacheRef, maxCachedPages),
    preloadPages: (pageNumber: number) => preloadPages(pageNumber, (page) => loadPageData(page, cacheRef, maxCachedPages)),
    getPageUrl,
    isPageLoaded,
    isPageLoading: (pageNumber: number) => loadingPages.has(pageNumber)
  };
};


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

  console.log(`🚀 usePDFLazyLoader initialized:`, {
    pdfFileId,
    options,
    currentState: {
      currentPage: state.currentPage,
      totalPages: state.totalPages,
      loadedPagesCount: state.loadedPages.size,
      isLoading: state.isLoading,
      error: state.error
    }
  });

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
    console.log(`🎯 goToPage called:`, {
      requestedPage: pageNumber,
      currentPage: state.currentPage,
      totalPages: state.totalPages,
      isValidRange: pageNumber >= 1 && (state.totalPages === 0 || pageNumber <= state.totalPages)
    });
    
    if (pageNumber < 1 || (state.totalPages > 0 && pageNumber > state.totalPages)) {
      console.log(`❌ Invalid page number: ${pageNumber} (total: ${state.totalPages})`);
      return;
    }

    // Update current page immediately
    setState(prev => ({ ...prev, currentPage: pageNumber, isLoading: true }));

    try {
      // Load current page
      console.log(`📄 Loading page ${pageNumber}...`);
      const url = await loadPageData(pageNumber, cacheRef, maxCachedPages, setPageUrl);
      console.log(`✅ Page ${pageNumber} loaded with URL: ${url ? 'available' : 'null'}`);

      // Preload surrounding pages
      console.log(`🔄 Preloading surrounding pages for page ${pageNumber}...`);
      await preloadPages(pageNumber, (page) => loadPageData(page, cacheRef, maxCachedPages, setPageUrl));

      setState(prev => ({ ...prev, isLoading: false }));
      console.log(`✅ Page ${pageNumber} and surrounding pages loaded successfully`);
    } catch (error) {
      console.error(`❌ Failed to load page ${pageNumber}:`, error);
      setState(prev => ({ 
        ...prev, 
        isLoading: false, 
        error: `Failed to load page ${pageNumber}: ${error instanceof Error ? error.message : 'Unknown error'}` 
      }));
    }
  }, [loadPageData, preloadPages, maxCachedPages, setPageUrl, state.currentPage, state.totalPages]);

  // Initialize total pages count and load first page
  useEffect(() => {
    if (!pdfFileId) {
      console.log(`⚠️ No pdfFileId provided`);
      return;
    }
    
    const initializePagesCount = async () => {
      console.log(`🚀 Initializing pages count for pdfFileId: ${pdfFileId}`);
      try {
        setState(prev => ({ ...prev, isLoading: true, error: null }));
        
        const { data, error } = await supabase
          .from('pdf_files')
          .select('num_pages_total')
          .eq('id', pdfFileId)
          .single();

        if (error) {
          console.error(`❌ Supabase query error:`, error);
          throw error;
        }

        const totalPages = data.num_pages_total || 1;
        console.log(`📊 Total pages found: ${totalPages}`);

        // Update state with total pages first
        setState(prev => ({
          ...prev,
          totalPages: totalPages,
          currentPage: 1
        }));

        // Load first page immediately after setting totalPages
        console.log(`🎯 Loading first page automatically after initializing totalPages=${totalPages}`);
        
        try {
          const firstPageUrl = await loadPageData(1, cacheRef, maxCachedPages, setPageUrl);
          console.log(`✅ First page loaded successfully with URL: ${firstPageUrl ? 'available' : 'null'}`);
          
          // Update loading state only after first page is loaded
          setState(prev => ({ ...prev, isLoading: false }));
          
          // Preload next few pages in background
          if (totalPages > 1) {
            console.log(`🔄 Preloading additional pages in background...`);
            preloadPages(1, (page) => loadPageData(page, cacheRef, maxCachedPages, setPageUrl))
              .catch(error => console.warn(`⚠️ Background preload failed:`, error));
          }
          
        } catch (pageError) {
          console.error(`❌ Failed to load first page:`, pageError);
          setState(prev => ({ 
            ...prev, 
            isLoading: false,
            error: `Failed to load first page: ${pageError instanceof Error ? pageError.message : 'Unknown error'}`
          }));
        }

      } catch (error) {
        console.error('❌ Failed to get pages count:', error);
        setState(prev => ({
          ...prev,
          error: `Failed to initialize PDF: ${error instanceof Error ? error.message : 'Unknown error'}`,
          isLoading: false
        }));
      }
    };

    initializePagesCount();
  }, [pdfFileId, loadPageData, maxCachedPages, setPageUrl, preloadPages]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      console.log(`🧹 usePDFLazyLoader cleanup for pdfFileId: ${pdfFileId}`);
      cleanupCache();
      cleanupLoader();
    };
  }, [cleanupCache, cleanupLoader, pdfFileId]);

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

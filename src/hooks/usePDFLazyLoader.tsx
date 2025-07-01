
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
  const isInitializedRef = useRef(false);
  const mainPdfUrlRef = useRef<string | null>(null);

  // Load page data (either from split pages or range request)
  const loadPageData = useCallback(async (pageNumber: number): Promise<string | null> => {
    console.log(`🔄 loadPageData called for page ${pageNumber}, totalPages: ${state.totalPages}`);
    
    // Check if already cached
    if (cacheRef.current.has(pageNumber)) {
      console.log(`📋 Page ${pageNumber} already cached`);
      return cacheRef.current.get(pageNumber)!;
    }

    // Check if already loading
    if (state.loadingPages.has(pageNumber)) {
      console.log(`⏳ Page ${pageNumber} already loading`);
      return null;
    }

    // If we only have 1 page or no split pages, return the main PDF URL
    if (state.totalPages === 1 || !mainPdfUrlRef.current) {
      console.log(`📄 Using main PDF for single page or no splits`);
      return mainPdfUrlRef.current;
    }

    try {
      console.log(`🚀 Starting to load page ${pageNumber}`);
      setState(prev => ({
        ...prev,
        loadingPages: new Set([...prev.loadingPages, pageNumber])
      }));

      // Set a timeout for page loading
      const timeoutId = setTimeout(() => {
        console.log(`⏰ Page ${pageNumber} loading timeout`);
        setState(prev => ({
          ...prev,
          loadingPages: new Set([...prev.loadingPages].filter(p => p !== pageNumber)),
          error: `טעינת עמוד ${pageNumber} נכשלה`
        }));
      }, 10000);

      // First, try to get from split pages
      const { data: pageData, error: pageError } = await supabase
        .from('pdf_pages')
        .select('file_path')
        .eq('pdf_file_id', pdfFileId)
        .eq('page_number', pageNumber)
        .maybeSingle();

      clearTimeout(timeoutId);

      let blobUrl: string;

      if (pageData && !pageError) {
        console.log(`📄 Loading split page ${pageNumber} from:`, pageData.file_path);
        
        // Use split page
        const { data: fileData, error: downloadError } = await supabase.storage
          .from('pdf-files')
          .download(pageData.file_path);

        if (downloadError || !fileData) {
          throw new Error(`Failed to download page ${pageNumber}: ${downloadError?.message}`);
        }

        blobUrl = URL.createObjectURL(fileData);
        console.log(`✅ Split page ${pageNumber} loaded successfully`);
        
      } else {
        console.log(`📄 No split page found for page ${pageNumber}, using main PDF`);
        
        // Fallback to main PDF file
        if (mainPdfUrlRef.current) {
          blobUrl = mainPdfUrlRef.current;
        } else {
          throw new Error('No PDF data available');
        }
      }

      // Cache the result
      cacheRef.current.set(pageNumber, blobUrl);

      // Clean up old cache if needed
      if (cacheRef.current.size > maxCachedPages) {
        const oldestPage = Math.min(...cacheRef.current.keys());
        const oldUrl = cacheRef.current.get(oldestPage);
        if (oldUrl && oldUrl.startsWith('blob:')) {
          URL.revokeObjectURL(oldUrl);
        }
        cacheRef.current.delete(oldestPage);
      }

      setState(prev => ({
        ...prev,
        loadedPages: new Map([...prev.loadedPages, [pageNumber, blobUrl]]),
        loadingPages: new Set([...prev.loadingPages].filter(p => p !== pageNumber))
      }));

      console.log(`✅ Page ${pageNumber} successfully loaded and cached`);
      return blobUrl;

    } catch (error) {
      console.error(`❌ Failed to load page ${pageNumber}:`, error);
      setState(prev => ({
        ...prev,
        error: `טעינת עמוד ${pageNumber} נכשלה: ${error instanceof Error ? error.message : 'שגיאה לא ידועה'}`,
        loadingPages: new Set([...prev.loadingPages].filter(p => p !== pageNumber))
      }));
      return null;
    }
  }, [pdfFileId, maxCachedPages, state.totalPages]);

  // Preload surrounding pages
  const preloadPages = useCallback(async (centerPage: number) => {
    console.log(`🔄 preloadPages called for center page ${centerPage}`);
    const pagesToPreload = [];
    
    for (let i = -preloadDistance; i <= preloadDistance; i++) {
      const pageNum = centerPage + i;
      if (pageNum >= 1 && pageNum <= state.totalPages && 
          !state.loadedPages.has(pageNum) && 
          !state.preloadedPages.has(pageNum)) {
        pagesToPreload.push(pageNum);
      }
    }

    console.log(`📋 Pages to preload: ${pagesToPreload.join(', ')}`);

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
      await loadPageData(pageNumber);

      // Preload surrounding pages
      await preloadPages(pageNumber);

      setState(prev => ({ ...prev, isLoading: false }));
    }
  }, [state.currentPage, state.totalPages, loadPageData, preloadPages]);

  // Initialize total pages count and main PDF URL
  useEffect(() => {
    if (!pdfFileId || isInitializedRef.current) return;
    
    const initializePDF = async () => {
      console.log(`🚀 Initializing PDF for pdfFileId: ${pdfFileId}`);
      try {
        const { data, error } = await supabase
          .from('pdf_files')
          .select('num_pages_total, file_path')
          .eq('id', pdfFileId)
          .single();

        if (error) throw error;

        const totalPages = data.num_pages_total || 1;
        
        // Get the public URL for the main PDF
        const { data: urlData } = supabase.storage
          .from('pdf-files')
          .getPublicUrl(data.file_path);
        
        mainPdfUrlRef.current = urlData.publicUrl;
        
        console.log(`📊 Total pages found: ${totalPages}, PDF URL: ${mainPdfUrlRef.current}`);

        setState(prev => ({
          ...prev,
          totalPages: totalPages
        }));

        isInitializedRef.current = true;

        // Load first page immediately
        if (totalPages > 0) {
          console.log(`🎯 Loading first page automatically`);
          const firstPageUrl = await loadPageData(1);
          if (firstPageUrl) {
            setState(prev => ({
              ...prev,
              loadedPages: new Map([...prev.loadedPages, [1, firstPageUrl]])
            }));
          }
        }

      } catch (error) {
        console.error('❌ Failed to initialize PDF:', error);
        setState(prev => ({
          ...prev,
          error: 'אתחול הקובץ נכשל'
        }));
      }
    };

    initializePDF();
  }, [pdfFileId, loadPageData]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      console.log('🧹 Cleaning up PDF lazy loader');
      // Revoke all blob URLs
      cacheRef.current.forEach(url => {
        if (url.startsWith('blob:')) {
          URL.revokeObjectURL(url);
        }
      });
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

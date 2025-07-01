
import { useState, useCallback, useRef, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';

interface LazyLoadState {
  loadedPages: Map<number, string>;
  preloadedPages: Set<number>;
  isLoading: boolean;
  currentPage: number;
  totalPages: number;
  loadingPages: Set<number>;
  error: string | null;
  fallbackToFullPDF: boolean;
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
    preloadedPages: new Set(),
    isLoading: false,
    currentPage: 1,
    totalPages: 0,
    loadingPages: new Set(),
    error: null,
    fallbackToFullPDF: false
  });

  const cacheRef = useRef<Map<number, string>>(new Map());
  const isInitializedRef = useRef(false);
  const fullPDFUrlRef = useRef<string | null>(null);

  const loadPageData = useCallback(async (pageNumber: number): Promise<string | null> => {
    console.log(`🔄 loadPageData called for page ${pageNumber}`);
    
    if (cacheRef.current.has(pageNumber)) {
      console.log(`📋 Page ${pageNumber} already cached`);
      return cacheRef.current.get(pageNumber)!;
    }

    if (state.loadingPages.has(pageNumber)) {
      console.log(`⏳ Page ${pageNumber} already loading`);
      return null;
    }

    try {
      console.log(`🚀 Starting to load page ${pageNumber}`);
      setState(prev => ({
        ...prev,
        loadingPages: new Set([...prev.loadingPages, pageNumber])
      }));

      // If we're in fallback mode or no split pages exist, use full PDF
      if (state.fallbackToFullPDF && fullPDFUrlRef.current) {
        console.log(`📄 Using full PDF URL for page ${pageNumber}`);
        const url = fullPDFUrlRef.current;
        cacheRef.current.set(pageNumber, url);
        
        setState(prev => ({
          ...prev,
          loadedPages: new Map([...prev.loadedPages, [pageNumber, url]]),
          loadingPages: new Set([...prev.loadingPages].filter(p => p !== pageNumber))
        }));
        
        return url;
      }

      // Try to get split page first
      const { data: pageData, error: pageError } = await supabase
        .from('pdf_pages')
        .select('file_path')
        .eq('pdf_file_id', pdfFileId)
        .eq('page_number', pageNumber)
        .maybeSingle();

      let blobUrl: string;

      if (pageData && !pageError) {
        console.log(`📄 Loading split page ${pageNumber} from:`, pageData.file_path);
        
        const { data: fileData, error: downloadError } = await supabase.storage
          .from('pdf-files')
          .download(pageData.file_path);

        if (downloadError || !fileData) {
          throw new Error(`Failed to download page ${pageNumber}: ${downloadError?.message}`);
        }

        blobUrl = URL.createObjectURL(fileData);
        console.log(`✅ Split page ${pageNumber} loaded successfully`);
        
      } else {
        console.log(`📄 No split page found for page ${pageNumber}, falling back to full PDF`);
        
        // Get full PDF URL if not cached
        if (!fullPDFUrlRef.current) {
          const { data: pdfFile, error: pdfError } = await supabase
            .from('pdf_files')
            .select('file_path')
            .eq('id', pdfFileId)
            .single();

          if (pdfError || !pdfFile) {
            throw new Error('PDF file not found');
          }

          const { data } = supabase.storage
            .from('pdf-files')
            .getPublicUrl(pdfFile.file_path);

          fullPDFUrlRef.current = data.publicUrl;
        }

        blobUrl = fullPDFUrlRef.current;
        
        // Set fallback mode for future requests
        setState(prev => ({ ...prev, fallbackToFullPDF: true }));
      }

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
        error: `Failed to load page ${pageNumber}: ${error instanceof Error ? error.message : 'Unknown error'}`,
        loadingPages: new Set([...prev.loadingPages].filter(p => p !== pageNumber))
      }));
      return null;
    }
  }, [pdfFileId, maxCachedPages, state.loadingPages, state.fallbackToFullPDF]);

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

    const preloadPromises = pagesToPreload.map(async (pageNum) => {
      setState(prev => ({
        ...prev,
        preloadedPages: new Set([...prev.preloadedPages, pageNum])
      }));
      return loadPageData(pageNum);
    });

    await Promise.all(preloadPromises);
  }, [preloadDistance, state.totalPages, state.loadedPages, state.preloadedPages, loadPageData]);

  const goToPage = useCallback(async (pageNumber: number) => {
    console.log(`🎯 goToPage called with pageNumber: ${pageNumber}`);
    
    if (pageNumber < 1 || (state.totalPages > 0 && pageNumber > state.totalPages)) {
      console.log(`❌ Invalid page number: ${pageNumber}`);
      return;
    }

    if (pageNumber !== state.currentPage) {
      console.log(`📄 Changing page from ${state.currentPage} to ${pageNumber}`);
      setState(prev => ({ ...prev, currentPage: pageNumber, isLoading: true }));

      await loadPageData(pageNumber);
      await preloadPages(pageNumber);

      setState(prev => ({ ...prev, isLoading: false }));
    }
  }, [state.currentPage, state.totalPages, loadPageData, preloadPages]);

  useEffect(() => {
    if (!pdfFileId || isInitializedRef.current) return;
    
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

        isInitializedRef.current = true;

        if (totalPages > 0) {
          console.log(`🎯 Loading first page automatically`);
          loadPageData(1);
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
  }, [pdfFileId, loadPageData]);

  useEffect(() => {
    return () => {
      console.log('🧹 Cleaning up PDF lazy loader');
      cacheRef.current.forEach(url => {
        if (url.startsWith('blob:')) {
          URL.revokeObjectURL(url);
        }
      });
      cacheRef.current.clear();
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

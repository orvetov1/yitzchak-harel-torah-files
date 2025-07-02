import { useState, useEffect, useCallback, useRef } from 'react';
import { supabase } from '@/integrations/supabase/client';

interface PDFPage {
  id: string;
  pageNumber: number;
  filePath: string;
  fileSize: number;
}

interface PDFFileInfo {
  id: string;
  title: string;
  numPagesTotal: number | null;
  processingStatus: string;
}

interface LargePDFViewerState {
  currentPage: number;
  scale: number;
  visiblePages: number[];
  loadedPages: Map<number, PDFPage>;
  loadingPages: Set<number>;
  errorPages: Set<number>;
  totalPages: number;
}

const PRELOAD_DISTANCE = 3;
const MAX_LOADED_PAGES = 20;

export const usePDFLargeLazyViewer = (pdfFileId: string) => {
  const [state, setState] = useState<LargePDFViewerState>({
    currentPage: 1,
    scale: 1.0,
    visiblePages: [1],
    loadedPages: new Map(),
    loadingPages: new Set(),
    errorPages: new Set(),
    totalPages: 0
  });

  const [fileInfo, setFileInfo] = useState<PDFFileInfo | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const abortControllerRef = useRef<AbortController | null>(null);

  console.log(`🚀 Large PDF Lazy Viewer initialized for: ${pdfFileId}`);

  // Load file info and total pages count
  const loadFileInfo = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);

      const { data, error: queryError } = await supabase
        .from('pdf_files')
        .select('id, title, num_pages_total, processing_status')
        .eq('id', pdfFileId)
        .single();

      if (queryError) throw queryError;

      const totalPages = data.num_pages_total || 0;
      console.log(`📊 File info loaded: ${data.title}, ${totalPages} pages, status: ${data.processing_status}`);

      // Map database fields to interface fields
      const mappedFileInfo: PDFFileInfo = {
        id: data.id,
        title: data.title,
        numPagesTotal: data.num_pages_total,
        processingStatus: data.processing_status || 'pending'
      };

      setFileInfo(mappedFileInfo);
      setState(prev => ({ ...prev, totalPages }));

    } catch (err) {
      console.error('❌ Failed to load file info:', err);
      setError('שגיאה בטעינת מידע הקובץ');
    } finally {
      setIsLoading(false);
    }
  }, [pdfFileId]);

  // Load specific pages from database
  const loadPagesFromDB = useCallback(async (pageNumbers: number[]): Promise<Map<number, PDFPage>> => {
    if (pageNumbers.length === 0) return new Map();

    // Cancel previous request
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }
    abortControllerRef.current = new AbortController();

    try {
      console.log(`📄 Loading pages from DB: ${pageNumbers.join(', ')}`);

      const { data, error: queryError } = await supabase
        .from('pdf_pages')
        .select('id, page_number, file_path, file_size')
        .eq('pdf_file_id', pdfFileId)
        .in('page_number', pageNumbers)
        .order('page_number', { ascending: true });

      if (queryError) throw queryError;

      const pagesMap = new Map<number, PDFPage>();
      (data || []).forEach(page => {
        pagesMap.set(page.page_number, {
          id: page.id,
          pageNumber: page.page_number,
          filePath: page.file_path,
          fileSize: page.file_size || 0
        });
      });

      console.log(`✅ Loaded ${pagesMap.size} pages from DB`);
      return pagesMap;

    } catch (err) {
      if (err.name === 'AbortError') {
        console.log('📄 Page loading aborted');
        return new Map();
      }
      console.error('❌ Failed to load pages:', err);
      throw err;
    }
  }, [pdfFileId]);

  // Get page URL for rendering
  const getPageUrl = useCallback((pageNumber: number): string | null => {
    const page = state.loadedPages.get(pageNumber);
    if (!page) {
      console.log(`❌ Page ${pageNumber} not found in loaded pages`);
      return null;
    }

    const { data } = supabase.storage.from('pdf-files').getPublicUrl(page.filePath);
    console.log(`🔗 Generated URL for page ${pageNumber}`);
    return data.publicUrl;
  }, [state.loadedPages]);

  // Update visible pages and load them
  const updateVisiblePages = useCallback(async (currentPage: number) => {
    const start = Math.max(1, currentPage - PRELOAD_DISTANCE);
    const end = Math.min(state.totalPages, currentPage + PRELOAD_DISTANCE);
    
    const newVisiblePages = [];
    for (let i = start; i <= end; i++) {
      newVisiblePages.push(i);
    }

    console.log(`👀 Updating visible pages for page ${currentPage}: ${newVisiblePages.join(', ')}`);

    // Find pages that need to be loaded
    const pagesToLoad = newVisiblePages.filter(pageNum => 
      !state.loadedPages.has(pageNum) && 
      !state.loadingPages.has(pageNum) &&
      !state.errorPages.has(pageNum)
    );

    if (pagesToLoad.length > 0) {
      // Mark pages as loading
      setState(prev => ({
        ...prev,
        visiblePages: newVisiblePages,
        loadingPages: new Set([...prev.loadingPages, ...pagesToLoad])
      }));

      try {
        const newPages = await loadPagesFromDB(pagesToLoad);
        
        setState(prev => {
          const updatedLoadedPages = new Map(prev.loadedPages);
          const updatedLoadingPages = new Set(prev.loadingPages);

          // Add newly loaded pages
          newPages.forEach((page, pageNum) => {
            updatedLoadedPages.set(pageNum, page);
            updatedLoadingPages.delete(pageNum);
          });

          // Clean up old pages if we have too many
          if (updatedLoadedPages.size > MAX_LOADED_PAGES) {
            const sortedPages = Array.from(updatedLoadedPages.keys()).sort((a, b) => 
              Math.abs(a - currentPage) - Math.abs(b - currentPage)
            );
            
            // Keep only the closest pages to current page
            const pagesToKeep = sortedPages.slice(0, MAX_LOADED_PAGES);
            const cleanedPages = new Map();
            pagesToKeep.forEach(pageNum => {
              cleanedPages.set(pageNum, updatedLoadedPages.get(pageNum)!);
            });
            
            console.log(`🧹 Cleaned up pages, keeping: ${pagesToKeep.join(', ')}`);
            return {
              ...prev,
              loadedPages: cleanedPages,
              loadingPages: updatedLoadingPages,
              visiblePages: newVisiblePages
            };
          }

          return {
            ...prev,
            loadedPages: updatedLoadedPages,
            loadingPages: updatedLoadingPages,
            visiblePages: newVisiblePages
          };
        });

        // Mark failed pages as errors
        const failedPages = pagesToLoad.filter(pageNum => !newPages.has(pageNum));
        if (failedPages.length > 0) {
          console.warn(`⚠️ Failed to load pages: ${failedPages.join(', ')}`);
          setState(prev => ({
            ...prev,
            errorPages: new Set([...prev.errorPages, ...failedPages]),
            loadingPages: new Set([...prev.loadingPages].filter(p => !failedPages.includes(p)))
          }));
        }

      } catch (err) {
        console.error('❌ Error loading pages:', err);
        setState(prev => ({
          ...prev,
          errorPages: new Set([...prev.errorPages, ...pagesToLoad]),
          loadingPages: new Set([...prev.loadingPages].filter(p => !pagesToLoad.includes(p)))
        }));
      }
    } else {
      setState(prev => ({ ...prev, visiblePages: newVisiblePages }));
    }
  }, [state.totalPages, state.loadedPages, state.loadingPages, state.errorPages, loadPagesFromDB]);

  // Navigation functions
  const goToPage = useCallback(async (pageNumber: number) => {
    if (pageNumber < 1 || pageNumber > state.totalPages) {
      console.log(`❌ Invalid page number: ${pageNumber}`);
      return;
    }

    console.log(`🎯 Navigating to page ${pageNumber}`);
    setState(prev => ({ ...prev, currentPage: pageNumber }));
    await updateVisiblePages(pageNumber);
  }, [state.totalPages, updateVisiblePages]);

  const goToPrevPage = useCallback(() => {
    if (state.currentPage > 1) {
      goToPage(state.currentPage - 1);
    }
  }, [state.currentPage, goToPage]);

  const goToNextPage = useCallback(() => {
    if (state.currentPage < state.totalPages) {
      goToPage(state.currentPage + 1);
    }
  }, [state.currentPage, state.totalPages, goToPage]);

  // Zoom functions
  const zoomIn = useCallback(() => {
    setState(prev => ({ ...prev, scale: Math.min(3.0, prev.scale + 0.2) }));
  }, []);

  const zoomOut = useCallback(() => {
    setState(prev => ({ ...prev, scale: Math.max(0.5, prev.scale - 0.2) }));
  }, []);

  // Retry loading failed page
  const retryPage = useCallback(async (pageNumber: number) => {
    console.log(`🔄 Retrying page ${pageNumber}`);
    setState(prev => ({
      ...prev,
      errorPages: new Set([...prev.errorPages].filter(p => p !== pageNumber))
    }));
    await updateVisiblePages(state.currentPage);
  }, [state.currentPage, updateVisiblePages]);

  // Initialize on mount
  useEffect(() => {
    loadFileInfo();
  }, [loadFileInfo]);

  // Load initial pages when file info is ready
  useEffect(() => {
    if (fileInfo && state.totalPages > 0) {
      updateVisiblePages(1);
    }
  }, [fileInfo, state.totalPages, updateVisiblePages]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
    };
  }, []);

  return {
    // State
    currentPage: state.currentPage,
    scale: state.scale,
    visiblePages: state.visiblePages,
    totalPages: state.totalPages,
    fileInfo,
    isLoading,
    error,

    // Page status checkers
    isPageLoaded: (pageNumber: number) => state.loadedPages.has(pageNumber),
    isPageLoading: (pageNumber: number) => state.loadingPages.has(pageNumber),
    isPageError: (pageNumber: number) => state.errorPages.has(pageNumber),

    // Functions
    goToPage,
    goToPrevPage,
    goToNextPage,
    zoomIn,
    zoomOut,
    getPageUrl,
    retryPage,
    reload: loadFileInfo
  };
};

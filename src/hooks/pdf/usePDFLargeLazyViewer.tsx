import { useState, useEffect, useCallback } from 'react';
import { usePDFLargeFileInfo } from './usePDFLargeFileInfo';
import { usePDFLargePageLoader } from './usePDFLargePageLoader';
import { usePDFLargeNavigation } from './usePDFLargeNavigation';
import { 
  LargePDFViewerState, 
  PRELOAD_DISTANCE, 
  MAX_LOADED_PAGES 
} from './types/largePDFViewer';

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

  console.log(`🚀 Large PDF Lazy Viewer initialized for: ${pdfFileId}`);

  // Use the smaller hooks
  const { fileInfo, isLoading, error, loadFileInfo } = usePDFLargeFileInfo(pdfFileId);
  const { loadPagesFromDB, getPageUrl, cleanup } = usePDFLargePageLoader(pdfFileId);

  // Get page URL for rendering
  const getPageUrlForNumber = useCallback((pageNumber: number): string | null => {
    const page = state.loadedPages.get(pageNumber);
    if (!page) {
      console.log(`❌ Page ${pageNumber} not found in loaded pages`);
      return null;
    }

    const url = getPageUrl(page);
    console.log(`🔗 Generated URL for page ${pageNumber}`);
    return url;
  }, [state.loadedPages, getPageUrl]);

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

  // Use navigation hook
  const { goToPrevPage, goToNextPage, zoomIn, zoomOut } = usePDFLargeNavigation(
    state.currentPage,
    state.totalPages,
    goToPage
  );

  // Zoom function wrappers
  const handleZoomIn = useCallback(() => {
    zoomIn(state.scale, (updater) => setState(prev => ({ ...prev, scale: updater(prev.scale) })));
  }, [state.scale, zoomIn]);

  const handleZoomOut = useCallback(() => {
    zoomOut(state.scale, (updater) => setState(prev => ({ ...prev, scale: updater(prev.scale) })));
  }, [state.scale, zoomOut]);

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
    const initializeViewer = async () => {
      const { totalPages } = await loadFileInfo();
      if (totalPages > 0) {
        setState(prev => ({ ...prev, totalPages }));
      }
    };
    
    initializeViewer();
  }, [loadFileInfo]);

  // Load initial pages when total pages is set
  useEffect(() => {
    if (state.totalPages > 0) {
      updateVisiblePages(1);
    }
  }, [state.totalPages, updateVisiblePages]);

  // Cleanup on unmount
  useEffect(() => {
    return cleanup;
  }, [cleanup]);

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
    zoomIn: handleZoomIn,
    zoomOut: handleZoomOut,
    getPageUrl: getPageUrlForNumber,
    retryPage,
    reload: loadFileInfo
  };
};

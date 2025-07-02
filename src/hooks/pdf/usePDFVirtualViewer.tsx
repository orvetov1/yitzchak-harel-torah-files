
import { useState, useEffect, useCallback } from 'react';

interface VirtualPDFViewerState {
  currentPage: number;
  scale: number;
  visiblePages: number[];
}

interface VirtualPDFViewerOptions {
  totalPages: number;
  preloadDistance?: number;
}

export const usePDFVirtualViewer = ({ totalPages, preloadDistance = 2 }: VirtualPDFViewerOptions) => {
  const [state, setState] = useState<VirtualPDFViewerState>({
    currentPage: 1,
    scale: 1.0,
    visiblePages: [1]
  });

  // Update visible pages when current page or total pages change
  useEffect(() => {
    if (state.currentPage > 0 && totalPages > 0) {
      const start = Math.max(1, state.currentPage - preloadDistance);
      const end = Math.min(totalPages, state.currentPage + preloadDistance);
      const pages = [];
      for (let i = start; i <= end; i++) {
        pages.push(i);
      }
      setState(prev => ({ ...prev, visiblePages: pages }));
      console.log(`👀 Virtual viewer: visible pages updated to ${pages.join(', ')} for current page ${state.currentPage}`);
    }
  }, [state.currentPage, totalPages, preloadDistance]);

  const goToPage = useCallback((pageNumber: number) => {
    if (pageNumber >= 1 && pageNumber <= totalPages) {
      console.log(`📄 Virtual viewer: navigating to page ${pageNumber}`);
      setState(prev => ({ ...prev, currentPage: pageNumber }));
    }
  }, [totalPages]);

  const goToPrevPage = useCallback(() => {
    const newPage = Math.max(1, state.currentPage - 1);
    goToPage(newPage);
  }, [state.currentPage, goToPage]);

  const goToNextPage = useCallback(() => {
    const newPage = Math.min(totalPages, state.currentPage + 1);
    goToPage(newPage);
  }, [state.currentPage, totalPages, goToPage]);

  const zoomIn = useCallback(() => {
    setState(prev => ({ ...prev, scale: Math.min(3.0, prev.scale + 0.2) }));
  }, []);

  const zoomOut = useCallback(() => {
    setState(prev => ({ ...prev, scale: Math.max(0.5, prev.scale - 0.2) }));
  }, []);

  return {
    currentPage: state.currentPage,
    scale: state.scale,
    visiblePages: state.visiblePages,
    goToPage,
    goToPrevPage,
    goToNextPage,
    zoomIn,
    zoomOut
  };
};

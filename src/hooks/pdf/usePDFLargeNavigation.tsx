
import { useCallback } from 'react';

export const usePDFLargeNavigation = (
  currentPage: number,
  totalPages: number,
  goToPage: (pageNumber: number) => Promise<void>
) => {
  const goToPrevPage = useCallback(() => {
    if (currentPage > 1) {
      goToPage(currentPage - 1);
    }
  }, [currentPage, goToPage]);

  const goToNextPage = useCallback(() => {
    if (currentPage < totalPages) {
      goToPage(currentPage + 1);
    }
  }, [currentPage, totalPages, goToPage]);

  const zoomIn = useCallback((scale: number, setScale: (updater: (prev: number) => number) => void) => {
    setScale(prev => Math.min(3.0, prev + 0.2));
  }, []);

  const zoomOut = useCallback((scale: number, setScale: (updater: (prev: number) => number) => void) => {
    setScale(prev => Math.max(0.5, prev - 0.2));
  }, []);

  return {
    goToPrevPage,
    goToNextPage,
    zoomIn,
    zoomOut
  };
};

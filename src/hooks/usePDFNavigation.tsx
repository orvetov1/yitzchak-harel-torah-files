
import { useState, useCallback } from 'react';

export const usePDFNavigation = () => {
  const [pageNumber, setPageNumber] = useState<number>(1);
  const [scale, setScale] = useState<number>(1.0);
  const [numPages, setNumPages] = useState<number>(0);

  const goToPrevPage = useCallback(() => {
    setPageNumber(prev => Math.max(1, prev - 1));
  }, []);

  const goToNextPage = useCallback(() => {
    setPageNumber(prev => Math.min(numPages, prev + 1));
  }, [numPages]);

  const zoomIn = useCallback(() => {
    setScale(prev => Math.min(3.0, prev + 0.2));
  }, []);

  const zoomOut = useCallback(() => {
    setScale(prev => Math.max(0.5, prev - 0.2));
  }, []);

  const setPage = useCallback((page: number) => {
    if (page >= 1 && page <= numPages) {
      setPageNumber(page);
    }
  }, [numPages]);

  const resetNavigation = useCallback(() => {
    setPageNumber(1);
    setScale(1.0);
  }, []);

  return {
    pageNumber,
    scale,
    numPages,
    setNumPages,
    goToPrevPage,
    goToNextPage,
    zoomIn,
    zoomOut,
    setPage,
    resetNavigation
  };
};


import { useState, useRef } from 'react';

interface PageLoaderState {
  loadingPages: Set<number>;
  error: string | null;
}

export const usePDFPageLoadingState = () => {
  const [state, setState] = useState<PageLoaderState>({
    loadingPages: new Set(),
    error: null
  });

  const abortControllersRef = useRef<Map<number, AbortController>>(new Map());

  const setPageLoading = (pageNumber: number, isLoading: boolean) => {
    setState(prev => ({
      ...prev,
      loadingPages: isLoading 
        ? new Set([...prev.loadingPages, pageNumber])
        : new Set([...prev.loadingPages].filter(p => p !== pageNumber)),
      error: isLoading ? null : prev.error
    }));
  };

  const setError = (error: string) => {
    setState(prev => ({
      ...prev,
      error
    }));
  };

  const clearError = () => {
    setState(prev => ({
      ...prev,
      error: null
    }));
  };

  const createAbortController = (pageNumber: number): AbortController => {
    // Cancel any existing request for this page
    const existingController = abortControllersRef.current.get(pageNumber);
    if (existingController) {
      existingController.abort();
    }

    // Create new abort controller
    const abortController = new AbortController();
    abortControllersRef.current.set(pageNumber, abortController);
    return abortController;
  };

  const removeAbortController = (pageNumber: number) => {
    abortControllersRef.current.delete(pageNumber);
  };

  const cleanup = () => {
    // Abort all ongoing requests
    abortControllersRef.current.forEach((controller, pageNumber) => {
      console.log(`🚫 Aborting request for page ${pageNumber}`);
      controller.abort();
    });
    abortControllersRef.current.clear();
  };

  return {
    state,
    setPageLoading,
    setError,
    clearError,
    createAbortController,
    removeAbortController,
    cleanup
  };
};

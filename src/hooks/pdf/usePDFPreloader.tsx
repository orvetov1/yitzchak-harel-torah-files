
import { useState, useCallback } from 'react';

interface PreloaderState {
  preloadedPages: Set<number>;
}

export const usePDFPreloader = (
  preloadDistance: number,
  totalPages: number,
  loadedPages: Map<number, string>
) => {
  const [state, setState] = useState<PreloaderState>({
    preloadedPages: new Set()
  });

  const preloadPages = useCallback(async (
    centerPage: number,
    loadPageData: (pageNumber: number) => Promise<string | null>
  ) => {
    console.log(`🔄 preloadPages called for center page ${centerPage}`);
    const pagesToPreload = [];
    
    for (let i = -preloadDistance; i <= preloadDistance; i++) {
      const pageNum = centerPage + i;
      if (pageNum >= 1 && pageNum <= totalPages && 
          !loadedPages.has(pageNum) && 
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
  }, [preloadDistance, totalPages, loadedPages, state.preloadedPages]);

  return {
    ...state,
    preloadPages
  };
};

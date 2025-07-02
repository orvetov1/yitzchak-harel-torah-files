
import { useCallback } from 'react';
import { usePDFPageLoadingState } from './usePDFPageLoadingState';
import { usePDFPageRetryManager } from './usePDFPageRetryManager';
import { usePDFPageDataLoader } from './usePDFPageDataLoader';

export const usePDFPageLoader = (pdfFileId: string) => {
  const { state, setPageLoading, setError, createAbortController, removeAbortController, cleanup: cleanupState } = usePDFPageLoadingState();
  const { incrementRetryCount, resetRetryCount, hasExceededMaxRetries, scheduleRetry, cleanup: cleanupRetry } = usePDFPageRetryManager();
  const { loadSplitPage, loadMainPDF, downloadFile, createBlobUrl, getImageUrl } = usePDFPageDataLoader(pdfFileId);

  const loadPageData = useCallback(async (
    pageNumber: number,
    cacheRef: React.MutableRefObject<Map<number, string>>,
    maxCachedPages: number,
    setPageUrl: (pageNumber: number, url: string) => void,
    maxRetries: number = 3
  ): Promise<string | null> => {
    console.log(`🔄 loadPageData called for page ${pageNumber}, pdfFileId: ${pdfFileId}`);
    
    // Check if already cached
    if (cacheRef.current.has(pageNumber)) {
      const url = cacheRef.current.get(pageNumber)!;
      console.log(`📋 Page ${pageNumber} already cached: ${url}`);
      return url;
    }

    // Check if already loading
    if (state.loadingPages.has(pageNumber)) {
      console.log(`⏳ Page ${pageNumber} already loading`);
      return null;
    }

    // Check retry count
    if (hasExceededMaxRetries(pageNumber, maxRetries)) {
      console.log(`❌ Page ${pageNumber} exceeded max retries (${maxRetries})`);
      return null;
    }

    try {
      const currentRetries = incrementRetryCount(pageNumber) - 1;
      console.log(`🚀 Starting to load page ${pageNumber} (attempt ${currentRetries + 1}/${maxRetries})`);
      
      // Create abort controller
      createAbortController(pageNumber);
      setPageLoading(pageNumber, true);

      let blobUrl: string;

      // Try to get from split pages first
      const pageData = await loadSplitPage(pageNumber);

      if (pageData) {
        // Check if it's an image file (PNG/JPG)
        const isImageFile = pageData.file_path.match(/\.(png|jpg|jpeg|gif|webp)$/i);
        
        if (isImageFile) {
          console.log(`🖼️ Split page ${pageNumber} is an image file`);
          blobUrl = getImageUrl(pageData.file_path, pageNumber);
        } else {
          console.log(`📄 Split page ${pageNumber} is a PDF file`);
          const fileData = await downloadFile(pageData.file_path);
          blobUrl = createBlobUrl(fileData, pageNumber, 'PDF');
        }
      } else {
        console.log(`📄 No split page found for page ${pageNumber}, trying main PDF`);
        
        // Fallback to main PDF file
        const pdfFile = await loadMainPDF();
        const fileData = await downloadFile(pdfFile.file_path);
        blobUrl = createBlobUrl(fileData, pageNumber, 'Main PDF');
      }

      // Cache the result
      cacheRef.current.set(pageNumber, blobUrl);
      setPageUrl(pageNumber, blobUrl);

      // Clean up old cache if needed
      if (cacheRef.current.size > maxCachedPages) {
        const oldestPage = Math.min(...cacheRef.current.keys());
        const oldUrl = cacheRef.current.get(oldestPage);
        if (oldUrl && oldUrl.startsWith('blob:')) {
          console.log(`🗑️ Cleaning up old cached page ${oldestPage}`);
          URL.revokeObjectURL(oldUrl);
        }
        cacheRef.current.delete(oldestPage);
      }

      // Reset retry count on success
      resetRetryCount(pageNumber);
      setPageLoading(pageNumber, false);
      removeAbortController(pageNumber);

      console.log(`✅ Page ${pageNumber} successfully loaded and cached: ${blobUrl}`);
      return blobUrl;

    } catch (error) {
      removeAbortController(pageNumber);
      console.error(`❌ Failed to load page ${pageNumber}:`, error);
      
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      setError(`Failed to load page ${pageNumber}: ${errorMessage}`);
      setPageLoading(pageNumber, false);

      // Schedule retry if we haven't exceeded max retries
      scheduleRetry(pageNumber, () => {
        loadPageData(pageNumber, cacheRef, maxCachedPages, setPageUrl, maxRetries);
      }, maxRetries);

      return null;
    }
  }, [pdfFileId, state.loadingPages, hasExceededMaxRetries, incrementRetryCount, createAbortController, setPageLoading, loadSplitPage, getImageUrl, downloadFile, createBlobUrl, loadMainPDF, resetRetryCount, removeAbortController, setError, scheduleRetry]);

  const cleanup = useCallback(() => {
    cleanupState();
    cleanupRetry();
    console.log(`🧹 usePDFPageLoader cleanup completed`);
  }, [cleanupState, cleanupRetry]);

  return {
    ...state,
    loadPageData,
    cleanup
  };
};


import { useState, useCallback, useRef } from 'react';
import { supabase } from '@/integrations/supabase/client';

interface PageLoaderState {
  loadingPages: Set<number>;
  error: string | null;
}

export const usePDFPageLoader = (pdfFileId: string) => {
  const [state, setState] = useState<PageLoaderState>({
    loadingPages: new Set(),
    error: null
  });

  const abortControllersRef = useRef<Map<number, AbortController>>(new Map());
  const retryCountRef = useRef<Map<number, number>>(new Map());

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
    const currentRetries = retryCountRef.current.get(pageNumber) || 0;
    if (currentRetries >= maxRetries) {
      console.log(`❌ Page ${pageNumber} exceeded max retries (${maxRetries})`);
      return null;
    }

    try {
      console.log(`🚀 Starting to load page ${pageNumber} (attempt ${currentRetries + 1}/${maxRetries})`);
      
      // Cancel any existing request for this page
      const existingController = abortControllersRef.current.get(pageNumber);
      if (existingController) {
        existingController.abort();
      }

      // Create new abort controller
      const abortController = new AbortController();
      abortControllersRef.current.set(pageNumber, abortController);

      setState(prev => ({
        ...prev,
        loadingPages: new Set([...prev.loadingPages, pageNumber]),
        error: null
      }));

      // First, try to get from split pages
      console.log(`🔍 Checking for split page ${pageNumber} in pdfFileId: ${pdfFileId}`);
      const { data: pageData, error: pageError } = await supabase
        .from('pdf_pages')
        .select('file_path')
        .eq('pdf_file_id', pdfFileId)
        .eq('page_number', pageNumber)
        .maybeSingle();

      if (pageError) {
        console.error(`❌ Error querying split pages for page ${pageNumber}:`, pageError);
      }

      let blobUrl: string;

      if (pageData && !pageError) {
        console.log(`📄 Found split page ${pageNumber} at:`, pageData.file_path);
        
        // Check if it's an image file (PNG/JPG)
        const isImageFile = pageData.file_path.match(/\.(png|jpg|jpeg|gif|webp)$/i);
        
        if (isImageFile) {
          console.log(`🖼️ Split page ${pageNumber} is an image file`);
          // Get public URL for image files
          const { data } = supabase.storage
            .from('pdf-files')
            .getPublicUrl(pageData.file_path);
          
          blobUrl = data.publicUrl;
          console.log(`✅ Image URL for page ${pageNumber}: ${blobUrl}`);
          
        } else {
          console.log(`📄 Split page ${pageNumber} is a PDF file`);
          // Download PDF file and create blob URL
          try {
            const { data: fileData, error: downloadError } = await supabase.storage
              .from('pdf-files')
              .download(pageData.file_path);

            if (downloadError || !fileData) {
              throw new Error(`Failed to download page ${pageNumber}: ${downloadError?.message}`);
            }

            // Verify the file is not empty
            if (fileData.size === 0) {
              throw new Error(`Downloaded file for page ${pageNumber} is empty`);
            }

            blobUrl = URL.createObjectURL(fileData);
            console.log(`✅ PDF blob URL for page ${pageNumber}: ${blobUrl}, size: ${fileData.size} bytes`);
            
          } catch (downloadError) {
            console.error(`❌ PDF download failed for page ${pageNumber}:`, downloadError);
            throw downloadError;
          }
        }
        
      } else {
        console.log(`📄 No split page found for page ${pageNumber}, trying main PDF`);
        
        // Fallback to main PDF file
        const { data: pdfFile, error: pdfError } = await supabase
          .from('pdf_files')
          .select('file_path')
          .eq('id', pdfFileId)
          .single();

        if (pdfError || !pdfFile) {
          throw new Error(`PDF file not found: ${pdfError?.message}`);
        }

        try {
          // Download main PDF and create blob URL
          const { data: fileData, error: downloadError } = await supabase.storage
            .from('pdf-files')
            .download(pdfFile.file_path);

          if (downloadError || !fileData) {
            throw new Error(`Failed to download main PDF: ${downloadError?.message}`);
          }

          // Verify the file is not empty
          if (fileData.size === 0) {
            throw new Error(`Main PDF file is empty`);
          }

          blobUrl = URL.createObjectURL(fileData);
          console.log(`✅ Main PDF blob URL for page ${pageNumber}: ${blobUrl}, size: ${fileData.size} bytes`);
          
        } catch (downloadError) {
          console.error(`❌ Main PDF download failed:`, downloadError);
          throw downloadError;
        }
      }

      // Cache the result using both cacheRef and setPageUrl
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
      retryCountRef.current.delete(pageNumber);

      setState(prev => ({
        ...prev,
        loadingPages: new Set([...prev.loadingPages].filter(p => p !== pageNumber)),
        error: null
      }));

      // Clean up abort controller
      abortControllersRef.current.delete(pageNumber);

      console.log(`✅ Page ${pageNumber} successfully loaded and cached: ${blobUrl}`);
      return blobUrl;

    } catch (error) {
      // Clean up abort controller
      abortControllersRef.current.delete(pageNumber);

      console.error(`❌ Failed to load page ${pageNumber} (attempt ${currentRetries + 1}):`, error);
      
      // Increment retry count
      retryCountRef.current.set(pageNumber, currentRetries + 1);
      
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      
      setState(prev => ({
        ...prev,
        error: `Failed to load page ${pageNumber}: ${errorMessage}`,
        loadingPages: new Set([...prev.loadingPages].filter(p => p !== pageNumber))
      }));

      // If we haven't exceeded max retries, try again after a delay
      if (currentRetries < maxRetries - 1) {
        const delay = Math.min(1000 * Math.pow(2, currentRetries), 5000); // Exponential backoff, max 5s
        console.log(`🔄 Retrying page ${pageNumber} in ${delay}ms...`);
        setTimeout(() => {
          loadPageData(pageNumber, cacheRef, maxCachedPages, setPageUrl, maxRetries);
        }, delay);
      }

      return null;
    }
  }, [pdfFileId, state.loadingPages]);

  const cleanup = useCallback(() => {
    // Abort all ongoing requests
    abortControllersRef.current.forEach((controller, pageNumber) => {
      console.log(`🚫 Aborting request for page ${pageNumber}`);
      controller.abort();
    });
    abortControllersRef.current.clear();
    
    // Clear retry counts
    retryCountRef.current.clear();
    
    console.log(`🧹 usePDFPageLoader cleanup completed`);
  }, []);

  return {
    ...state,
    loadPageData,
    cleanup
  };
};

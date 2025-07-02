
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

  const loadPageData = useCallback(async (
    pageNumber: number,
    cacheRef: React.MutableRefObject<Map<number, string>>,
    maxCachedPages: number,
    setPageUrl: (pageNumber: number, url: string) => void
  ): Promise<string | null> => {
    console.log(`🔄 loadPageData called for page ${pageNumber}`);
    
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

    try {
      console.log(`🚀 Starting to load page ${pageNumber}`);
      setState(prev => ({
        ...prev,
        loadingPages: new Set([...prev.loadingPages, pageNumber])
      }));

      // First, try to get from split pages (these are usually images)
      const { data: pageData, error: pageError } = await supabase
        .from('pdf_pages')
        .select('file_path')
        .eq('pdf_file_id', pdfFileId)
        .eq('page_number', pageNumber)
        .maybeSingle();

      let blobUrl: string;

      if (pageData && !pageError) {
        console.log(`📄 Loading split page ${pageNumber} from:`, pageData.file_path);
        
        // Check if it's an image file (PNG/JPG)
        const isImageFile = pageData.file_path.match(/\.(png|jpg|jpeg)$/i);
        
        if (isImageFile) {
          console.log(`🖼️ Split page ${pageNumber} is an image file`);
          // Get public URL for image files
          const { data } = supabase.storage
            .from('pdf-files')
            .getPublicUrl(pageData.file_path);
          
          blobUrl = data.publicUrl;
        } else {
          console.log(`📄 Split page ${pageNumber} is a PDF file`);
          // Download PDF file and create blob URL
          const { data: fileData, error: downloadError } = await supabase.storage
            .from('pdf-files')
            .download(pageData.file_path);

          if (downloadError || !fileData) {
            throw new Error(`Failed to download page ${pageNumber}: ${downloadError?.message}`);
          }

          blobUrl = URL.createObjectURL(fileData);
        }
        
        console.log(`✅ Split page ${pageNumber} loaded successfully: ${blobUrl}`);
        
      } else {
        console.log(`📄 No split page found for page ${pageNumber}, using main PDF`);
        
        // Fallback to main PDF file
        const { data: pdfFile, error: pdfError } = await supabase
          .from('pdf_files')
          .select('file_path')
          .eq('id', pdfFileId)
          .single();

        if (pdfError || !pdfFile) {
          throw new Error('PDF file not found');
        }

        // Download main PDF and create blob URL
        const { data: fileData, error: downloadError } = await supabase.storage
          .from('pdf-files')
          .download(pdfFile.file_path);

        if (downloadError || !fileData) {
          throw new Error(`Failed to download main PDF: ${downloadError?.message}`);
        }

        blobUrl = URL.createObjectURL(fileData);
        console.log(`✅ Main PDF blob URL for page ${pageNumber}: ${blobUrl}`);
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

      setState(prev => ({
        ...prev,
        loadingPages: new Set([...prev.loadingPages].filter(p => p !== pageNumber)),
        error: null
      }));

      console.log(`✅ Page ${pageNumber} successfully loaded and cached: ${blobUrl}`);
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
  }, [pdfFileId, state.loadingPages]);

  const cleanup = useCallback(() => {
    // Abort all ongoing requests
    abortControllersRef.current.forEach(controller => controller.abort());
    abortControllersRef.current.clear();
  }, []);

  return {
    ...state,
    loadPageData,
    cleanup
  };
};


import { useCallback, useRef } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { PDFPage } from './types/largePDFViewer';

export const usePDFLargePageLoader = (pdfFileId: string) => {
  const abortControllerRef = useRef<AbortController | null>(null);

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

  const getPageUrl = useCallback((page: PDFPage | undefined): string | null => {
    if (!page) {
      return null;
    }

    const { data } = supabase.storage.from('pdf-files').getPublicUrl(page.filePath);
    return data.publicUrl;
  }, []);

  const cleanup = useCallback(() => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }
  }, []);

  return {
    loadPagesFromDB,
    getPageUrl,
    cleanup
  };
};

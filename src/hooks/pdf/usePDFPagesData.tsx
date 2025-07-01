
import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';

interface PDFPage {
  id: string;
  pageNumber: number;
  filePath: string;
  fileSize: number;
}

export const usePDFPagesData = (pdfFileId: string, processingStatus?: string) => {
  const [pages, setPages] = useState<PDFPage[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadPages = async () => {
    if (!pdfFileId || processingStatus !== 'completed') return;

    try {
      setIsLoading(true);
      setError(null);

      const { data: pagesData, error: pagesError } = await supabase
        .from('pdf_pages')
        .select('id, page_number, file_path, file_size')
        .eq('pdf_file_id', pdfFileId)
        .order('page_number', { ascending: true });

      if (pagesError) {
        throw pagesError;
      }

      const formattedPages: PDFPage[] = (pagesData || []).map(page => ({
        id: page.id,
        pageNumber: page.page_number,
        filePath: page.file_path,
        fileSize: page.file_size || 0
      }));

      setPages(formattedPages);
      console.log(`📄 Loaded ${formattedPages.length} pages for PDF ${pdfFileId}`);

    } catch (err) {
      console.error('Error loading PDF pages:', err);
      setError('שגיאה בטעינת עמודי PDF');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadPages();
  }, [pdfFileId, processingStatus]);

  return {
    pages,
    isLoading,
    error,
    reload: loadPages
  };
};

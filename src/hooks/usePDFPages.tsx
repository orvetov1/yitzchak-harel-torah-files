
import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';

interface PDFPage {
  id: string;
  pageNumber: number;
  filePath: string;
  fileSize: number;
}

interface PDFFileInfo {
  id: string;
  title: string;
  numPagesTotal: number | null;
  processingStatus: string;
}

export const usePDFPages = (pdfFileId: string) => {
  const [pages, setPages] = useState<PDFPage[]>([]);
  const [fileInfo, setFileInfo] = useState<PDFFileInfo | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (pdfFileId) {
      loadPDFPages();
    }
  }, [pdfFileId]);

  const loadPDFPages = async () => {
    try {
      setIsLoading(true);
      setError(null);

      // Load file info first
      const { data: fileData, error: fileError } = await supabase
        .from('pdf_files')
        .select('id, title, num_pages_total, processing_status')
        .eq('id', pdfFileId)
        .single();

      if (fileError) {
        throw fileError;
      }

      setFileInfo({
        id: fileData.id,
        title: fileData.title,
        numPagesTotal: fileData.num_pages_total,
        processingStatus: fileData.processing_status || 'pending'
      });

      // If processing is completed, load pages
      if (fileData.processing_status === 'completed') {
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
      }

    } catch (err) {
      console.error('Error loading PDF pages:', err);
      setError('שגיאה בטעינת עמודי PDF');
    } finally {
      setIsLoading(false);
    }
  };

  const getPageUrl = (page: PDFPage): string => {
    const { data } = supabase.storage
      .from('pdf-files')
      .getPublicUrl(page.filePath);
    
    return data.publicUrl;
  };

  const retryProcessing = async () => {
    try {
      const { error } = await supabase.functions.invoke('split-pdf', {
        body: {
          pdf_file_id: pdfFileId,
          file_path: fileInfo?.title, // This should be updated to use actual file path
          file_name: fileInfo?.title
        }
      });

      if (error) {
        throw error;
      }

      // Reload pages after retry
      await loadPDFPages();
    } catch (err) {
      console.error('Error retrying processing:', err);
      setError('שגיאה בהפעלה מחדש של העיבוד');
    }
  };

  return {
    pages,
    fileInfo,
    isLoading,
    error,
    reload: loadPDFPages,
    getPageUrl,
    retryProcessing
  };
};

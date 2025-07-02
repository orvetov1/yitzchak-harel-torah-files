
import { useState, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { PDFFileInfo } from './types/largePDFViewer';

export const usePDFLargeFileInfo = (pdfFileId: string) => {
  const [fileInfo, setFileInfo] = useState<PDFFileInfo | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadFileInfo = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);

      const { data, error: queryError } = await supabase
        .from('pdf_files')
        .select('id, title, num_pages_total, processing_status')
        .eq('id', pdfFileId)
        .single();

      if (queryError) throw queryError;

      const totalPages = data.num_pages_total || 0;
      console.log(`📊 File info loaded: ${data.title}, ${totalPages} pages, status: ${data.processing_status}`);

      const mappedFileInfo: PDFFileInfo = {
        id: data.id,
        title: data.title,
        numPagesTotal: data.num_pages_total,
        processingStatus: data.processing_status || 'pending'
      };

      setFileInfo(mappedFileInfo);
      return { fileInfo: mappedFileInfo, totalPages };

    } catch (err) {
      console.error('❌ Failed to load file info:', err);
      setError('שגיאה בטעינת מידע הקובץ');
      return { fileInfo: null, totalPages: 0 };
    } finally {
      setIsLoading(false);
    }
  }, [pdfFileId]);

  return {
    fileInfo,
    isLoading,
    error,
    loadFileInfo
  };
};

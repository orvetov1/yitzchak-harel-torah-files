
import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';

interface PDFFileInfo {
  id: string;
  title: string;
  numPagesTotal: number | null;
  processingStatus: string;
}

export const usePDFFileInfo = (pdfFileId: string) => {
  const [fileInfo, setFileInfo] = useState<PDFFileInfo | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadFileInfo = async () => {
    if (!pdfFileId) return;

    try {
      setIsLoading(true);
      setError(null);

      const { data: fileData, error: fileError } = await supabase
        .from('pdf_files')
        .select('id, title, num_pages_total, processing_status, file_path')
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

    } catch (err) {
      console.error('Error loading file info:', err);
      setError('שגיאה בטעינת מידע הקובץ');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadFileInfo();
  }, [pdfFileId]);

  return {
    fileInfo,
    isLoading,
    error,
    reload: loadFileInfo,
    setFileInfo
  };
};

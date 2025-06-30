
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
      
      // Set up real-time subscription for processing status updates
      const subscription = supabase
        .channel('pdf-processing')
        .on(
          'postgres_changes',
          {
            event: 'UPDATE',
            schema: 'public',
            table: 'pdf_files',
            filter: `id=eq.${pdfFileId}`
          },
          (payload) => {
            console.log('📡 Processing status updated:', payload.new);
            if (payload.new) {
              setFileInfo(prev => prev ? {
                ...prev,
                processingStatus: payload.new.processing_status,
                numPagesTotal: payload.new.num_pages_total
              } : null);
              
              // If processing completed, reload pages
              if (payload.new.processing_status === 'completed') {
                loadPDFPages();
              }
            }
          }
        )
        .subscribe();

      return () => {
        supabase.removeChannel(subscription);
      };
    }
  }, [pdfFileId]);

  const loadPDFPages = async () => {
    try {
      setIsLoading(true);
      setError(null);

      // Load file info first
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
        console.log(`📄 Loaded ${formattedPages.length} pages for PDF ${pdfFileId}`);
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
      setError(null);
      
      // First, reset the processing status
      const { error: updateError } = await supabase
        .from('pdf_files')
        .update({ processing_status: 'pending' })
        .eq('id', pdfFileId);

      if (updateError) {
        throw updateError;
      }

      // Clear existing pages
      const { error: deleteError } = await supabase
        .from('pdf_pages')
        .delete()
        .eq('pdf_file_id', pdfFileId);

      if (deleteError) {
        console.warn('Warning: Could not clear existing pages:', deleteError);
      }

      // Get file info for retry
      const { data: fileData, error: fileError } = await supabase
        .from('pdf_files')
        .select('file_path, file_name')
        .eq('id', pdfFileId)
        .single();

      if (fileError) {
        throw fileError;
      }

      // Extract relative path
      let relativePath = fileData.file_path;
      if (fileData.file_path.includes('/storage/v1/object/public/pdf-files/')) {
        const match = fileData.file_path.match(/\/pdf-files\/(.+)$/);
        relativePath = match ? match[1] : fileData.file_name;
      }

      // Invoke the split function
      const { error: functionError } = await supabase.functions.invoke('split-pdf', {
        body: {
          pdf_file_id: pdfFileId,
          file_path: relativePath,
          file_name: fileData.file_name
        }
      });

      if (functionError) {
        throw functionError;
      }

      console.log('🔄 PDF processing retry initiated');
      
      // Reload file info to reflect new status
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

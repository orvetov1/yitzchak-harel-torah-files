
import { useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';

interface PDFFileInfo {
  id: string;
  title: string;
  numPagesTotal: number | null;
  processingStatus: string;
}

export const usePDFProcessingSubscription = (
  pdfFileId: string,
  setFileInfo: (updater: (prev: PDFFileInfo | null) => PDFFileInfo | null) => void,
  reloadPages: () => void
) => {
  useEffect(() => {
    if (!pdfFileId) return;

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
            
            if (payload.new.processing_status === 'completed') {
              reloadPages();
            }
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(subscription);
    };
  }, [pdfFileId, setFileInfo, reloadPages]);
};


import { supabase } from '@/integrations/supabase/client';
import { usePDFFileInfo } from './pdf/usePDFFileInfo';
import { usePDFPagesData } from './pdf/usePDFPagesData';
import { usePDFProcessingSubscription } from './pdf/usePDFProcessingSubscription';
import { usePDFRetryProcessing } from './pdf/usePDFRetryProcessing';

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
  const { fileInfo, isLoading: fileInfoLoading, error: fileInfoError, reload: reloadFileInfo, setFileInfo } = usePDFFileInfo(pdfFileId);
  const { pages, isLoading: pagesLoading, error: pagesError, reload: reloadPages } = usePDFPagesData(pdfFileId, fileInfo?.processingStatus);
  const { retryProcessing, isRetrying } = usePDFRetryProcessing();

  // Set up real-time subscription for processing status updates
  usePDFProcessingSubscription(pdfFileId, setFileInfo, reloadPages);

  const getPageUrl = (page: PDFPage): string => {
    const { data } = supabase.storage
      .from('pdf-files')
      .getPublicUrl(page.filePath);
    
    return data.publicUrl;
  };

  const handleRetryProcessing = async () => {
    await retryProcessing(pdfFileId, reloadFileInfo);
  };

  const isLoading = fileInfoLoading || pagesLoading || isRetrying;
  const error = fileInfoError || pagesError;

  const loadPDFPages = async () => {
    await reloadFileInfo();
    await reloadPages();
  };

  return {
    pages,
    fileInfo,
    isLoading,
    error,
    reload: loadPDFPages,
    getPageUrl,
    retryProcessing: handleRetryProcessing
  };
};

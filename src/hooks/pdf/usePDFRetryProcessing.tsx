
import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';

export const usePDFRetryProcessing = () => {
  const [isRetrying, setIsRetrying] = useState(false);

  const retryProcessing = async (pdfFileId: string, reloadFileInfo: () => void) => {
    try {
      setIsRetrying(true);
      
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
      await reloadFileInfo();

    } catch (err) {
      console.error('Error retrying processing:', err);
      throw new Error('שגיאה בהפעלה מחדש של העיבוד');
    } finally {
      setIsRetrying(false);
    }
  };

  return {
    retryProcessing,
    isRetrying
  };
};

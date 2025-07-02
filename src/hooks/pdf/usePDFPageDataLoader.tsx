
import { useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';

export const usePDFPageDataLoader = (pdfFileId: string) => {
  const loadSplitPage = useCallback(async (pageNumber: number) => {
    console.log(`🔍 Checking for split page ${pageNumber} in pdfFileId: ${pdfFileId}`);
    
    const { data: pageData, error: pageError } = await supabase
      .from('pdf_pages')
      .select('file_path')
      .eq('pdf_file_id', pdfFileId)
      .eq('page_number', pageNumber)
      .maybeSingle();

    if (pageError) {
      console.error(`❌ Error querying split pages for page ${pageNumber}:`, pageError);
      throw pageError;
    }

    if (!pageData) {
      return null;
    }

    console.log(`📄 Found split page ${pageNumber} at:`, pageData.file_path);
    return pageData;
  }, [pdfFileId]);

  const loadMainPDF = useCallback(async () => {
    console.log(`📄 Loading main PDF for pdfFileId: ${pdfFileId}`);
    
    const { data: pdfFile, error: pdfError } = await supabase
      .from('pdf_files')
      .select('file_path')
      .eq('id', pdfFileId)
      .single();

    if (pdfError || !pdfFile) {
      throw new Error(`PDF file not found: ${pdfError?.message}`);
    }

    return pdfFile;
  }, [pdfFileId]);

  const downloadFile = useCallback(async (filePath: string): Promise<Blob> => {
    const { data: fileData, error: downloadError } = await supabase.storage
      .from('pdf-files')
      .download(filePath);

    if (downloadError || !fileData) {
      throw new Error(`Failed to download file: ${downloadError?.message}`);
    }

    // Verify the file is not empty
    if (fileData.size === 0) {
      throw new Error(`Downloaded file is empty`);
    }

    return fileData;
  }, []);

  const createBlobUrl = useCallback((fileData: Blob, pageNumber: number, fileType: string): string => {
    const blobUrl = URL.createObjectURL(fileData);
    console.log(`✅ ${fileType} blob URL for page ${pageNumber}: ${blobUrl}, size: ${fileData.size} bytes`);
    return blobUrl;
  }, []);

  const getImageUrl = useCallback((filePath: string, pageNumber: number): string => {
    const { data } = supabase.storage
      .from('pdf-files')
      .getPublicUrl(filePath);
    
    console.log(`✅ Image URL for page ${pageNumber}: ${data.publicUrl}`);
    return data.publicUrl;
  }, []);

  return {
    loadSplitPage,
    loadMainPDF,
    downloadFile,
    createBlobUrl,
    getImageUrl
  };
};


import { useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { PDFPageData } from '@/types/pdfViewer';

export const usePDFPageDataLoader = (pdfFileId: string) => {
  const loadSplitPage = useCallback(async (pageNumber: number): Promise<PDFPageData | null> => {
    try {
      console.log(`🔍 Checking for split page ${pageNumber} in pdfFileId: ${pdfFileId}`);
      
      const { data, error } = await supabase
        .from('pdf_pages')
        .select('file_path')
        .eq('pdf_file_id', pdfFileId)
        .eq('page_number', pageNumber)
        .maybeSingle();

      if (error) {
        console.error(`❌ Supabase error loading split page ${pageNumber}:`, error);
        throw error;
      }

      if (!data) {
        console.log(`📄 No split page found for page ${pageNumber}`);
        return null;
      }

      console.log(`✅ Split page ${pageNumber} found at: ${data.file_path}`);
      return {
        file_path: data.file_path,
        page_number: pageNumber
      };

    } catch (error) {
      console.error(`❌ Error loading split page ${pageNumber}:`, error);
      throw error;
    }
  }, [pdfFileId]);

  const loadMainPDF = useCallback(async (): Promise<{ file_path: string }> => {
    try {
      console.log(`📄 Loading main PDF for pdfFileId: ${pdfFileId}`);
      
      const { data, error } = await supabase
        .from('pdf_files')
        .select('file_path')
        .eq('id', pdfFileId)
        .single();

      if (error) {
        console.error(`❌ Supabase error loading main PDF:`, error);
        throw error;
      }

      console.log(`✅ Main PDF found at: ${data.file_path}`);
      return data;

    } catch (error) {
      console.error(`❌ Error loading main PDF:`, error);
      throw error;
    }
  }, [pdfFileId]);

  const downloadFile = useCallback(async (filePath: string): Promise<ArrayBuffer> => {
    try {
      console.log(`📥 Downloading file from: ${filePath}`);
      
      // Use Supabase storage to get the file with proper CORS handling
      const { data, error } = await supabase.storage
        .from('pdf-files')
        .download(filePath);

      if (error) {
        console.error(`❌ Supabase storage error downloading ${filePath}:`, error);
        throw new Error(`Failed to download file: ${error.message}`);
      }

      if (!data) {
        throw new Error(`No data received for file: ${filePath}`);
      }

      const arrayBuffer = await data.arrayBuffer();
      console.log(`✅ File downloaded successfully: ${arrayBuffer.byteLength} bytes`);
      return arrayBuffer;

    } catch (error) {
      console.error(`❌ Error downloading file ${filePath}:`, error);
      throw error;
    }
  }, []);

  const createBlobUrl = useCallback((data: ArrayBuffer, pageNumber: number, source: string): string => {
    try {
      console.log(`🔗 Creating blob URL for page ${pageNumber} from ${source}: ${data.byteLength} bytes`);
      
      // Determine content type based on data
      const uint8Array = new Uint8Array(data);
      let contentType = 'application/pdf';
      
      // Check for image file signatures
      if (uint8Array[0] === 0x89 && uint8Array[1] === 0x50 && uint8Array[2] === 0x4E && uint8Array[3] === 0x47) {
        contentType = 'image/png';
      } else if (uint8Array[0] === 0xFF && uint8Array[1] === 0xD8 && uint8Array[2] === 0xFF) {
        contentType = 'image/jpeg';
      }

      const blob = new Blob([data], { type: contentType });
      const url = URL.createObjectURL(blob);
      
      console.log(`✅ Blob URL created for page ${pageNumber}: ${url.substring(0, 50)}... (${contentType})`);
      return url;

    } catch (error) {
      console.error(`❌ Error creating blob URL for page ${pageNumber}:`, error);
      throw error;
    }
  }, []);

  const getImageUrl = useCallback((filePath: string, pageNumber: number): string => {
    try {
      console.log(`🖼️ Getting image URL for page ${pageNumber} from: ${filePath}`);
      
      // Use Supabase storage public URL with proper CORS handling
      const { data } = supabase.storage
        .from('pdf-files')
        .getPublicUrl(filePath);

      if (!data.publicUrl) {
        throw new Error(`Failed to get public URL for: ${filePath}`);
      }

      console.log(`✅ Image URL created for page ${pageNumber}: ${data.publicUrl.substring(0, 50)}...`);
      return data.publicUrl;

    } catch (error) {
      console.error(`❌ Error getting image URL for page ${pageNumber}:`, error);
      throw error;
    }
  }, []);

  return {
    loadSplitPage,
    loadMainPDF,
    downloadFile,
    createBlobUrl,
    getImageUrl
  };
};

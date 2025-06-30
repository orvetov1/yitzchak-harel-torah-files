
import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAdmin } from './useAdmin';
import { toast } from 'sonner';

interface UploadFileParams {
  file: File;
  title: string;
  description: string;
  categoryId: string;
}

// Function to sanitize file names for storage
const sanitizeFileName = (fileName: string): string => {
  // Get file extension
  const extensionMatch = fileName.match(/\.[^.]+$/);
  const extension = extensionMatch ? extensionMatch[0] : '';
  
  // Remove extension from name for processing
  const nameWithoutExt = fileName.replace(/\.[^.]+$/, '');
  
  // Replace Hebrew characters and special characters with safe alternatives
  const sanitized = nameWithoutExt
    .replace(/[א-ת]/g, '') // Remove Hebrew characters
    .replace(/[^\w\-_.]/g, '-') // Replace non-alphanumeric with dash
    .replace(/[-_]{2,}/g, '-') // Replace multiple dashes/underscores with single dash
    .replace(/^[-_]+|[-_]+$/g, '') // Remove leading/trailing dashes
    .toLowerCase();
  
  // If name becomes empty after sanitization, use timestamp
  const finalName = sanitized || 'file';
  
  return `${finalName}${extension}`;
};

export const useFileUpload = () => {
  const [isUploading, setIsUploading] = useState(false);
  const { adminUser } = useAdmin();

  const uploadFile = async ({ file, title, description, categoryId }: UploadFileParams): Promise<boolean> => {
    if (!file || !title || !categoryId) {
      toast.error('אנא מלא את כל השדות הנדרשים');
      return false;
    }

    setIsUploading(true);
    try {
      // Create sanitized file name for storage
      const sanitizedFileName = sanitizeFileName(file.name);
      const storageFileName = `${Date.now()}-${sanitizedFileName}`;
      
      console.log('📤 Starting file upload...');
      console.log('Original file name:', file.name);
      console.log('Storage file name:', storageFileName);
      console.log('File size:', file.size, 'bytes');

      // Upload file to storage
      const { data: uploadData, error: uploadError } = await supabase.storage
        .from('pdf-files')
        .upload(storageFileName, file, {
          contentType: 'application/pdf',
          upsert: false
        });

      if (uploadError) {
        console.error('Storage upload error:', uploadError);
        throw uploadError;
      }

      // Get public URL - store the relative path instead of full URL
      const { data: { publicUrl } } = supabase.storage
        .from('pdf-files')
        .getPublicUrl(storageFileName);

      console.log('✅ File uploaded to storage successfully');
      console.log('Public URL:', publicUrl);
      console.log('Storage path:', storageFileName);

      // Save file info to database with relative path for processing
      const { data: insertData, error: dbError } = await supabase
        .from('pdf_files')
        .insert({
          title,
          description,
          file_path: publicUrl, // Store full URL for public access
          file_name: storageFileName, // Store relative path for processing
          category_id: categoryId,
          file_size: file.size,
          uploaded_by: adminUser?.id,
          processing_status: 'pending'
        })
        .select('id')
        .single();

      if (dbError) {
        console.error('Database insert error:', dbError);
        // Clean up uploaded file if database insert fails
        await supabase.storage.from('pdf-files').remove([storageFileName]);
        throw dbError;
      }

      console.log('✅ File record created in database:', insertData.id);

      // טריגר עיבוד PDF ישירות מהקוד במקום טריגר דאטהבייס
      try {
        console.log('🔄 Starting PDF processing...');
        
        // חילוץ הנתיב היחסי מהURL המלא
        let relativePath = storageFileName;
        if (publicUrl.includes('/storage/v1/object/public/pdf-files/')) {
          const match = publicUrl.match(/\/pdf-files\/(.+)$/);
          relativePath = match ? match[1] : storageFileName;
        }

        const { error: functionError } = await supabase.functions.invoke('split-pdf', {
          body: {
            pdf_file_id: insertData.id,
            file_path: relativePath,
            file_name: storageFileName
          }
        });

        if (functionError) {
          console.error('PDF processing function error:', functionError);
          // לא נזרוק שגיאה כי הקובץ כבר הועלה בהצלחה
          console.log('⚠️ PDF processing failed but file was uploaded successfully');
        } else {
          console.log('✅ PDF processing started successfully');
        }
      } catch (processingError) {
        console.error('PDF processing error:', processingError);
        // לא נזרוק שגיאה כי הקובץ כבר הועלה בהצלחה
      }

      toast.success('הקובץ הועלה בהצלחה');
      return true;
    } catch (error: any) {
      console.error('Upload error:', error);
      toast.error(`שגיאה בהעלאת הקובץ: ${error.message || 'שגיאה לא ידועה'}`);
      return false;
    } finally {
      setIsUploading(false);
    }
  };

  return { uploadFile, isUploading };
};


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

      // Get public URL
      const { data: { publicUrl } } = supabase.storage
        .from('pdf-files')
        .getPublicUrl(storageFileName);

      console.log('✅ File uploaded to storage successfully');
      console.log('Public URL:', publicUrl);

      // Save file info to database - using the exact column names from the schema
      const insertData = {
        title: title,
        description: description || null,
        file_path: publicUrl,
        file_name: storageFileName, // Store the sanitized storage file name
        category_id: categoryId,
        file_size: file.size,
        uploaded_by: adminUser?.id || null,
        processing_status: 'pending'
      };

      console.log('📝 Inserting to database:', insertData);

      const { data: dbInsertData, error: dbError } = await supabase
        .from('pdf_files')
        .insert(insertData)
        .select('id')
        .single();

      if (dbError) {
        console.error('Database insert error:', dbError);
        // Clean up uploaded file if database insert fails
        await supabase.storage.from('pdf-files').remove([storageFileName]);
        throw dbError;
      }

      console.log('✅ File record created in database:', dbInsertData.id);

      // Start PDF processing
      try {
        console.log('🔄 Starting PDF processing...');
        
        const { error: functionError } = await supabase.functions.invoke('split-pdf', {
          body: {
            pdf_file_id: dbInsertData.id,
            file_path: storageFileName,
            file_name: storageFileName
          }
        });

        if (functionError) {
          console.error('PDF processing function error:', functionError);
          console.log('⚠️ PDF processing failed but file was uploaded successfully');
        } else {
          console.log('✅ PDF processing started successfully');
        }
      } catch (processingError) {
        console.error('PDF processing error:', processingError);
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

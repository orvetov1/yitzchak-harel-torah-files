
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
      
      console.log('Original file name:', file.name);
      console.log('Sanitized file name:', storageFileName);

      // Upload file to storage
      const { data: uploadData, error: uploadError } = await supabase.storage
        .from('pdf-files')
        .upload(storageFileName, file);

      if (uploadError) {
        console.error('Storage upload error:', uploadError);
        throw uploadError;
      }

      // Get public URL
      const { data: { publicUrl } } = supabase.storage
        .from('pdf-files')
        .getPublicUrl(storageFileName);

      // Save file info to database
      const { error: dbError } = await supabase
        .from('pdf_files')
        .insert({
          title,
          description,
          file_path: publicUrl,
          file_name: file.name, // Keep original name for display
          category_id: categoryId,
          file_size: file.size,
          uploaded_by: adminUser?.id
        });

      if (dbError) {
        console.error('Database insert error:', dbError);
        throw dbError;
      }

      toast.success('הקובץ הועלה בהצלחה');
      return true;
    } catch (error) {
      console.error('Upload error:', error);
      toast.error(`שגיאה בהעלאת הקובץ: ${error.message || 'שגיאה לא ידועה'}`);
      return false;
    } finally {
      setIsUploading(false);
    }
  };

  return { uploadFile, isUploading };
};

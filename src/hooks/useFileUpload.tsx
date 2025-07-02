// src/hooks/useFileUpload.tsx
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
  console.log('🔧 Starting sanitizeFileName with:', fileName);
  
  const extensionMatch = fileName.match(/\.[^.]+$/);
  const extension = extensionMatch ? extensionMatch[0] : '';
  
  const nameWithoutExt = fileName.replace(/\.[^.]+$/, '');
  
  // Step 1: Remove all non-ASCII characters
  const step1 = nameWithoutExt.replace(/[^\x00-\x7F]/g, '');
  
  // Step 2: Replace spaces, parentheses, brackets with dash
  const step2 = step1.replace(/[\s\(\)\[\]{}]/g, '-');
  
  // Step 3: Replace remaining special characters with dash
  const step3 = step2.replace(/[^\w\-_.]/g, '-');
  
  // Step 4: Clean up multiple dashes
  const step4 = step3.replace(/[-_]{2,}/g, '-');
  
  // Step 5: Remove leading/trailing dashes
  const step5 = step4.replace(/^[-_]+|[-_]+$/g, '');
  
  // Step 6: Convert to lowercase
  const sanitized = step5.toLowerCase();
  
  const finalName = sanitized || `document-${Date.now()}`;
  
  const result = `${finalName}${extension}`;
  
  // Final validation for problematic characters
  const hasProblematicChars = /[^\w\-_.]/g.test(result);
  if (hasProblematicChars) {
    console.warn('⚠️ Warning: Problematic characters still found in sanitized name, using fallback timestamp name.');
    return `file-${Date.now()}${extension}`;
  }
  
  console.log('✅ Final sanitized filename:', result);
  return result;
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
      // Create a unique storage path for the file, using the sanitized name
      const sanitizedFileName = sanitizeFileName(file.name);
      // Construct a unique path for the storage bucket. This is the RELATIVE path.
      const storageRelativePath = `uploads/${Date.now()}-${sanitizedFileName}`; 
      
      console.log('📤 Starting file upload...');
      console.log('Original file name:', file.name);
      console.log('Sanitized file name:', sanitizedFileName);
      console.log('Storage relative path:', storageRelativePath);
      console.log('File size:', file.size, 'bytes');

      if (storageRelativePath.includes('undefined') || storageRelativePath.includes('null')) {
        console.error('❌ Invalid storage filename generated:', storageRelativePath);
        throw new Error('Invalid filename generated after sanitization');
      }

      // Upload file to storage using the relative path
      const { data: uploadData, error: uploadError } = await supabase.storage
        .from('pdf-files')
        .upload(storageRelativePath, file, {
          contentType: 'application/pdf',
          upsert: false // Do not overwrite existing files by default
        });

      if (uploadError) {
        console.error('Storage upload error:', uploadError);
        throw uploadError;
      }

      // Get the public URL for the uploaded file
      const { data: { publicUrl } } = supabase.storage
        .from('pdf-files')
        .getPublicUrl(storageRelativePath);

      if (!publicUrl) {
          throw new Error('Failed to get public URL for uploaded file.');
      }

      console.log('✅ File uploaded to storage successfully');
      console.log('Public URL:', publicUrl);

      // Save file info to database.
      // Store the PUBLIC URL in file_path for client-side access.
      // Store the RELATIVE PATH in file_name for Supabase functions (if they need it).
      const insertData = {
        title: title,
        description: description || null,
        file_path: publicUrl, // Full public URL for client
        file_name: storageRelativePath, // Relative path for server-side functions / internal references
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
        // Clean up uploaded file from storage if database insert fails
        await supabase.storage.from('pdf-files').remove([storageRelativePath]);
        throw dbError;
      }

      console.log('✅ File record created in database:', dbInsertData.id);

      // Trigger PDF processing functions.
      // Pass the RELATIVE PATH to the functions.
      try {
        console.log('🔄 Starting PDF processing (split-pdf function)...');
        
        const { error: splitFunctionError } = await supabase.functions.invoke('split-pdf', {
          body: {
            pdf_file_id: dbInsertData.id,
            file_path: storageRelativePath, // Pass relative path to backend function
            file_name: sanitizedFileName // Pass original sanitized name
          }
        });

        if (splitFunctionError) {
          console.error('PDF split function error:', splitFunctionError);
          toast.error('הקובץ הועלה אך הייתה שגיאה בעיבוד עמודים');
        } else {
          console.log('✅ PDF split processing triggered successfully');
        }
      } catch (processingError) {
        console.error('General PDF processing trigger error:', processingError);
        toast.error(`שגיאה בהפעלת עיבוד הקובץ: ${processingError.message || 'שגיאה לא ידועה'}`);
      }

      toast.success('הקובץ הועלה בהצלחה');
      return true;
    } catch (error: any) {
      console.error('Upload operation failed:', error);
      toast.error(`שגיאה בהעלאת הקובץ: ${error.message || 'שגיאה לא ידועה'}`);
      return false;
    } finally {
      setIsUploading(false);
    }
  };

  return { uploadFile, isUploading };
};
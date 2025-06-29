
import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';

interface PDFItem {
  id: string;
  title: string;
  description?: string;
  filePath: string;
  category: string;
}

export const usePDFFiles = (categorySlug?: string) => {
  const [items, setItems] = useState<PDFItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadPDFFiles();
  }, [categorySlug]);

  const loadPDFFiles = async () => {
    try {
      setIsLoading(true);
      setError(null);

      let query = supabase
        .from('pdf_files')
        .select(`
          id,
          title,
          description,
          file_path,
          categories!inner (
            slug,
            name
          )
        `);

      if (categorySlug) {
        query = query.eq('categories.slug', categorySlug);
      }

      const { data, error: queryError } = await query.order('created_at', { ascending: false });

      if (queryError) {
        throw queryError;
      }

      const formattedItems: PDFItem[] = (data || []).map(item => ({
        id: item.id,
        title: item.title,
        description: item.description || undefined,
        filePath: item.file_path,
        category: item.categories.slug
      }));

      setItems(formattedItems);
    } catch (err) {
      console.error('Error loading PDF files:', err);
      setError('שגיאה בטעינת הקבצים');
    } finally {
      setIsLoading(false);
    }
  };

  return { items, isLoading, error, reload: loadPDFFiles };
};

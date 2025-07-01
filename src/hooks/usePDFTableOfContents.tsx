
import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';

interface TableOfContentsItem {
  id: string;
  chapter_title: string;
  page_number: number;
  level: number;
  order_index: number;
}

export const usePDFTableOfContents = (pdfFileId: string) => {
  const [tableOfContents, setTableOfContents] = useState<TableOfContentsItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!pdfFileId) return;

    const loadTableOfContents = async () => {
      try {
        setIsLoading(true);
        setError(null);

        const { data, error: queryError } = await supabase
          .from('pdf_table_of_contents')
          .select('*')
          .eq('pdf_file_id', pdfFileId)
          .order('order_index', { ascending: true });

        if (queryError) {
          throw queryError;
        }

        setTableOfContents(data || []);
      } catch (err) {
        console.error('Error loading table of contents:', err);
        setError('שגיאה בטעינת תוכן עניינים');
      } finally {
        setIsLoading(false);
      }
    };

    loadTableOfContents();
  }, [pdfFileId]);

  return { tableOfContents, isLoading, error };
};

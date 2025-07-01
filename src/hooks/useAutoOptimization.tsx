
import { useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';

export const useAutoOptimization = () => {
  const triggerAutoOptimization = useCallback(async (pdfFileId: string) => {
    try {
      console.log('🚀 Triggering auto-optimization for:', pdfFileId);
      
      const { data, error } = await supabase.functions.invoke('auto-optimize-trigger', {
        body: { pdf_file_id: pdfFileId }
      });

      if (error) {
        console.error('❌ Auto-optimization trigger failed:', error);
        return { success: false, error: error.message };
      }

      console.log('✅ Auto-optimization result:', data);
      return data;

    } catch (error) {
      console.error('❌ Auto-optimization error:', error);
      return { 
        success: false, 
        error: error instanceof Error ? error.message : 'Unknown error' 
      };
    }
  }, []);

  return { triggerAutoOptimization };
};

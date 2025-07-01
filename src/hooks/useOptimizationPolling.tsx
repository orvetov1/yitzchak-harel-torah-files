
import { useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';

interface OptimizationPollingOptions {
  pdfFileId: string;
  onOptimizationComplete?: (data: any) => void;
  onOptimizationFailed?: (error: string) => void;
  enabled?: boolean;
  interval?: number;
}

export const useOptimizationPolling = ({
  pdfFileId,
  onOptimizationComplete,
  onOptimizationFailed,
  enabled = false,
  interval = 3000 // 3 seconds
}: OptimizationPollingOptions) => {
  
  const checkOptimizationStatus = useCallback(async () => {
    try {
      const { data, error } = await supabase
        .from('pdf_files')
        .select('processing_status, optimized_file_path, compression_ratio, optimization_completed_at')
        .eq('id', pdfFileId)
        .single();

      if (error) {
        console.error('❌ Failed to check optimization status:', error);
        return;
      }

      if (data.processing_status === 'optimized' && data.optimized_file_path) {
        console.log('✅ Optimization completed for:', pdfFileId);
        onOptimizationComplete?.(data);
        return true; // Stop polling
      }

      if (data.processing_status === 'failed') {
        console.log('❌ Optimization failed for:', pdfFileId);
        onOptimizationFailed?.('Optimization failed');
        return true; // Stop polling
      }

      return false; // Continue polling
    } catch (error) {
      console.error('❌ Error checking optimization status:', error);
      return false;
    }
  }, [pdfFileId, onOptimizationComplete, onOptimizationFailed]);

  useEffect(() => {
    if (!enabled) return;

    let intervalId: NodeJS.Timeout;
    let isActive = true;

    const startPolling = async () => {
      // Check immediately
      const shouldStop = await checkOptimizationStatus();
      if (shouldStop || !isActive) return;

      // Set up interval
      intervalId = setInterval(async () => {
        if (!isActive) return;
        
        const shouldStop = await checkOptimizationStatus();
        if (shouldStop) {
          clearInterval(intervalId);
        }
      }, interval);
    };

    startPolling();

    return () => {
      isActive = false;
      if (intervalId) {
        clearInterval(intervalId);
      }
    };
  }, [enabled, checkOptimizationStatus, interval]);
};


import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';

interface OptimizationState {
  hasOptimizedVersion: boolean;
  optimizedUrl: string | null;
  originalUrl: string;
  isOptimizing: boolean;
  error: string | null;
  compressionRatio?: number;
  originalSize?: number;
  optimizedSize?: number;
}

export const usePDFOptimization = (fileUrl: string, pdfFileId?: string) => {
  const [state, setState] = useState<OptimizationState>({
    hasOptimizedVersion: false,
    optimizedUrl: null,
    originalUrl: fileUrl,
    isOptimizing: false,
    error: null
  });

  const checkOptimizedVersion = useCallback(async () => {
    if (!pdfFileId) return;

    try {
      const { data, error } = await supabase
        .from('pdf_files')
        .select('optimized_file_path, processing_status, compression_ratio, original_size, optimized_size')
        .eq('id', pdfFileId)
        .single();

      if (error) {
        console.error('❌ Failed to check optimization status:', error);
        return;
      }

      const hasOptimized = data.optimized_file_path && data.processing_status === 'optimized';
      
      setState(prev => ({
        ...prev,
        hasOptimizedVersion: hasOptimized,
        optimizedUrl: hasOptimized ? data.optimized_file_path : null,
        isOptimizing: data.processing_status === 'optimizing',
        compressionRatio: data.compression_ratio || undefined,
        originalSize: data.original_size || undefined,
        optimizedSize: data.optimized_size || undefined,
        error: null
      }));

      console.log('🔍 Optimization status check:', {
        hasOptimized,
        isOptimizing: data.processing_status === 'optimizing',
        compressionRatio: data.compression_ratio
      });

    } catch (error) {
      console.error('❌ Error checking optimization:', error);
      setState(prev => ({
        ...prev,
        error: 'Failed to check optimization status'
      }));
    }
  }, [pdfFileId]);

  const requestOptimization = useCallback(async () => {
    if (!pdfFileId) return;

    try {
      setState(prev => ({ ...prev, isOptimizing: true, error: null }));

      // Get file details first
      const { data: fileData, error: fileError } = await supabase
        .from('pdf_files')
        .select('file_path, file_name')
        .eq('id', pdfFileId)
        .single();

      if (fileError || !fileData) {
        throw new Error('Failed to get file details');
      }

      // Extract relative path from full URL if needed
      let relativePath = fileData.file_path;
      if (fileData.file_path.includes('/storage/v1/object/public/pdf-files/')) {
        const match = fileData.file_path.match(/\/pdf-files\/(.+)$/);
        relativePath = match ? match[1] : fileData.file_name;
      }

      console.log('🚀 Requesting PDF optimization for:', pdfFileId);

      const { error: functionError } = await supabase.functions.invoke('optimize-pdf', {
        body: {
          pdf_file_id: pdfFileId,
          file_path: relativePath,
          file_name: fileData.file_name
        }
      });

      if (functionError) {
        throw functionError;
      }

      // Check status after a delay
      setTimeout(checkOptimizedVersion, 2000);

    } catch (error) {
      console.error('❌ Failed to request optimization:', error);
      setState(prev => ({
        ...prev,
        isOptimizing: false,
        error: 'Failed to start optimization'
      }));
    }
  }, [pdfFileId, checkOptimizedVersion]);

  const getBestUrl = useCallback((): string => {
    return state.hasOptimizedVersion && state.optimizedUrl 
      ? state.optimizedUrl 
      : state.originalUrl;
  }, [state.hasOptimizedVersion, state.optimizedUrl, state.originalUrl]);

  useEffect(() => {
    checkOptimizedVersion();
  }, [checkOptimizedVersion]);

  return {
    ...state,
    checkOptimizedVersion,
    requestOptimization,
    getBestUrl
  };
};


import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';

interface LinearizationState {
  hasLinearizedVersion: boolean;
  linearizedUrl: string | null;
  originalUrl: string;
  isLinearizing: boolean;
  error: string | null;
  compressionRatio?: number;
  originalSize?: number;
  linearizedSize?: number;
  isLinearized?: boolean;
}

export const usePDFLinearization = (fileUrl: string, pdfFileId?: string) => {
  const [state, setState] = useState<LinearizationState>({
    hasLinearizedVersion: false,
    linearizedUrl: null,
    originalUrl: fileUrl,
    isLinearizing: false,
    error: null
  });

  const checkLinearizedVersion = useCallback(async () => {
    if (!pdfFileId) return;

    try {
      const { data, error } = await supabase
        .from('pdf_files')
        .select('optimized_file_path, processing_status, compression_ratio, original_size, optimized_size')
        .eq('id', pdfFileId)
        .single();

      if (error) {
        console.error('❌ Failed to check linearization status:', error);
        return;
      }

      const hasLinearized = data.optimized_file_path && 
                           (data.processing_status === 'linearized' || data.processing_status === 'optimized');
      
      setState(prev => ({
        ...prev,
        hasLinearizedVersion: hasLinearized,
        linearizedUrl: hasLinearized ? data.optimized_file_path : null,
        isLinearizing: data.processing_status === 'linearizing',
        compressionRatio: data.compression_ratio || undefined,
        originalSize: data.original_size || undefined,
        linearizedSize: data.optimized_size || undefined,
        isLinearized: data.processing_status === 'linearized',
        error: null
      }));

      console.log('🔍 Linearization status check:', {
        hasLinearized,
        isLinearizing: data.processing_status === 'linearizing',
        compressionRatio: data.compression_ratio,
        isLinearized: data.processing_status === 'linearized'
      });

    } catch (error) {
      console.error('❌ Error checking linearization:', error);
      setState(prev => ({
        ...prev,
        error: 'Failed to check linearization status'
      }));
    }
  }, [pdfFileId]);

  const requestLinearization = useCallback(async () => {
    if (!pdfFileId) return;

    try {
      setState(prev => ({ ...prev, isLinearizing: true, error: null }));

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

      console.log('🚀 Requesting PDF linearization for:', pdfFileId);

      const { error: functionError } = await supabase.functions.invoke('linearize-pdf', {
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
      setTimeout(checkLinearizedVersion, 2000);

    } catch (error) {
      console.error('❌ Failed to request linearization:', error);
      setState(prev => ({
        ...prev,
        isLinearizing: false,
        error: 'Failed to start linearization'
      }));
    }
  }, [pdfFileId, checkLinearizedVersion]);

  const getBestUrl = useCallback((): string => {
    return state.hasLinearizedVersion && state.linearizedUrl 
      ? state.linearizedUrl 
      : state.originalUrl;
  }, [state.hasLinearizedVersion, state.linearizedUrl, state.originalUrl]);

  useEffect(() => {
    checkLinearizedVersion();
  }, [checkLinearizedVersion]);

  return {
    ...state,
    checkLinearizedVersion,
    requestLinearization,
    getBestUrl
  };
};

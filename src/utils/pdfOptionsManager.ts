
import { useMemo } from 'react';
import { pdfjs } from 'react-pdf';

export interface OptimizedPDFOptions {
  cMapUrl: string;
  cMapPacked: boolean;
  standardFontDataUrl: string;
  httpHeaders: Record<string, string>;
  withCredentials: boolean;
  verbosity: number;
  disableAutoFetch: boolean;
  disableStream: boolean;
  disableRange: boolean;
  maxImageSize: number;
  isEvalSupported: boolean;
  enableXfa: boolean;
  useSystemFonts: boolean;
  useWorkerFetch: boolean;
}

export const usePDFOptions = (fileSize?: number, complexity?: string): OptimizedPDFOptions => {
  return useMemo(() => {
    const baseOptions: OptimizedPDFOptions = {
      // Use reliable CDN for character maps
      cMapUrl: `https://cdn.jsdelivr.net/npm/pdfjs-dist@${pdfjs.version}/cmaps/`,
      cMapPacked: true,
      standardFontDataUrl: `https://cdn.jsdelivr.net/npm/pdfjs-dist@${pdfjs.version}/standard_fonts/`,
      
      // Network optimization for Supabase
      httpHeaders: {
        'Accept': 'application/pdf,*/*',
        'Cache-Control': 'public, max-age=3600'
      },
      withCredentials: false,
      
      // Logging level (0 = errors only, 1 = warnings, 5 = everything)
      verbosity: process.env.NODE_ENV === 'development' ? 1 : 0,
      
      // Performance optimizations - start conservative for Supabase
      disableAutoFetch: false,
      disableStream: false,
      disableRange: false,
      
      // Image optimization
      maxImageSize: fileSize && fileSize > 5 * 1024 * 1024 ? 1024 * 1024 : 4 * 1024 * 1024, // 1MB for large files, 4MB for others
      
      // Feature toggles
      isEvalSupported: false, // Disable eval for security
      enableXfa: false, // Disable XFA forms for performance
      useSystemFonts: true, // Use system fonts when possible
      useWorkerFetch: false // Use main thread for fetching (more reliable with Supabase)
    };

    // Adjust options based on complexity or file size
    if (complexity === 'high' || (fileSize && fileSize > 10 * 1024 * 1024)) {
      return {
        ...baseOptions,
        disableAutoFetch: true,
        disableStream: true,
        maxImageSize: 512 * 1024, // 512KB for complex files
      };
    }

    if (complexity === 'low' || (fileSize && fileSize < 1024 * 1024)) {
      return {
        ...baseOptions,
        disableRange: true, // Use full download for small files
      };
    }

    return baseOptions;
  }, [fileSize, complexity]);
};

// Enhanced Document options factory with better Supabase support
export const createDocumentOptions = (
  fileUrl: string, 
  fileSize?: number, 
  complexity?: string
) => {
  const options = usePDFOptions(fileSize, complexity);
  
  return {
    url: fileUrl,
    ...options,
    // Enhanced request handling for Supabase Storage
    onProgress: (progressData: { loaded: number; total: number }) => {
      const percent = Math.round((progressData.loaded / progressData.total) * 100);
      console.log(`📥 PDF Download progress: ${percent}% (${progressData.loaded}/${progressData.total})`);
    },
    onError: (error: Error) => {
      console.error('📄 PDF Document error:', {
        message: error.message,
        name: error.name,
        stack: error.stack
      });
    }
  };
};

// Test if file is accessible and get content type
export const validatePDFFile = async (fileUrl: string): Promise<{
  isAccessible: boolean;
  contentType: string | null;
  fileSize: number;
  supportsRange: boolean;
}> => {
  try {
    const response = await fetch(fileUrl, { method: 'HEAD' });
    
    const contentType = response.headers.get('Content-Type');
    const fileSize = parseInt(response.headers.get('Content-Length') || '0');
    const acceptRanges = response.headers.get('Accept-Ranges');
    
    const validation = {
      isAccessible: response.ok,
      contentType,
      fileSize,
      supportsRange: acceptRanges === 'bytes'
    };
    
    console.log('📋 PDF file validation:', validation);
    
    if (contentType && !contentType.includes('pdf')) {
      console.warn('⚠️ File may not be a PDF:', contentType);
    }
    
    return validation;
    
  } catch (error) {
    console.error('❌ PDF file validation failed:', error);
    return {
      isAccessible: false,
      contentType: null,
      fileSize: 0,
      supportsRange: false
    };
  }
};


import { useCallback } from 'react';

export type FallbackStrategy = 'simple-load' | 'page-by-page' | 'new-tab' | 'download-only';

interface FallbackOptions {
  fileUrl: string;
  fileName: string;
  failureType: 'timeout' | 'complex-pdf' | 'scanned-pdf' | 'memory-error' | 'unknown';
}

export const usePDFFallback = () => {
  const suggestFallback = useCallback((failureType: string): FallbackStrategy => {
    switch (failureType) {
      case 'complex-pdf':
      case 'scanned-pdf':
        return 'simple-load';
      case 'memory-error':
        return 'page-by-page';
      case 'timeout':
        return 'new-tab';
      default:
        return 'download-only';
    }
  }, []);

  const executeFallback = useCallback(async (
    strategy: FallbackStrategy, 
    options: FallbackOptions
  ) => {
    const { fileUrl, fileName } = options;
    
    console.log(`🔄 Executing fallback strategy: ${strategy}`);
    
    switch (strategy) {
      case 'simple-load':
        // Return simplified PDF.js options
        return {
          type: 'simple-options',
          options: {
            verbosity: 0,
            disableFontFace: true,
            disableRange: true,
            disableStream: true,
            maxImageSize: 512 * 1024, // 512KB limit
            renderTextLayer: false,
            renderAnnotationLayer: false,
            enableXfa: false
          }
        };
        
      case 'page-by-page':
        return {
          type: 'page-mode',
          message: 'טעינה עמוד אחר עמוד'
        };
        
      case 'new-tab':
        window.open(fileUrl, '_blank');
        return {
          type: 'redirect',
          message: 'הקובץ נפתח בטאב חדש'
        };
        
      case 'download-only':
        try {
          const response = await fetch(fileUrl);
          const blob = await response.blob();
          const url = window.URL.createObjectURL(blob);
          const link = document.createElement('a');
          link.href = url;
          link.download = fileName.endsWith('.pdf') ? fileName : `${fileName}.pdf`;
          document.body.appendChild(link);
          link.click();
          document.body.removeChild(link);
          window.URL.revokeObjectURL(url);
          
          return {
            type: 'download',
            message: 'הקובץ הורד למחשב'
          };
        } catch (error) {
          console.error('Download fallback failed:', error);
          window.open(fileUrl, '_blank');
          return {
            type: 'redirect',
            message: 'הקובץ נפתח בטאב חדש'
          };
        }
    }
  }, []);

  const getFallbackMessage = useCallback((strategy: FallbackStrategy, failureType: string) => {
    const messages = {
      'simple-load': 'נסה טעינה פשוטה ללא אלמנטים מורכבים',
      'page-by-page': 'נסה טעינה עמוד אחר עמוד',
      'new-tab': 'פתח בטאב חדש לצפייה מהירה',
      'download-only': 'הורד הקובץ לצפייה במחשב'
    };
    
    return messages[strategy] || 'נסה אפשרות חלופית';
  }, []);

  return {
    suggestFallback,
    executeFallback,
    getFallbackMessage
  };
};

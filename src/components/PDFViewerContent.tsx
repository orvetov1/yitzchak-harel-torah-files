
import React from 'react';
import { Document, Page, pdfjs } from 'react-pdf';
import { Button } from './ui/button';

// Configure PDF.js worker to use local file (copied by Vite plugin)
pdfjs.GlobalWorkerOptions.workerSrc = '/pdf.worker.min.js';
console.log('PDF.js worker configured to use local file (optimized for performance)');

interface PDFViewerContentProps {
  fileUrl: string;
  pageNumber: number;
  scale: number;
  loading: boolean;
  error: string | null;
  fileSize?: number;
  setPageLoading: (loading: boolean) => void;
  onDocumentLoadSuccess: ({ numPages }: { numPages: number }) => void;
  onDocumentLoadError: (error: Error) => void;
  onDocumentLoadProgress: ({ loaded, total }: { loaded: number; total: number }) => void;
  onRetry?: () => void;
}

const PDFViewerContent = ({
  fileUrl,
  pageNumber,
  scale,
  loading,
  error,
  fileSize = 0,
  setPageLoading,
  onDocumentLoadSuccess,
  onDocumentLoadError,
  onDocumentLoadProgress,
  onRetry
}: PDFViewerContentProps) => {
  // Dynamic optimization based on file size
  const getOptimizedSettings = () => {
    const fileSizeMB = fileSize / (1024 * 1024);
    
    if (fileSizeMB > 5) {
      // Large files - aggressive optimization
      return {
        maxImageSize: 1024 * 1024, // 1MB
        disableRange: true,
        disableStream: true,
      };
    } else if (fileSizeMB > 2) {
      // Medium files - balanced optimization
      return {
        maxImageSize: 2 * 1024 * 1024, // 2MB
        disableRange: false,
        disableStream: false,
      };
    } else {
      // Small files - minimal optimization for best quality
      return {
        maxImageSize: 4 * 1024 * 1024, // 4MB
        disableRange: false,
        disableStream: false,
      };
    }
  };

  const optimizedSettings = getOptimizedSettings();

  if (loading) {
    return (
      <div className="text-center hebrew-text space-y-4 p-8">
        <div className="animate-spin rounded-full h-16 w-16 border-b-4 border-primary mx-auto"></div>
        <div className="space-y-2">
          <div className="hebrew-text text-xl font-medium">מכין את הקובץ...</div>
          <div className="hebrew-text text-sm text-muted-foreground">
            טוען ממשאבים מקומיים (מותאם לביצועים)
          </div>
          {fileSize > 0 && (
            <div className="hebrew-text text-xs text-muted-foreground">
              גודל קובץ: {Math.round(fileSize / 1024)}KB
            </div>
          )}
        </div>
      </div>
    );
  }

  if (error) {
    const isSimpleError = error.includes('שגיאה בטעינת הקובץ');
    
    return (
      <div className="text-center hebrew-text space-y-4 p-8">
        <div className="text-red-600 text-lg font-medium">{error}</div>
        <div className="flex gap-2 justify-center flex-wrap">
          <Button 
            variant="outline" 
            onClick={() => window.open(fileUrl, '_blank')}
            className="hebrew-text"
          >
            פתח בטאב חדש
          </Button>
          {onRetry && !isSimpleError && (
            <Button 
              variant="default" 
              onClick={onRetry}
              className="hebrew-text"
            >
              נסה שוב
            </Button>
          )}
          {isSimpleError && (
            <Button 
              variant="secondary" 
              onClick={() => {
                console.log('Attempting simple load fallback');
                window.open(fileUrl, '_blank');
              }}
              className="hebrew-text text-sm"
            >
              טעינה פשוטה
            </Button>
          )}
        </div>
        <p className="hebrew-text text-xs text-muted-foreground">
          {isSimpleError 
            ? 'קובץ זה דורש טעינה מיוחדת - השתמש ב"טעינה פשוטה" או פתח בטאב חדש'
            : 'אם הבעיה נמשכת, פתח את הקובץ בטאב חדש או הורד אותו למחשב'
          }
        </p>
      </div>
    );
  }

  return (
    <div className="bg-white shadow-lg">
      <Document
        file={fileUrl}
        onLoadSuccess={onDocumentLoadSuccess}
        onLoadError={onDocumentLoadError}
        onLoadProgress={onDocumentLoadProgress}
        loading={null}
        options={{
          // Performance-optimized settings
          verbosity: 0,
          ...optimizedSettings,
          disableFontFace: false,
          // Local-only resources for maximum reliability
          cMapUrl: '',
          cMapPacked: false,
          standardFontDataUrl: '',
          useSystemFonts: true,
          enableXfa: false,
          // Enhanced rendering settings
          renderInteractiveForms: false,
          isEvalSupported: false,
        }}
      >
        <Page
          pageNumber={pageNumber}
          scale={scale}
          onLoadStart={() => {
            const startTime = performance.now();
            console.log(`Loading page ${pageNumber} (size: ${Math.round(fileSize / 1024)}KB) - Start time: ${startTime}`);
            setPageLoading(true);
          }}
          onLoadSuccess={() => {
            const endTime = performance.now();
            console.log(`Page ${pageNumber} loaded successfully - Load time: ${endTime}ms`);
            setPageLoading(false);
          }}
          onLoadError={(error) => {
            console.error('Page load error:', error);
            setPageLoading(false);
          }}
          loading={
            <div className="p-8 text-center hebrew-text flex items-center justify-center min-h-[400px]">
              <div className="space-y-2">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
                <div>טוען עמוד {pageNumber}...</div>
                <div className="text-xs text-muted-foreground">
                  (מותאם לביצועים)
                </div>
              </div>
            </div>
          }
          renderTextLayer={true}
          renderAnnotationLayer={true}
          // Optimized canvas settings
          canvasBackground="white"
        />
      </Document>
    </div>
  );
};

export default PDFViewerContent;

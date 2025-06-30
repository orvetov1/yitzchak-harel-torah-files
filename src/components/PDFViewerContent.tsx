
import React from 'react';
import { Document, Page, pdfjs } from 'react-pdf';
import { Button } from './ui/button';

// Configure PDF.js worker to use local file (copied by Vite plugin)
pdfjs.GlobalWorkerOptions.workerSrc = '/pdf.worker.min.js';
console.log('PDF.js worker configured to use local file (no external CDN)');

interface PDFViewerContentProps {
  fileUrl: string;
  pageNumber: number;
  scale: number;
  loading: boolean;
  error: string | null;
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
  setPageLoading,
  onDocumentLoadSuccess,
  onDocumentLoadError,
  onDocumentLoadProgress,
  onRetry
}: PDFViewerContentProps) => {
  if (loading) {
    return (
      <div className="text-center hebrew-text space-y-4 p-8">
        <div className="animate-spin rounded-full h-16 w-16 border-b-4 border-primary mx-auto"></div>
        <div className="space-y-2">
          <div className="hebrew-text text-xl font-medium">מכין את הקובץ...</div>
          <div className="hebrew-text text-sm text-muted-foreground">
            מעבד עם משאבים מקומיים
          </div>
        </div>
      </div>
    );
  }

  if (error) {
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
          {onRetry && (
            <Button 
              variant="default" 
              onClick={onRetry}
              className="hebrew-text"
            >
              נסה שוב
            </Button>
          )}
        </div>
        <p className="hebrew-text text-xs text-muted-foreground">
          אם הבעיה נמשכת, פתח את הקובץ בטאב חדש או הורד אותו למחשב
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
          // Optimized settings for better performance
          verbosity: 0,
          maxImageSize: 1024 * 1024 * 2, // Reduced from 4MB to 2MB for better performance
          disableFontFace: false,
          disableRange: false,
          disableStream: false,
          // Disable external CDN dependencies for better reliability
          cMapUrl: '',
          cMapPacked: false,
          standardFontDataUrl: '',
          useSystemFonts: true,
          enableXfa: false, // Disable XFA to avoid potential external dependencies
        }}
      >
        <Page
          pageNumber={pageNumber}
          scale={scale}
          onLoadStart={() => {
            console.log(`🔄 Loading page ${pageNumber} with optimized settings`);
            setPageLoading(true);
          }}
          onLoadSuccess={() => {
            console.log(`✅ Page ${pageNumber} loaded successfully`);
            setPageLoading(false);
          }}
          onLoadError={(error) => {
            console.error(`❌ Page ${pageNumber} load error:`, error);
            setPageLoading(false);
          }}
          loading={
            <div className="p-8 text-center hebrew-text flex items-center justify-center min-h-[400px]">
              <div className="space-y-2">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
                <div>טוען עמוד {pageNumber}...</div>
              </div>
            </div>
          }
          renderTextLayer={true}
          renderAnnotationLayer={true}
        />
      </Document>
    </div>
  );
};

export default PDFViewerContent;

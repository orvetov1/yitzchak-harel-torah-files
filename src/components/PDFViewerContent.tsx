
import React from 'react';
import { Document, Page, pdfjs } from 'react-pdf';
import { Button } from './ui/button';

// Enhanced PDF.js worker setup with better error handling
try {
  // Try local worker first
  pdfjs.GlobalWorkerOptions.workerSrc = '/pdf.worker.min.js';
  console.log('PDF.js worker set to local file');
} catch (error) {
  console.warn('Failed to set local PDF worker, using CDN:', error);
  // Fallback to CDN with exact version match
  pdfjs.GlobalWorkerOptions.workerSrc = `https://cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjs.version}/pdf.worker.min.js`;
}

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
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
        <div className="space-y-2">
          <div className="hebrew-text text-lg font-medium">מכין את הקובץ לקריאה...</div>
          <div className="hebrew-text text-sm text-muted-foreground">
            אנא המתינו, הקובץ נטען ומעובד
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
          אם הבעיה נמשכת, נסה להוריד את הקובץ ולפתוח אותו במחשב שלך
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
          // Enhanced options for better PDF support
          cMapUrl: `https://cdn.jsdelivr.net/npm/pdfjs-dist@${pdfjs.version}/cmaps/`,
          cMapPacked: true,
          standardFontDataUrl: `https://cdn.jsdelivr.net/npm/pdfjs-dist@${pdfjs.version}/standard_fonts/`,
          // Support for encrypted/protected PDFs
          useSystemFonts: true,
          // Better handling of various PDF types
          verbosity: 0, // Reduce console noise
          maxImageSize: 1024 * 1024 * 16, // 16MB max image size
          disableFontFace: false,
          disableRange: false,
          disableStream: false,
        }}
      >
        <Page
          pageNumber={pageNumber}
          scale={scale}
          onLoadStart={() => setPageLoading(true)}
          onLoadSuccess={() => setPageLoading(false)}
          onLoadError={(error) => {
            console.error('Page load error:', error);
            setPageLoading(false);
          }}
          loading={
            <div className="p-8 text-center hebrew-text flex items-center justify-center min-h-[400px]">
              <div className="space-y-2">
                <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary mx-auto"></div>
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

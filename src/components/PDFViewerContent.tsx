
import React from 'react';
import { Document, Page, pdfjs } from 'react-pdf';
import { Button } from './ui/button';

// Set up PDF.js worker with fallback
try {
  pdfjs.GlobalWorkerOptions.workerSrc = '/pdf.worker.min.js';
} catch {
  pdfjs.GlobalWorkerOptions.workerSrc = `//cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjs.version}/pdf.worker.min.js`;
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
  onDocumentLoadProgress
}: PDFViewerContentProps) => {
  if (loading) {
    return (
      <div className="text-center hebrew-text space-y-4">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
        <div className="space-y-2">
          <div className="hebrew-text text-lg font-medium">טוען קובץ PDF...</div>
          <div className="hebrew-text text-sm text-muted-foreground">
            אנא המתינו, הקובץ נטען
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center hebrew-text space-y-4">
        <div className="text-red-600 text-lg font-medium">{error}</div>
        <Button 
          variant="outline" 
          onClick={() => window.open(fileUrl, '_blank')}
          className="hebrew-text"
        >
          פתח בטאב חדש
        </Button>
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
      >
        <Page
          pageNumber={pageNumber}
          scale={scale}
          onLoadStart={() => setPageLoading(true)}
          onLoadSuccess={() => setPageLoading(false)}
          onLoadError={() => setPageLoading(false)}
          loading={
            <div className="p-8 text-center hebrew-text flex items-center justify-center min-h-[400px]">
              <div className="space-y-2">
                <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary mx-auto"></div>
                <div>טוען עמוד {pageNumber}...</div>
              </div>
            </div>
          }
        />
      </Document>
    </div>
  );
};

export default PDFViewerContent;

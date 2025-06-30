
import React from 'react';
import { Document, Page, pdfjs } from 'react-pdf';
import { Button } from './ui/button';
import { usePDFComplexity } from '../hooks/usePDFComplexity';

// Configure PDF.js worker to use local file (copied by Vite plugin)
pdfjs.GlobalWorkerOptions.workerSrc = '/pdf.worker.min.js';
console.log('PDF.js worker configured to use local file (no external CDN)');

interface PDFViewerContentProps {
  fileUrl: string;
  fileSize: number;
  pageNumber: number;
  scale: number;
  loading: boolean;
  error: string | null;
  setPageLoading: (loading: boolean) => void;
  onDocumentLoadSuccess: ({ numPages }: { numPages: number }) => void;
  onDocumentLoadError: (error: Error) => void;
  onDocumentLoadProgress: ({ loaded, total }: { loaded: number; total: number }) => void;
  onRetry?: () => void;
  onProcessingStart?: () => void;
}

const PDFViewerContent = ({
  fileUrl,
  fileSize,
  pageNumber,
  scale,
  loading,
  error,
  setPageLoading,
  onDocumentLoadSuccess,
  onDocumentLoadError,
  onDocumentLoadProgress,
  onRetry,
  onProcessingStart
}: PDFViewerContentProps) => {
  const { analyzeComplexity, getOptimizedSettings } = usePDFComplexity();

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

  // Analyze PDF complexity and get optimized settings
  const complexity = analyzeComplexity(fileSize);
  const optimizedOptions = getOptimizedSettings(complexity);

  return (
    <div className="bg-white shadow-lg">
      <Document
        file={fileUrl}
        onLoadSuccess={(pdf) => {
          console.log('📄 PDF Document loaded successfully');
          onDocumentLoadSuccess({ numPages: pdf.numPages });
        }}
        onLoadError={(error) => {
          console.error('❌ PDF Document load error (Full object):', error);
          console.error('❌ Error message:', error.message);
          console.error('❌ Error name:', error.name);
          onDocumentLoadError(error);
        }}
        onLoadProgress={onDocumentLoadProgress}
        loading={null}
        options={optimizedOptions}
        onSourceSuccess={() => {
          console.log('📥 PDF source loaded, starting processing...');
          onProcessingStart?.();
        }}
      >
        <Page
          pageNumber={pageNumber}
          scale={scale}
          onLoadStart={() => {
            console.log(`🔄 Loading page ${pageNumber} with ${complexity.estimatedComplexity} complexity settings`);
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
          renderTextLayer={complexity.estimatedComplexity !== 'complex'}
          renderAnnotationLayer={complexity.estimatedComplexity === 'simple'}
        />
      </Document>
    </div>
  );
};

export default PDFViewerContent;


import React from 'react';
import { Document, Page, pdfjs } from 'react-pdf';
import { Button } from './ui/button';
import { Download, RefreshCw, ExternalLink } from 'lucide-react';
import { usePDFComplexity } from '../hooks/usePDFComplexity';

// Configure PDF.js worker with correct version matching
pdfjs.GlobalWorkerOptions.workerSrc = `//unpkg.com/pdfjs-dist@${pdfjs.version}/build/pdf.worker.min.js`;

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

  const handleDownload = async () => {
    try {
      const response = await fetch(fileUrl);
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `document.pdf`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Download failed:', error);
      window.open(fileUrl, '_blank');
    }
  };

  if (loading) {
    return (
      <div className="text-center hebrew-text space-y-4 p-8">
        <div className="animate-spin rounded-full h-16 w-16 border-b-4 border-primary mx-auto"></div>
        <div className="space-y-2">
          <div className="hebrew-text text-xl font-medium">מכין את הקובץ...</div>
          <div className="hebrew-text text-sm text-muted-foreground">
            עיבוד Canvas במקום plugins
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center hebrew-text space-y-6 p-8 max-w-md mx-auto">
        <div className="space-y-3">
          <div className="text-red-600 text-lg font-medium">{error}</div>
          <div className="text-sm text-muted-foreground">
            הקובץ עלול להיות פגום, גדול מדי, או שיש בעיה בחיבור האינטרנט
          </div>
        </div>
        
        <div className="bg-accent/20 border border-accent rounded-lg p-4">
          <div className="hebrew-text text-sm font-medium mb-3">אפשרויות לפתרון:</div>
          <div className="flex flex-col gap-2">
            <Button 
              variant="default" 
              onClick={handleDownload}
              className="hebrew-text"
            >
              <Download size={16} className="ml-2" />
              הורד קובץ למחשב
            </Button>
            <Button 
              variant="outline" 
              onClick={() => window.open(fileUrl, '_blank')}
              className="hebrew-text"
            >
              <ExternalLink size={16} className="ml-2" />
              פתח בטאב חדש
            </Button>
            {onRetry && (
              <Button 
                variant="outline" 
                onClick={onRetry}
                className="hebrew-text"
              >
                <RefreshCw size={16} className="ml-2" />
                נסה שוב
              </Button>
            )}
          </div>
        </div>
        
        <div className="text-xs text-muted-foreground">
          אם הבעיה נמשכת, נסה להוריד את הקובץ ולפתוח אותו ביישום PDF במחשב
        </div>
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
          console.log('📄 PDF Document loaded successfully with Canvas rendering');
          onDocumentLoadSuccess({ numPages: pdf.numPages });
        }}
        onLoadError={(error) => {
          console.error('❌ PDF Document load error (Canvas rendering):', error);
          console.error('❌ Error message:', error.message);
          console.error('❌ Error name:', error.name);
          onDocumentLoadError(error);
        }}
        onLoadProgress={onDocumentLoadProgress}
        loading={null}
        options={optimizedOptions}
        onSourceSuccess={() => {
          console.log('📥 PDF source loaded for Canvas rendering, starting processing...');
          onProcessingStart?.();
        }}
      >
        <Page
          pageNumber={pageNumber}
          scale={scale}
          onLoadStart={() => {
            console.log(`🔄 Loading page ${pageNumber} with Canvas rendering (${complexity.estimatedComplexity} complexity)`);
            setPageLoading(true);
          }}
          onLoadSuccess={() => {
            console.log(`✅ Page ${pageNumber} loaded successfully with Canvas rendering`);
            setPageLoading(false);
          }}
          onLoadError={(error) => {
            console.error(`❌ Page ${pageNumber} Canvas rendering error:`, error);
            setPageLoading(false);
          }}
          loading={
            <div className="p-8 text-center hebrew-text flex items-center justify-center min-h-[400px]">
              <div className="space-y-2">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
                <div>מעבד עמוד {pageNumber} ב-Canvas...</div>
              </div>
            </div>
          }
          renderTextLayer={false}
          renderAnnotationLayer={false}
          className="mx-auto"
        />
      </Document>
    </div>
  );
};

export default PDFViewerContent;

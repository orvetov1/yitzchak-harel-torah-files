
import React from 'react';
import { Document, Page, pdfjs } from 'react-pdf';
import { Button } from './ui/button';
import { ExternalLink, Download, RefreshCw } from 'lucide-react';
import { usePDFComplexity } from '../hooks/usePDFComplexity';
import { FallbackStrategy } from '../hooks/usePDFFallback';

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
  fallbackSuggestion?: FallbackStrategy | null;
  onFallback?: (strategy: FallbackStrategy) => void;
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
  onProcessingStart,
  fallbackSuggestion,
  onFallback
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
      <div className="text-center hebrew-text space-y-4 p-8 max-w-md mx-auto">
        <div className="text-red-600 text-lg font-medium">{error}</div>
        
        {/* Primary action buttons */}
        <div className="flex gap-2 justify-center flex-wrap">
          {onRetry && (
            <Button 
              variant="default" 
              onClick={onRetry}
              className="hebrew-text"
            >
              <RefreshCw size={16} />
              נסה שוב
            </Button>
          )}
          <Button 
            variant="outline" 
            onClick={() => window.open(fileUrl, '_blank')}
            className="hebrew-text"
          >
            <ExternalLink size={16} />
            פתח בטאב חדש
          </Button>
        </div>

        {/* Fallback suggestions */}
        {fallbackSuggestion && onFallback && (
          <div className="mt-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
            <p className="hebrew-text text-sm font-medium text-blue-800 mb-3">
              אפשרויות מומלצות לפתרון הבעיה:
            </p>
            <div className="space-y-2">
              {fallbackSuggestion === 'simple-load' && (
                <div className="space-y-2">
                  <Button 
                    variant="outline" 
                    onClick={() => onFallback('simple-load')}
                    className="hebrew-text w-full bg-white"
                    size="sm"
                  >
                    <RefreshCw size={14} />
                    טען במצב פשוט (ללא אלמנטים מורכבים)
                  </Button>
                  <p className="hebrew-text text-xs text-blue-600">
                    מומלץ לקבצים עם גרפיקה מורכבת או בעיות רינדור
                  </p>
                </div>
              )}
              
              {fallbackSuggestion === 'new-tab' && (
                <div className="space-y-2">
                  <Button 
                    variant="outline" 
                    onClick={() => onFallback('new-tab')}
                    className="hebrew-text w-full bg-white"
                    size="sm"
                  >
                    <ExternalLink size={14} />
                    פתח בטאב חדש
                  </Button>
                  <p className="hebrew-text text-xs text-blue-600">
                    מומלץ לבעיות רשת או קבצים גדולים
                  </p>
                </div>
              )}
              
              {fallbackSuggestion === 'download-only' && (
                <div className="space-y-2">
                  <Button 
                    variant="outline" 
                    onClick={() => onFallback('download-only')}
                    className="hebrew-text w-full bg-white"
                    size="sm"
                  >
                    <Download size={14} />
                    הורד לצפייה במחשב
                  </Button>
                  <p className="hebrew-text text-xs text-blue-600">
                    מומלץ לקבצים מוגנים או עם בעיות תאימות
                  </p>
                </div>
              )}
            </div>
          </div>
        )}

        <p className="hebrew-text text-xs text-muted-foreground mt-4">
          אם הבעיה נמשכת, נסה להוריד את הקובץ ולפתוח אותו במחשב
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
          console.error('❌ Error stack:', error.stack);
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

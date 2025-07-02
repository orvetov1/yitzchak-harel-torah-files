
import React from 'react';
import PDFErrorBoundary from './PDFErrorBoundary';
import PDFProgressiveLoader from './PDFProgressiveLoader';
import PDFImageRenderer from './renderers/PDFImageRenderer';
import PDFDocumentRenderer from './renderers/PDFDocumentRenderer';
import PDFPageHeader from './renderers/PDFPageHeader';
import { Button } from '../ui/button';
import { RefreshCw, AlertTriangle, Download, Settings, FileX } from 'lucide-react';
import { getPDFWorkerStatus, isPDFWorkerReady, resetPDFWorker, getPDFWorkerDiagnostics, initializePDFWorkerIfNeeded } from '../../utils/pdfWorkerLoader';

interface VirtualPDFPageRendererProps {
  pageNumber: number;
  pageUrl: string | null;
  scale: number;
  totalPages: number;
  isCurrentPage: boolean;
  isPageLoading: boolean;
  isPageLoaded: boolean;
  isPageError: boolean;
  onLoadPage: () => void;
}

const VirtualPDFPageRenderer = ({
  pageNumber,
  scale,
  totalPages,
  isCurrentPage,
  isPageLoading,
  isPageLoaded,
  isPageError,
  onLoadPage,
  pageUrl
}: VirtualPDFPageRendererProps) => {
  
  // Check if the URL points to an image file
  const isImageFile = (url: string) => {
    return /\.(png|jpg|jpeg|gif|webp)(\?|$)/i.test(url);
  };

  // Get worker status with better checking
  const isWorkerAvailable = isPDFWorkerReady();
  const workerStatus = getPDFWorkerStatus();

  console.log(`🔍 VirtualPDFPageRenderer - Page ${pageNumber}:`, {
    pageUrl: pageUrl ? `Available (${pageUrl.substring(0, 50)}...)` : 'null',
    isCurrentPage,
    isPageLoading,
    isPageLoaded,
    isPageError,
    workerStatus,
    isWorkerAvailable
  });

  // Enhanced render mode logic
  const getRenderMode = (url: string | null) => {
    if (!url) return 'fallback';
    if (isImageFile(url)) return 'image';
    
    // Check if it's a PDF file
    const isPdfFile = /\.pdf(\?|$)/i.test(url);
    if (isPdfFile) {
      return isWorkerAvailable ? 'pdf' : 'worker_not_ready';
    }
    
    return isWorkerAvailable ? 'pdf' : 'image';
  };

  const renderMode = getRenderMode(pageUrl);

  // Handle worker retry with initialization
  const handleWorkerRetry = async () => {
    console.log('🔄 Attempting to initialize/reset PDF Worker...');
    try {
      // First try to initialize if needed
      const initialized = await initializePDFWorkerIfNeeded();
      if (!initialized) {
        // If initialization failed, try reset
        await resetPDFWorker();
      }
      // Wait a moment for the worker to be ready
      setTimeout(() => {
        onLoadPage();
      }, 1000);
    } catch (error) {
      console.error('❌ Worker retry failed:', error);
      // Still try to reload the page
      onLoadPage();
    }
  };

  // Handle direct download
  const handleDirectDownload = () => {
    if (pageUrl) {
      window.open(pageUrl, '_blank');
    }
  };

  // Show error state
  if (isPageError) {
    return (
      <div className="mb-6">
        <div className="bg-white p-2 rounded-lg shadow-lg">
          <PDFPageHeader
            pageNumber={pageNumber}
            totalPages={totalPages}
            pageUrl={pageUrl}
            isCurrentPage={isCurrentPage}
          />
          
          <div className="flex items-center justify-center h-96 hebrew-text bg-red-50 border border-red-200 rounded-lg">
            <div className="text-center space-y-4 max-w-md p-6">
              <AlertTriangle size={48} className="mx-auto text-red-600" />
              <div className="text-red-600 text-lg font-medium">שגיאה בטעינת עמוד {pageNumber}</div>
              <div className="text-sm text-red-500">
                העמוד לא נמצא או שאירעה שגיאה בטעינה
              </div>
              <Button
                onClick={onLoadPage}
                variant="outline"
                className="hebrew-text"
              >
                <RefreshCw size={16} className="ml-2" />
                נסה שוב
              </Button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Show worker not ready state
  if (renderMode === 'worker_not_ready') {
    const diagnostics = getPDFWorkerDiagnostics();
    const isCorruptedFile = diagnostics.errors.some(error => 
      error.includes('corrupted') || 
      error.includes('incomplete') || 
      error.includes('empty') ||
      error.includes('too small')
    );
    
    return (
      <div className="mb-6">
        <div className="bg-white p-2 rounded-lg shadow-lg">
          <PDFPageHeader
            pageNumber={pageNumber}
            totalPages={totalPages}
            pageUrl={pageUrl}
            isCurrentPage={isCurrentPage}
          />
          
          <div className="flex items-center justify-center h-96 hebrew-text bg-amber-50 border border-amber-200 rounded-lg">
            <div className="text-center space-y-4 max-w-lg p-6">
              {isCorruptedFile ? (
                <>
                  <FileX size={48} className="mx-auto text-red-600" />
                  <div className="text-red-700 text-lg font-medium">קובץ מנוע ה-PDF פגום</div>
                  <div className="text-sm text-red-600">
                    קובץ המנוע (pdf.worker.mjs) חסר או פגום. זה מונע מהמערכת לעבד קבצי PDF.
                  </div>
                </>
              ) : (
                <>
                  <Settings size={48} className="mx-auto text-amber-600" />
                  <div className="text-amber-700 text-lg font-medium">מנוע ה-PDF לא מוכן</div>
                  <div className="text-sm text-amber-600">
                    יש בעיה באתחול מנוע ה-PDF. מנסה לאתחל אוטומטית...
                  </div>
                </>
              )}
              
              <div className="bg-gray-100 p-3 rounded border text-xs text-gray-700 font-mono">
                <div className="font-medium mb-2">מידע טכני:</div>
                <div>מצב Worker: {workerStatus}</div>
                <div>שגיאות: {diagnostics.errors.length}</div>
                <div>ניסיונות: {diagnostics.attempts}</div>
                {diagnostics.fileSize && (
                  <div>גודל קובץ: {Math.round(diagnostics.fileSize / 1024)}KB</div>
                )}
                {diagnostics.lastError && (
                  <div className="mt-2 text-red-600 break-words">
                    שגיאה אחרונה: {diagnostics.lastError}
                  </div>
                )}
              </div>
              
              <div className="flex flex-col gap-2">
                <Button
                  onClick={handleWorkerRetry}
                  className="hebrew-text"
                >
                  <RefreshCw size={16} className="ml-2" />
                  {isCorruptedFile ? 'נסה בכל זאת' : 'אתחל מנוע PDF'}
                </Button>
                
                <Button
                  onClick={handleDirectDownload}
                  variant="outline"
                  className="hebrew-text"
                >
                  <Download size={16} className="ml-2" />
                  פתח קובץ בטאב חדש
                </Button>
              </div>
              
              <div className="text-xs text-muted-foreground">
                {isCorruptedFile 
                  ? 'בעיה זו דורשת תיקון על ידי מפתח האתר'
                  : 'אם הבעיה נמשכת, נסה לרענן את הדף או להוריד את הקובץ'
                }
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Show loading state
  if (isPageLoading || !isPageLoaded) {
    return (
      <div className="mb-6">
        <div className="bg-white p-2 rounded-lg shadow-lg">
          <PDFPageHeader
            pageNumber={pageNumber}
            totalPages={totalPages}
            pageUrl={pageUrl}
            isCurrentPage={isCurrentPage}
          />
          
          <div className="flex items-center justify-center h-96 hebrew-text bg-gray-50 border border-gray-200 rounded-lg">
            <div className="text-center space-y-4 max-w-md p-6">
              {isPageLoading ? (
                <>
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
                  <div className="text-muted-foreground">טוען עמוד {pageNumber}...</div>
                </>
              ) : (
                <>
                  <div className="text-muted-foreground text-lg">עמוד {pageNumber}</div>
                  <div className="text-sm text-muted-foreground">
                    העמוד עדיין לא נטען
                  </div>
                  <Button
                    onClick={onLoadPage}
                    variant="outline"
                    className="hebrew-text"
                  >
                    טען עמוד
                  </Button>
                </>
              )}
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Show loaded page
  if (pageUrl && isPageLoaded) {
    return (
      <div className="mb-6">
        <div className="bg-white p-2 rounded-lg shadow-lg">
          <PDFPageHeader
            pageNumber={pageNumber}
            totalPages={totalPages}
            pageUrl={pageUrl}
            isCurrentPage={isCurrentPage}
          />
          
          <PDFErrorBoundary 
            pageNumber={pageNumber} 
            pdfUrl={pageUrl}
            onRetry={onLoadPage}
          >
            <PDFProgressiveLoader
              pageNumber={pageNumber}
              pageUrl={pageUrl}
              isLoading={false}
              onRetry={onLoadPage}
              renderMode={renderMode}
            >
              {renderMode === 'image' ? (
                <PDFImageRenderer
                  pageNumber={pageNumber}
                  pageUrl={pageUrl}
                  scale={scale}
                />
              ) : renderMode === 'pdf' ? (
                <PDFDocumentRenderer
                  pageNumber={pageNumber}
                  pageUrl={pageUrl}
                  scale={scale}
                />
              ) : (
                <div className="flex items-center justify-center h-96 hebrew-text bg-gray-50 border border-gray-200 rounded-lg">
                  <div className="text-center space-y-4 max-w-md p-6">
                    <div className="text-muted-foreground text-lg">עמוד {pageNumber} לא זמין</div>
                    <div className="text-xs text-muted-foreground bg-yellow-50 p-3 rounded border">
                      <div className="font-medium mb-1">מידע טכני:</div>
                      <div>מצב Worker: {workerStatus}</div>
                    </div>
                    <Button
                      onClick={onLoadPage}
                      variant="outline"
                      className="hebrew-text"
                    >
                      נסה לטעון שוב
                    </Button>
                  </div>
                </div>
              )}
            </PDFProgressiveLoader>
          </PDFErrorBoundary>
        </div>
      </div>
    );
  }

  // Fallback - should not reach here
  return (
    <div className="mb-6">
      <div className="bg-white p-2 rounded-lg shadow-lg">
        <PDFPageHeader
          pageNumber={pageNumber}
          totalPages={totalPages}
          pageUrl={pageUrl}
          isCurrentPage={isCurrentPage}
        />
        
        <div className="flex items-center justify-center h-96 hebrew-text bg-gray-50 border border-gray-200 rounded-lg">
          <div className="text-center space-y-4 max-w-md p-6">
            <div className="text-muted-foreground text-lg">עמוד {pageNumber}</div>
            <div className="text-sm text-muted-foreground">
              מצב לא ידוע
            </div>
            <Button
              onClick={onLoadPage}
              variant="outline"
              className="hebrew-text"
            >
              נסה לטעון
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default VirtualPDFPageRenderer;

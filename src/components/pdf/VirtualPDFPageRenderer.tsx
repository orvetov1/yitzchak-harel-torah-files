
import React from 'react';
import PDFErrorBoundary from './PDFErrorBoundary';
import PDFProgressiveLoader from './PDFProgressiveLoader';
import PDFImageRenderer from './renderers/PDFImageRenderer';
import PDFDocumentRenderer from './renderers/PDFDocumentRenderer';
import PDFPageHeader from './renderers/PDFPageHeader';
import { Button } from '../ui/button';
import { RefreshCw, AlertTriangle } from 'lucide-react';
import { getPDFWorkerStatus, isPDFWorkerReady, initializePDFWorkerIfNeeded } from '../../utils/pdfWorkerLoader';

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
  pageUrl,
  scale,
  totalPages,
  isCurrentPage,
  isPageLoading,
  isPageLoaded,
  isPageError,
  onLoadPage
}: VirtualPDFPageRendererProps) => {
  
  // Check if the URL points to an image file
  const isImageFile = (url: string) => {
    return /\.(png|jpg|jpeg|gif|webp)(\?|$)/i.test(url);
  };

  // Get worker status
  const isWorkerAvailable = isPDFWorkerReady();
  const workerStatus = getPDFWorkerStatus();

  // Enhanced render mode logic
  const getRenderMode = (url: string | null) => {
    if (!url) return 'fallback';
    if (isImageFile(url)) return 'image';
    return isWorkerAvailable ? 'pdf' : 'image';
  };

  const renderMode = getRenderMode(pageUrl);

  console.log(`🔍 VirtualPDFPageRenderer - Page ${pageNumber}:`, {
    pageUrl: pageUrl ? `Available` : 'null',
    renderMode,
    isCurrentPage,
    isPageLoading,
    isPageLoaded,
    isPageError,
    workerStatus
  });

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


import React from 'react';
import PDFErrorBoundary from './PDFErrorBoundary';
import PDFProgressiveLoader from './PDFProgressiveLoader';
import PDFImageRenderer from './renderers/PDFImageRenderer';
import PDFDocumentRenderer from './renderers/PDFDocumentRenderer';
import PDFPageHeader from './renderers/PDFPageHeader';
import PDFWorkerManager from '../../utils/pdfWorkerConfig';
import { getPDFWorkerStatus, isPDFWorkerReady, initializePDFWorkerIfNeeded } from '../../utils/pdfWorkerLoader';

interface VirtualPDFPageRendererProps {
  pageNumber: number;
  pageUrl: string | null;
  scale: number;
  totalPages: number;
  isCurrentPage: boolean;
  isPageLoading: boolean;
  onLoadPage: (pageNumber: number) => void;
}

const VirtualPDFPageRenderer = ({
  pageNumber,
  pageUrl,
  scale,
  totalPages,
  isCurrentPage,
  isPageLoading,
  onLoadPage
}: VirtualPDFPageRendererProps) => {
  
  // Check if the URL points to an image file
  const isImageFile = (url: string) => {
    return /\.(png|jpg|jpeg|gif|webp)(\?|$)/i.test(url);
  };

  // Get worker status
  const workerManager = PDFWorkerManager.getInstance();
  const isWorkerAvailable = isPDFWorkerReady();
  const workerStatus = getPDFWorkerStatus();

  // Enhanced render mode logic with lazy worker initialization
  const getRenderMode = async (url: string | null) => {
    if (!url) {
      console.log(`📄 Page ${pageNumber}: No URL available, using fallback mode`);
      return 'fallback';
    }
    
    // Always use image renderer for image files
    if (isImageFile(url)) {
      console.log(`🖼️ Page ${pageNumber}: Detected image file, using Image Renderer`);
      return 'image';
    }
    
    // For PDF files, initialize worker if needed
    if (!isWorkerAvailable) {
      console.log(`📄 Page ${pageNumber}: PDF Worker not ready, attempting initialization...`);
      const initialized = await initializePDFWorkerIfNeeded();
      
      if (!initialized) {
        console.log(`📄 Page ${pageNumber}: PDF Worker initialization failed, using Image Renderer as fallback`);
        return 'image';
      }
    }
    
    console.log(`📄 Page ${pageNumber}: PDF Worker ready, using PDF Document Renderer`);
    return 'pdf';
  };

  // Use synchronous render mode determination for initial render
  const getInitialRenderMode = (url: string | null) => {
    if (!url) return 'fallback';
    if (isImageFile(url)) return 'image';
    return isWorkerAvailable ? 'pdf' : 'image';
  };

  const initialRenderMode = getInitialRenderMode(pageUrl);

  // Enhanced logging for debugging
  console.log(`🔍 VirtualPDFPageRenderer - Page ${pageNumber}:`, {
    pageUrl: pageUrl ? `Available (${pageUrl.substring(0, 50)}...)` : 'null',
    initialRenderMode,
    isCurrentPage,
    isPageLoading,
    workerStatus,
    workerDiagnostics: {
      initialized: isWorkerAvailable,
      errors: workerManager.getDiagnostics().errors.slice(-2)
    }
  });

  return (
    <div 
      key={pageNumber}
      className="mb-6"
    >
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
          onRetry={() => onLoadPage(pageNumber)}
        >
          <PDFProgressiveLoader
            pageNumber={pageNumber}
            pageUrl={pageUrl}
            isLoading={isPageLoading}
            onRetry={() => onLoadPage(pageNumber)}
            renderMode={initialRenderMode}
          >
            {pageUrl && !isPageLoading && (
              <>
                {initialRenderMode === 'image' ? (
                  <PDFImageRenderer
                    pageNumber={pageNumber}
                    pageUrl={pageUrl}
                    scale={scale}
                  />
                ) : initialRenderMode === 'pdf' ? (
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
                        {workerManager.getDiagnostics().errors.length > 0 && (
                          <div className="mt-2 text-red-600">
                            שגיאה אחרונה: {workerManager.getDiagnostics().errors.slice(-1)[0]}
                          </div>
                        )}
                      </div>
                      <button
                        onClick={() => onLoadPage(pageNumber)}
                        className="px-4 py-2 bg-primary text-primary-foreground rounded-md hover:bg-primary/90 transition-colors"
                      >
                        נסה לטעון שוב
                      </button>
                    </div>
                  </div>
                )}
              </>
            )}
          </PDFProgressiveLoader>
        </PDFErrorBoundary>
      </div>
    </div>
  );
};

export default VirtualPDFPageRenderer;

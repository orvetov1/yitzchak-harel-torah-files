
import React from 'react';
import PDFErrorBoundary from './PDFErrorBoundary';
import PDFProgressiveLoader from './PDFProgressiveLoader';
import PDFImageRenderer from './renderers/PDFImageRenderer';
import PDFDocumentRenderer from './renderers/PDFDocumentRenderer';
import PDFPageHeader from './renderers/PDFPageHeader';
import PDFWorkerManager from '../../utils/pdfWorkerConfig';
import '../../utils/pdfWorkerLoader';

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

  // Get worker status for better fallback decisions
  const workerManager = PDFWorkerManager.getInstance();
  const isWorkerAvailable = workerManager.isInitialized();
  const isFallbackMode = workerManager.isFallbackMode();

  // Enhanced render mode logic
  const getRenderMode = (url: string | null) => {
    if (!url) return 'fallback';
    
    // Always use image renderer for image files
    if (isImageFile(url)) {
      console.log(`🖼️ Page ${pageNumber}: Detected image file, using Image Renderer`);
      return 'image';
    }
    
    // For PDF files, check worker availability
    if (!isWorkerAvailable || isFallbackMode) {
      console.log(`📄 Page ${pageNumber}: PDF Worker not available (initialized: ${isWorkerAvailable}, fallback: ${isFallbackMode}), trying Image Renderer as fallback`);
      return 'image'; // Try image renderer as fallback for PDFs too
    }
    
    console.log(`📄 Page ${pageNumber}: PDF Worker available, using PDF Document Renderer`);
    return 'pdf';
  };

  const renderMode = getRenderMode(pageUrl);

  // Enhanced logging
  console.log(`🔍 VirtualPDFPageRenderer - Page ${pageNumber}:`, {
    pageUrl: pageUrl ? 'available' : 'null',
    renderMode,
    isCurrentPage,
    isPageLoading,
    workerStatus: {
      initialized: isWorkerAvailable,
      fallbackMode: isFallbackMode,
      diagnostics: workerManager.getDiagnostics()
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
            renderMode={renderMode}
          >
            {pageUrl && !isPageLoading && (
              <>
                {renderMode === 'image' ? (
                  <PDFImageRenderer
                    pageNumber={pageNumber}
                    pageUrl={pageUrl}
                    scale={scale}
                  />
                ) : (
                  <PDFDocumentRenderer
                    pageNumber={pageNumber}
                    pageUrl={pageUrl}
                    scale={scale}
                  />
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

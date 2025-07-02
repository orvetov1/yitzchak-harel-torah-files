
import React from 'react';
import PDFErrorBoundary from './PDFErrorBoundary';
import PDFProgressiveLoader from './PDFProgressiveLoader';
import PDFImageRenderer from './renderers/PDFImageRenderer';
import PDFDocumentRenderer from './renderers/PDFDocumentRenderer';
import PDFPageHeader from './renderers/PDFPageHeader';
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

  const renderMode = pageUrl ? (isImageFile(pageUrl) ? 'image' : 'pdf') : 'fallback';

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

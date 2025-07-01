
import React, { useState, useEffect } from 'react';
import { Button } from './ui/button';
import { usePDFLazyLoader } from '../hooks/usePDFLazyLoader';
import PDFViewerControlsBar from './PDFViewerControlsBar';
import SimplePDFRenderer from './SimplePDFRenderer';

interface VirtualPDFViewerProps {
  pdfFileId: string;
  onClose: () => void;
}

const VirtualPDFViewer = ({ pdfFileId, onClose }: VirtualPDFViewerProps) => {
  const [scale, setScale] = useState(1.0);
  const [visiblePages, setVisiblePages] = useState<number[]>([1]);

  console.log(`🚀 VirtualPDFViewer initialized with pdfFileId: ${pdfFileId}`);

  const {
    loadedPages,
    currentPage,
    totalPages,
    isLoading,
    error,
    goToPage,
    getPageUrl,
    isPageLoaded,
    isPageLoading
  } = usePDFLazyLoader(pdfFileId, {
    preloadDistance: 2,
    maxCachedPages: 15,
    useVirtualScrolling: true
  });

  // Update visible pages when current page changes
  useEffect(() => {
    console.log(`📄 Current page changed to: ${currentPage}, total: ${totalPages}`);
    if (currentPage > 0) {
      // Show current page and 1 page before/after
      const start = Math.max(1, currentPage - 1);
      const end = Math.min(totalPages, currentPage + 1);
      const pages = [];
      for (let i = start; i <= end; i++) {
        pages.push(i);
      }
      setVisiblePages(pages);
      console.log(`👀 Visible pages updated: ${pages.join(', ')}`);
    }
  }, [currentPage, totalPages]);

  const goToPrevPage = () => {
    const newPage = Math.max(1, currentPage - 1);
    console.log(`⬅️ Going to previous page: ${newPage}`);
    goToPage(newPage);
  };

  const goToNextPage = () => {
    const newPage = Math.min(totalPages, currentPage + 1);
    console.log(`➡️ Going to next page: ${newPage}`);
    goToPage(newPage);
  };

  const zoomIn = () => setScale(prev => Math.min(3.0, prev + 0.2));
  const zoomOut = () => setScale(prev => Math.max(0.5, prev - 0.2));

  console.log(`📊 VirtualPDFViewer state: currentPage=${currentPage}, totalPages=${totalPages}, loadedPages=${loadedPages.size}, isLoading=${isLoading}`);

  if (error) {
    return (
      <div className="flex flex-col h-full items-center justify-center text-center hebrew-text p-8">
        <div className="text-red-600 mb-4 text-lg">{error}</div>
        <Button onClick={onClose} className="hebrew-text">סגור</Button>
      </div>
    );
  }

  if (isLoading && totalPages === 0) {
    return (
      <div className="flex flex-col h-full items-center justify-center text-center hebrew-text p-8">
        <div className="animate-spin rounded-full h-16 w-16 border-b-4 border-primary mx-auto mb-4"></div>
        <div>מכין את הקובץ...</div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full">
      <PDFViewerControlsBar
        currentPage={currentPage}
        totalPages={totalPages}
        scale={scale}
        onPrevPage={goToPrevPage}
        onNextPage={goToNextPage}
        onZoomIn={zoomIn}
        onZoomOut={zoomOut}
        onPageChange={goToPage}
      />

      <div className="flex-1 overflow-auto bg-gray-100 p-4">
        <div className="max-w-4xl mx-auto space-y-6">
          {visiblePages.map(pageNumber => {
            const pageUrl = getPageUrl(pageNumber);
            const isCurrentPage = pageNumber === currentPage;
            
            console.log(`🔍 Rendering page ${pageNumber}: loaded=${isPageLoaded(pageNumber)}, loading=${isPageLoading(pageNumber)}, url=${pageUrl}, isCurrent=${isCurrentPage}`);
            
            return (
              <div 
                key={pageNumber}
                className={`mb-6 ${isCurrentPage ? 'ring-2 ring-blue-500' : ''}`}
              >
                <div className="bg-white p-2 rounded-lg shadow-lg">
                  <div className="text-center hebrew-text text-sm text-gray-600 mb-2">
                    עמוד {pageNumber} מתוך {totalPages}
                  </div>
                  
                  {isPageLoading(pageNumber) && (
                    <div className="flex items-center justify-center h-96 hebrew-text">
                      <div className="text-center space-y-2">
                        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
                        <div>טוען עמוד {pageNumber}...</div>
                      </div>
                    </div>
                  )}
                  
                  {pageUrl && !isPageLoading(pageNumber) && (
                    <SimplePDFRenderer
                      pdfUrl={pageUrl}
                      scale={scale}
                      onLoadSuccess={() => console.log(`✅ Page ${pageNumber} rendered successfully`)}
                      onLoadError={(error) => console.error(`❌ Page ${pageNumber} render error:`, error)}
                      className="w-full"
                    />
                  )}
                  
                  {!pageUrl && !isPageLoading(pageNumber) && (
                    <div className="flex items-center justify-center h-96 hebrew-text">
                      <div className="text-center space-y-2">
                        <div className="text-muted-foreground">עמוד {pageNumber}</div>
                        <Button
                          variant="outline"
                          onClick={() => {
                            console.log(`🔄 Manual load requested for page ${pageNumber}`);
                            goToPage(pageNumber);
                          }}
                          className="hebrew-text"
                        >
                          טען עמוד
                        </Button>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Status bar */}
      <div className="bg-white border-t border-border p-2 text-center">
        <span className="hebrew-text text-xs text-muted-foreground">
          עמוד {currentPage} מתוך {totalPages} • {loadedPages.size} עמודים בזיכרון
          {visiblePages.length > 0 && ` • מציג עמודים ${visiblePages.join(', ')}`}
        </span>
      </div>
    </div>
  );
};

export default VirtualPDFViewer;


import React, { useState, useEffect, useRef } from 'react';
import { Button } from '../ui/button';
import { usePDFLazyLoader } from '../../hooks/usePDFLazyLoader';
import { useKeyboardNavigation } from '../../hooks/useKeyboardNavigation';
import { useFullscreen } from '../../hooks/useFullscreen';
import PDFTableOfContents from '../PDFTableOfContents';
import EnhancedPDFControls from '../EnhancedPDFControls';
import VirtualPDFPageRenderer from './VirtualPDFPageRenderer';
import VirtualPDFStatusBar from './VirtualPDFStatusBar';

interface VirtualPDFContainerProps {
  pdfFileId: string;
  onClose: () => void;
}

const VirtualPDFContainer = ({ pdfFileId, onClose }: VirtualPDFContainerProps) => {
  const [scale, setScale] = useState(1.0);
  const [visiblePages, setVisiblePages] = useState<number[]>([1]);
  const [showSidebar, setShowSidebar] = useState(false);
  
  const containerRef = useRef<HTMLDivElement>(null);
  const { isFullscreen, toggleFullscreen } = useFullscreen(containerRef);

  console.log(`🚀 VirtualPDFContainer initialized with pdfFileId: ${pdfFileId}`);

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

  // Enable keyboard navigation
  useKeyboardNavigation({
    onPrevPage: goToPrevPage,
    onNextPage: goToNextPage,
    onToggleFullscreen: toggleFullscreen,
    isEnabled: true
  });

  console.log(`📊 VirtualPDFContainer state: currentPage=${currentPage}, totalPages=${totalPages}, loadedPages=${loadedPages.size}, isLoading=${isLoading}`);

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
    <div 
      ref={containerRef}
      className={`flex h-full ${isFullscreen ? 'fixed inset-0 z-50 bg-white' : ''}`}
    >
      {/* Sidebar */}
      {showSidebar && (
        <div className="w-80 border-l border-border bg-background flex flex-col">
          <PDFTableOfContents
            pdfFileId={pdfFileId}
            currentPage={currentPage}
            onPageSelect={goToPage}
            className="flex-1"
          />
        </div>
      )}

      {/* Main viewer */}
      <div className="flex-1 flex flex-col">
        <EnhancedPDFControls
          currentPage={currentPage}
          totalPages={totalPages}
          scale={scale}
          isFullscreen={isFullscreen}
          showSidebar={showSidebar}
          onPrevPage={goToPrevPage}
          onNextPage={goToNextPage}
          onZoomIn={zoomIn}
          onZoomOut={zoomOut}
          onToggleFullscreen={toggleFullscreen}
          onToggleSidebar={() => setShowSidebar(!showSidebar)}
          onPageChange={goToPage}
        />

        <div className="flex-1 overflow-auto bg-gray-100 p-4">
          <div className="max-w-4xl mx-auto space-y-6">
            {visiblePages.map(pageNumber => {
              const pageUrl = getPageUrl(pageNumber);
              const isCurrentPage = pageNumber === currentPage;
              
              console.log(`🔍 Rendering page ${pageNumber}: loaded=${isPageLoaded(pageNumber)}, loading=${isPageLoading(pageNumber)}, url=${pageUrl}, isCurrent=${isCurrentPage}`);
              
              return (
                <VirtualPDFPageRenderer
                  key={pageNumber}
                  pageNumber={pageNumber}
                  pageUrl={pageUrl}
                  scale={scale}
                  totalPages={totalPages}
                  isCurrentPage={isCurrentPage}
                  isPageLoading={isPageLoading(pageNumber)}
                  onLoadPage={goToPage}
                />
              );
            })}
          </div>
        </div>

        {/* Status bar */}
        <VirtualPDFStatusBar
          currentPage={currentPage}
          totalPages={totalPages}
          loadedPagesCount={loadedPages.size}
          visiblePages={visiblePages}
          isFullscreen={isFullscreen}
        />
      </div>

      {/* Close button for fullscreen mode */}
      {isFullscreen && (
        <Button
          variant="outline"
          size="sm"
          onClick={onClose}
          className="absolute top-4 left-4 hebrew-text z-10"
        >
          סגור
        </Button>
      )}
    </div>
  );
};

export default VirtualPDFContainer;

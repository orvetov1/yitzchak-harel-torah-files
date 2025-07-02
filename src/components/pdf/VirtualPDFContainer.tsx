
import React, { useState, useRef } from 'react';
import { Button } from '../ui/button';
import { usePDFPages } from '../../hooks/usePDFPages';
import { usePDFVirtualViewer } from '../../hooks/pdf/usePDFVirtualViewer';
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
  const [showSidebar, setShowSidebar] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const { isFullscreen, toggleFullscreen } = useFullscreen(containerRef);

  console.log(`🚀 VirtualPDFContainer initialized with pdfFileId: ${pdfFileId}`);

  // Use the working usePDFPages hook instead of usePDFLazyLoader
  const {
    pages,
    fileInfo,
    isLoading,
    error,
    reload,
    getPageUrl,
    retryProcessing
  } = usePDFPages(pdfFileId);

  // Use virtual viewer hook for navigation and state management
  const {
    currentPage,
    scale,
    visiblePages,
    goToPage,
    goToPrevPage,
    goToNextPage,
    zoomIn,
    zoomOut
  } = usePDFVirtualViewer({
    totalPages: fileInfo?.numPagesTotal || 0,
    preloadDistance: 2
  });

  // Enable keyboard navigation
  useKeyboardNavigation({
    onPrevPage: goToPrevPage,
    onNextPage: goToNextPage,
    onToggleFullscreen: toggleFullscreen,
    isEnabled: true
  });

  console.log(`📊 VirtualPDFContainer state:`, {
    currentPage,
    totalPages: fileInfo?.numPagesTotal || 0,
    pagesCount: pages.length,
    isLoading,
    error,
    processingStatus: fileInfo?.processingStatus
  });

  if (error) {
    return (
      <div className="flex flex-col h-full items-center justify-center text-center hebrew-text p-8 bg-white">
        <div className="text-red-600 mb-4 text-lg">{error}</div>
        <div className="space-y-2">
          <Button onClick={reload} className="hebrew-text mr-2">נסה שוב</Button>
          <Button onClick={onClose} variant="outline" className="hebrew-text">סגור</Button>
        </div>
      </div>
    );
  }

  if (isLoading && !fileInfo) {
    return (
      <div className="flex flex-col h-full items-center justify-center text-center hebrew-text p-8 bg-white">
        <div className="animate-spin rounded-full h-16 w-16 border-b-4 border-primary mx-auto mb-4"></div>
        <div>מכין את הקובץ...</div>
      </div>
    );
  }

  if (fileInfo?.processingStatus !== 'completed') {
    return (
      <div className="flex flex-col h-full items-center justify-center text-center hebrew-text p-8 bg-white">
        <div className="text-lg mb-4">הקובץ עדיין מעובד...</div>
        <div className="text-sm text-muted-foreground mb-4">
          מצב עיבוד: {fileInfo?.processingStatus || 'לא ידוע'}
        </div>
        <div className="space-y-2">
          <Button onClick={retryProcessing} className="hebrew-text mr-2">נסה לעבד שוב</Button>
          <Button onClick={onClose} variant="outline" className="hebrew-text">סגור</Button>
        </div>
      </div>
    );
  }

  const totalPages = fileInfo?.numPagesTotal || 0;

  return (
    <div 
      ref={containerRef}
      className={`flex h-full ${isFullscreen ? 'fixed inset-0 z-50 bg-white' : 'bg-white'}`}
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
              // Find the page data for this page number
              const pageData = pages.find(p => p.pageNumber === pageNumber);
              const pageUrl = pageData ? getPageUrl(pageData) : null;
              const isCurrentPage = pageNumber === currentPage;
              
              console.log(`🔍 Rendering page ${pageNumber}:`, {
                hasPageData: !!pageData,
                pageUrl: pageUrl ? 'available' : 'null',
                isCurrent: isCurrentPage
              });
              
              return (
                <VirtualPDFPageRenderer
                  key={pageNumber}
                  pageNumber={pageNumber}
                  pageUrl={pageUrl}
                  scale={scale}
                  totalPages={totalPages}
                  isCurrentPage={isCurrentPage}
                  isPageLoading={false} // We're not using loading states since pages are pre-loaded
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
          loadedPagesCount={pages.length}
          visiblePages={visiblePages}
          isFullscreen={isFullscreen}
        />
      </div>

      {/* Close button */}
      <Button
        variant="outline"
        size="sm"
        onClick={onClose}
        className="absolute top-4 left-4 hebrew-text z-10"
      >
        סגור
      </Button>
    </div>
  );
};

export default VirtualPDFContainer;

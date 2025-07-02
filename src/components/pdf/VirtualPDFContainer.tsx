
import React, { useState, useRef, useEffect } from 'react';
import { Button } from '../ui/button';
import { usePDFLargeLazyViewer } from '../../hooks/pdf/usePDFLargeLazyViewer';
import { useKeyboardNavigation } from '../../hooks/useKeyboardNavigation';
import { useFullscreen } from '../../hooks/useFullscreen';
import PDFTableOfContents from '../PDFTableOfContents';
import EnhancedPDFControls from '../EnhancedPDFControls';
import VirtualPDFPageRenderer from './VirtualPDFPageRenderer';
import VirtualPDFStatusBar from './VirtualPDFStatusBar';
import { ensurePDFWorkerReady } from '../../utils/pdfWorkerAutoInitializer';

interface VirtualPDFContainerProps {
  pdfFileId: string;
  onClose: () => void;
}

const VirtualPDFContainer = ({ pdfFileId, onClose }: VirtualPDFContainerProps) => {
  const [showSidebar, setShowSidebar] = useState(false);
  const [workerInitializing, setWorkerInitializing] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const { isFullscreen, toggleFullscreen } = useFullscreen(containerRef);

  console.log(`🚀 VirtualPDFContainer initialized with pdfFileId: ${pdfFileId}`);

  // Use the new large lazy viewer
  const {
    currentPage,
    scale,
    visiblePages,
    totalPages,
    fileInfo,
    isLoading,
    error,
    isPageLoaded,
    isPageLoading,
    isPageError,
    goToPage,
    goToPrevPage,
    goToNextPage,
    zoomIn,
    zoomOut,
    getPageUrl,
    retryPage,
    reload
  } = usePDFLargeLazyViewer(pdfFileId);

  // Auto-initialize PDF Worker when container opens
  useEffect(() => {
    const initializeWorker = async () => {
      setWorkerInitializing(true);
      try {
        await ensurePDFWorkerReady();
      } catch (error) {
        console.error('❌ Failed to initialize PDF Worker:', error);
      } finally {
        setWorkerInitializing(false);
      }
    };

    initializeWorker();
  }, []);

  // Enable keyboard navigation
  useKeyboardNavigation({
    onPrevPage: goToPrevPage,
    onNextPage: goToNextPage,
    onToggleFullscreen: toggleFullscreen,
    isEnabled: true
  });

  console.log(`📊 VirtualPDFContainer state:`, {
    currentPage,
    totalPages,
    visiblePagesCount: visiblePages.length,
    isLoading,
    error,
    processingStatus: fileInfo?.processingStatus,
    workerInitializing
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

  if ((isLoading && !fileInfo) || workerInitializing) {
    return (
      <div className="flex flex-col h-full items-center justify-center text-center hebrew-text p-8 bg-white">
        <div className="animate-spin rounded-full h-16 w-16 border-b-4 border-primary mx-auto mb-4"></div>
        <div>
          {workerInitializing ? 'מכין מנוע PDF...' : 'מכין את הקובץ...'}
        </div>
      </div>
    );
  }

  // Allow viewing even if processing is not completed - check if we have pages
  const canViewFile = fileInfo && (
    fileInfo.processingStatus === 'completed' || 
    totalPages > 0 || 
    visiblePages.some(p => isPageLoaded(p))
  );

  if (fileInfo && !canViewFile) {
    return (
      <div className="flex flex-col h-full items-center justify-center text-center hebrew-text p-8 bg-white">
        <div className="text-lg mb-4">הקובץ עדיין מעובד...</div>
        <div className="text-sm text-muted-foreground mb-4">
          מצב עיבוד: {fileInfo.processingStatus || 'לא ידוע'}
        </div>
        <div className="space-y-2">
          <Button onClick={reload} className="hebrew-text mr-2">רענן</Button>
          <Button onClick={onClose} variant="outline" className="hebrew-text">סגור</Button>
        </div>
      </div>
    );
  }

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
              const pageUrl = getPageUrl(pageNumber);
              const isCurrentPage = pageNumber === currentPage;
              const pageLoaded = isPageLoaded(pageNumber);
              const pageLoading = isPageLoading(pageNumber);
              const pageError = isPageError(pageNumber);
              
              console.log(`🔍 Rendering page ${pageNumber}:`, {
                hasPageUrl: !!pageUrl,
                isCurrent: isCurrentPage,
                isLoaded: pageLoaded,
                isLoading: pageLoading,
                hasError: pageError
              });
              
              return (
                <VirtualPDFPageRenderer
                  key={pageNumber}
                  pageNumber={pageNumber}
                  pageUrl={pageUrl}
                  scale={scale}
                  totalPages={totalPages}
                  isCurrentPage={isCurrentPage}
                  isPageLoading={pageLoading}
                  isPageLoaded={pageLoaded}
                  isPageError={pageError}
                  onLoadPage={() => retryPage(pageNumber)}
                />
              );
            })}
          </div>
        </div>

        {/* Status bar */}
        <VirtualPDFStatusBar
          currentPage={currentPage}
          totalPages={totalPages}
          loadedPagesCount={visiblePages.filter(p => isPageLoaded(p)).length}
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

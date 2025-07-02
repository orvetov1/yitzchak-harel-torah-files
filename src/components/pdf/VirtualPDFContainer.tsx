
import React, { useState, useRef } from 'react';
import { Button } from '../ui/button';
import { usePDFLargeLazyViewer } from '../../hooks/pdf/usePDFLargeLazyViewer';
import { useKeyboardNavigation } from '../../hooks/useKeyboardNavigation';
import { useFullscreen } from '../../hooks/useFullscreen';
import PDFTableOfContents from '../PDFTableOfContents';
import VirtualPDFLoadingStates from './VirtualPDFLoadingStates';
import VirtualPDFProcessingState from './VirtualPDFProcessingState';
import VirtualPDFMainViewer from './VirtualPDFMainViewer';
import { usePDFWorkerInitialization } from './hooks/usePDFWorkerInitialization';

interface VirtualPDFContainerProps {
  pdfFileId: string;
  onClose: () => void;
}

const VirtualPDFContainer = ({ pdfFileId, onClose }: VirtualPDFContainerProps) => {
  const [showSidebar, setShowSidebar] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const { isFullscreen, toggleFullscreen } = useFullscreen(containerRef);

  console.log(`🚀 VirtualPDFContainer initialized with pdfFileId: ${pdfFileId}`);

  // Initialize PDF Worker
  const { isWorkerReady, workerInitializing } = usePDFWorkerInitialization();

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

  // Show loading states
  const loadingState = (
    <VirtualPDFLoadingStates
      isWorkerReady={isWorkerReady}
      workerInitializing={workerInitializing}
      isLoading={isLoading}
      fileInfo={fileInfo}
      error={error}
      onReload={reload}
      onClose={onClose}
    />
  );

  if (loadingState) return loadingState;

  // Show processing state
  const processingState = (
    <VirtualPDFProcessingState
      fileInfo={fileInfo}
      totalPages={totalPages}
      visiblePages={visiblePages}
      isPageLoaded={isPageLoaded}
      onReload={reload}
      onClose={onClose}
    />
  );

  if (processingState) return processingState;

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
      <VirtualPDFMainViewer
        currentPage={currentPage}
        totalPages={totalPages}
        scale={scale}
        isFullscreen={isFullscreen}
        showSidebar={showSidebar}
        visiblePages={visiblePages}
        onPrevPage={goToPrevPage}
        onNextPage={goToNextPage}
        onZoomIn={zoomIn}
        onZoomOut={zoomOut}
        onToggleFullscreen={toggleFullscreen}
        onToggleSidebar={() => setShowSidebar(!showSidebar)}
        onPageChange={goToPage}
        getPageUrl={getPageUrl}
        isPageLoaded={isPageLoaded}
        isPageLoading={isPageLoading}
        isPageError={isPageError}
        retryPage={retryPage}
      />

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

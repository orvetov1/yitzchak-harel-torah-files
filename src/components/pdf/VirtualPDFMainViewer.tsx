
import React from 'react';
import EnhancedPDFControls from '../EnhancedPDFControls';
import VirtualPDFPageRenderer from './VirtualPDFPageRenderer';
import VirtualPDFStatusBar from './VirtualPDFStatusBar';

interface VirtualPDFMainViewerProps {
  currentPage: number;
  totalPages: number;
  scale: number;
  isFullscreen: boolean;
  showSidebar: boolean;
  visiblePages: number[];
  onPrevPage: () => void;
  onNextPage: () => void;
  onZoomIn: () => void;
  onZoomOut: () => void;
  onToggleFullscreen: () => void;
  onToggleSidebar: () => void;
  onPageChange: (page: number) => void;
  getPageUrl: (pageNumber: number) => string | null;
  isPageLoaded: (pageNumber: number) => boolean;
  isPageLoading: (pageNumber: number) => boolean;
  isPageError: (pageNumber: number) => boolean;
  retryPage: (pageNumber: number) => void;
}

const VirtualPDFMainViewer = ({
  currentPage,
  totalPages,
  scale,
  isFullscreen,
  showSidebar,
  visiblePages,
  onPrevPage,
  onNextPage,
  onZoomIn,
  onZoomOut,
  onToggleFullscreen,
  onToggleSidebar,
  onPageChange,
  getPageUrl,
  isPageLoaded,
  isPageLoading,
  isPageError,
  retryPage
}: VirtualPDFMainViewerProps) => {
  return (
    <div className="flex-1 flex flex-col">
      <EnhancedPDFControls
        currentPage={currentPage}
        totalPages={totalPages}
        scale={scale}
        isFullscreen={isFullscreen}
        showSidebar={showSidebar}
        onPrevPage={onPrevPage}
        onNextPage={onNextPage}
        onZoomIn={onZoomIn}
        onZoomOut={onZoomOut}
        onToggleFullscreen={onToggleFullscreen}
        onToggleSidebar={onToggleSidebar}
        onPageChange={onPageChange}
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
  );
};

export default VirtualPDFMainViewer;

import React, { useState } from 'react';
import { Button } from './ui/button';
import { usePDFLazyLoader } from '../hooks/usePDFLazyLoader';
import VirtualScrollContainer from './VirtualScrollContainer';
import PDFViewerControlsBar from './PDFViewerControlsBar';
import { pdfjs } from 'react-pdf';

// Configure PDF.js worker to use compatible version
pdfjs.GlobalWorkerOptions.workerSrc = new URL(
  'pdfjs-dist/build/pdf.worker.min.js',
  import.meta.url,
).toString();

interface VirtualPDFViewerProps {
  pdfFileId: string;
  onClose: () => void;
}

const VirtualPDFViewer = ({ pdfFileId, onClose }: VirtualPDFViewerProps) => {
  const [scale, setScale] = useState(1.0);
  const [visibleRange, setVisibleRange] = useState({ start: 1, end: 3 });

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

  const goToPrevPage = () => goToPage(Math.max(1, currentPage - 1));
  const goToNextPage = () => goToPage(Math.min(totalPages, currentPage + 1));
  const zoomIn = () => setScale(prev => Math.min(3.0, prev + 0.2));
  const zoomOut = () => setScale(prev => Math.max(0.5, prev - 0.2));

  const handleVisibleRangeChange = (range: { start: number; end: number }) => {
    setVisibleRange(range);
  };

  const handleCurrentPageChange = (page: number) => {
    if (page !== currentPage) {
      goToPage(page);
    }
  };

  if (error) {
    return (
      <div className="text-center hebrew-text p-8">
        <div className="text-red-600 mb-4">{error}</div>
        <Button onClick={onClose}>סגור</Button>
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

      <VirtualScrollContainer
        visibleRange={visibleRange}
        totalPages={totalPages}
        scale={scale}
        isLoading={isLoading}
        loadedPages={loadedPages}
        isPageLoaded={isPageLoaded}
        isPageLoading={isPageLoading}
        getPageUrl={getPageUrl}
        goToPage={goToPage}
        onVisibleRangeChange={handleVisibleRangeChange}
        onCurrentPageChange={handleCurrentPageChange}
        currentPage={currentPage}
      />

      {/* Status bar */}
      <div className="bg-white border-t border-border p-2 text-center">
        <span className="hebrew-text text-xs text-muted-foreground">
          עיבוד Canvas פעיל • עמודים {visibleRange.start}-{visibleRange.end} מתוך {totalPages}
          • {loadedPages.size} עמודים בזיכרון
        </span>
      </div>
    </div>
  );
};

export default VirtualPDFViewer;

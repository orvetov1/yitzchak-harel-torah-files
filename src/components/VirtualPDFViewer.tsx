
import React, { useState, useRef, useEffect, useCallback } from 'react';
import { Button } from './ui/button';
import { ChevronLeft, ChevronRight, ZoomIn, ZoomOut } from 'lucide-react';
import { usePDFLazyLoader } from '../hooks/usePDFLazyLoader';

interface VirtualPDFViewerProps {
  pdfFileId: string;
  onClose: () => void;
}

const VirtualPDFViewer = ({ pdfFileId, onClose }: VirtualPDFViewerProps) => {
  const [scale, setScale] = useState(1.0);
  const [visibleRange, setVisibleRange] = useState({ start: 1, end: 3 });
  const containerRef = useRef<HTMLDivElement>(null);
  const pageRefs = useRef<Map<number, HTMLDivElement>>(new Map());

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

  // Virtual scrolling logic
  const updateVisibleRange = useCallback(() => {
    if (!containerRef.current) return;

    const container = containerRef.current;
    const scrollTop = container.scrollTop;
    const containerHeight = container.clientHeight;
    const pageHeight = 800; // Approximate page height

    const startPage = Math.max(1, Math.floor(scrollTop / pageHeight) + 1);
    const endPage = Math.min(totalPages, startPage + Math.ceil(containerHeight / pageHeight) + 1);

    setVisibleRange({ start: startPage, end: endPage });

    // Update current page based on scroll position
    const newCurrentPage = Math.max(1, Math.min(totalPages, startPage));
    if (newCurrentPage !== currentPage) {
      goToPage(newCurrentPage);
    }
  }, [totalPages, currentPage, goToPage]);

  // Handle scroll events for virtual scrolling
  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const handleScroll = () => {
      updateVisibleRange();
    };

    container.addEventListener('scroll', handleScroll, { passive: true });
    return () => container.removeEventListener('scroll', handleScroll);
  }, [updateVisibleRange]);

  // Render page component
  const renderPage = (pageNumber: number) => {
    const pageUrl = getPageUrl(pageNumber);
    const isLoaded = isPageLoaded(pageNumber);
    const isLoadingPage = isPageLoading(pageNumber);

    return (
      <div
        key={pageNumber}
        ref={(el) => {
          if (el) pageRefs.current.set(pageNumber, el);
        }}
        className="mb-4 bg-white shadow-lg rounded-lg overflow-hidden"
        style={{
          transform: `scale(${scale})`,
          transformOrigin: 'top center',
          minHeight: '800px'
        }}
      >
        {isLoadingPage && (
          <div className="flex items-center justify-center h-96 hebrew-text">
            <div className="text-center space-y-2">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
              <div>טוען עמוד {pageNumber}...</div>
            </div>
          </div>
        )}
        
        {isLoaded && pageUrl && (
          <iframe
            src={`${pageUrl}#view=FitH`}
            className="w-full h-full min-h-[800px]"
            title={`עמוד ${pageNumber}`}
            style={{ border: 'none' }}
          />
        )}
        
        {!isLoaded && !isLoadingPage && (
          <div className="flex items-center justify-center h-96 hebrew-text">
            <div className="text-center space-y-2">
              <div className="text-muted-foreground">עמוד {pageNumber}</div>
              <Button
                variant="outline"
                onClick={() => goToPage(pageNumber)}
                className="hebrew-text"
              >
                טען עמוד
              </Button>
            </div>
          </div>
        )}
      </div>
    );
  };

  // Generate visible pages
  const visiblePages = [];
  for (let i = visibleRange.start; i <= visibleRange.end; i++) {
    visiblePages.push(renderPage(i));
  }

  const goToPrevPage = () => goToPage(Math.max(1, currentPage - 1));
  const goToNextPage = () => goToPage(Math.min(totalPages, currentPage + 1));
  const zoomIn = () => setScale(prev => Math.min(3.0, prev + 0.2));
  const zoomOut = () => setScale(prev => Math.max(0.5, prev - 0.2));

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
      {/* Controls */}
      <div className="bg-white border-b border-border p-3 flex items-center justify-center gap-4">
        <Button variant="outline" onClick={goToPrevPage} disabled={currentPage <= 1}>
          <ChevronRight size={16} />
        </Button>
        
        <div className="flex items-center gap-2">
          <input
            type="number"
            min="1"
            max={totalPages}
            value={currentPage}
            onChange={(e) => {
              const page = parseInt(e.target.value);
              if (page >= 1 && page <= totalPages) {
                goToPage(page);
              }
            }}
            className="w-16 px-2 py-1 text-center border border-border rounded text-sm hebrew-text"
          />
          <span className="hebrew-text text-sm text-muted-foreground">
            / {totalPages}
          </span>
        </div>

        <Button variant="outline" onClick={goToNextPage} disabled={currentPage >= totalPages}>
          <ChevronLeft size={16} />
        </Button>

        <div className="w-px h-6 bg-border mx-2" />

        <Button variant="outline" onClick={zoomOut} disabled={scale <= 0.5}>
          <ZoomOut size={16} />
        </Button>
        <span className="hebrew-text text-sm text-muted-foreground min-w-12 text-center">
          {Math.round(scale * 100)}%
        </span>
        <Button variant="outline" onClick={zoomIn} disabled={scale >= 3.0}>
          <ZoomIn size={16} />
        </Button>
      </div>

      {/* Virtual scrolling container */}
      <div 
        ref={containerRef}
        className="flex-1 overflow-auto bg-gray-100 p-4"
        style={{ scrollBehavior: 'smooth' }}
      >
        <div className="max-w-4xl mx-auto space-y-4">
          {isLoading && visiblePages.length === 0 && (
            <div className="text-center hebrew-text p-8">
              <div className="animate-spin rounded-full h-16 w-16 border-b-4 border-primary mx-auto mb-4"></div>
              <div>מכין את הקובץ...</div>
            </div>
          )}
          
          {/* Virtual spacer for pages before visible range */}
          {visibleRange.start > 1 && (
            <div 
              style={{ height: `${(visibleRange.start - 1) * 850}px` }}
              className="bg-gray-200 rounded flex items-center justify-center text-muted-foreground hebrew-text"
            >
              עמודים 1-{visibleRange.start - 1} (לא נטענו)
            </div>
          )}
          
          {visiblePages}
          
          {/* Virtual spacer for pages after visible range */}
          {visibleRange.end < totalPages && (
            <div 
              style={{ height: `${(totalPages - visibleRange.end) * 850}px` }}
              className="bg-gray-200 rounded flex items-center justify-center text-muted-foreground hebrew-text"
            >
              עמודים {visibleRange.end + 1}-{totalPages} (לא נטענו)
            </div>
          )}
        </div>
      </div>

      {/* Status bar */}
      <div className="bg-white border-t border-border p-2 text-center">
        <span className="hebrew-text text-xs text-muted-foreground">
          טעינה חכמה פעילה • עמודים {visibleRange.start}-{visibleRange.end} מתוך {totalPages}
          • {loadedPages.size} עמודים בזיכרון
        </span>
      </div>
    </div>
  );
};

export default VirtualPDFViewer;


import React, { useRef, useEffect, useCallback } from 'react';
import PDFPage from './PDFPage';

interface VirtualScrollContainerProps {
  visibleRange: { start: number; end: number };
  totalPages: number;
  scale: number;
  isLoading: boolean;
  loadedPages: Map<number, string>;
  isPageLoaded: (pageNumber: number) => boolean;
  isPageLoading: (pageNumber: number) => boolean;
  getPageUrl: (pageNumber: number) => string | null;
  goToPage: (pageNumber: number) => void;
  onVisibleRangeChange: (range: { start: number; end: number }) => void;
  onCurrentPageChange: (page: number) => void;
  currentPage: number;
}

const VirtualScrollContainer = ({
  visibleRange,
  totalPages,
  scale,
  isLoading,
  loadedPages,
  isPageLoaded,
  isPageLoading,
  getPageUrl,
  goToPage,
  onVisibleRangeChange,
  onCurrentPageChange,
  currentPage
}: VirtualScrollContainerProps) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const pageRefs = useRef<Map<number, HTMLDivElement>>(new Map());

  const updateVisibleRange = useCallback(() => {
    if (!containerRef.current) return;

    const container = containerRef.current;
    const scrollTop = container.scrollTop;
    const containerHeight = container.clientHeight;
    const pageHeight = 800;

    const startPage = Math.max(1, Math.floor(scrollTop / pageHeight) + 1);
    const endPage = Math.min(totalPages, startPage + Math.ceil(containerHeight / pageHeight) + 1);

    onVisibleRangeChange({ start: startPage, end: endPage });

    const newCurrentPage = Math.max(1, Math.min(totalPages, startPage));
    if (newCurrentPage !== currentPage) {
      onCurrentPageChange(newCurrentPage);
    }
  }, [totalPages, currentPage, onVisibleRangeChange, onCurrentPageChange]);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const handleScroll = () => {
      updateVisibleRange();
    };

    container.addEventListener('scroll', handleScroll, { passive: true });
    return () => container.removeEventListener('scroll', handleScroll);
  }, [updateVisibleRange]);

  const visiblePages = [];
  for (let i = visibleRange.start; i <= visibleRange.end; i++) {
    visiblePages.push(
      <PDFPage
        key={i}
        pageNumber={i}
        scale={scale}
        pageUrl={getPageUrl(i)}
        isLoaded={isPageLoaded(i)}
        isLoading={isPageLoading(i)}
        onPageLoad={goToPage}
        pageRef={(el) => {
          if (el) pageRefs.current.set(i, el);
        }}
      />
    );
  }

  return (
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
  );
};

export default VirtualScrollContainer;

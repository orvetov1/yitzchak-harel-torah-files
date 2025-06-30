
import React, { useState, useCallback, useMemo } from 'react';
import { Button } from './ui/button';
import { ChevronLeft, ChevronRight, Download, X, RotateCcw } from 'lucide-react';
import { usePDFPages } from '../hooks/usePDFPages';

interface LazyPDFViewerProps {
  pdfFileId: string;
  fileName: string;
  isOpen: boolean;
  onClose: () => void;
}

const LazyPDFViewer = ({ pdfFileId, fileName, isOpen, onClose }: LazyPDFViewerProps) => {
  const { pages, fileInfo, isLoading, error, getPageUrl, retryProcessing } = usePDFPages(pdfFileId);
  const [currentPageIndex, setCurrentPageIndex] = useState(0);
  const [scale, setScale] = useState(1.0);
  const [loadedPages, setLoadedPages] = useState<Set<number>>(new Set());

  const currentPage = useMemo(() => {
    return pages[currentPageIndex] || null;
  }, [pages, currentPageIndex]);

  const currentPageUrl = useMemo(() => {
    return currentPage ? getPageUrl(currentPage) : null;
  }, [currentPage, getPageUrl]);

  const handlePageLoad = useCallback((pageIndex: number) => {
    setLoadedPages(prev => new Set([...prev, pageIndex]));
  }, []);

  const goToPrevPage = useCallback(() => {
    setCurrentPageIndex(prev => Math.max(0, prev - 1));
  }, []);

  const goToNextPage = useCallback(() => {
    setCurrentPageIndex(prev => Math.min(pages.length - 1, prev + 1));
  }, [pages.length]);

  const handleDownload = async () => {
    if (!currentPageUrl) return;

    try {
      const response = await fetch(currentPageUrl);
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `${fileName}_page_${currentPage?.pageNumber || 1}.pdf`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Download failed:', error);
      if (currentPageUrl) {
        window.open(currentPageUrl, '_blank');
      }
    }
  };

  const zoomIn = () => setScale(prev => Math.min(3.0, prev + 0.2));
  const zoomOut = () => setScale(prev => Math.max(0.5, prev - 0.2));

  if (!isOpen) return null;

  // Loading state
  if (isLoading) {
    return (
      <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm">
        <div className="flex flex-col h-full">
          <div className="bg-white border-b border-border p-4 flex items-center justify-between">
            <h2 className="hebrew-title text-lg font-semibold">{fileName}</h2>
            <Button variant="outline" onClick={onClose}>
              <X size={16} />
            </Button>
          </div>
          <div className="flex-1 flex items-center justify-center">
            <div className="text-center hebrew-text space-y-4">
              <div className="animate-spin rounded-full h-16 w-16 border-b-4 border-primary mx-auto"></div>
              <div className="space-y-2">
                <div className="text-xl font-medium">טוען קובץ PDF...</div>
                <div className="text-sm text-muted-foreground">
                  בודק אם הקובץ מפוצל לעמודים
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Error state
  if (error) {
    return (
      <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm">
        <div className="flex flex-col h-full">
          <div className="bg-white border-b border-border p-4 flex items-center justify-between">
            <h2 className="hebrew-title text-lg font-semibold">{fileName}</h2>
            <Button variant="outline" onClick={onClose}>
              <X size={16} />
            </Button>
          </div>
          <div className="flex-1 flex items-center justify-center">
            <div className="text-center hebrew-text space-y-4 p-8">
              <div className="text-red-600 text-lg font-medium">{error}</div>
              <Button onClick={retryProcessing} className="hebrew-text">
                <RotateCcw size={16} className="mr-2" />
                נסה שוב
              </Button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Processing state
  if (fileInfo?.processingStatus !== 'completed') {
    return (
      <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm">
        <div className="flex flex-col h-full">
          <div className="bg-white border-b border-border p-4 flex items-center justify-between">
            <h2 className="hebrew-title text-lg font-semibold">{fileName}</h2>
            <Button variant="outline" onClick={onClose}>
              <X size={16} />
            </Button>
          </div>
          <div className="flex-1 flex items-center justify-center">
            <div className="text-center hebrew-text space-y-4 p-8">
              <div className="animate-pulse rounded-full h-16 w-16 border-4 border-blue-500 mx-auto"></div>
              <div className="space-y-2">
                <div className="text-xl font-medium">מעבד קובץ PDF...</div>
                <div className="text-sm text-muted-foreground">
                  הקובץ מפוצל לעמודים נפרדים לטעינה מהירה יותר
                </div>
                {fileInfo?.numPagesTotal && (
                  <div className="text-sm text-blue-600">
                    סה"כ {fileInfo.numPagesTotal} עמודים
                  </div>
                )}
              </div>
              <Button onClick={retryProcessing} variant="outline" className="hebrew-text">
                <RotateCcw size={16} className="mr-2" />
                בדוק מחדש
              </Button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Main viewer
  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm">
      <div className="flex flex-col h-full">
        {/* Header */}
        <div className="bg-white border-b border-border p-4 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <h2 className="hebrew-title text-lg font-semibold">{fileName}</h2>
            <span className="hebrew-text text-sm text-muted-foreground">
              עמוד {currentPageIndex + 1} מתוך {pages.length}
            </span>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="outline" onClick={handleDownload}>
              <Download size={16} />
            </Button>
            <Button variant="outline" onClick={onClose}>
              <X size={16} />
            </Button>
          </div>
        </div>

        {/* Controls */}
        <div className="bg-white border-b border-border p-2 flex items-center justify-center gap-4">
          <Button
            variant="outline"
            onClick={goToPrevPage}
            disabled={currentPageIndex === 0}
          >
            <ChevronRight size={16} />
          </Button>
          
          <div className="flex items-center gap-2">
            <Button variant="outline" onClick={zoomOut}>-</Button>
            <span className="hebrew-text text-sm min-w-[60px] text-center">
              {Math.round(scale * 100)}%
            </span>
            <Button variant="outline" onClick={zoomIn}>+</Button>
          </div>

          <Button
            variant="outline"
            onClick={goToNextPage}
            disabled={currentPageIndex === pages.length - 1}
          >
            <ChevronLeft size={16} />
          </Button>
        </div>

        {/* PDF Content */}
        <div className="flex-1 overflow-auto bg-gray-100 flex items-center justify-center p-4">
          {currentPageUrl ? (
            <div className="bg-white shadow-lg" style={{ transform: `scale(${scale})` }}>
              <iframe
                src={currentPageUrl}
                className="w-[800px] h-[600px] border-0"
                onLoad={() => handlePageLoad(currentPageIndex)}
                title={`עמוד ${currentPageIndex + 1}`}
              />
            </div>
          ) : (
            <div className="text-center hebrew-text">
              <div className="text-muted-foreground">אין עמוד לתצוגה</div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="bg-white border-t border-border p-2 text-center">
          <span className="hebrew-text text-xs text-muted-foreground">
            השתמש בחיצים לדפדוף, + ו - לזום, ESC לסגירה
          </span>
        </div>
      </div>
    </div>
  );
};

export default LazyPDFViewer;

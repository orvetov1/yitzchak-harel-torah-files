
import React, { useState, useCallback } from 'react';
import { Document, Page, pdfjs } from 'react-pdf';
import { X, ChevronLeft, ChevronRight, ZoomIn, ZoomOut, Download } from 'lucide-react';
import { Button } from './ui/button';

// Set up PDF.js worker
pdfjs.GlobalWorkerOptions.workerSrc = `//cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjs.version}/pdf.worker.min.js`;

interface PDFViewerProps {
  fileUrl: string;
  fileName: string;
  isOpen: boolean;
  onClose: () => void;
}

const PDFViewer = ({ fileUrl, fileName, isOpen, onClose }: PDFViewerProps) => {
  const [numPages, setNumPages] = useState<number>(0);
  const [pageNumber, setPageNumber] = useState<number>(1);
  const [scale, setScale] = useState<number>(1.0);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  const onDocumentLoadSuccess = useCallback(({ numPages }: { numPages: number }) => {
    setNumPages(numPages);
    setLoading(false);
    setError(null);
  }, []);

  const onDocumentLoadError = useCallback((error: Error) => {
    console.error('Error loading PDF:', error);
    setError('שגיאה בטעינת הקובץ');
    setLoading(false);
  }, []);

  const goToPrevPage = () => {
    setPageNumber(prev => Math.max(1, prev - 1));
  };

  const goToNextPage = () => {
    setPageNumber(prev => Math.min(numPages, prev + 1));
  };

  const zoomIn = () => {
    setScale(prev => Math.min(3.0, prev + 0.2));
  };

  const zoomOut = () => {
    setScale(prev => Math.max(0.5, prev - 0.2));
  };

  const handleDownload = async () => {
    try {
      const response = await fetch(fileUrl);
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = fileName.endsWith('.pdf') ? fileName : `${fileName}.pdf`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Download failed:', error);
    }
  };

  const handleKeyDown = useCallback((event: KeyboardEvent) => {
    if (!isOpen) return;
    
    switch (event.key) {
      case 'Escape':
        onClose();
        break;
      case 'ArrowLeft':
        goToPrevPage();
        break;
      case 'ArrowRight':
        goToNextPage();
        break;
      case '+':
        event.preventDefault();
        zoomIn();
        break;
      case '-':
        event.preventDefault();
        zoomOut();
        break;
    }
  }, [isOpen, onClose]);

  React.useEffect(() => {
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [handleKeyDown]);

  React.useEffect(() => {
    if (isOpen) {
      setPageNumber(1);
      setScale(1.0);
      setLoading(true);
      setError(null);
    }
  }, [isOpen, fileUrl]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm">
      <div className="flex flex-col h-full">
        {/* Header */}
        <div className="bg-white border-b border-border p-4 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <h2 className="hebrew-title text-lg font-semibold text-foreground">
              {fileName}
            </h2>
            {!loading && !error && (
              <span className="hebrew-text text-sm text-muted-foreground">
                עמוד {pageNumber} מתוך {numPages}
              </span>
            )}
          </div>
          
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={handleDownload}
              className="hebrew-text"
            >
              <Download size={16} />
              הורד
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={onClose}
            >
              <X size={16} />
            </Button>
          </div>
        </div>

        {/* Controls */}
        <div className="bg-white border-b border-border p-3 flex items-center justify-center gap-4">
          <Button
            variant="outline"
            size="sm"
            onClick={goToPrevPage}
            disabled={pageNumber <= 1 || loading}
          >
            <ChevronRight size={16} />
          </Button>
          
          <div className="flex items-center gap-2">
            <input
              type="number"
              min="1"
              max={numPages}
              value={pageNumber}
              onChange={(e) => {
                const page = parseInt(e.target.value);
                if (page >= 1 && page <= numPages) {
                  setPageNumber(page);
                }
              }}
              className="w-16 px-2 py-1 text-center border border-border rounded text-sm"
              disabled={loading}
            />
            <span className="hebrew-text text-sm text-muted-foreground">
              / {numPages || 0}
            </span>
          </div>
          
          <Button
            variant="outline"
            size="sm"
            onClick={goToNextPage}
            disabled={pageNumber >= numPages || loading}
          >
            <ChevronLeft size={16} />
          </Button>
          
          <div className="w-px h-6 bg-border mx-2" />
          
          <Button
            variant="outline"
            size="sm"
            onClick={zoomOut}
            disabled={scale <= 0.5 || loading}
          >
            <ZoomOut size={16} />
          </Button>
          
          <span className="hebrew-text text-sm text-muted-foreground min-w-12 text-center">
            {Math.round(scale * 100)}%
          </span>
          
          <Button
            variant="outline"
            size="sm"
            onClick={zoomIn}
            disabled={scale >= 3.0 || loading}
          >
            <ZoomIn size={16} />
          </Button>
        </div>

        {/* PDF Content */}
        <div className="flex-1 overflow-auto bg-gray-100 flex items-center justify-center p-4">
          {loading && (
            <div className="text-center hebrew-text">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-2"></div>
              טוען קובץ...
            </div>
          )}
          
          {error && (
            <div className="text-center hebrew-text text-red-600">
              {error}
            </div>
          )}
          
          {!loading && !error && (
            <div className="bg-white shadow-lg">
              <Document
                file={fileUrl}
                onLoadSuccess={onDocumentLoadSuccess}
                onLoadError={onDocumentLoadError}
                loading={
                  <div className="p-8 text-center hebrew-text">
                    טוען מסמך...
                  </div>
                }
              >
                <Page
                  pageNumber={pageNumber}
                  scale={scale}
                  loading={
                    <div className="p-8 text-center hebrew-text">
                      טוען עמוד...
                    </div>
                  }
                />
              </Document>
            </div>
          )}
        </div>

        {/* Footer with keyboard shortcuts hint */}
        <div className="bg-white border-t border-border p-2 text-center">
          <span className="hebrew-text text-xs text-muted-foreground">
            השתמש בחיצים לדפדוף, + ו - לזום, ESC לסגירה
          </span>
        </div>
      </div>
    </div>
  );
};

export default PDFViewer;

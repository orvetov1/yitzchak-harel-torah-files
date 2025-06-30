
import React, { useState, useEffect, useRef } from 'react';
import { Document, Page, pdfjs } from 'react-pdf';
import { Button } from './ui/button';
import { ChevronLeft, ChevronRight, Download, X, Maximize, Minimize, ZoomIn, ZoomOut, RotateCcw } from 'lucide-react';

// Set up PDF.js worker using the public path
pdfjs.GlobalWorkerOptions.workerSrc = '/pdf.worker.min.js';

interface PDFViewerModalProps {
  pdfUrl: string;
  fileName: string;
  isOpen: boolean;
  onClose: () => void;
}

const PDFViewerModal = ({ pdfUrl, fileName, isOpen, onClose }: PDFViewerModalProps) => {
  const [numPages, setNumPages] = useState<number>(0);
  const [pageNumber, setPageNumber] = useState<number>(1);
  const [scale, setScale] = useState<number>(1.0);
  const [isFullscreen, setIsFullscreen] = useState<boolean>(false);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (isOpen) {
      setPageNumber(1);
      setScale(1.0);
      setError(null);
      setLoading(true);
    }
  }, [isOpen, pdfUrl]);

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (!isOpen) return;

      switch (event.key) {
        case 'Escape':
          if (isFullscreen) {
            exitFullscreen();
          } else {
            onClose();
          }
          break;
        case 'ArrowLeft':
          goToPrevPage();
          break;
        case 'ArrowRight':
          goToNextPage();
          break;
        case 'f':
        case 'F':
          if (event.ctrlKey || event.metaKey) {
            event.preventDefault();
            toggleFullscreen();
          }
          break;
        case '+':
        case '=':
          if (event.ctrlKey || event.metaKey) {
            event.preventDefault();
            zoomIn();
          }
          break;
        case '-':
          if (event.ctrlKey || event.metaKey) {
            event.preventDefault();
            zoomOut();
          }
          break;
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, isFullscreen, pageNumber, numPages, scale]);

  const onDocumentLoadSuccess = ({ numPages }: { numPages: number }) => {
    setNumPages(numPages);
    setLoading(false);
    console.log(`📄 PDF loaded successfully: ${numPages} pages`);
  };

  const onDocumentLoadError = (error: Error) => {
    console.error('❌ Error loading PDF:', error);
    setError('שגיאה בטעינת הקובץ - אנא נסה שוב');
    setLoading(false);
  };

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

  const toggleFullscreen = async () => {
    if (!containerRef.current) return;

    try {
      if (!isFullscreen) {
        await containerRef.current.requestFullscreen();
        setIsFullscreen(true);
      } else {
        await document.exitFullscreen();
        setIsFullscreen(false);
      }
    } catch (error) {
      console.warn('Fullscreen not supported or failed:', error);
    }
  };

  const exitFullscreen = async () => {
    try {
      if (document.fullscreenElement) {
        await document.exitFullscreen();
      }
      setIsFullscreen(false);
    } catch (error) {
      console.warn('Exit fullscreen failed:', error);
    }
  };

  const handleDownload = async () => {
    try {
      const response = await fetch(pdfUrl);
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
      window.open(pdfUrl, '_blank');
    }
  };

  const handlePageInputChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const page = parseInt(event.target.value);
    if (page >= 1 && page <= numPages) {
      setPageNumber(page);
    }
  };

  if (!isOpen) return null;

  return (
    <div 
      ref={containerRef}
      className={`fixed inset-0 z-50 bg-black/90 backdrop-blur-sm ${isFullscreen ? 'bg-black' : ''}`}
    >
      <div className="flex flex-col h-full">
        {/* Header */}
        <div className="bg-white border-b border-border p-4 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <h2 className="hebrew-title text-lg font-semibold">{fileName}</h2>
            {!loading && !error && (
              <span className="hebrew-text text-sm text-muted-foreground">
                עמוד {pageNumber} מתוך {numPages}
              </span>
            )}
          </div>
          <div className="flex items-center gap-2">
            <Button variant="outline" onClick={handleDownload} disabled={loading}>
              <Download size={16} />
            </Button>
            <Button variant="outline" onClick={toggleFullscreen}>
              {isFullscreen ? <Minimize size={16} /> : <Maximize size={16} />}
            </Button>
            <Button variant="outline" onClick={onClose}>
              <X size={16} />
            </Button>
          </div>
        </div>

        {/* Controls */}
        {!loading && !error && (
          <div className="bg-white border-b border-border p-3 flex items-center justify-center gap-4">
            <Button
              variant="outline"
              onClick={goToPrevPage}
              disabled={pageNumber <= 1}
            >
              <ChevronRight size={16} />
            </Button>
            
            <div className="flex items-center gap-2">
              <input
                type="number"
                min="1"
                max={numPages}
                value={pageNumber}
                onChange={handlePageInputChange}
                className="w-16 px-2 py-1 text-center border border-border rounded text-sm hebrew-text"
              />
              <span className="hebrew-text text-sm text-muted-foreground">
                / {numPages}
              </span>
            </div>

            <Button
              variant="outline"
              onClick={goToNextPage}
              disabled={pageNumber >= numPages}
            >
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
        )}

        {/* PDF Content */}
        <div className="flex-1 overflow-auto bg-gray-100 flex items-center justify-center p-4">
          {loading && (
            <div className="text-center hebrew-text space-y-4">
              <div className="animate-spin rounded-full h-16 w-16 border-b-4 border-primary mx-auto"></div>
              <div className="text-xl font-medium">טוען קובץ PDF...</div>
            </div>
          )}

          {error && (
            <div className="text-center hebrew-text space-y-4">
              <div className="text-red-600 text-lg font-medium">{error}</div>
              <Button onClick={handleDownload} variant="outline" className="hebrew-text">
                <Download size={16} className="mr-2" />
                הורד קובץ
              </Button>
            </div>
          )}

          {!loading && !error && (
            <Document
              file={pdfUrl}
              onLoadSuccess={onDocumentLoadSuccess}
              onLoadError={onDocumentLoadError}
              loading=""
              error=""
            >
              <Page
                pageNumber={pageNumber}
                scale={scale}
                renderTextLayer={true}
                renderAnnotationLayer={true}
                className="shadow-lg"
              />
            </Document>
          )}
        </div>

        {/* Footer */}
        <div className="bg-white border-t border-border p-2 text-center">
          <span className="hebrew-text text-xs text-muted-foreground">
            השתמש בחיצים לדפדוף, Ctrl+/- לזום, F11 למסך מלא, ESC לסגירה
          </span>
        </div>
      </div>
    </div>
  );
};

export default PDFViewerModal;

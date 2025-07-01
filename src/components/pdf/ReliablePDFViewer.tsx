
import React, { useState, useCallback } from 'react';
import { Document, Page } from 'react-pdf';
import { Button } from '../ui/button';
import { ChevronLeft, ChevronRight, ZoomIn, ZoomOut, Download, ExternalLink } from 'lucide-react';

interface ReliablePDFViewerProps {
  pdfUrl: string;
  fileName: string;
  className?: string;
}

const ReliablePDFViewer = ({ pdfUrl, fileName, className = "" }: ReliablePDFViewerProps) => {
  const [numPages, setNumPages] = useState<number>(0);
  const [pageNumber, setPageNumber] = useState<number>(1);
  const [scale, setScale] = useState<number>(1.0);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  console.log(`📄 ReliablePDFViewer loading: ${pdfUrl}`);

  const onDocumentLoadSuccess = useCallback(({ numPages }: { numPages: number }) => {
    console.log(`✅ PDF loaded successfully with ${numPages} pages`);
    setNumPages(numPages);
    setLoading(false);
    setError(null);
  }, []);

  const onDocumentLoadError = useCallback((error: Error) => {
    console.error('❌ PDF load error:', error);
    setError('שגיאה בטעינת PDF');
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

  const handleDownload = () => {
    const link = document.createElement('a');
    link.href = pdfUrl;
    link.download = fileName.endsWith('.pdf') ? fileName : `${fileName}.pdf`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const openInNewTab = () => {
    window.open(pdfUrl, '_blank', 'noopener,noreferrer');
  };

  if (error) {
    return (
      <div className={`flex flex-col items-center justify-center p-8 bg-gray-50 rounded-lg ${className}`}>
        <div className="text-center space-y-4">
          <div className="text-red-600 hebrew-text text-lg">שגיאה בטעינת PDF</div>
          <div className="text-sm text-gray-600 hebrew-text">{error}</div>
          <div className="flex gap-2 justify-center">
            <Button onClick={openInNewTab} className="hebrew-text">
              <ExternalLink size={16} className="ml-2" />
              פתח בטאב חדש
            </Button>
            <Button variant="outline" onClick={handleDownload} className="hebrew-text">
              <Download size={16} className="ml-2" />
              הורד קובץ
            </Button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={`flex flex-col h-full ${className}`}>
      {/* Header with controls */}
      <div className="bg-white border-b border-border p-4 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <h2 className="hebrew-title text-lg font-semibold">{fileName}</h2>
          {!loading && (
            <span className="hebrew-text text-sm text-muted-foreground">
              עמוד {pageNumber} מתוך {numPages}
            </span>
          )}
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" onClick={handleDownload}>
            <Download size={16} />
          </Button>
        </div>
      </div>

      {/* Navigation and zoom controls */}
      {!loading && (
        <div className="bg-white border-b border-border p-3 flex items-center justify-center gap-4">
          <Button variant="outline" onClick={goToPrevPage} disabled={pageNumber <= 1}>
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
              className="w-16 px-2 py-1 text-center border border-border rounded text-sm hebrew-text"
            />
            <span className="hebrew-text text-sm text-muted-foreground">
              / {numPages}
            </span>
          </div>

          <Button variant="outline" onClick={goToNextPage} disabled={pageNumber >= numPages}>
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

      {/* PDF content */}
      <div className="flex-1 overflow-auto bg-gray-100 p-4">
        {loading && (
          <div className="flex items-center justify-center h-full">
            <div className="text-center space-y-2">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
              <div className="hebrew-text text-sm">טוען PDF...</div>
            </div>
          </div>
        )}
        
        <div className="flex justify-center">
          <Document
            file={pdfUrl}
            onLoadSuccess={onDocumentLoadSuccess}
            onLoadError={onDocumentLoadError}
            className="max-w-full"
            options={{
              cMapUrl: 'https://cdn.jsdelivr.net/npm/pdfjs-dist@4.4.168/cmaps/',
              cMapPacked: true,
            }}
          >
            {!loading && (
              <Page
                pageNumber={pageNumber}
                scale={scale}
                className="shadow-lg"
                renderTextLayer={false}
                renderAnnotationLayer={false}
              />
            )}
          </Document>
        </div>
      </div>
    </div>
  );
};

export default ReliablePDFViewer;

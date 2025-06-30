
import React, { useState, useCallback, useEffect, useRef } from 'react';
import { Document, Page, pdfjs } from 'react-pdf';
import { X, ChevronLeft, ChevronRight, ZoomIn, ZoomOut, Download } from 'lucide-react';
import { Button } from './ui/button';
import { Progress } from './ui/progress';

// Set up PDF.js worker with fallback
try {
  pdfjs.GlobalWorkerOptions.workerSrc = '/pdf.worker.min.js';
} catch {
  pdfjs.GlobalWorkerOptions.workerSrc = `//cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjs.version}/pdf.worker.min.js`;
}

interface PDFViewerProps {
  fileUrl: string;
  fileName: string;
  isOpen: boolean;
  onClose: () => void;
}

interface DocumentCache {
  [key: string]: {
    numPages: number;
    loadedAt: number;
  };
}

const PDFViewer = ({ fileUrl, fileName, isOpen, onClose }: PDFViewerProps) => {
  const [numPages, setNumPages] = useState<number>(0);
  const [pageNumber, setPageNumber] = useState<number>(1);
  const [scale, setScale] = useState<number>(1.0);
  const [loading, setLoading] = useState<boolean>(true);
  const [loadingProgress, setLoadingProgress] = useState<number>(0);
  const [error, setError] = useState<string | null>(null);
  const [pageLoading, setPageLoading] = useState<boolean>(false);
  
  const cacheRef = useRef<DocumentCache>({});
  const loadingIntervalRef = useRef<NodeJS.Timeout | null>(null);

  // Simulate loading progress for better UX
  const simulateLoadingProgress = useCallback(() => {
    setLoadingProgress(0);
    let progress = 0;
    
    loadingIntervalRef.current = setInterval(() => {
      progress += Math.random() * 15;
      if (progress > 90) {
        progress = 90;
      }
      setLoadingProgress(progress);
    }, 100);
  }, []);

  const onDocumentLoadSuccess = useCallback(({ numPages }: { numPages: number }) => {
    setNumPages(numPages);
    setLoading(false);
    setLoadingProgress(100);
    setError(null);
    
    // Cache document info
    cacheRef.current[fileUrl] = {
      numPages,
      loadedAt: Date.now()
    };

    // Clear loading interval
    if (loadingIntervalRef.current) {
      clearInterval(loadingIntervalRef.current);
      loadingIntervalRef.current = null;
    }

    console.log(`PDF loaded successfully: ${numPages} pages`);
  }, [fileUrl]);

  const onDocumentLoadError = useCallback((error: Error) => {
    console.error('Error loading PDF:', error);
    setError('שגיאה בטעינת הקובץ');
    setLoading(false);
    setLoadingProgress(0);
    
    if (loadingIntervalRef.current) {
      clearInterval(loadingIntervalRef.current);
      loadingIntervalRef.current = null;
    }
  }, []);

  const onDocumentLoadProgress = useCallback(({ loaded, total }: { loaded: number; total: number }) => {
    if (total > 0) {
      const progress = (loaded / total) * 100;
      setLoadingProgress(Math.min(progress, 90));
    }
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

  useEffect(() => {
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [handleKeyDown]);

  useEffect(() => {
    if (isOpen) {
      setPageNumber(1);
      setScale(1.0);
      setError(null);
      
      // Check cache first
      const cached = cacheRef.current[fileUrl];
      if (cached && Date.now() - cached.loadedAt < 5 * 60 * 1000) { // 5 minutes cache
        setNumPages(cached.numPages);
        setLoading(false);
        setLoadingProgress(100);
        console.log('Using cached PDF data');
      } else {
        setLoading(true);
        setLoadingProgress(0);
        simulateLoadingProgress();
      }
    }
  }, [isOpen, fileUrl, simulateLoadingProgress]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (loadingIntervalRef.current) {
        clearInterval(loadingIntervalRef.current);
      }
    };
  }, []);

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
              disabled={loading}
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

        {/* Loading Progress */}
        {loading && (
          <div className="bg-white border-b border-border p-3">
            <div className="max-w-md mx-auto">
              <div className="flex items-center gap-3 mb-2">
                <span className="hebrew-text text-sm text-muted-foreground">
                  טוען קובץ...
                </span>
                <span className="hebrew-text text-sm font-medium">
                  {Math.round(loadingProgress)}%
                </span>
              </div>
              <Progress value={loadingProgress} className="h-2" />
            </div>
          </div>
        )}

        {/* Controls */}
        {!loading && !error && (
          <div className="bg-white border-b border-border p-3 flex items-center justify-center gap-4">
            <Button
              variant="outline"
              size="sm"
              onClick={goToPrevPage}
              disabled={pageNumber <= 1 || pageLoading}
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
                disabled={pageLoading}
              />
              <span className="hebrew-text text-sm text-muted-foreground">
                / {numPages || 0}
              </span>
            </div>
            
            <Button
              variant="outline"
              size="sm"
              onClick={goToNextPage}
              disabled={pageNumber >= numPages || pageLoading}
            >
              <ChevronLeft size={16} />
            </Button>
            
            <div className="w-px h-6 bg-border mx-2" />
            
            <Button
              variant="outline"
              size="sm"
              onClick={zoomOut}
              disabled={scale <= 0.5 || pageLoading}
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
              disabled={scale >= 3.0 || pageLoading}
            >
              <ZoomIn size={16} />
            </Button>
          </div>
        )}

        {/* PDF Content */}
        <div className="flex-1 overflow-auto bg-gray-100 flex items-center justify-center p-4">
          {loading && (
            <div className="text-center hebrew-text space-y-4">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
              <div className="space-y-2">
                <div className="hebrew-text text-lg font-medium">טוען קובץ PDF...</div>
                <div className="hebrew-text text-sm text-muted-foreground">
                  אנא המתינו, הקובץ נטען
                </div>
              </div>
            </div>
          )}
          
          {error && (
            <div className="text-center hebrew-text space-y-4">
              <div className="text-red-600 text-lg font-medium">{error}</div>
              <Button 
                variant="outline" 
                onClick={() => window.open(fileUrl, '_blank')}
                className="hebrew-text"
              >
                פתח בטאב חדש
              </Button>
            </div>
          )}
          
          {!loading && !error && (
            <div className="bg-white shadow-lg">
              <Document
                file={fileUrl}
                onLoadSuccess={onDocumentLoadSuccess}
                onLoadError={onDocumentLoadError}
                onLoadProgress={onDocumentLoadProgress}
                loading={null}
              >
                <Page
                  pageNumber={pageNumber}
                  scale={scale}
                  onLoadStart={() => setPageLoading(true)}
                  onLoadSuccess={() => setPageLoading(false)}
                  onLoadError={() => setPageLoading(false)}
                  loading={
                    <div className="p-8 text-center hebrew-text flex items-center justify-center min-h-[400px]">
                      <div className="space-y-2">
                        <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary mx-auto"></div>
                        <div>טוען עמוד {pageNumber}...</div>
                      </div>
                    </div>
                  }
                />
              </Document>
            </div>
          )}
        </div>

        {/* Footer */}
        {!loading && (
          <div className="bg-white border-t border-border p-2 text-center">
            <span className="hebrew-text text-xs text-muted-foreground">
              השתמש בחיצים לדפדוף, + ו - לזום, ESC לסגירה
            </span>
          </div>
        )}
      </div>
    </div>
  );
};

export default PDFViewer;

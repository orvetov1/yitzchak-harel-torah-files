
import React, { useState, useEffect, useCallback, useRef } from 'react';
import { Document, Page, pdfjs } from 'react-pdf';
import { Button } from './ui/button';
import { ChevronLeft, ChevronRight, Download, X, ZoomIn, ZoomOut, RefreshCw } from 'lucide-react';
import { Progress } from './ui/progress';
import { usePDFRangeLoader } from '../hooks/usePDFRangeLoader';
import { usePDFComplexity } from '../hooks/usePDFComplexity';

// Configure PDF.js worker
pdfjs.GlobalWorkerOptions.workerSrc = '/pdf.worker.min.js';

interface OptimizedPDFViewerProps {
  fileUrl: string;
  fileName: string;
  isOpen: boolean;
  onClose: () => void;
}

const OptimizedPDFViewer = ({ fileUrl, fileName, isOpen, onClose }: OptimizedPDFViewerProps) => {
  const [numPages, setNumPages] = useState<number>(0);
  const [pageNumber, setPageNumber] = useState<number>(1);
  const [scale, setScale] = useState<number>(1.0);
  const [loading, setLoading] = useState<boolean>(true);
  const [loadingProgress, setLoadingProgress] = useState<number>(0);
  const [loadingPhase, setLoadingPhase] = useState<string>('');
  const [error, setError] = useState<string | null>(null);
  const [pageLoading, setPageLoading] = useState<boolean>(false);
  const [pdfData, setPdfData] = useState<ArrayBuffer | null>(null);
  const [useRangeLoading, setUseRangeLoading] = useState<boolean>(false);

  const containerRef = useRef<HTMLDivElement>(null);
  const { analyzeComplexity, getOptimizedSettings } = usePDFComplexity();
  const { state: rangeState, checkRangeSupport, loadInitialChunk, loadRange, cancelLoading: cancelRangeLoading } = usePDFRangeLoader(fileUrl);

  // Initialize PDF loading strategy
  useEffect(() => {
    if (!isOpen) return;

    const initializeLoading = async () => {
      setLoading(true);
      setLoadingProgress(0);
      setLoadingPhase('בודק תמיכה ב-Range Requests...');
      setError(null);

      try {
        // Check if range requests are supported
        const rangeSupported = await checkRangeSupport();
        
        if (rangeSupported) {
          console.log('✅ Range requests supported, using progressive loading');
          setUseRangeLoading(true);
          setLoadingPhase('טוען חלק ראשון של הקובץ...');
          setLoadingProgress(10);
          
          // Load initial chunk
          const initialChunk = await loadInitialChunk();
          if (initialChunk) {
            setPdfData(initialChunk);
            setLoadingProgress(30);
            setLoadingPhase('מעבד את החלק הראשון...');
          } else {
            throw new Error('Failed to load initial chunk');
          }
        } else {
          console.log('⚠️ Range requests not supported, falling back to full download');
          setUseRangeLoading(false);
          setLoadingPhase('מוריד קובץ מלא...');
          setLoadingProgress(10);
          
          // Fallback to full file download
          const response = await fetch(fileUrl);
          const totalSize = parseInt(response.headers.get('Content-Length') || '0');
          
          if (!response.body) {
            throw new Error('No response body');
          }

          const reader = response.body.getReader();
          const chunks: Uint8Array[] = [];
          let receivedLength = 0;

          while (true) {
            const { done, value } = await reader.read();
            if (done) break;

            chunks.push(value);
            receivedLength += value.length;

            if (totalSize > 0) {
              const progress = Math.min((receivedLength / totalSize) * 80, 80);
              setLoadingProgress(10 + progress);
              setLoadingPhase(`מוריד: ${Math.round(receivedLength / 1024)}KB מתוך ${Math.round(totalSize / 1024)}KB`);
            }
          }

          const fullBuffer = new Uint8Array(receivedLength);
          let position = 0;
          for (const chunk of chunks) {
            fullBuffer.set(chunk, position);
            position += chunk.length;
          }

          setPdfData(fullBuffer.buffer);
          setLoadingProgress(90);
          setLoadingPhase('מכין לתצוגה...');
        }
      } catch (err) {
        console.error('❌ PDF loading failed:', err);
        setError('שגיאה בטעינת הקובץ - אנא נסה שוב');
        setLoading(false);
      }
    };

    initializeLoading();

    return () => {
      cancelRangeLoading();
    };
  }, [isOpen, fileUrl, checkRangeSupport, loadInitialChunk, cancelRangeLoading]);

  const onDocumentLoadSuccess = useCallback(({ numPages }: { numPages: number }) => {
    console.log(`✅ PDF loaded successfully with ${numPages} pages`);
    setNumPages(numPages);
    setLoading(false);
    setLoadingProgress(100);
    setLoadingPhase('');
    setError(null);
  }, []);

  const onDocumentLoadError = useCallback((error: Error) => {
    console.error('❌ PDF document load error:', error);
    setError('שגיאה בטעינת הקובץ - אנא נסה שוב');
    setLoading(false);
    setLoadingProgress(0);
  }, []);

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
      window.open(fileUrl, '_blank');
    }
  };

  const goToPrevPage = () => setPageNumber(prev => Math.max(1, prev - 1));
  const goToNextPage = () => setPageNumber(prev => Math.min(numPages, prev + 1));
  const zoomIn = () => setScale(prev => Math.min(3.0, prev + 0.2));
  const zoomOut = () => setScale(prev => Math.max(0.5, prev - 0.2));

  const handlePageInputChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const page = parseInt(event.target.value);
    if (page >= 1 && page <= numPages) {
      setPageNumber(page);
    }
  };

  const retryLoading = () => {
    setPdfData(null);
    setError(null);
    // Re-trigger loading by changing a dependency
    setPageNumber(1);
  };

  if (!isOpen) return null;

  // Get optimized settings based on file complexity
  const complexity = analyzeComplexity(rangeState.totalSize || 0, numPages);
  const optimizedOptions = getOptimizedSettings(complexity);

  return (
    <div 
      ref={containerRef}
      className="fixed inset-0 z-50 bg-black/90 backdrop-blur-sm"
    >
      <div className="flex flex-col h-full">
        {/* Header */}
        <div className="bg-white border-b border-border p-4 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <h2 className="hebrew-title text-lg font-semibold">{fileName}</h2>
            {!loading && !error && numPages > 0 && (
              <div className="flex items-center gap-2">
                <span className="hebrew-text text-sm text-muted-foreground">
                  עמוד {pageNumber} מתוך {numPages}
                </span>
                {useRangeLoading && (
                  <span className="hebrew-text text-xs text-green-600 bg-green-50 px-2 py-1 rounded">
                    טעינה מתקדמת
                  </span>
                )}
              </div>
            )}
            {rangeState.totalSize > 0 && (
              <span className="hebrew-text text-xs text-muted-foreground">
                ({Math.round(rangeState.totalSize / 1024)}KB)
              </span>
            )}
          </div>
          <div className="flex items-center gap-2">
            <Button variant="outline" onClick={handleDownload} disabled={loading}>
              <Download size={16} />
            </Button>
            <Button variant="outline" onClick={onClose}>
              <X size={16} />
            </Button>
          </div>
        </div>

        {/* Progress Bar */}
        {loading && (
          <div className="bg-white border-b border-border p-4">
            <div className="max-w-md mx-auto space-y-3">
              <div className="flex items-center justify-between">
                <span className="hebrew-text text-sm font-medium">
                  {loadingPhase || 'טוען קובץ...'}
                </span>
                <span className="hebrew-text text-lg font-bold">
                  {Math.round(loadingProgress)}%
                </span>
              </div>
              <Progress value={loadingProgress} className="h-2" />
              {useRangeLoading && (
                <div className="hebrew-text text-xs text-blue-600">
                  ✨ משתמש בטעינה מתקדמת - עמודים נטענים לפי הצורך
                </div>
              )}
            </div>
          </div>
        )}

        {/* Controls */}
        {!loading && !error && numPages > 0 && (
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
                onChange={handlePageInputChange}
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

        {/* PDF Content */}
        <div className="flex-1 overflow-auto bg-gray-100 flex items-center justify-center p-4">
          {loading ? (
            <div className="text-center hebrew-text space-y-4 p-8">
              <div className="animate-spin rounded-full h-16 w-16 border-b-4 border-primary mx-auto"></div>
              <div className="space-y-2">
                <div className="hebrew-text text-xl font-medium">
                  {loadingPhase || 'מכין את הקובץ...'}
                </div>
                <div className="hebrew-text text-sm text-muted-foreground">
                  {useRangeLoading ? 'טעינה מתקדמת מופעלת' : 'טעינה רגילה'}
                </div>
              </div>
            </div>
          ) : error ? (
            <div className="text-center hebrew-text space-y-6 p-8 max-w-md mx-auto">
              <div className="space-y-3">
                <div className="text-red-600 text-lg font-medium">{error}</div>
                <div className="text-sm text-muted-foreground">
                  אנא נסה שוב או הורד את הקובץ למחשב
                </div>
              </div>
              
              <div className="flex flex-col gap-2">
                <Button variant="default" onClick={retryLoading} className="hebrew-text">
                  <RefreshCw size={16} className="ml-2" />
                  נסה שוב
                </Button>
                <Button variant="outline" onClick={handleDownload} className="hebrew-text">
                  <Download size={16} className="ml-2" />
                  הורד קובץ
                </Button>
              </div>
            </div>
          ) : pdfData ? (
            <div className="bg-white shadow-lg">
              <Document
                file={pdfData}
                onLoadSuccess={onDocumentLoadSuccess}
                onLoadError={onDocumentLoadError}
                loading={null}
                options={optimizedOptions}
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
                        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
                        <div>טוען עמוד {pageNumber}...</div>
                      </div>
                    </div>
                  }
                  renderTextLayer={complexity.estimatedComplexity !== 'complex'}
                  renderAnnotationLayer={complexity.estimatedComplexity === 'simple'}
                />
              </Document>
            </div>
          ) : null}
        </div>

        {/* Footer */}
        <div className="bg-white border-t border-border p-2 text-center">
          <span className="hebrew-text text-xs text-muted-foreground">
            השתמש בחיצים לדפדוף, +/- לזום, ESC לסגירה
            {pageLoading && ' • טוען עמוד...'}
            {useRangeLoading && ' • טעינה מתקדמת פעילה'}
          </span>
        </div>
      </div>
    </div>
  );
};

export default OptimizedPDFViewer;

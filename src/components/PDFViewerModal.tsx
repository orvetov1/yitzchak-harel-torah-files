import React, { useState, useEffect, useRef } from 'react';
import { Button } from './ui/button';
import { ChevronLeft, ChevronRight, Download, X, Maximize, Minimize, ZoomIn, ZoomOut } from 'lucide-react';
import { usePDFViewer } from '../hooks/usePDFViewer';
import PDFViewerContent from './PDFViewerContent';
import PDFViewerProgress from './PDFViewerProgress';
import { usePDFOptimization } from '../hooks/usePDFOptimization';
import { usePDFLinearization } from '../hooks/usePDFLinearization';
import EnhancedPDFViewer from './EnhancedPDFViewer';
import PDFWithSuspense from './PDFWithSuspense';

interface PDFViewerModalProps {
  pdfUrl: string;
  fileName: string;
  isOpen: boolean;
  onClose: () => void;
  pdfFileId?: string; // Add optional PDF file ID for optimization
}

const PDFViewerModal = ({ pdfUrl, fileName, isOpen, onClose, pdfFileId }: PDFViewerModalProps) => {
  const [isFullscreen, setIsFullscreen] = useState<boolean>(false);
  const [useEnhancedViewer, setUseEnhancedViewer] = useState<boolean>(true);
  const containerRef = useRef<HTMLDivElement>(null);

  // Add linearization hook
  const linearizationState = usePDFLinearization(pdfUrl, pdfFileId);
  const effectiveUrl = linearizationState.getBestUrl();

  // Use the enhanced viewer by default, fallback to original if needed
  if (useEnhancedViewer && isOpen) {
    return (
      <PDFWithSuspense>
        <EnhancedPDFViewer
          fileUrl={pdfUrl}
          fileName={fileName}
          isOpen={isOpen}
          onClose={onClose}
          pdfFileId={pdfFileId}
        />
      </PDFWithSuspense>
    );
  }

  const {
    numPages,
    pageNumber,
    scale,
    loading,
    loadingProgress,
    error,
    pageLoading,
    fileSize,
    waitingForUser,
    loadingPhase,
    loadingStage,
    setPageLoading,
    onDocumentLoadSuccess,
    onDocumentLoadError,
    onDocumentLoadProgress,
    onProcessingStart,
    goToPrevPage,
    goToNextPage,
    zoomIn,
    zoomOut,
    setPage,
    cancelLoading,
    retryLoading,
    continueWaiting
  } = usePDFViewer(effectiveUrl, isOpen);

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
  }, [isOpen, isFullscreen, goToPrevPage, goToNextPage, zoomIn, zoomOut]);

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
      setPage(page);
    }
  };

  if (!isOpen) return null;

  return (
    <PDFWithSuspense>
      <div 
        ref={containerRef}
        className={`fixed inset-0 z-50 bg-black/90 backdrop-blur-sm ${isFullscreen ? 'bg-black' : ''}`}
      >
        <div className="flex flex-col h-full">
          {/* Header */}
          <div className="bg-white border-b border-border p-4 flex items-center justify-between">
            <div className="flex items-center gap-4">
              <h2 className="hebrew-title text-lg font-semibold">{fileName}</h2>
              {!loading && !error && numPages > 0 && (
                <span className="hebrew-text text-sm text-muted-foreground">
                  עמוד {pageNumber} מתוך {numPages}
                </span>
              )}
              {fileSize > 0 && (
                <span className="hebrew-text text-xs text-muted-foreground">
                  ({Math.round(fileSize / 1024)}KB)
                </span>
              )}
              {/* Enhanced viewer toggle */}
              <Button
                variant="outline"
                size="sm"
                onClick={() => setUseEnhancedViewer(!useEnhancedViewer)}
                className="hebrew-text text-xs"
              >
                {useEnhancedViewer ? '📊 רגיל' : '✨ משופר'}
              </Button>
              {/* Linearization status indicator */}
              {linearizationState.hasLinearizedVersion && (
                <span className="hebrew-text text-xs text-green-600 bg-green-50 px-2 py-1 rounded">
                  ✨ גרסה לינארית ({linearizationState.compressionRatio?.toFixed(1)}% חיסכון)
                </span>
              )}
              {linearizationState.isLinearizing && (
                <span className="hebrew-text text-xs text-blue-600 bg-blue-50 px-2 py-1 rounded animate-pulse">
                  🔄 יוצר גרסה לינארית...
                </span>
              )}
            </div>
            <div className="flex items-center gap-2">
              {/* Add linearization button if not linearized yet */}
              {!linearizationState.hasLinearizedVersion && !linearizationState.isLinearizing && pdfFileId && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={linearizationState.requestLinearization}
                  className="hebrew-text text-xs"
                  disabled={loading}
                >
                  ⚡ צור לינארי
                </Button>
              )}
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

          {/* Progress Bar - shown during loading */}
          {(loading || waitingForUser) && (
            <PDFViewerProgress
              loadingProgress={loadingProgress}
              fileSize={fileSize}
              waitingForUser={waitingForUser}
              loadingPhase={loadingPhase}
              onCancel={cancelLoading}
              onContinue={continueWaiting}
            />
          )}

          {/* Show optimization info if using optimized version */}
          {linearizationState.hasLinearizedVersion && !loading && (
            <div className="bg-green-50 border-b border-green-200 px-4 py-2">
              <div className="hebrew-text text-sm text-green-800 text-center">
                ✨ משתמש בגרסה לינארית - 
                חיסכון של {linearizationState.compressionRatio?.toFixed(1)}% בגודל הקובץ
                ({Math.round((linearizationState.originalSize || 0) / 1024)}KB → {Math.round((linearizationState.optimizedSize || 0) / 1024)}KB)
              </div>
            </div>
          )}

          {/* Controls - shown when PDF is loaded */}
          {!loading && !error && numPages > 0 && (
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

              {loadingStage !== 'complete' && (
                <div className="flex items-center gap-2 ml-4">
                  <div className="hebrew-text text-xs text-muted-foreground">
                    {loadingStage === 'downloading' && 'מוריד...'}
                    {loadingStage === 'processing' && 'מעבד...'}
                    {loadingStage === 'rendering' && 'מכין תצוגה...'}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* PDF Content */}
          <div className="flex-1 overflow-auto bg-gray-100 flex items-center justify-center p-4">
            <PDFViewerContent
              fileUrl={effectiveUrl}
              fileSize={fileSize}
              pageNumber={pageNumber}
              scale={scale}
              loading={loading}
              error={error}
              setPageLoading={setPageLoading}
              onDocumentLoadSuccess={onDocumentLoadSuccess}
              onDocumentLoadError={onDocumentLoadError}
              onDocumentLoadProgress={onDocumentLoadProgress}
              onRetry={retryLoading}
              onProcessingStart={onProcessingStart}
            />
          </div>

          {/* Footer */}
          <div className="bg-white border-t border-border p-2 text-center">
            <span className="hebrew-text text-xs text-muted-foreground">
              השתמש בחיצים לדפדוף, Ctrl+/- לזום, F11 למסך מלא, ESC לסגירה
              {pageLoading && ' • טוען עמוד...'}
              {linearizationState.hasLinearizedVersion && ' • גרסה לינארית פעילה'}
            </span>
          </div>
        </div>
      </div>
    </PDFWithSuspense>
  );
};

export default PDFViewerModal;

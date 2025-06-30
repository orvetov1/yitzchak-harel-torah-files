
import React, { useCallback, useEffect } from 'react';
import PDFViewerHeader from './PDFViewerHeader';
import PDFViewerProgress from './PDFViewerProgress';
import PDFViewerControls from './PDFViewerControls';
import PDFViewerContent from './PDFViewerContent';
import { usePDFViewer } from '../hooks/usePDFViewer';

interface PDFViewerProps {
  fileUrl: string;
  fileName: string;
  isOpen: boolean;
  onClose: () => void;
}

const PDFViewer = ({ fileUrl, fileName, isOpen, onClose }: PDFViewerProps) => {
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
    setPageLoading,
    onDocumentLoadSuccess,
    onDocumentLoadError,
    onDocumentLoadProgress,
    goToPrevPage,
    goToNextPage,
    zoomIn,
    zoomOut,
    setPage,
    cancelLoading,
    retryLoading,
    continueWaiting
  } = usePDFViewer(fileUrl, isOpen);

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
      // Fallback to opening in new tab
      window.open(fileUrl, '_blank');
    }
  };

  const handleCancel = () => {
    cancelLoading();
    onClose();
  };

  const handleKeyDown = useCallback((event: KeyboardEvent) => {
    if (!isOpen) return;
    
    switch (event.key) {
      case 'Escape':
        if (loading) {
          handleCancel();
        } else {
          onClose();
        }
        break;
      case 'ArrowLeft':
        if (!loading) goToPrevPage();
        break;
      case 'ArrowRight':
        if (!loading) goToNextPage();
        break;
      case '+':
        if (!loading) {
          event.preventDefault();
          zoomIn();
        }
        break;
      case '-':
        if (!loading) {
          event.preventDefault();
          zoomOut();
        }
        break;
    }
  }, [isOpen, loading, onClose, goToPrevPage, goToNextPage, zoomIn, zoomOut, handleCancel]);

  useEffect(() => {
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [handleKeyDown]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm">
      <div className="flex flex-col h-full">
        <PDFViewerHeader
          fileName={fileName}
          pageNumber={pageNumber}
          numPages={numPages}
          loading={loading}
          error={error}
          onClose={loading ? handleCancel : onClose}
          onDownload={handleDownload}
        />

        {loading && (
          <PDFViewerProgress 
            loadingProgress={loadingProgress}
            fileSize={fileSize}
            waitingForUser={waitingForUser}
            onCancel={handleCancel}
            onContinue={continueWaiting}
          />
        )}

        {!loading && !error && (
          <PDFViewerControls
            pageNumber={pageNumber}
            numPages={numPages}
            scale={scale}
            pageLoading={pageLoading}
            onPrevPage={goToPrevPage}
            onNextPage={goToNextPage}
            onZoomIn={zoomIn}
            onZoomOut={zoomOut}
            onPageChange={setPage}
          />
        )}

        <div className="flex-1 overflow-auto bg-gray-100 flex items-center justify-center p-4">
          <PDFViewerContent
            fileUrl={fileUrl}
            pageNumber={pageNumber}
            scale={scale}
            loading={loading}
            error={error}
            fileSize={fileSize}
            setPageLoading={setPageLoading}
            onDocumentLoadSuccess={onDocumentLoadSuccess}
            onDocumentLoadError={onDocumentLoadError}
            onDocumentLoadProgress={onDocumentLoadProgress}
            onRetry={retryLoading}
          />
        </div>

        {!loading && (
          <div className="bg-white border-t border-border p-2 text-center">
            <span className="hebrew-text text-xs text-muted-foreground">
              השתמש בחיצים לדפדוף, + ו - לזום, ESC לסגירה • טעינה מותאמת לביצועים
            </span>
          </div>
        )}
      </div>
    </div>
  );
};

export default PDFViewer;

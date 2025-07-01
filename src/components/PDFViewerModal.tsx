
import React, { useState, useEffect, useRef } from 'react';
import { usePDFViewer } from '../hooks/usePDFViewer';
import PDFViewerContent from './PDFViewerContent';
import PDFViewerProgress from './PDFViewerProgress';
import { usePDFLinearization } from '../hooks/usePDFLinearization';
import EnhancedPDFViewer from './EnhancedPDFViewer';
import PDFWithSuspense from './PDFWithSuspense';
import PDFModalContainer from './pdf/PDFModalContainer';
import PDFModalHeader from './pdf/PDFModalHeader';
import PDFModalControls from './pdf/PDFModalControls';
import PDFOptimizationBanner from './pdf/PDFOptimizationBanner';
import PDFModalFooter from './pdf/PDFModalFooter';

interface PDFViewerModalProps {
  pdfUrl: string;
  fileName: string;
  isOpen: boolean;
  onClose: () => void;
  pdfFileId?: string;
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

  if (!isOpen) return null;

  return (
    <PDFWithSuspense>
      <PDFModalContainer 
        isFullscreen={isFullscreen} 
        containerRef={containerRef}
      >
        {/* Header */}
        <PDFModalHeader
          fileName={fileName}
          currentPage={pageNumber}
          totalPages={numPages}
          fileSize={fileSize}
          loading={loading}
          error={error}
          isFullscreen={isFullscreen}
          useEnhancedViewer={useEnhancedViewer}
          hasLinearizedVersion={linearizationState.hasLinearizedVersion}
          isLinearizing={linearizationState.isLinearizing}
          compressionRatio={linearizationState.compressionRatio}
          canRequestLinearization={!linearizationState.hasLinearizedVersion && !linearizationState.isLinearizing && !!pdfFileId}
          onDownload={handleDownload}
          onClose={onClose}
          onToggleFullscreen={toggleFullscreen}
          onToggleViewer={() => setUseEnhancedViewer(!useEnhancedViewer)}
          onRequestLinearization={linearizationState.requestLinearization}
        />

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
        <PDFOptimizationBanner
          hasLinearizedVersion={linearizationState.hasLinearizedVersion && !loading}
          compressionRatio={linearizationState.compressionRatio}
          originalSize={linearizationState.originalSize}
          optimizedSize={linearizationState.optimizedSize}
        />

        {/* Controls - shown when PDF is loaded */}
        {!loading && !error && numPages > 0 && (
          <PDFModalControls
            currentPage={pageNumber}
            totalPages={numPages}
            scale={scale}
            loadingStage={loadingStage}
            onPrevPage={goToPrevPage}
            onNextPage={goToNextPage}
            onPageChange={setPage}
            onZoomIn={zoomIn}
            onZoomOut={zoomOut}
          />
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
        <PDFModalFooter
          pageLoading={pageLoading}
          hasLinearizedVersion={linearizationState.hasLinearizedVersion}
        />
      </PDFModalContainer>
    </PDFWithSuspense>
  );
};

export default PDFViewerModal;

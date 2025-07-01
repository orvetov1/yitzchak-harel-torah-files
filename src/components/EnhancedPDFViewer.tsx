
import React, { useState, useEffect, useCallback, useRef } from 'react';
import { usePDFLinearization } from '../hooks/usePDFLinearization';
import { usePDFPages } from '../hooks/usePDFPages';
import VirtualPDFViewer from './VirtualPDFViewer';
import PDFViewerHeader from './pdf/PDFViewerHeader';
import PDFViewerControls from './pdf/PDFViewerControls';
import PDFLinearizationBadge from './pdf/PDFLinearizationBadge';
import PDFStatusBanner from './pdf/PDFStatusBanner';
import PDFDocumentRenderer from './pdf/PDFDocumentRenderer';
import PDFViewerFooter from './pdf/PDFViewerFooter';
import '../utils/pdfWorkerLoader';

interface EnhancedPDFViewerProps {
  fileUrl: string;
  fileName: string;
  isOpen: boolean;
  onClose: () => void;
  pdfFileId?: string;
}

const EnhancedPDFViewer = ({ fileUrl, fileName, isOpen, onClose, pdfFileId }: EnhancedPDFViewerProps) => {
  const [viewMode, setViewMode] = useState<'hybrid' | 'pages' | 'full' | 'virtual'>('virtual');
  const [currentPage, setCurrentPage] = useState(1);
  const [scale, setScale] = useState(1.0);
  const [numPages, setNumPages] = useState(0);
  const [loadingStrategy, setLoadingStrategy] = useState<'auto' | 'range' | 'pages' | 'virtual'>('virtual');
  
  const containerRef = useRef<HTMLDivElement>(null);
  
  // Use linearization hook
  const linearization = usePDFLinearization(fileUrl, pdfFileId);
  
  // Use pages hook for split PDF functionality
  const { pages, fileInfo, isLoading: pagesLoading } = usePDFPages(pdfFileId || '');

  // Smart strategy selection with new virtual option as default
  useEffect(() => {
    if (!isOpen) return;

    const selectOptimalStrategy = async () => {
      // Prefer virtual scrolling with lazy loading as the default
      if (pdfFileId) {
        setViewMode('virtual');
        setLoadingStrategy('virtual');
        console.log('📊 Using virtual scrolling with lazy loading');
        return;
      }

      // If we have linearized version, prefer hybrid approach
      if (linearization.hasLinearizedVersion) {
        setViewMode('hybrid');
        setLoadingStrategy('range');
        console.log('📊 Using hybrid strategy with linearized PDF');
        return;
      }

      // If we have split pages, use page-by-page loading
      if (pages.length > 0) {
        setViewMode('pages');
        setLoadingStrategy('pages');
        console.log('📊 Using page-by-page strategy');
        return;
      }

      // Fallback to full loading
      setViewMode('full');
      setLoadingStrategy('auto');
      console.log('📊 Using full loading strategy');
    };

    selectOptimalStrategy();
  }, [isOpen, linearization.hasLinearizedVersion, pages.length, pdfFileId]);

  const handleLinearizeRequest = useCallback(async () => {
    if (linearization.isLinearizing) return;
    await linearization.requestLinearization();
  }, [linearization]);

  const goToPrevPage = () => setCurrentPage(prev => Math.max(1, prev - 1));
  const goToNextPage = () => setCurrentPage(prev => Math.min(fileInfo?.numPagesTotal || numPages || 1, prev + 1));
  const zoomIn = () => setScale(prev => Math.min(3.0, prev + 0.2));
  const zoomOut = () => setScale(prev => Math.max(0.5, prev - 0.2));

  const handleDownload = useCallback(() => {
    window.open(fileUrl, '_blank');
  }, [fileUrl]);

  const handleDocumentLoadSuccess = useCallback((pdf: { numPages: number }) => {
    // Handle document load success
  }, []);

  const handleDocumentLoadError = useCallback((error: Error) => {
    console.error('❌ Error loading PDF:', error);
  }, []);

  if (!isOpen) return null;

  const totalPages = fileInfo?.numPagesTotal || pages.length || numPages || 1;

  // If using virtual mode, render minimal wrapper
  if (viewMode === 'virtual' && pdfFileId) {
    return (
      <div 
        ref={containerRef}
        className="fixed inset-0 z-50 bg-black/90 backdrop-blur-sm"
      >
        <div className="flex flex-col h-full">
          {/* Minimal header for virtual mode */}
          <PDFViewerHeader
            fileName={fileName}
            currentPage={currentPage}
            totalPages={totalPages}
            onDownload={handleDownload}
            onClose={onClose}
            canLinearize={false}
            isLinearizing={linearization.isLinearizing}
            linearizationBadge={
              <PDFLinearizationBadge
                viewMode={viewMode}
                hasLinearizedVersion={linearization.hasLinearizedVersion}
                isLinearizing={linearization.isLinearizing}
                compressionRatio={linearization.compressionRatio}
                pagesLength={pages.length}
              />
            }
          />

          {/* Virtual content */}
          <div className="flex-1">
            <VirtualPDFViewer pdfFileId={pdfFileId} onClose={onClose} />
          </div>
        </div>
      </div>
    );
  }

  return (
    <div 
      ref={containerRef}
      className="fixed inset-0 z-50 bg-black/90 backdrop-blur-sm"
    >
      <div className="flex flex-col h-full">
        {/* Header */}
        <PDFViewerHeader
          fileName={fileName}
          currentPage={currentPage}
          totalPages={totalPages}
          onDownload={handleDownload}
          onClose={onClose}
          onLinearizeRequest={handleLinearizeRequest}
          canLinearize={!linearization.hasLinearizedVersion && !linearization.isLinearizing && !!pdfFileId}
          isLinearizing={linearization.isLinearizing}
          linearizationBadge={
            <PDFLinearizationBadge
              viewMode={viewMode}
              hasLinearizedVersion={linearization.hasLinearizedVersion}
              isLinearizing={linearization.isLinearizing}
              compressionRatio={linearization.compressionRatio}
              pagesLength={pages.length}
            />
          }
        />

        {/* Status banners */}
        <PDFStatusBanner
          isLinearizing={linearization.isLinearizing}
          hasLinearizedVersion={linearization.hasLinearizedVersion}
          compressionRatio={linearization.compressionRatio}
          originalSize={linearization.originalSize}
          linearizedSize={linearization.linearizedSize}
        />

        {/* Controls */}
        {viewMode !== 'virtual' && (
          <PDFViewerControls
            currentPage={currentPage}
            totalPages={totalPages}
            scale={scale}
            viewMode={viewMode}
            onPrevPage={goToPrevPage}
            onNextPage={goToNextPage}
            onPageChange={setCurrentPage}
            onZoomIn={zoomIn}
            onZoomOut={zoomOut}
            onViewModeChange={setViewMode}
          />
        )}

        {/* PDF Content */}
        <div className="flex-1 overflow-auto bg-gray-100 flex items-center justify-center p-4">
          <PDFDocumentRenderer
            viewMode={viewMode}
            currentPage={currentPage}
            scale={scale}
            effectiveUrl={linearization.getBestUrl()}
            pages={pages}
            onLoadSuccess={handleDocumentLoadSuccess}
            onLoadError={handleDocumentLoadError}
            setNumPages={setNumPages}
          />
        </div>

        {/* Footer */}
        <PDFViewerFooter
          hasLinearizedVersion={linearization.hasLinearizedVersion}
          viewMode={viewMode}
        />
      </div>
    </div>
  );
};

export default EnhancedPDFViewer;

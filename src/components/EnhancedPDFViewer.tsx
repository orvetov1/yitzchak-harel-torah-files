
import React, { useState, useEffect, useCallback, useRef } from 'react';
import { usePDFLinearization } from '../hooks/usePDFLinearization';
import { usePDFPages } from '../hooks/usePDFPages';
import VirtualPDFViewer from './VirtualPDFViewer';
import PDFViewerModal from './pdf/PDFViewerModal';
import PDFViewerHeader from './pdf/PDFViewerHeader';
import PDFViewerControls from './pdf/PDFViewerControls';
import PDFViewerContent from './pdf/PDFViewerContent';
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
  const [viewMode, setViewMode] = useState<'virtual' | 'standard'>('virtual');
  const [currentPage, setCurrentPage] = useState(1);
  const [scale, setScale] = useState(1.0);
  const [numPages, setNumPages] = useState(0);
  
  const containerRef = useRef<HTMLDivElement>(null);
  const linearization = usePDFLinearization(fileUrl, pdfFileId);
  const { pages, fileInfo } = usePDFPages(pdfFileId || '');

  // Smart strategy selection - prefer virtual mode when possible
  useEffect(() => {
    if (!isOpen) return;

    console.log('🔍 PDF Strategy Selection:');
    console.log('- pdfFileId:', pdfFileId);
    console.log('- hasLinearizedVersion:', linearization.hasLinearizedVersion);
    console.log('- pages.length:', pages.length);

    // Default to virtual mode if we have pdfFileId
    if (pdfFileId) {
      setViewMode('virtual');
      console.log('✅ Using virtual scrolling mode');
    } else {
      setViewMode('standard');
      console.log('✅ Using standard PDF viewer mode');
    }
  }, [isOpen, pdfFileId, linearization.hasLinearizedVersion, pages.length]);

  const handleLinearizeRequest = useCallback(async () => {
    if (linearization.isLinearizing) return;
    await linearization.requestLinearization();
  }, [linearization]);

  const goToPrevPage = () => setCurrentPage(prev => Math.max(1, prev - 1));
  const goToNextPage = () => setCurrentPage(prev => Math.min(fileInfo?.numPagesTotal || numPages || 1, prev + 1));
  const zoomIn = () => setScale(prev => Math.min(3.0, prev + 0.2));
  const zoomOut = () => setScale(prev => Math.max(0.5, prev - 0.2));

  const handlePageChange = (page: number) => setCurrentPage(page);

  const handlePDFLoadSuccess = (pdf: any) => {
    setNumPages(pdf.numPages);
    console.log(`✅ PDF loaded with ${pdf.numPages} pages`);
  };

  const handlePDFLoadError = (error: any) => {
    console.error('❌ Error loading PDF:', error);
  };

  // Virtual mode - single clean viewer
  if (viewMode === 'virtual' && pdfFileId) {
    return (
      <PDFViewerModal isOpen={isOpen}>
        <PDFViewerHeader
          fileName={fileName}
          currentPage={0}
          totalPages={0}
          viewMode={viewMode}
          hasLinearizedVersion={linearization.hasLinearizedVersion || false}
          isLinearizing={linearization.isLinearizing}
          compressionRatio={linearization.compressionRatio}
          pdfFileId={pdfFileId}
          fileUrl={fileUrl}
          onClose={onClose}
          onLinearizeRequest={handleLinearizeRequest}
        />
        <div className="flex-1">
          <VirtualPDFViewer pdfFileId={pdfFileId} onClose={onClose} />
        </div>
      </PDFViewerModal>
    );
  }

  // Standard mode fallback
  const totalPages = fileInfo?.numPagesTotal || numPages || 1;
  const effectiveUrl = linearization.getBestUrl();

  return (
    <PDFViewerModal isOpen={isOpen}>
      <PDFViewerHeader
        fileName={fileName}
        currentPage={currentPage}
        totalPages={totalPages}
        viewMode={viewMode}
        hasLinearizedVersion={linearization.hasLinearizedVersion || false}
        isLinearizing={linearization.isLinearizing}
        compressionRatio={linearization.compressionRatio}
        pdfFileId={pdfFileId}
        fileUrl={fileUrl}
        onClose={onClose}
        onLinearizeRequest={handleLinearizeRequest}
      />

      <PDFViewerControls
        currentPage={currentPage}
        totalPages={totalPages}
        scale={scale}
        onPrevPage={goToPrevPage}
        onNextPage={goToNextPage}
        onZoomIn={zoomIn}
        onZoomOut={zoomOut}
        onPageChange={handlePageChange}
      />

      <PDFViewerContent
        effectiveUrl={effectiveUrl}
        currentPage={currentPage}
        scale={scale}
        onLoadSuccess={handlePDFLoadSuccess}
        onLoadError={handlePDFLoadError}
      />

      <PDFViewerFooter hasLinearizedVersion={linearization.hasLinearizedVersion || false} />
    </PDFViewerModal>
  );
};

export default EnhancedPDFViewer;

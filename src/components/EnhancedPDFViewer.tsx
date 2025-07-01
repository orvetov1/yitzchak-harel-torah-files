
import React, { useState, useEffect, useCallback, useRef } from 'react';
import { Document, Page } from 'react-pdf';
import { Button } from './ui/button';
import { ChevronLeft, ChevronRight, Download, X, ZoomIn, ZoomOut, Zap } from 'lucide-react';
import { usePDFLinearization } from '../hooks/usePDFLinearization';
import { usePDFPages } from '../hooks/usePDFPages';
import { Badge } from './ui/badge';
import VirtualPDFViewer from './VirtualPDFViewer';
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

  const renderStrategyBadge = () => {
    if (viewMode === 'virtual') {
      return (
        <Badge variant="default" className="bg-purple-100 text-purple-800 border-purple-200">
          🚀 Canvas rendering פעיל
        </Badge>
      );
    }

    if (linearization.hasLinearizedVersion) {
      return (
        <Badge variant="default" className="bg-green-100 text-green-800 border-green-200">
          ✨ לינארי ({linearization.compressionRatio?.toFixed(1)}% חיסכון)
        </Badge>
      );
    }
    
    if (linearization.isLinearizing) {
      return (
        <Badge variant="secondary" className="bg-blue-100 text-blue-800 border-blue-200 animate-pulse">
          🔄 מייצר גרסה לינארית...
        </Badge>
      );
    }

    return (
      <Badge variant="outline" className="text-gray-600">
        📁 טעינה רגילה
      </Badge>
    );
  };

  if (!isOpen) return null;

  // Virtual mode - single clean viewer
  if (viewMode === 'virtual' && pdfFileId) {
    return (
      <div className="fixed inset-0 z-50 bg-black/90 backdrop-blur-sm">
        <div className="flex flex-col h-full">
          {/* Minimal header for virtual mode */}
          <div className="bg-white border-b border-border p-4 flex items-center justify-between">
            <div className="flex items-center gap-4">
              <h2 className="hebrew-title text-lg font-semibold">{fileName}</h2>
              {renderStrategyBadge()}
            </div>
            <div className="flex items-center gap-2">
              <Button variant="outline" onClick={() => window.open(fileUrl, '_blank')}>
                <Download size={16} />
              </Button>
              <Button variant="outline" onClick={onClose}>
                <X size={16} />
              </Button>
            </div>
          </div>

          {/* Single virtual viewer - no nesting */}
          <div className="flex-1">
            <VirtualPDFViewer pdfFileId={pdfFileId} onClose={onClose} />
          </div>
        </div>
      </div>
    );
  }

  // Standard mode fallback
  const totalPages = fileInfo?.numPagesTotal || numPages || 1;
  const effectiveUrl = linearization.getBestUrl();

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
            <span className="hebrew-text text-sm text-muted-foreground">
              עמוד {currentPage} מתוך {totalPages}
            </span>
            {renderStrategyBadge()}
          </div>
          <div className="flex items-center gap-2">
            {!linearization.hasLinearizedVersion && !linearization.isLinearizing && pdfFileId && (
              <Button
                variant="outline"
                size="sm"
                onClick={handleLinearizeRequest}
                className="hebrew-text text-xs"
              >
                <Zap size={16} className="ml-1" />
                צור גרסה לינארית
              </Button>
            )}
            <Button variant="outline" onClick={() => window.open(fileUrl, '_blank')}>
              <Download size={16} />
            </Button>
            <Button variant="outline" onClick={onClose}>
              <X size={16} />
            </Button>
          </div>
        </div>

        {/* Controls */}
        <div className="bg-white border-b border-border p-3 flex items-center justify-center gap-4">
          <Button variant="outline" onClick={goToPrevPage} disabled={currentPage <= 1}>
            <ChevronRight size={16} />
          </Button>
          
          <div className="flex items-center gap-2">
            <input
              type="number"
              min="1"
              max={totalPages}
              value={currentPage}
              onChange={(e) => {
                const page = parseInt(e.target.value);
                if (page >= 1 && page <= totalPages) {
                  setCurrentPage(page);
                }
              }}
              className="w-16 px-2 py-1 text-center border border-border rounded text-sm hebrew-text"
            />
            <span className="hebrew-text text-sm text-muted-foreground">
              / {totalPages}
            </span>
          </div>

          <Button variant="outline" onClick={goToNextPage} disabled={currentPage >= totalPages}>
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

        {/* PDF Content - direct react-pdf */}
        <div className="flex-1 overflow-auto bg-gray-100 flex items-center justify-center p-4">
          <div className="bg-white shadow-lg">
            <Document
              file={effectiveUrl}
              onLoadSuccess={(pdf) => {
                setNumPages(pdf.numPages);
                console.log(`✅ PDF loaded with ${pdf.numPages} pages`);
              }}
              onLoadError={(error) => {
                console.error('❌ Error loading PDF:', error);
              }}
              loading={
                <div className="flex items-center justify-center h-96 hebrew-text">
                  <div className="text-center space-y-2">
                    <div className="animate-spin rounded-full h-16 w-16 border-b-4 border-primary mx-auto"></div>
                    <div>טוען קובץ PDF...</div>
                  </div>
                </div>
              }
            >
              <Page
                pageNumber={currentPage}
                scale={scale}
                renderTextLayer={false}
                renderAnnotationLayer={false}
                className="mx-auto"
              />
            </Document>
          </div>
        </div>

        {/* Footer */}
        <div className="bg-white border-t border-border p-2 text-center">
          <span className="hebrew-text text-xs text-muted-foreground">
            Canvas rendering פעיל • ללא הטמעות כפולות
            {linearization.hasLinearizedVersion && ' • גרסה לינארית פעילה'}
          </span>
        </div>
      </div>
    </div>
  );
};

export default EnhancedPDFViewer;

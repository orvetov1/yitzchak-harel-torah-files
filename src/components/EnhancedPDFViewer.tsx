import React, { useState, useEffect, useCallback, useRef } from 'react';
import { Document, Page, pdfjs } from 'react-pdf';
import { Button } from './ui/button';
import { ChevronLeft, ChevronRight, Download, X, ZoomIn, ZoomOut, Zap, RefreshCw } from 'lucide-react';
import { Progress } from './ui/progress';
import { usePDFLinearization } from '../hooks/usePDFLinearization';
import { usePDFPages } from '../hooks/usePDFPages';
import { usePDFLazyLoader } from '../hooks/usePDFLazyLoader';
import { Badge } from './ui/badge';
import VirtualPDFViewer from './VirtualPDFViewer';

// Configure PDF.js worker with correct version matching
pdfjs.GlobalWorkerOptions.workerSrc = `//unpkg.com/pdfjs-dist@${pdfjs.version}/build/pdf.worker.min.js`;

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

    if (pages.length > 0) {
      return (
        <Badge variant="outline" className="text-purple-600 border-purple-200">
          📄 טעינה לפי עמודים ({pages.length})
        </Badge>
      );
    }

    return (
      <Badge variant="outline" className="text-gray-600">
        📁 טעינה רגילה
      </Badge>
    );
  };

  const renderContent = () => {
    // Virtual scrolling mode - new default
    if (viewMode === 'virtual' && pdfFileId) {
      return <VirtualPDFViewer pdfFileId={pdfFileId} onClose={onClose} />;
    }

    if (viewMode === 'pages' && pages.length > 0) {
      // Render individual page with react-pdf
      const currentPageData = pages.find(p => p.pageNumber === currentPage);
      if (!currentPageData) {
        return (
          <div className="text-center hebrew-text p-8">
            <div className="text-red-600">עמוד לא נמצא</div>
          </div>
        );
      }

      return (
        <div className="bg-white shadow-lg">
          <Document
            file={currentPageData.filePath}
            onLoadSuccess={(pdf) => {
              console.log(`✅ Page ${currentPage} loaded with ${pdf.numPages} pages`);
            }}
            onLoadError={(error) => {
              console.error(`❌ Error loading page ${currentPage}:`, error);
            }}
            loading={
              <div className="flex items-center justify-center h-96 hebrew-text">
                <div className="text-center space-y-2">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
                  <div>טוען עמוד {currentPage}...</div>
                </div>
              </div>
            }
          >
            <Page
              pageNumber={1}
              scale={scale}
              renderTextLayer={false}
              renderAnnotationLayer={false}
              className="mx-auto"
            />
          </Document>
        </div>
      );
    }

    // For hybrid and full modes, use react-pdf with the best available URL
    const effectiveUrl = linearization.getBestUrl();
    
    return (
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
            loading={
              <div className="flex items-center justify-center h-96 hebrew-text">
                <div className="text-center space-y-2">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
                  <div>טוען עמוד {currentPage}...</div>
                </div>
              </div>
            }
          />
        </Document>
      </div>
    );
  };

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

          {/* Virtual content */}
          <div className="flex-1">
            {renderContent()}
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
                disabled={pagesLoading}
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

        {/* Loading indicator for linearization */}
        {linearization.isLinearizing && (
          <div className="bg-blue-50 border-b border-blue-200 px-4 py-2">
            <div className="hebrew-text text-sm text-blue-800 text-center">
              🔄 יוצר גרסה לינארית לטעינה מהירה יותר...
            </div>
          </div>
        )}

        {/* Optimization info */}
        {linearization.hasLinearizedVersion && (
          <div className="bg-green-50 border-b border-green-200 px-4 py-2">
            <div className="hebrew-text text-sm text-green-800 text-center">
              ✨ משתמש בגרסה לינארית - 
              חיסכון של {linearization.compressionRatio?.toFixed(1)}% בגודל הקובץ
              ({Math.round((linearization.originalSize || 0) / 1024)}KB → {Math.round((linearization.linearizedSize || 0) / 1024)}KB)
            </div>
          </div>
        )}

        {/* Controls */}
        {viewMode !== 'virtual' && (
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

            {/* Strategy selector */}
            <div className="flex items-center gap-2 ml-4">
              <select
                value={viewMode}
                onChange={(e) => setViewMode(e.target.value as any)}
                className="text-xs border border-border rounded px-2 py-1 hebrew-text"
              >
                <option value="virtual">Canvas וירטואלי (מומלץ)</option>
                <option value="hybrid">היברידי</option>
                <option value="pages">עמודים נפרדים</option>
                <option value="full">קובץ מלא</option>
              </select>
            </div>
          </div>
        )}

        {/* PDF Content */}
        <div className="flex-1 overflow-auto bg-gray-100 flex items-center justify-center p-4">
          {renderContent()}
        </div>

        {/* Footer */}
        <div className="bg-white border-t border-border p-2 text-center">
          <span className="hebrew-text text-xs text-muted-foreground">
            Canvas rendering פעיל • לא נחסם ע"י Chrome
            {linearization.hasLinearizedVersion && ' • גרסה לינארית פעילה'}
            {viewMode === 'virtual' && ' • טעינה וירטואלית פעילה'}
            {viewMode === 'pages' && ' • טעינה לפי עמודים'}
          </span>
        </div>
      </div>
    </div>
  );
};

export default EnhancedPDFViewer;

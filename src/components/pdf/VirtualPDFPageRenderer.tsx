
import React from 'react';
import { Document, Page } from 'react-pdf';
import { Button } from '../ui/button';
import PDFErrorBoundary from './PDFErrorBoundary';
import PDFProgressiveLoader from './PDFProgressiveLoader';
import { usePDFOptions } from '../../utils/pdfOptionsManager';
import '../../utils/pdfWorkerLoader';

interface VirtualPDFPageRendererProps {
  pageNumber: number;
  pageUrl: string | null;
  scale: number;
  totalPages: number;
  isCurrentPage: boolean;
  isPageLoading: boolean;
  onLoadPage: (pageNumber: number) => void;
}

const VirtualPDFPageRenderer = ({
  pageNumber,
  pageUrl,
  scale,
  totalPages,
  isCurrentPage,
  isPageLoading,
  onLoadPage
}: VirtualPDFPageRendererProps) => {
  
  // Get optimized PDF options
  const pdfOptions = usePDFOptions();
  
  // Check if the URL points to an image file
  const isImageFile = (url: string) => {
    return /\.(png|jpg|jpeg|gif|webp)(\?|$)/i.test(url);
  };

  const renderMode = pageUrl ? (isImageFile(pageUrl) ? 'image' : 'pdf') : 'fallback';

  const renderImagePage = (pageNumber: number, pageUrl: string) => {
    console.log(`🖼️ Rendering optimized image page ${pageNumber}: ${pageUrl}`);
    
    return (
      <div 
        className="bg-white shadow-lg flex items-center justify-center p-4"
        style={{ transform: `scale(${scale})`, transformOrigin: 'top center' }}
      >
        <img
          src={pageUrl}
          alt={`עמוד ${pageNumber}`}
          className="max-w-full h-auto"
          style={{ maxHeight: '800px' }}
          loading="lazy"
          onLoad={() => {
            console.log(`✅ Optimized image page ${pageNumber} loaded successfully`);
          }}
          onError={(error) => {
            console.error(`❌ Optimized image page ${pageNumber} load error:`, error);
          }}
        />
      </div>
    );
  };

  const renderPDFPage = (pageNumber: number, pageUrl: string) => {
    console.log(`📄 Rendering optimized PDF page ${pageNumber} with react-pdf: ${pageUrl}`);
    
    return (
      <div 
        className="bg-white shadow-lg flex items-center justify-center min-h-[800px] p-4"
        style={{ transform: `scale(${scale})`, transformOrigin: 'top center' }}
      >
        <Document
          file={pageUrl}
          options={pdfOptions}
          onLoadSuccess={(pdf) => {
            console.log(`✅ Optimized PDF document loaded for page ${pageNumber}, total pages: ${pdf.numPages}`);
          }}
          onLoadError={(error) => {
            console.error(`❌ Optimized PDF document load error for page ${pageNumber}:`, {
              error: error.message,
              name: error.name,
              url: pageUrl
            });
          }}
          loading={null} // We handle loading in PDFProgressiveLoader
          error={null} // We handle errors in PDFErrorBoundary
        >
          <Page
            pageNumber={1}
            scale={scale}
            renderTextLayer={false}
            renderAnnotationLayer={false}
            loading={null} // We handle loading in PDFProgressiveLoader
            error={null} // We handle errors in PDFErrorBoundary
            onLoadSuccess={() => {
              console.log(`✅ Optimized page ${pageNumber} rendered successfully`);
            }}
            onLoadError={(error) => {
              console.error(`❌ Optimized page ${pageNumber} render error:`, {
                error: error.message,
                name: error.name,
                pageNumber
              });
            }}
          />
        </Document>
      </div>
    );
  };

  return (
    <div 
      key={pageNumber}
      className="mb-6"
    >
      <div className="bg-white p-2 rounded-lg shadow-lg">
        <div className="text-center hebrew-text text-sm text-gray-600 mb-2">
          עמוד {pageNumber} מתוך {totalPages}
          {pageUrl && (
            <div className="text-xs text-muted-foreground mt-1 flex items-center justify-center gap-2">
              <span>{renderMode === 'image' ? '🖼️ תמונה' : '📄 PDF'}</span>
              {isCurrentPage && <span className="text-primary">• נוכחי</span>}
            </div>
          )}
        </div>
        
        <PDFErrorBoundary 
          pageNumber={pageNumber} 
          pdfUrl={pageUrl}
          onRetry={() => onLoadPage(pageNumber)}
        >
          <PDFProgressiveLoader
            pageNumber={pageNumber}
            pageUrl={pageUrl}
            isLoading={isPageLoading}
            onRetry={() => onLoadPage(pageNumber)}
            renderMode={renderMode}
          >
            {pageUrl && !isPageLoading && (
              <>
                {renderMode === 'image' 
                  ? renderImagePage(pageNumber, pageUrl)
                  : renderPDFPage(pageNumber, pageUrl)
                }
              </>
            )}
          </PDFProgressiveLoader>
        </PDFErrorBoundary>
      </div>
    </div>
  );
};

export default VirtualPDFPageRenderer;


import React from 'react';
import { Document, Page } from 'react-pdf';
import { Button } from '../ui/button';
import PDFErrorBoundary from './PDFErrorBoundary';
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
  
  // Check if the URL points to an image file
  const isImageFile = (url: string) => {
    return /\.(png|jpg|jpeg|gif|webp)(\?|$)/i.test(url);
  };

  const renderImagePage = (pageNumber: number, pageUrl: string) => {
    console.log(`🖼️ Rendering image page ${pageNumber}: ${pageUrl}`);
    
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
          onLoad={() => {
            console.log(`✅ Image page ${pageNumber} loaded successfully`);
          }}
          onError={(error) => {
            console.error(`❌ Image page ${pageNumber} load error:`, error);
          }}
        />
      </div>
    );
  };

  const renderPDFPage = (pageNumber: number, pageUrl: string) => {
    console.log(`📄 Rendering PDF page ${pageNumber} with react-pdf: ${pageUrl}`);
    
    return (
      <div 
        className="bg-white shadow-lg flex items-center justify-center min-h-[800px] p-4"
        style={{ transform: `scale(${scale})`, transformOrigin: 'top center' }}
      >
        <Document
          file={pageUrl}
          onLoadSuccess={(pdf) => {
            console.log(`✅ PDF document loaded for page ${pageNumber}, total pages: ${pdf.numPages}`);
          }}
          onLoadError={(error) => {
            console.error(`❌ PDF document load error for page ${pageNumber}:`, {
              error: error.message,
              name: error.name,
              url: pageUrl
            });
          }}
          loading={
            <div className="flex items-center justify-center h-96 hebrew-text">
              <div className="text-center space-y-2">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
                <div>טוען מסמך PDF...</div>
                <div className="text-xs text-muted-foreground">עמוד {pageNumber}</div>
              </div>
            </div>
          }
          error={
            <div className="flex items-center justify-center h-96 hebrew-text">
              <div className="text-center space-y-4 text-red-600 max-w-md">
                <div>שגיאה בטעינת המסמך</div>
                <div className="text-xs text-muted-foreground">עמוד {pageNumber}</div>
                <div className="flex flex-col gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => onLoadPage(pageNumber)}
                    className="hebrew-text"
                  >
                    נסה שוב
                  </Button>
                  {pageUrl && (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => window.open(pageUrl, '_blank')}
                      className="hebrew-text"
                    >
                      פתח בטאב חדש
                    </Button>
                  )}
                </div>
              </div>
            </div>
          }
          options={{
            // Optimize for better performance and compatibility
            cMapUrl: `https://cdn.jsdelivr.net/npm/pdfjs-dist@3.11.174/cmaps/`,
            cMapPacked: true,
            standardFontDataUrl: `https://cdn.jsdelivr.net/npm/pdfjs-dist@3.11.174/standard_fonts/`,
            // Increase timeouts
            httpHeaders: {},
            withCredentials: false
          }}
        >
          <Page
            pageNumber={1}
            scale={scale}
            renderTextLayer={false}
            renderAnnotationLayer={false}
            loading={
              <div className="flex items-center justify-center h-96 hebrew-text">
                <div className="text-center space-y-2">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
                  <div>מעבד עמוד {pageNumber}...</div>
                </div>
              </div>
            }
            error={
              <div className="flex items-center justify-center h-96 hebrew-text">
                <div className="text-center space-y-2 text-red-600">
                  <div>שגיאה בהצגת עמוד {pageNumber}</div>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => onLoadPage(pageNumber)}
                    className="hebrew-text"
                  >
                    טען שוב
                  </Button>
                </div>
              </div>
            }
            onLoadSuccess={() => {
              console.log(`✅ Page ${pageNumber} rendered successfully`);
            }}
            onLoadError={(error) => {
              console.error(`❌ Page ${pageNumber} render error:`, {
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

  // Don't render if no URL and not loading
  if (!pageUrl && !isPageLoading) {
    return (
      <div 
        key={pageNumber}
        className="mb-6"
      >
        <div className="bg-white p-4 rounded-lg shadow-lg">
          <div className="text-center hebrew-text text-sm text-gray-600 mb-4">
            עמוד {pageNumber} מתוך {totalPages}
          </div>
          
          <div className="flex items-center justify-center h-96 hebrew-text">
            <div className="text-center space-y-4">
              <div className="text-muted-foreground">עמוד {pageNumber} לא נטען</div>
              <Button
                variant="outline"
                onClick={() => {
                  console.log(`🔄 Manual load requested for page ${pageNumber}`);
                  onLoadPage(pageNumber);
                }}
                className="hebrew-text"
              >
                טען עמוד
              </Button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div 
      key={pageNumber}
      className="mb-6"
    >
      <div className="bg-white p-2 rounded-lg shadow-lg">
        <div className="text-center hebrew-text text-sm text-gray-600 mb-2">
          עמוד {pageNumber} מתוך {totalPages}
          {pageUrl && (
            <div className="text-xs text-muted-foreground mt-1">
              {isImageFile(pageUrl) ? 'תמונה' : 'PDF'}
            </div>
          )}
        </div>
        
        {isPageLoading && (
          <div className="flex items-center justify-center h-96 hebrew-text">
            <div className="text-center space-y-2">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
              <div>טוען עמוד {pageNumber}...</div>
            </div>
          </div>
        )}
        
        {pageUrl && !isPageLoading && (
          <PDFErrorBoundary 
            pageNumber={pageNumber} 
            pdfUrl={pageUrl}
            onRetry={() => onLoadPage(pageNumber)}
          >
            {isImageFile(pageUrl) 
              ? renderImagePage(pageNumber, pageUrl)
              : renderPDFPage(pageNumber, pageUrl)
            }
          </PDFErrorBoundary>
        )}
      </div>
    </div>
  );
};

export default VirtualPDFPageRenderer;

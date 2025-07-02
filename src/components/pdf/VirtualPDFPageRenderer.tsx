
import React from 'react';
import { Document, Page } from 'react-pdf';
import { Button } from '../ui/button';
import '../../utils/pdfWorkerLoader'; // Ensure worker is loaded

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
  const renderPDFPage = (pageNumber: number, pageUrl: string) => {
    console.log(`🔍 Rendering PDF page ${pageNumber} with react-pdf`);
    
    return (
      <div 
        className="bg-white shadow-lg flex items-center justify-center min-h-[800px]"
        style={{ transform: `scale(${scale})`, transformOrigin: 'top center' }}
      >
        <Document
          file={pageUrl}
          onLoadSuccess={(pdf) => {
            console.log(`✅ PDF document loaded for page ${pageNumber}, total pages: ${pdf.numPages}`);
          }}
          onLoadError={(error) => {
            console.error(`❌ PDF document load error for page ${pageNumber}:`, error);
          }}
          loading={
            <div className="flex items-center justify-center h-96 hebrew-text">
              <div className="text-center space-y-2">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
                <div>טוען מסמך PDF...</div>
              </div>
            </div>
          }
          error={
            <div className="flex items-center justify-center h-96 hebrew-text">
              <div className="text-center space-y-2 text-red-600">
                <div>שגיאה בטעינת המסמך</div>
                <Button
                  variant="outline"
                  onClick={() => onLoadPage(pageNumber)}
                  className="hebrew-text"
                >
                  נסה שוב
                </Button>
              </div>
            </div>
          }
        >
          <Page
            pageNumber={1} // Always render the first page since we're dealing with single-page documents
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
              console.error(`❌ Page ${pageNumber} render error:`, error);
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
          renderPDFPage(pageNumber, pageUrl)
        )}
        
        {!pageUrl && !isPageLoading && (
          <div className="flex items-center justify-center h-96 hebrew-text">
            <div className="text-center space-y-2">
              <div className="text-muted-foreground">עמוד {pageNumber}</div>
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
        )}
      </div>
    </div>
  );
};

export default VirtualPDFPageRenderer;

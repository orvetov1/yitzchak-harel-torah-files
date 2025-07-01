
import React from 'react';
import { Button } from '../ui/button';

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
    console.log(`🔍 Rendering page ${pageNumber} directly with image/embed`);
    
    return (
      <div 
        className="bg-white shadow-lg flex items-center justify-center min-h-[800px]"
        style={{ transform: `scale(${scale})`, transformOrigin: 'top center' }}
      >
        <img
          src={pageUrl}
          alt={`עמוד ${pageNumber}`}
          className="max-w-full h-auto"
          onLoad={() => {
            console.log(`✅ Page ${pageNumber} image loaded successfully`);
          }}
          onError={(error) => {
            console.error(`❌ Page ${pageNumber} image load error:`, error);
          }}
          style={{ maxHeight: '90vh' }}
        />
      </div>
    );
  };

  return (
    <div 
      key={pageNumber}
      className={`mb-6 ${isCurrentPage ? 'ring-2 ring-blue-500' : ''}`}
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

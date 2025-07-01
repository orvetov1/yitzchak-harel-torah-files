
import React from 'react';
import { Document, Page } from 'react-pdf';
import { Button } from './ui/button';

interface PDFPageProps {
  pageNumber: number;
  scale: number;
  pageUrl: string | null;
  isLoaded: boolean;
  isLoading: boolean;
  onPageLoad: (pageNumber: number) => void;
  pageRef?: (el: HTMLDivElement | null) => void;
}

const PDFPage = ({
  pageNumber,
  scale,
  pageUrl,
  isLoaded,
  isLoading,
  onPageLoad,
  pageRef
}: PDFPageProps) => {
  return (
    <div
      ref={pageRef}
      className="mb-4 bg-white shadow-lg rounded-lg overflow-hidden"
      style={{
        transform: `scale(${scale})`,
        transformOrigin: 'top center',
        minHeight: '800px'
      }}
    >
      {isLoading && (
        <div className="flex items-center justify-center h-96 hebrew-text">
          <div className="text-center space-y-2">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
            <div>טוען עמוד {pageNumber}...</div>
          </div>
        </div>
      )}
      
      {isLoaded && pageUrl && (
        <Document
          file={pageUrl}
          onLoadSuccess={() => {
            console.log(`✅ Page ${pageNumber} document loaded with modern worker`);
          }}
          onLoadError={(error) => {
            console.error(`❌ Page ${pageNumber} load error:`, error);
            // Enhanced error logging for worker issues
            if (error.message.includes('setup') || error.message.includes('worker')) {
              console.error('🔧 Worker setup error detected - check PDF.js worker configuration');
            }
          }}
          loading={
            <div className="flex items-center justify-center h-96 hebrew-text">
              <div className="text-center space-y-2">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
                <div>מכין עמוד {pageNumber}...</div>
              </div>
            </div>
          }
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
          />
        </Document>
      )}
      
      {!isLoaded && !isLoading && (
        <div className="flex items-center justify-center h-96 hebrew-text">
          <div className="text-center space-y-2">
            <div className="text-muted-foreground">עמוד {pageNumber}</div>
            <Button
              variant="outline"
              onClick={() => onPageLoad(pageNumber)}
              className="hebrew-text"
            >
              טען עמוד
            </Button>
          </div>
        </div>
      )}
    </div>
  );
};

export default PDFPage;

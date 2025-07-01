
import React from 'react';
import { Document, Page } from 'react-pdf';

interface PDFViewerContentProps {
  effectiveUrl: string;
  currentPage: number;
  scale: number;
  onLoadSuccess: (pdf: any) => void;
  onLoadError: (error: any) => void;
}

const PDFViewerContent = ({
  effectiveUrl,
  currentPage,
  scale,
  onLoadSuccess,
  onLoadError
}: PDFViewerContentProps) => {
  return (
    <div className="flex-1 overflow-auto bg-gray-100 flex items-center justify-center p-4">
      <div className="bg-white shadow-lg">
        <Document
          file={effectiveUrl}
          onLoadSuccess={onLoadSuccess}
          onLoadError={onLoadError}
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
  );
};

export default PDFViewerContent;

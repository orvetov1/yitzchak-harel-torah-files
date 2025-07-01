
import React from 'react';
import { Document, Page } from 'react-pdf';

interface PDFDocumentRendererProps {
  viewMode: 'hybrid' | 'pages' | 'full' | 'virtual';
  currentPage: number;
  scale: number;
  effectiveUrl: string;
  pages: any[];
  onLoadSuccess: (pdf: { numPages: number }) => void;
  onLoadError: (error: Error) => void;
  setNumPages: (pages: number) => void;
}

const PDFDocumentRenderer = ({
  viewMode,
  currentPage,
  scale,
  effectiveUrl,
  pages,
  onLoadSuccess,
  onLoadError,
  setNumPages
}: PDFDocumentRendererProps) => {
  if (viewMode === 'pages' && pages.length > 0) {
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

  return (
    <div className="bg-white shadow-lg">
      <Document
        file={effectiveUrl}
        onLoadSuccess={(pdf) => {
          setNumPages(pdf.numPages);
          onLoadSuccess(pdf);
          console.log(`✅ PDF loaded with ${pdf.numPages} pages`);
        }}
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

export default PDFDocumentRenderer;

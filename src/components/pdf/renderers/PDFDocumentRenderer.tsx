
import React from 'react';
import { Document, Page } from 'react-pdf';
import { loadPDFDocument, createOptimizedPDFOptions } from '../../../utils/pdfWorkerAutoInitializer';

interface PDFDocumentRendererProps {
  pageNumber: number;
  pageUrl: string;
  scale: number;
}

const PDFDocumentRenderer = ({ pageNumber, pageUrl, scale }: PDFDocumentRendererProps) => {
  console.log(`📄 Rendering optimized PDF page ${pageNumber} with react-pdf: ${pageUrl}`);
  
  // Use optimized PDF options for better compatibility
  const pdfOptions = createOptimizedPDFOptions(pageUrl);
  
  return (
    <div 
      className="bg-white shadow-lg flex items-center justify-center min-h-[800px] p-4"
      style={{ transform: `scale(${scale})`, transformOrigin: 'top center' }}
    >
      <Document
        file={pdfOptions}
        onLoadSuccess={(pdf) => {
          console.log(`✅ Optimized PDF document loaded for page ${pageNumber}, total pages: ${pdf.numPages}`);
        }}
        onLoadError={(error) => {
          console.error(`❌ Optimized PDF document load error for page ${pageNumber}:`, {
            error: error.message,
            name: error.name,
            url: pageUrl,
            stack: error.stack
          });
        }}
        loading={
          <div className="flex items-center justify-center h-96">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mr-2"></div>
            <span className="hebrew-text">טוען מסמך...</span>
          </div>
        }
        error={
          <div className="flex items-center justify-center h-96 text-red-600 hebrew-text">
            <div className="text-center">
              <div className="mb-2">שגיאה בטעינת המסמך</div>
              <div className="text-sm">נסה לרענן או להוריד ישירות</div>
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
            <div className="flex items-center justify-center h-96">
              <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary mr-2"></div>
              <span className="hebrew-text">טוען עמוד...</span>
            </div>
          }
          error={
            <div className="flex items-center justify-center h-96 text-red-600 hebrew-text">
              <div className="text-center">
                <div className="mb-2">שגיאה בטעינת עמוד {pageNumber}</div>
                <div className="text-sm">העמוד עלול להיות פגום</div>
              </div>
            </div>
          }
          onLoadSuccess={() => {
            console.log(`✅ Optimized page ${pageNumber} rendered successfully`);
          }}
          onLoadError={(error) => {
            console.error(`❌ Optimized page ${pageNumber} render error:`, {
              error: error.message,
              name: error.name,
              pageNumber,
              stack: error.stack
            });
          }}
        />
      </Document>
    </div>
  );
};

export default PDFDocumentRenderer;

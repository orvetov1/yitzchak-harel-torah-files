
import React from 'react';
import { Document, Page } from 'react-pdf';
import { usePDFOptions } from '../../../utils/pdfOptionsManager';

interface PDFDocumentRendererProps {
  pageNumber: number;
  pageUrl: string;
  scale: number;
}

const PDFDocumentRenderer = ({ pageNumber, pageUrl, scale }: PDFDocumentRendererProps) => {
  // Get optimized PDF options
  const pdfOptions = usePDFOptions();
  
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

export default PDFDocumentRenderer;

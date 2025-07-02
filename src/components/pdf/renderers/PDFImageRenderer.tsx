
import React from 'react';

interface PDFImageRendererProps {
  pageNumber: number;
  pageUrl: string;
  scale: number;
}

const PDFImageRenderer = ({ pageNumber, pageUrl, scale }: PDFImageRendererProps) => {
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

export default PDFImageRenderer;

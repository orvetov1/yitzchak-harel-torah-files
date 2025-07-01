
import React from 'react';
import ReliablePDFViewer from './pdf/ReliablePDFViewer';

interface PDFEmbedProps {
  src: string;
  title?: string;
  className?: string;
  onError?: (error: string) => void;
}

const PDFEmbed = ({ src, title = 'PDF Document', className = '' }: PDFEmbedProps) => {
  console.log(`📄 PDFEmbed rendering with ReliablePDFViewer: ${src}`);

  return (
    <div className={className}>
      <ReliablePDFViewer 
        pdfUrl={src} 
        fileName={title}
        className="h-full"
      />
    </div>
  );
};

export default PDFEmbed;

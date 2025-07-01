
import React from 'react';
import ReliablePDFViewer from './pdf/ReliablePDFViewer';

interface SimplePDFRendererProps {
  pdfUrl: string;
  scale: number;
  onLoadSuccess?: () => void;
  onLoadError?: (error: Error) => void;
  className?: string;
}

const SimplePDFRenderer = ({ 
  pdfUrl, 
  scale, 
  onLoadSuccess, 
  onLoadError,
  className = "" 
}: SimplePDFRendererProps) => {
  console.log(`🔄 SimplePDFRenderer rendering PDF: ${pdfUrl}`);

  // Extract filename from URL for display
  const getFileName = (url: string) => {
    try {
      const urlObj = new URL(url);
      const pathParts = urlObj.pathname.split('/');
      return pathParts[pathParts.length - 1] || 'PDF Document';
    } catch {
      return 'PDF Document';
    }
  };

  return (
    <div className={className}>
      <ReliablePDFViewer 
        pdfUrl={pdfUrl} 
        fileName={getFileName(pdfUrl)}
        className="h-[800px]"
      />
    </div>
  );
};

export default SimplePDFRenderer;

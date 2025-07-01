
import React from 'react';
import VirtualPDFContainer from './pdf/VirtualPDFContainer';

interface VirtualPDFViewerProps {
  pdfFileId: string;
  onClose: () => void;
}

const VirtualPDFViewer = ({ pdfFileId, onClose }: VirtualPDFViewerProps) => {
  return (
    <div className="fixed inset-0 z-50 bg-black/90 backdrop-blur-sm">
      <VirtualPDFContainer pdfFileId={pdfFileId} onClose={onClose} />
    </div>
  );
};

export default VirtualPDFViewer;

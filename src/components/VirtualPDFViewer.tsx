
import React from 'react';
import VirtualPDFContainer from './pdf/VirtualPDFContainer';

interface VirtualPDFViewerProps {
  pdfFileId: string;
  onClose: () => void;
}

const VirtualPDFViewer = ({ pdfFileId, onClose }: VirtualPDFViewerProps) => {
  return <VirtualPDFContainer pdfFileId={pdfFileId} onClose={onClose} />;
};

export default VirtualPDFViewer;

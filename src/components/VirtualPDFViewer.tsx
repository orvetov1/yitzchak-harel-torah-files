
import React, { useEffect } from 'react';
import VirtualPDFContainer from './pdf/VirtualPDFContainer';

interface VirtualPDFViewerProps {
  pdfFileId: string;
  onClose: () => void;
}

const VirtualPDFViewer = ({ pdfFileId, onClose }: VirtualPDFViewerProps) => {
  console.log(`🎬 VirtualPDFViewer mounted for pdfFileId: ${pdfFileId}`);

  // Cleanup function to ensure proper unmounting
  useEffect(() => {
    return () => {
      console.log(`🧹 VirtualPDFViewer cleanup for pdfFileId: ${pdfFileId}`);
      // Any additional cleanup can be added here
    };
  }, [pdfFileId]);

  // Handle escape key to close viewer
  useEffect(() => {
    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        console.log(`⌨️ Escape key pressed - closing viewer`);
        onClose();
      }
    };

    document.addEventListener('keydown', handleEscape);
    return () => {
      document.removeEventListener('keydown', handleEscape);
    };
  }, [onClose]);

  return (
    <div className="fixed inset-0 z-50 bg-black/90 backdrop-blur-sm">
      <VirtualPDFContainer pdfFileId={pdfFileId} onClose={onClose} />
    </div>
  );
};

export default VirtualPDFViewer;

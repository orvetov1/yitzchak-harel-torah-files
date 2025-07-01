
import React from 'react';

interface PDFViewerModalProps {
  isOpen: boolean;
  children: React.ReactNode;
}

const PDFViewerModal = ({ isOpen, children }: PDFViewerModalProps) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 bg-black/90 backdrop-blur-sm">
      <div className="flex flex-col h-full">
        {children}
      </div>
    </div>
  );
};

export default PDFViewerModal;

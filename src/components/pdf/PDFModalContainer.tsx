
import React, { useRef, RefObject } from 'react';

interface PDFModalContainerProps {
  children: React.ReactNode;
  isFullscreen: boolean;
  containerRef: RefObject<HTMLDivElement>;
}

const PDFModalContainer = ({ children, isFullscreen, containerRef }: PDFModalContainerProps) => {
  return (
    <div 
      ref={containerRef}
      className={`fixed inset-0 z-50 bg-black/90 backdrop-blur-sm ${isFullscreen ? 'bg-black' : ''}`}
    >
      <div className="flex flex-col h-full">
        {children}
      </div>
    </div>
  );
};

export default PDFModalContainer;

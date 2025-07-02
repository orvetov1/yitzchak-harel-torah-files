
import React from 'react';
import { Button } from '../ui/button';

interface VirtualPDFProcessingStateProps {
  fileInfo: any;
  totalPages: number;
  visiblePages: number[];
  isPageLoaded: (pageNumber: number) => boolean;
  onReload: () => void;
  onClose: () => void;
}

const VirtualPDFProcessingState = ({
  fileInfo,
  totalPages,
  visiblePages,
  isPageLoaded,
  onReload,
  onClose
}: VirtualPDFProcessingStateProps) => {
  // Allow viewing even if processing is not completed - check if we have pages
  const canViewFile = fileInfo && (
    fileInfo.processingStatus === 'completed' || 
    totalPages > 0 || 
    visiblePages.some(p => isPageLoaded(p))
  );

  if (fileInfo && !canViewFile) {
    return (
      <div className="flex flex-col h-full items-center justify-center text-center hebrew-text p-8 bg-white">
        <div className="text-lg mb-4">הקובץ עדיין מעובד...</div>
        <div className="text-sm text-muted-foreground mb-4">
          מצב עיבוד: {fileInfo.processingStatus || 'לא ידוע'}
        </div>
        <div className="space-y-2">
          <Button onClick={onReload} className="hebrew-text mr-2">רענן</Button>
          <Button onClick={onClose} variant="outline" className="hebrew-text">סגור</Button>
        </div>
      </div>
    );
  }

  return null;
};

export default VirtualPDFProcessingState;

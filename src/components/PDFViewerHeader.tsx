
import React from 'react';
import { X, Download } from 'lucide-react';
import { Button } from './ui/button';

interface PDFViewerHeaderProps {
  fileName: string;
  pageNumber: number;
  numPages: number;
  loading: boolean;
  error: string | null;
  onClose: () => void;
  onDownload: () => void;
}

const PDFViewerHeader = ({ 
  fileName, 
  pageNumber, 
  numPages, 
  loading, 
  error, 
  onClose, 
  onDownload 
}: PDFViewerHeaderProps) => {
  return (
    <div className="bg-white border-b border-border p-4 flex items-center justify-between">
      <div className="flex items-center gap-4">
        <h2 className="hebrew-title text-lg font-semibold text-foreground">
          {fileName}
        </h2>
        {!loading && !error && (
          <span className="hebrew-text text-sm text-muted-foreground">
            עמוד {pageNumber} מתוך {numPages}
          </span>
        )}
      </div>
      
      <div className="flex items-center gap-2">
        <Button
          variant="outline"
          size="sm"
          onClick={onDownload}
          className="hebrew-text"
          disabled={loading}
        >
          <Download size={16} />
          הורד
        </Button>
        <Button
          variant="outline"
          size="sm"
          onClick={onClose}
        >
          <X size={16} />
        </Button>
      </div>
    </div>
  );
};

export default PDFViewerHeader;

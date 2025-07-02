
import React from 'react';
import { ChevronLeft, ChevronRight, ZoomIn, ZoomOut } from 'lucide-react';
import { Button } from './ui/button';

interface PDFViewerControlsProps {
  pageNumber: number;
  numPages: number;
  scale: number;
  pageLoading: boolean;
  onPrevPage: () => void;
  onNextPage: () => void;
  onZoomIn: () => void;
  onZoomOut: () => void;
  onPageChange: (page: number) => void;
}

const PDFViewerControls = ({
  pageNumber,
  numPages,
  scale,
  pageLoading,
  onPrevPage,
  onNextPage,
  onZoomIn,
  onZoomOut,
  onPageChange
}: PDFViewerControlsProps) => {
  return (
    <div className="bg-white border-b border-border p-3 flex items-center justify-center gap-4">
      <Button
        variant="outline"
        size="sm"
        onClick={onPrevPage}
        disabled={pageNumber <= 1 || pageLoading}
      >
        <ChevronRight size={16} />
      </Button>
      
      <div className="flex items-center gap-2">
        <input
          id="pdf-viewer-page-input"
          name="pdfViewerPageNumber"
          type="number"
          min="1"
          max={numPages}
          value={pageNumber}
          onChange={(e) => {
            const page = parseInt(e.target.value);
            onPageChange(page);
          }}
          className="w-16 px-2 py-1 text-center border border-border rounded text-sm"
          disabled={pageLoading}
          aria-label="מספר עמוד נוכחי"
        />
        <span className="hebrew-text text-sm text-muted-foreground">
          / {numPages || 0}
        </span>
      </div>
      
      <Button
        variant="outline"
        size="sm"
        onClick={onNextPage}
        disabled={pageNumber >= numPages || pageLoading}
      >
        <ChevronLeft size={16} />
      </Button>
      
      <div className="w-px h-6 bg-border mx-2" />
      
      <Button
        variant="outline"
        size="sm"
        onClick={onZoomOut}
        disabled={scale <= 0.5 || pageLoading}
      >
        <ZoomOut size={16} />
      </Button>
      
      <span className="hebrew-text text-sm text-muted-foreground min-w-12 text-center">
        {Math.round(scale * 100)}%
      </span>
      
      <Button
        variant="outline"
        size="sm"
        onClick={onZoomIn}
        disabled={scale >= 3.0 || pageLoading}
      >
        <ZoomIn size={16} />
      </Button>
    </div>
  );
};

export default PDFViewerControls;

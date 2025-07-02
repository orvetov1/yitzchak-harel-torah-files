
import React from 'react';
import { Button } from '../ui/button';
import { ChevronLeft, ChevronRight, ZoomIn, ZoomOut } from 'lucide-react';

interface PDFModalControlsProps {
  currentPage: number;
  totalPages: number;
  scale: number;
  loadingStage: 'downloading' | 'processing' | 'rendering' | 'complete';
  onPrevPage: () => void;
  onNextPage: () => void;
  onPageChange: (page: number) => void;
  onZoomIn: () => void;
  onZoomOut: () => void;
}

const PDFModalControls = ({
  currentPage,
  totalPages,
  scale,
  loadingStage,
  onPrevPage,
  onNextPage,
  onPageChange,
  onZoomIn,
  onZoomOut
}: PDFModalControlsProps) => {
  const handlePageInputChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const page = parseInt(event.target.value);
    if (page >= 1 && page <= totalPages) {
      onPageChange(page);
    }
  };

  return (
    <div className="bg-white border-b border-border p-3 flex items-center justify-center gap-4">
      <Button
        variant="outline"
        onClick={onPrevPage}
        disabled={currentPage <= 1}
      >
        <ChevronRight size={16} />
      </Button>
      
      <div className="flex items-center gap-2">
        <input
          id="pdf-modal-page-input"
          name="pdfModalPageNumber"
          type="number"
          min="1"
          max={totalPages}
          value={currentPage}
          onChange={handlePageInputChange}
          className="w-16 px-2 py-1 text-center border border-border rounded text-sm hebrew-text"
          aria-label="מספר עמוד נוכחי"
        />
        <span className="hebrew-text text-sm text-muted-foreground">
          / {totalPages}
        </span>
      </div>

      <Button
        variant="outline"
        onClick={onNextPage}
        disabled={currentPage >= totalPages}
      >
        <ChevronLeft size={16} />
      </Button>

      <div className="w-px h-6 bg-border mx-2" />

      <Button variant="outline" onClick={onZoomOut} disabled={scale <= 0.5}>
        <ZoomOut size={16} />
      </Button>
      <span className="hebrew-text text-sm text-muted-foreground min-w-12 text-center">
        {Math.round(scale * 100)}%
      </span>
      <Button variant="outline" onClick={onZoomIn} disabled={scale >= 3.0}>
        <ZoomIn size={16} />
      </Button>

      {loadingStage !== 'complete' && (
        <div className="flex items-center gap-2 ml-4">
          <div className="hebrew-text text-xs text-muted-foreground">
            {loadingStage === 'downloading' && 'מוריד...'}
            {loadingStage === 'processing' && 'מעבד...'}
            {loadingStage === 'rendering' && 'מכין תצוגה...'}
          </div>
        </div>
      )}
    </div>
  );
};

export default PDFModalControls;

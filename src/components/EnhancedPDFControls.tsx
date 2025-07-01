
import React from 'react';
import { Button } from './ui/button';
import { 
  ChevronLeft, 
  ChevronRight, 
  Maximize, 
  Minimize, 
  Menu,
  X,
  ZoomIn,
  ZoomOut
} from 'lucide-react';

interface EnhancedPDFControlsProps {
  currentPage: number;
  totalPages: number;
  scale: number;
  isFullscreen: boolean;
  showSidebar: boolean;
  onPrevPage: () => void;
  onNextPage: () => void;
  onZoomIn: () => void;
  onZoomOut: () => void;
  onToggleFullscreen: () => void;
  onToggleSidebar: () => void;
  onPageChange: (page: number) => void;
}

const EnhancedPDFControls = ({
  currentPage,
  totalPages,
  scale,
  isFullscreen,
  showSidebar,
  onPrevPage,
  onNextPage,
  onZoomIn,
  onZoomOut,
  onToggleFullscreen,
  onToggleSidebar,
  onPageChange
}: EnhancedPDFControlsProps) => {
  const handlePageInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const page = parseInt(e.target.value);
    if (page >= 1 && page <= totalPages) {
      onPageChange(page);
    }
  };

  return (
    <div className="bg-white border-b border-border p-3 flex items-center justify-between">
      <div className="flex items-center gap-2">
        <Button
          variant="outline"
          size="sm"
          onClick={onToggleSidebar}
          className="hebrew-text"
        >
          {showSidebar ? <X size={16} /> : <Menu size={16} />}
          {showSidebar ? 'סגור תפריט' : 'תוכן עניינים'}
        </Button>
      </div>

      <div className="flex items-center gap-2">
        <Button
          variant="outline"
          size="sm"
          onClick={onPrevPage}
          disabled={currentPage <= 1}
        >
          <ChevronRight size={16} />
        </Button>
        
        <div className="flex items-center gap-2 hebrew-text text-sm">
          <span>עמוד</span>
          <input
            type="number"
            value={currentPage}
            onChange={handlePageInputChange}
            min={1}
            max={totalPages}
            className="w-16 px-2 py-1 border border-border rounded text-center"
          />
          <span>מתוך {totalPages}</span>
        </div>
        
        <Button
          variant="outline"
          size="sm"
          onClick={onNextPage}
          disabled={currentPage >= totalPages}
        >
          <ChevronLeft size={16} />
        </Button>
      </div>

      <div className="flex items-center gap-2">
        <Button
          variant="outline"
          size="sm"
          onClick={onZoomOut}
          disabled={scale <= 0.5}
        >
          <ZoomOut size={16} />
        </Button>
        
        <span className="hebrew-text text-sm min-w-[4rem] text-center">
          {Math.round(scale * 100)}%
        </span>
        
        <Button
          variant="outline"
          size="sm"
          onClick={onZoomIn}
          disabled={scale >= 3.0}
        >
          <ZoomIn size={16} />
        </Button>
        
        <Button
          variant="outline"
          size="sm"
          onClick={onToggleFullscreen}
          className="hebrew-text"
        >
          {isFullscreen ? <Minimize size={16} /> : <Maximize size={16} />}
          {isFullscreen ? 'צא ממסך מלא' : 'מסך מלא'}
        </Button>
      </div>
    </div>
  );
};

export default EnhancedPDFControls;

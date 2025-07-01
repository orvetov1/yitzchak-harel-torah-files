
import React from 'react';

interface VirtualPDFStatusBarProps {
  currentPage: number;
  totalPages: number;
  loadedPagesCount: number;
  visiblePages: number[];
  isFullscreen: boolean;
}

const VirtualPDFStatusBar = ({
  currentPage,
  totalPages,
  loadedPagesCount,
  visiblePages,
  isFullscreen
}: VirtualPDFStatusBarProps) => {
  return (
    <div className="bg-white border-t border-border p-2 text-center">
      <span className="hebrew-text text-xs text-muted-foreground">
        עמוד {currentPage} מתוך {totalPages} • {loadedPagesCount} עמודים בזיכרון
        {visiblePages.length > 0 && ` • מציג עמודים ${visiblePages.join(', ')}`}
        {isFullscreen && ' • מצב מסך מלא (לחץ F או Escape ליציאה)'}
      </span>
    </div>
  );
};

export default VirtualPDFStatusBar;

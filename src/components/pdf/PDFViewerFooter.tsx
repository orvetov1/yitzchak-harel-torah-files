
import React from 'react';

interface PDFViewerFooterProps {
  hasLinearizedVersion: boolean;
}

const PDFViewerFooter = ({ hasLinearizedVersion }: PDFViewerFooterProps) => {
  return (
    <div className="bg-white border-t border-border p-2 text-center">
      <span className="hebrew-text text-xs text-muted-foreground">
        Canvas rendering פעיל • ללא הטמעות כפולות
        {hasLinearizedVersion && ' • גרסה לינארית פעילה'}
      </span>
    </div>
  );
};

export default PDFViewerFooter;


import React from 'react';

interface PDFViewerFooterProps {
  hasLinearizedVersion: boolean;
  viewMode: 'hybrid' | 'pages' | 'full' | 'virtual';
}

const PDFViewerFooter = ({ hasLinearizedVersion, viewMode }: PDFViewerFooterProps) => {
  return (
    <div className="bg-white border-t border-border p-2 text-center">
      <span className="hebrew-text text-xs text-muted-foreground">
        Canvas rendering פעיל • לא נחסם ע"י Chrome
        {hasLinearizedVersion && ' • גרסה לינארית פעילה'}
        {viewMode === 'virtual' && ' • טעינה וירטואלית פעילה'}
        {viewMode === 'pages' && ' • טעינה לפי עמודים'}
      </span>
    </div>
  );
};

export default PDFViewerFooter;

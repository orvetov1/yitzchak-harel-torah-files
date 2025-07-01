
import React from 'react';

interface PDFModalFooterProps {
  pageLoading: boolean;
  hasLinearizedVersion: boolean;
}

const PDFModalFooter = ({ pageLoading, hasLinearizedVersion }: PDFModalFooterProps) => {
  return (
    <div className="bg-white border-t border-border p-2 text-center">
      <span className="hebrew-text text-xs text-muted-foreground">
        השתמש בחיצים לדפדוף, Ctrl+/- לזום, F11 למסך מלא, ESC לסגירה
        {pageLoading && ' • טוען עמוד...'}
        {hasLinearizedVersion && ' • גרסה לינארית פעילה'}
      </span>
    </div>
  );
};

export default PDFModalFooter;


import React, { Suspense } from 'react';

interface PDFWithSuspenseProps {
  children: React.ReactNode;
  fallback?: React.ReactNode;
}

const PDFWithSuspense = ({ children, fallback }: PDFWithSuspenseProps) => {
  const defaultFallback = (
    <div className="flex items-center justify-center h-96 hebrew-text">
      <div className="text-center space-y-2">
        <div className="animate-spin rounded-full h-16 w-16 border-b-4 border-primary mx-auto"></div>
        <div>טוען רכיב PDF...</div>
        <div className="text-sm text-muted-foreground">
          מכין סביבת עבודה מאובטחת
        </div>
      </div>
    </div>
  );

  return (
    <Suspense fallback={fallback || defaultFallback}>
      {children}
    </Suspense>
  );
};

export default PDFWithSuspense;

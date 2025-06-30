
import React from 'react';
import { Progress } from './ui/progress';

interface PDFViewerProgressProps {
  loadingProgress: number;
}

const PDFViewerProgress = ({ loadingProgress }: PDFViewerProgressProps) => {
  return (
    <div className="bg-white border-b border-border p-3">
      <div className="max-w-md mx-auto">
        <div className="flex items-center gap-3 mb-2">
          <span className="hebrew-text text-sm text-muted-foreground">
            טוען קובץ...
          </span>
          <span className="hebrew-text text-sm font-medium">
            {Math.round(loadingProgress)}%
          </span>
        </div>
        <Progress value={loadingProgress} className="h-2" />
      </div>
    </div>
  );
};

export default PDFViewerProgress;

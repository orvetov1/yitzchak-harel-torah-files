
import React from 'react';
import { Progress } from './ui/progress';
import { Button } from './ui/button';
import { X } from 'lucide-react';

interface PDFViewerProgressProps {
  loadingProgress: number;
  onCancel?: () => void;
}

const PDFViewerProgress = ({ loadingProgress, onCancel }: PDFViewerProgressProps) => {
  return (
    <div className="bg-white border-b border-border p-4">
      <div className="max-w-md mx-auto">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-3">
            <span className="hebrew-text text-sm text-muted-foreground">
              טוען קובץ...
            </span>
            <span className="hebrew-text text-sm font-medium">
              {Math.round(loadingProgress)}%
            </span>
          </div>
          
          {onCancel && (
            <Button
              variant="outline"
              size="sm"
              onClick={onCancel}
              className="hebrew-text text-xs"
            >
              <X size={12} />
              ביטול
            </Button>
          )}
        </div>
        
        <Progress value={loadingProgress} className="h-2" />
        
        {loadingProgress > 80 && (
          <p className="hebrew-text text-xs text-muted-foreground mt-2 text-center">
            כמעט מוכן...
          </p>
        )}
      </div>
    </div>
  );
};

export default PDFViewerProgress;


import React from 'react';
import { Progress } from './ui/progress';
import { Button } from './ui/button';
import { X, Clock } from 'lucide-react';

interface PDFViewerProgressProps {
  loadingProgress: number;
  fileSize?: number;
  waitingForUser?: boolean;
  onCancel?: () => void;
  onContinue?: () => void;
}

const PDFViewerProgress = ({ 
  loadingProgress, 
  fileSize = 0, 
  waitingForUser = false,
  onCancel, 
  onContinue 
}: PDFViewerProgressProps) => {
  const fileSizeKB = Math.round(fileSize / 1024);
  const isLargeFile = fileSize > 1024 * 1024; // > 1MB

  return (
    <div className="bg-white border-b border-border p-4">
      <div className="max-w-md mx-auto">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-3">
            {waitingForUser ? (
              <div className="flex items-center gap-2">
                <Clock size={16} className="text-amber-500" />
                <span className="hebrew-text text-sm text-muted-foreground">
                  הטעינה נמשכת...
                </span>
              </div>
            ) : (
              <span className="hebrew-text text-sm text-muted-foreground">
                {isLargeFile ? 'טוען קובץ גדול...' : 'טוען קובץ...'}
              </span>
            )}
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
        
        {fileSizeKB > 0 && (
          <p className="hebrew-text text-xs text-muted-foreground mt-1">
            גודל הקובץ: {fileSizeKB > 1024 ? `${Math.round(fileSizeKB/1024)}MB` : `${fileSizeKB}KB`}
          </p>
        )}
        
        {waitingForUser ? (
          <div className="mt-3 text-center space-y-2">
            <p className="hebrew-text text-sm text-muted-foreground">
              הקובץ גדול ולוקח זמן להיטען
            </p>
            {onContinue && (
              <Button
                variant="outline"
                size="sm"
                onClick={onContinue}
                className="hebrew-text text-xs"
              >
                המשך המתנה
              </Button>
            )}
          </div>
        ) : loadingProgress > 95 ? (
          <p className="hebrew-text text-xs text-muted-foreground mt-2 text-center">
            כמעט מוכן...
          </p>
        ) : null}
      </div>
    </div>
  );
};

export default PDFViewerProgress;

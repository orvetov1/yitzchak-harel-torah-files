
import React from 'react';
import { Progress } from './ui/progress';
import { Button } from './ui/button';
import { X, Clock, FileText } from 'lucide-react';

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
  const fileSizeMB = Math.round(fileSize / (1024 * 1024));
  const isLargeFile = fileSize > 1024 * 1024; // > 1MB

  return (
    <div className="bg-white border-b border-border p-4">
      <div className="max-w-md mx-auto">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-3">
            <FileText size={20} className="text-primary" />
            
            {waitingForUser ? (
              <div className="flex items-center gap-2">
                <Clock size={16} className="text-amber-500 animate-pulse" />
                <span className="hebrew-text text-sm font-medium text-amber-700">
                  הקובץ גדול - נדרש זמן נוסף
                </span>
              </div>
            ) : (
              <span className="hebrew-text text-sm font-medium text-primary">
                {isLargeFile ? `טוען קובץ של ${fileSizeMB}MB מקומית...` : 'טוען קובץ מקומית...'}
              </span>
            )}
          </div>
          
          <div className="flex items-center gap-2">
            <span className="hebrew-text text-lg font-bold text-primary">
              {Math.round(loadingProgress)}%
            </span>
            {onCancel && (
              <Button
                variant="outline"
                size="sm"
                onClick={onCancel}
                className="hebrew-text text-xs h-7"
              >
                <X size={14} />
                ביטול
              </Button>
            )}
          </div>
        </div>
        
        <Progress value={loadingProgress} className="h-3 mb-2" />
        
        {waitingForUser ? (
          <div className="mt-4 space-y-3 text-center">
            <div className="bg-amber-50 border border-amber-200 rounded-md p-3">
              <p className="hebrew-text text-sm text-amber-800 mb-2">
                הקובץ גדול ויכול לקחת עוד רגע להיטען (בטעינה מקומית)
              </p>
              <div className="flex gap-2 justify-center">
                {onContinue && (
                  <Button
                    variant="default"
                    size="sm"
                    onClick={onContinue}
                    className="hebrew-text text-xs"
                  >
                    המשך המתנה
                  </Button>
                )}
                {onCancel && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={onCancel}
                    className="hebrew-text text-xs"
                  >
                    בטל וסגור
                  </Button>
                )}
              </div>
            </div>
          </div>
        ) : (
          <div className="text-center">
            {loadingProgress > 95 ? (
              <p className="hebrew-text text-xs text-green-600 font-medium">
                כמעט מוכן... מעבד את הקובץ
              </p>
            ) : loadingProgress > 80 ? (
              <p className="hebrew-text text-xs text-blue-600">
                מסיים טעינה מקומית...
              </p>
            ) : (
              <p className="hebrew-text text-xs text-muted-foreground">
                {isLargeFile ? 'קובץ גדול - טוען מקומית' : 'טוען מקומית...'}
              </p>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default PDFViewerProgress;


import React from 'react';
import { Progress } from './ui/progress';
import { Button } from './ui/button';
import { X, Clock, FileText, Zap } from 'lucide-react';

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
  const isLargeFile = fileSize > 2 * 1024 * 1024; // > 2MB
  const isVeryLargeFile = fileSize > 5 * 1024 * 1024; // > 5MB

  const getProgressMessage = () => {
    if (waitingForUser) {
      return isVeryLargeFile 
        ? 'קובץ גדול מאוד - מתבצע אופטימיזציה'
        : 'מעבד קובץ גדול - אנא המתן';
    }
    
    if (loadingProgress > 95) {
      return 'מסיים עיבוד...';
    } else if (loadingProgress > 80) {
      return isLargeFile ? 'כמעט מוכן (מותאם לביצועים)' : 'כמעט מוכן...';
    } else if (loadingProgress > 50) {
      return 'טוען דפים...';
    } else {
      return isLargeFile ? 'טוען קובץ גדול (מותאם)' : 'טוען מהר מקומית...';
    }
  };

  const getSpeedIndicator = () => {
    if (fileSize === 0) return null;
    
    const estimatedTimeSeconds = isVeryLargeFile ? 4 : isLargeFile ? 2 : 1;
    const progressRate = loadingProgress / 100;
    const remainingTime = Math.max(0, estimatedTimeSeconds * (1 - progressRate));
    
    if (remainingTime < 0.5) return null;
    
    return (
      <div className="flex items-center gap-1 text-xs text-muted-foreground">
        <Zap size={12} className="text-green-600" />
        <span>עוד ~{Math.ceil(remainingTime)} שניות</span>
      </div>
    );
  };

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
                  {getProgressMessage()}
                </span>
              </div>
            ) : (
              <div className="space-y-1">
                <span className="hebrew-text text-sm font-medium text-primary">
                  {getProgressMessage()}
                </span>
                {getSpeedIndicator()}
              </div>
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
        
        {fileSize > 0 && (
          <div className="text-center text-xs text-muted-foreground mb-2">
            {isVeryLargeFile ? (
              <span className="text-amber-600">קובץ גדול: {fileSizeMB}MB (אופטימיזציה אוטומטית)</span>
            ) : isLargeFile ? (
              <span className="text-blue-600">קובץ בינוני: {fileSizeMB}MB (טעינה מהירה)</span>
            ) : (
              <span className="text-green-600">קובץ קטן: {fileSizeKB}KB (טעינה מהירה מאוד)</span>
            )}
          </div>
        )}
        
        {waitingForUser ? (
          <div className="mt-4 space-y-3 text-center">
            <div className="bg-amber-50 border border-amber-200 rounded-md p-3">
              <p className="hebrew-text text-sm text-amber-800 mb-2">
                {isVeryLargeFile 
                  ? 'קובץ גדול מאוד - מתבצעת אופטימיזציה אוטומטית לביצועים טובים יותר'
                  : 'הקובץ בתהליך עיבוד מתקדם - זה יכול לקחת עוד רגע'
                }
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
            <p className="hebrew-text text-xs text-muted-foreground">
              {loadingProgress > 95 ? (
                <span className="text-green-600 font-medium">כמעט מוכן - מעבד את הקובץ...</span>
              ) : loadingProgress > 80 ? (
                <span className="text-blue-600">מסיים טעינה מקומית (מותאם לביצועים)...</span>
              ) : (
                <span>טוען במהירות ממשאבים מקומיים (אופטימיזציה אוטומטית)</span>
              )}
            </p>
          </div>
        )}
      </div>
    </div>
  );
};

export default PDFViewerProgress;

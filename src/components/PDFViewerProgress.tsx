
import React from 'react';
import { Progress } from './ui/progress';
import { Button } from './ui/button';
import { X, Clock, FileText, Download, RefreshCw, ExternalLink, Settings } from 'lucide-react';
import { FallbackStrategy } from '../hooks/usePDFFallback';

interface PDFViewerProgressProps {
  loadingProgress: number;
  fileSize?: number;
  waitingForUser?: boolean;
  loadingPhase?: string;
  fallbackSuggestion?: FallbackStrategy | null;
  debugMode?: boolean;
  onCancel?: () => void;
  onContinue?: () => void;
  onFallback?: (strategy: FallbackStrategy) => void;
  onToggleDebug?: () => void;
}

const PDFViewerProgress = ({ 
  loadingProgress, 
  fileSize = 0, 
  waitingForUser = false,
  loadingPhase = '',
  fallbackSuggestion = null,
  debugMode = false,
  onCancel, 
  onContinue,
  onFallback,
  onToggleDebug
}: PDFViewerProgressProps) => {
  const fileSizeKB = Math.round(fileSize / 1024);
  const fileSizeMB = Math.round(fileSize / (1024 * 1024) * 10) / 10;
  const isLargeFile = fileSize > 3 * 1024 * 1024; // > 3MB

  // Calculate expected time based on file size
  const getExpectedTime = () => {
    if (fileSize <= 1024 * 1024) return '8 שניות';
    if (fileSize <= 3 * 1024 * 1024) return '12 שניות';
    if (fileSize <= 5 * 1024 * 1024) return '18 שניות';
    return '25 שניות';
  };

  const getFallbackText = (strategy: FallbackStrategy) => {
    const texts = {
      'simple-load': 'טען במצב פשוט',
      'page-by-page': 'טען עמוד אחר עמוד',
      'new-tab': 'פתח בטאב חדש',
      'download-only': 'הורד קובץ'
    };
    return texts[strategy] || 'נסה חלופה';
  };

  const getFallbackIcon = (strategy: FallbackStrategy) => {
    switch (strategy) {
      case 'simple-load': return <RefreshCw size={14} />;
      case 'page-by-page': return <FileText size={14} />;
      case 'new-tab': return <ExternalLink size={14} />;
      case 'download-only': return <Download size={14} />;
      default: return <RefreshCw size={14} />;
    }
  };

  return (
    <div className="bg-white border-b border-border p-4">
      <div className="max-w-md mx-auto">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-3">
            {waitingForUser ? (
              <Clock size={20} className="text-amber-500 animate-pulse" />
            ) : (
              <FileText size={20} className="text-primary" />
            )}
            
            {waitingForUser ? (
              <div className="flex items-center gap-2">
                <span className="hebrew-text text-sm font-medium text-amber-700">
                  הקובץ דורש זמן נוסף לעיבוד
                </span>
              </div>
            ) : (
              <div className="space-y-1">
                <span className="hebrew-text text-sm font-medium text-primary">
                  {isLargeFile ? `טוען קובץ של ${fileSizeMB}MB...` : `טוען קובץ של ${fileSizeKB}KB...`}
                </span>
                {loadingPhase && (
                  <div className="hebrew-text text-xs text-muted-foreground">
                    {loadingPhase}
                  </div>
                )}
                {debugMode && (
                  <div className="hebrew-text text-xs text-blue-600 font-mono">
                    DEBUG: {Math.round(loadingProgress)}% | רזולוציה מלאה
                  </div>
                )}
              </div>
            )}
          </div>
          
          <div className="flex items-center gap-2">
            <span className="hebrew-text text-lg font-bold text-primary">
              {Math.round(loadingProgress)}%
            </span>
            {onToggleDebug && (
              <Button
                variant="ghost"
                size="sm"
                onClick={onToggleDebug}
                className={`h-7 w-7 p-0 ${debugMode ? 'bg-blue-100 text-blue-600' : ''}`}
                title="מצב דיבוג"
              >
                <Settings size={14} />
              </Button>
            )}
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
              <p className="hebrew-text text-sm text-amber-800 mb-1">
                עיבוד הקובץ לוקח יותר זמן מהצפוי
              </p>
              <p className="hebrew-text text-xs text-amber-600 mb-3">
                זמן צפוי לקובץ זה: עד {getExpectedTime()}
              </p>
              
              <div className="space-y-2">
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
                
                {/* Fallback options */}
                {fallbackSuggestion && onFallback && (
                  <div className="pt-2 border-t border-amber-200">
                    <p className="hebrew-text text-xs text-amber-700 mb-2">אפשרויות חלופיות:</p>
                    <div className="flex gap-1 justify-center flex-wrap">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => onFallback(fallbackSuggestion)}
                        className="hebrew-text text-xs h-7 bg-white"
                      >
                        {getFallbackIcon(fallbackSuggestion)}
                        {getFallbackText(fallbackSuggestion)}
                      </Button>
                      
                      {/* Additional fallback options */}
                      {fallbackSuggestion !== 'new-tab' && (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => onFallback('new-tab')}
                          className="hebrew-text text-xs h-7 bg-white"
                        >
                          <ExternalLink size={14} />
                          פתח בטאב חדש
                        </Button>
                      )}
                    </div>
                  </div>
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
                מסיים עיבוד הקובץ...
              </p>
            ) : (
              <div className="space-y-1">
                <p className="hebrew-text text-xs text-muted-foreground">
                  {isLargeFile ? 'קובץ גדול - עיבוד עלול לקחת זמן' : 'מעבד קובץ...'}
                </p>
                <p className="hebrew-text text-xs text-muted-foreground/70">
                  זמן צפוי: עד {getExpectedTime()}
                </p>
                {debugMode && (
                  <p className="hebrew-text text-xs text-blue-600 font-mono">
                    מצב דיבוג פעיל - לוגים מפורטים בקונסולה
                  </p>
                )}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default PDFViewerProgress;

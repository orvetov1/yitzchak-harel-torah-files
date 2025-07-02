
import React, { useState, useEffect } from 'react';
import { Button } from '../ui/button';
import { RefreshCw, Image, FileText, AlertTriangle } from 'lucide-react';
import PDFWorkerManager from '../../utils/pdfWorkerConfig';

interface PDFProgressiveLoaderProps {
  pageNumber: number;
  pageUrl: string | null;
  isLoading: boolean;
  onRetry: () => void;
  renderMode: 'pdf' | 'image' | 'fallback';
  children: React.ReactNode;
}

const PDFProgressiveLoader = ({
  pageNumber,
  pageUrl,
  isLoading,
  onRetry,
  renderMode,
  children
}: PDFProgressiveLoaderProps) => {
  const [loadAttempts, setLoadAttempts] = useState(0);
  const [lastError, setLastError] = useState<string | null>(null);
  const [showDiagnostics, setShowDiagnostics] = useState(false);

  const handleRetry = () => {
    setLoadAttempts(prev => prev + 1);
    setLastError(null);
    onRetry();
  };

  const handleError = (error: string) => {
    setLastError(error);
    console.error(`📄 Progressive loader error for page ${pageNumber}:`, error);
  };

  // Reset attempts when page changes
  useEffect(() => {
    setLoadAttempts(0);
    setLastError(null);
    setShowDiagnostics(false);
  }, [pageNumber, pageUrl]);

  // Get worker diagnostics
  const workerManager = PDFWorkerManager.getInstance();
  const diagnostics = workerManager.getDiagnostics();

  // Show loading state
  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-96 hebrew-text">
        <div className="text-center space-y-4">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
          <div className="space-y-1">
            <div>טוען עמוד {pageNumber}...</div>
            <div className="text-xs text-muted-foreground flex items-center justify-center gap-2">
              {renderMode === 'pdf' && <><FileText size={12} /> PDF Worker</>}
              {renderMode === 'image' && <><Image size={12} /> תמונה</>}
              {renderMode === 'fallback' && <><AlertTriangle size={12} /> מצב חלופי</>}
              {loadAttempts > 0 && <span>(נסיון {loadAttempts + 1})</span>}
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Show error state if no URL and not loading
  if (!pageUrl && !isLoading) {
    return (
      <div className="flex items-center justify-center h-96 hebrew-text">
        <div className="text-center space-y-4 max-w-md">
          <div className="text-muted-foreground">
            <div className="mb-2">עמוד {pageNumber} לא זמין</div>
            {lastError && (
              <div className="text-xs text-red-600 bg-red-50 p-2 rounded mb-3">
                {lastError}
              </div>
            )}
          </div>
          
          <div className="space-y-2">
            <Button
              variant="outline"
              size="sm"
              onClick={handleRetry}
              className="hebrew-text"
              disabled={loadAttempts >= 3}
            >
              <RefreshCw size={16} className="ml-2" />
              {loadAttempts >= 3 ? 'מקסימום נסיונות' : 'נסה שוב'}
            </Button>
            
            {loadAttempts >= 2 && (
              <div className="space-y-2">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setShowDiagnostics(!showDiagnostics)}
                  className="hebrew-text text-xs"
                >
                  {showDiagnostics ? 'הסתר' : 'הצג'} מידע טכני
                </Button>
                
                {showDiagnostics && (
                  <div className="text-xs text-muted-foreground bg-gray-50 p-3 rounded max-w-sm">
                    <div className="font-medium mb-2">מצב PDF Worker:</div>
                    <div>• מאותחל: {diagnostics.initialized ? 'כן' : 'לא'}</div>
                    <div>• מצב חלופי: {diagnostics.fallbackMode ? 'כן' : 'לא'}</div>
                    <div>• מקור: {diagnostics.workerSource || 'לא זמין'}</div>
                    {diagnostics.errors.length > 0 && (
                      <div className="mt-2">
                        <div className="font-medium">שגיאות:</div>
                        {diagnostics.errors.slice(-2).map((error, i) => (
                          <div key={i} className="text-red-600">• {error}</div>
                        ))}
                      </div>
                    )}
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    );
  }

  // Render content with error boundary
  return (
    <div
      onError={(e) => {
        const error = e as any;
        handleError(error.message || 'שגיאה בטעינת התוכן');
      }}
    >
      {children}
    </div>
  );
};

export default PDFProgressiveLoader;

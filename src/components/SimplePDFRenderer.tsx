
import React, { useRef, useEffect, useState } from 'react';
import { Button } from './ui/button';
import { RefreshCw } from 'lucide-react';
import PDFEmbed from './PDFEmbed';

interface SimplePDFRendererProps {
  pdfUrl: string;
  scale: number;
  onLoadSuccess?: () => void;
  onLoadError?: (error: Error) => void;
  className?: string;
}

const SimplePDFRenderer = ({ 
  pdfUrl, 
  scale, 
  onLoadSuccess, 
  onLoadError,
  className = "" 
}: SimplePDFRendererProps) => {
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [retryCount, setRetryCount] = useState(0);
  const timeoutRef = useRef<NodeJS.Timeout>();

  useEffect(() => {
    console.log(`🔄 SimplePDFRenderer loading PDF: ${pdfUrl}`);
    setIsLoading(true);
    setError(null);

    // Backup timeout to ensure loading state doesn't persist forever
    timeoutRef.current = setTimeout(() => {
      console.log('⏰ SimplePDFRenderer timeout - assuming loaded');
      setIsLoading(false);
      onLoadSuccess?.();
    }, 10000); // 10 second backup timeout

    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, [pdfUrl, retryCount, onLoadSuccess]);

  const handleLoad = () => {
    console.log(`✅ PDF loaded successfully: ${pdfUrl}`);
    setIsLoading(false);
    setError(null);
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }
    onLoadSuccess?.();
  };

  const handleError = (errorMsg: string) => {
    console.error(`❌ ${errorMsg}`);
    setIsLoading(false);
    setError(errorMsg);
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }
    onLoadError?.(new Error(errorMsg));
  };

  const handleRetry = () => {
    console.log(`🔄 Retrying PDF load, attempt: ${retryCount + 1}`);
    setRetryCount(prev => prev + 1);
  };

  if (error) {
    return (
      <div className={`flex flex-col items-center justify-center p-8 bg-gray-50 rounded-lg ${className}`}>
        <div className="text-center space-y-4">
          <div className="text-red-600 hebrew-text">שגיאה בטעינת PDF</div>
          <div className="text-sm text-gray-600">{error}</div>
          <Button onClick={handleRetry} variant="outline" className="hebrew-text">
            <RefreshCw size={16} className="ml-2" />
            נסה שוב
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className={`relative ${className}`} style={{ transform: `scale(${scale})`, transformOrigin: 'top center' }}>
      {isLoading && (
        <div className="absolute inset-0 flex items-center justify-center bg-white bg-opacity-75 z-10">
          <div className="text-center space-y-2">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
            <div className="hebrew-text text-sm">טוען PDF...</div>
          </div>
        </div>
      )}
      
      <PDFEmbed
        src={pdfUrl}
        title="PDF Viewer"
        className="w-full h-[800px] rounded-lg shadow-lg"
        onError={handleError}
      />
    </div>
  );
};

export default SimplePDFRenderer;

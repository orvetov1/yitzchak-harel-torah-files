
import React, { useState, useRef, useEffect } from 'react';
import { Button } from './ui/button';
import { ExternalLink, RefreshCw } from 'lucide-react';

interface PDFEmbedProps {
  src: string;
  title?: string;
  className?: string;
  onError?: (error: string) => void;
}

const PDFEmbed = ({ src, title = 'PDF Document', className = '', onError }: PDFEmbedProps) => {
  const [embedMethod, setEmbedMethod] = useState<'embed' | 'object' | 'iframe' | 'fallback'>('embed');
  const [hasError, setHasError] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const timeoutRef = useRef<NodeJS.Timeout>();

  console.log(`📄 PDFEmbed rendering with method: ${embedMethod}, src: ${src}`);

  // Clear loading after timeout to prevent infinite loading
  useEffect(() => {
    if (isLoading) {
      timeoutRef.current = setTimeout(() => {
        console.log('⏰ PDF loading timeout reached, removing loader');
        setIsLoading(false);
      }, 8000); // 8 second timeout
    }

    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, [isLoading, embedMethod]);

  const handleEmbedError = () => {
    console.log('🚫 Embed method failed, trying object method');
    setEmbedMethod('object');
    setIsLoading(true);
  };

  const handleObjectError = () => {
    console.log('🚫 Object method failed, trying iframe method');
    setEmbedMethod('iframe');
    setIsLoading(true);
  };

  const handleIframeError = () => {
    console.log('🚫 Iframe method failed, showing fallback');
    setEmbedMethod('fallback');
    setHasError(true);
    setIsLoading(false);
    onError?.('PDF cannot be displayed in browser');
  };

  const handleLoad = () => {
    console.log(`✅ PDF loaded successfully with method: ${embedMethod}`);
    setIsLoading(false);
    setHasError(false);
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }
  };

  const openInNewTab = () => {
    window.open(src, '_blank', 'noopener,noreferrer');
  };

  const resetAndRetry = () => {
    console.log('🔄 Resetting and retrying PDF load');
    setEmbedMethod('embed');
    setHasError(false);
    setIsLoading(true);
  };

  useEffect(() => {
    console.log(`🔄 PDF source changed to: ${src}`);
    setEmbedMethod('embed');
    setHasError(false);
    setIsLoading(true);
  }, [src]);

  if (embedMethod === 'fallback' || hasError) {
    return (
      <div className={`flex items-center justify-center bg-gray-50 border-2 border-dashed border-gray-300 ${className}`}>
        <div className="text-center space-y-4 p-8">
          <div className="text-gray-600 hebrew-text">
            לא ניתן להציג את הקובץ בדפדפן
          </div>
          <div className="text-sm text-gray-500 hebrew-text">
            הדפדפן חוסם הצגת קובצי PDF מסיבות אבטחה
          </div>
          <div className="flex gap-2 justify-center">
            <Button onClick={openInNewTab} className="hebrew-text">
              <ExternalLink size={16} className="ml-2" />
              פתח בטאב חדש
            </Button>
            <Button 
              variant="outline" 
              onClick={resetAndRetry}
              className="hebrew-text"
            >
              <RefreshCw size={16} className="ml-2" />
              נסה שוב
            </Button>
          </div>
        </div>
      </div>
    );
  }

  if (embedMethod === 'iframe') {
    return (
      <div className={`relative ${className}`}>
        {isLoading && (
          <div className="absolute inset-0 flex items-center justify-center bg-gray-50 z-10">
            <div className="text-center space-y-2">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
              <div className="text-gray-600 hebrew-text text-sm">טוען PDF...</div>
            </div>
          </div>
        )}
        <iframe
          src={`${src}#toolbar=1&navpanes=1&scrollbar=1&view=FitH`}
          title={title}
          className="w-full h-full border-0"
          onLoad={handleLoad}
          onError={handleIframeError}
        />
      </div>
    );
  }

  if (embedMethod === 'object') {
    return (
      <div className={`relative ${className}`}>
        {isLoading && (
          <div className="absolute inset-0 flex items-center justify-center bg-gray-50 z-10">
            <div className="text-center space-y-2">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
              <div className="text-gray-600 hebrew-text text-sm">טוען PDF...</div>
            </div>
          </div>
        )}
        <object
          data={src}
          type="application/pdf"
          className="w-full h-full"
          title={title}
          onLoad={handleLoad}
          onError={handleObjectError}
        >
          <div className="flex items-center justify-center bg-gray-50 h-full">
            <div className="text-center space-y-4 p-8">
              <div className="text-gray-600 hebrew-text">
                הקובץ נטען...
              </div>
              <Button onClick={openInNewTab} className="hebrew-text">
                <ExternalLink size={16} className="ml-2" />
                פתח בטאב חדש
              </Button>
            </div>
          </div>
        </object>
      </div>
    );
  }

  // Default: embed method
  return (
    <div className={`relative ${className}`}>
      {isLoading && (
        <div className="absolute inset-0 flex items-center justify-center bg-gray-50 z-10">
          <div className="text-center space-y-2">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
            <div className="text-gray-600 hebrew-text text-sm">טוען PDF...</div>
          </div>
        </div>
      )}
      <embed
        src={`${src}#toolbar=1&navpanes=1&scrollbar=1&view=FitH`}
        type="application/pdf"
        className="w-full h-full"
        title={title}
        onLoad={handleLoad}
        onError={handleEmbedError}
      />
    </div>
  );
};

export default PDFEmbed;

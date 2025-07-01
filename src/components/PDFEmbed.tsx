
import React, { useState, useRef, useEffect } from 'react';
import { Button } from './ui/button';
import { ExternalLink, RefreshCw } from 'lucide-react';

interface PDFEmbedProps {
  src: string;
  title?: string;
  className?: string;
  onLoad?: () => void;
  onError?: (error: string) => void;
}

const PDFEmbed = ({ src, title = 'PDF Document', className = '', onLoad, onError }: PDFEmbedProps) => {
  const [embedMethod, setEmbedMethod] = useState<'embed' | 'object' | 'iframe' | 'fallback'>('embed');
  const [hasError, setHasError] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const timeoutRef = useRef<NodeJS.Timeout>();

  console.log(`📄 PDFEmbed rendering with method: ${embedMethod}, src: ${src}`);

  // Clear any existing timeout
  const clearLoadingTimeout = () => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
      timeoutRef.current = undefined;
    }
  };

  // Set a loading timeout to prevent infinite loading
  const setLoadingTimeout = (duration: number = 8000) => {
    clearLoadingTimeout();
    timeoutRef.current = setTimeout(() => {
      console.log(`⏰ Loading timeout reached for ${embedMethod} method`);
      handleLoadingTimeout();
    }, duration);
  };

  const handleLoadingTimeout = () => {
    if (embedMethod === 'embed') {
      console.log('🚫 Embed timeout, trying object method');
      setEmbedMethod('object');
    } else if (embedMethod === 'object') {
      console.log('🚫 Object timeout, trying iframe method');
      setEmbedMethod('iframe');
    } else if (embedMethod === 'iframe') {
      console.log('🚫 Iframe timeout, showing fallback');
      setEmbedMethod('fallback');
      setHasError(true);
      setIsLoading(false);
      onError?.('לא ניתן להציג את הקובץ בדפדפן');
    }
  };

  const handleSuccess = () => {
    console.log(`✅ PDF loaded successfully with method: ${embedMethod}`);
    clearLoadingTimeout();
    setIsLoading(false);
    setHasError(false);
    onLoad?.();
  };

  const handleEmbedError = () => {
    console.log('🚫 Embed method failed, trying object method');
    clearLoadingTimeout();
    setEmbedMethod('object');
    setIsLoading(true);
  };

  const handleObjectError = () => {
    console.log('🚫 Object method failed, trying iframe method');
    clearLoadingTimeout();
    setEmbedMethod('iframe');
    setIsLoading(true);
  };

  const handleIframeError = () => {
    console.log('🚫 Iframe method failed, showing fallback');
    clearLoadingTimeout();
    setEmbedMethod('fallback');
    setHasError(true);
    setIsLoading(false);
    onError?.('PDF cannot be displayed in browser');
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

  // Reset when src changes
  useEffect(() => {
    console.log(`🔄 PDF source changed to: ${src}`);
    clearLoadingTimeout();
    setEmbedMethod('embed');
    setHasError(false);
    setIsLoading(true);
  }, [src]);

  // Set timeout when method changes
  useEffect(() => {
    if (embedMethod !== 'fallback' && isLoading) {
      setLoadingTimeout();
    }
    return clearLoadingTimeout;
  }, [embedMethod, isLoading]);

  // Handle embed method detection - since embed/object don't fire reliable load events,
  // we'll use a shorter timeout and assume success if no error occurs
  useEffect(() => {
    if ((embedMethod === 'embed' || embedMethod === 'object') && isLoading) {
      const checkTimeout = setTimeout(() => {
        console.log(`✅ Assuming ${embedMethod} loaded successfully (no error detected)`);
        handleSuccess();
      }, 3000); // Shorter timeout for embed/object

      return () => clearTimeout(checkTimeout);
    }
  }, [embedMethod, isLoading]);

  // Cleanup on unmount
  useEffect(() => {
    return clearLoadingTimeout;
  }, []);

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
              <div className="text-gray-600 hebrew-text text-sm">טוען בשיטה חלופית...</div>
            </div>
          </div>
        )}
        <iframe
          src={`${src}#toolbar=1&navpanes=1&scrollbar=1&view=FitH`}
          title={title}
          className="w-full h-full border-0"
          onLoad={handleSuccess}
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
          onError={handleObjectError}
        >
          <div className="flex items-center justify-center bg-gray-50 h-full">
            <div className="text-center space-y-4 p-8">
              <div className="text-gray-600 hebrew-text">
                טוען קובץ PDF...
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
        onError={handleEmbedError}
      />
    </div>
  );
};

export default PDFEmbed;


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
  const [embedMethod, setEmbedMethod] = useState<'embed' | 'object' | 'fallback'>('embed');
  const [hasError, setHasError] = useState(false);
  const embedRef = useRef<HTMLEmbedElement>(null);
  const objectRef = useRef<HTMLObjectElement>(null);

  const handleEmbedError = () => {
    console.log('🚫 Embed method failed, trying object method');
    setEmbedMethod('object');
  };

  const handleObjectError = () => {
    console.log('🚫 Object method failed, showing fallback');
    setEmbedMethod('fallback');
    setHasError(true);
    onError?.('PDF cannot be displayed in browser');
  };

  const openInNewTab = () => {
    window.open(src, '_blank', 'noopener,noreferrer');
  };

  useEffect(() => {
    // Reset when src changes
    setEmbedMethod('embed');
    setHasError(false);
  }, [src]);

  if (embedMethod === 'fallback' || hasError) {
    return (
      <div className={`flex items-center justify-center bg-gray-50 border-2 border-dashed border-gray-300 ${className}`}>
        <div className="text-center space-y-4 p-8">
          <div className="text-gray-600 hebrew-text">
            לא ניתן להציג את הקובץ בדפדפן
          </div>
          <div className="flex gap-2 justify-center">
            <Button onClick={openInNewTab} className="hebrew-text">
              <ExternalLink size={16} className="ml-2" />
              פתח בטאב חדש
            </Button>
            <Button 
              variant="outline" 
              onClick={() => setEmbedMethod('embed')}
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

  if (embedMethod === 'object') {
    return (
      <object
        ref={objectRef}
        data={src}
        type="application/pdf"
        className={className}
        title={title}
        onError={handleObjectError}
      >
        <div className="flex items-center justify-center bg-gray-50 border-2 border-dashed border-gray-300 h-full">
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
    );
  }

  return (
    <embed
      ref={embedRef}
      src={`${src}#toolbar=1&navpanes=1&scrollbar=1`}
      type="application/pdf"
      className={className}
      title={title}
      onError={handleEmbedError}
    />
  );
};

export default PDFEmbed;

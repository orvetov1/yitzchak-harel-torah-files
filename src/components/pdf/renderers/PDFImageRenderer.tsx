
import React, { useState } from 'react';
import { AlertTriangle } from 'lucide-react';

interface PDFImageRendererProps {
  pageNumber: number;
  pageUrl: string;
  scale: number;
}

const PDFImageRenderer = ({ pageNumber, pageUrl, scale }: PDFImageRendererProps) => {
  const [imageError, setImageError] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  
  // Check if this is actually an image file or a PDF being rendered as fallback
  const isActualImage = /\.(png|jpg|jpeg|gif|webp)(\?|$)/i.test(pageUrl);
  
  console.log(`🖼️ PDFImageRenderer - Page ${pageNumber}:`, {
    pageUrl,
    isActualImage,
    scale,
    imageError
  });
  
  const handleImageLoad = () => {
    setIsLoading(false);
    console.log(`✅ Image page ${pageNumber} loaded successfully`);
  };

  const handleImageError = (error: any) => {
    setIsLoading(false);
    setImageError(true);
    console.error(`❌ Image page ${pageNumber} load error:`, error);
  };

  if (imageError) {
    return (
      <div className="bg-white shadow-lg flex items-center justify-center p-8 min-h-[400px]">
        <div className="text-center space-y-3 hebrew-text">
          <AlertTriangle size={48} className="mx-auto text-yellow-600" />
          <div className="text-lg font-medium">שגיאה בטעינת העמוד</div>
          <div className="text-sm text-muted-foreground">
            {isActualImage ? 'לא ניתן להציג את התמונה' : 'לא ניתן להציג את קובץ ה-PDF'}
          </div>
          <div className="text-xs text-muted-foreground">
            עמוד {pageNumber}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div 
      className="bg-white shadow-lg flex items-center justify-center p-4"
      style={{ transform: `scale(${scale})`, transformOrigin: 'top center' }}
    >
      {isLoading && (
        <div className="absolute inset-0 flex items-center justify-center bg-white/80">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
        </div>
      )}
      
      <img
        src={pageUrl}
        alt={`עמוד ${pageNumber}`}
        className="max-w-full h-auto"
        style={{ maxHeight: '800px' }}
        loading="lazy"
        onLoad={handleImageLoad}
        onError={handleImageError}
      />
      
      {!isActualImage && !imageError && (
        <div className="absolute bottom-2 right-2 bg-yellow-100 text-yellow-800 px-2 py-1 rounded text-xs hebrew-text">
          מצב תצוגה חלופי
        </div>
      )}
    </div>
  );
};

export default PDFImageRenderer;

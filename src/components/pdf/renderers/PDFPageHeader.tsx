
import React from 'react';

interface PDFPageHeaderProps {
  pageNumber: number;
  totalPages: number;
  pageUrl: string | null;
  isCurrentPage: boolean;
}

const PDFPageHeader = ({ pageNumber, totalPages, pageUrl, isCurrentPage }: PDFPageHeaderProps) => {
  // Check if the URL points to an image file
  const isImageFile = pageUrl ? /\.(png|jpg|jpeg|gif|webp)(\?|$)/i.test(pageUrl) : false;
  const renderMode = pageUrl ? (isImageFile ? 'image' : 'pdf') : 'fallback';

  return (
    <div className="text-center hebrew-text text-sm text-gray-600 mb-2">
      עמוד {pageNumber} מתוך {totalPages}
      {pageUrl && (
        <div className="text-xs text-muted-foreground mt-1 flex items-center justify-center gap-2">
          <span>{renderMode === 'image' ? '🖼️ תמונה' : '📄 PDF'}</span>
          {isCurrentPage && <span className="text-primary">• נוכחי</span>}
        </div>
      )}
    </div>
  );
};

export default PDFPageHeader;

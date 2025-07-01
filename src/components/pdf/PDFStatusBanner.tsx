
import React from 'react';

interface PDFStatusBannerProps {
  isLinearizing?: boolean;
  hasLinearizedVersion?: boolean;
  compressionRatio?: number;
  originalSize?: number;
  linearizedSize?: number;
}

const PDFStatusBanner = ({
  isLinearizing,
  hasLinearizedVersion,
  compressionRatio,
  originalSize,
  linearizedSize
}: PDFStatusBannerProps) => {
  if (isLinearizing) {
    return (
      <div className="bg-blue-50 border-b border-blue-200 px-4 py-2">
        <div className="hebrew-text text-sm text-blue-800 text-center">
          🔄 יוצר גרסה לינארית לטעינה מהירה יותר...
        </div>
      </div>
    );
  }

  if (hasLinearizedVersion) {
    return (
      <div className="bg-green-50 border-b border-green-200 px-4 py-2">
        <div className="hebrew-text text-sm text-green-800 text-center">
          ✨ משתמש בגרסה לינארית - 
          חיסכון של {compressionRatio?.toFixed(1)}% בגודל הקובץ
          ({Math.round((originalSize || 0) / 1024)}KB → {Math.round((linearizedSize || 0) / 1024)}KB)
        </div>
      </div>
    );
  }

  return null;
};

export default PDFStatusBanner;

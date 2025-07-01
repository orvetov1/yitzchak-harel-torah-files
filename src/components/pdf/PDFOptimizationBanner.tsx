
import React from 'react';

interface PDFOptimizationBannerProps {
  hasLinearizedVersion: boolean;
  compressionRatio?: number;
  originalSize?: number;
  optimizedSize?: number;
}

const PDFOptimizationBanner = ({
  hasLinearizedVersion,
  compressionRatio,
  originalSize,
  optimizedSize
}: PDFOptimizationBannerProps) => {
  if (!hasLinearizedVersion) return null;

  return (
    <div className="bg-green-50 border-b border-green-200 px-4 py-2">
      <div className="hebrew-text text-sm text-green-800 text-center">
        ✨ משתמש בגרסה לינארית - 
        חיסכון של {compressionRatio?.toFixed(1)}% בגודל הקובץ
        ({Math.round((originalSize || 0) / 1024)}KB → {Math.round((optimizedSize || 0) / 1024)}KB)
      </div>
    </div>
  );
};

export default PDFOptimizationBanner;

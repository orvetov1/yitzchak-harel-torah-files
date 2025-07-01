
import React from 'react';
import { Badge } from '../ui/badge';

interface PDFLinearizationBadgeProps {
  viewMode: 'hybrid' | 'pages' | 'full' | 'virtual';
  hasLinearizedVersion: boolean;
  isLinearizing: boolean;
  compressionRatio?: number;
  pagesLength: number;
}

const PDFLinearizationBadge = ({
  viewMode,
  hasLinearizedVersion,
  isLinearizing,
  compressionRatio,
  pagesLength
}: PDFLinearizationBadgeProps) => {
  if (viewMode === 'virtual') {
    return (
      <Badge variant="default" className="bg-purple-100 text-purple-800 border-purple-200">
        🚀 Canvas rendering פעיל
      </Badge>
    );
  }

  if (hasLinearizedVersion) {
    return (
      <Badge variant="default" className="bg-green-100 text-green-800 border-green-200">
        ✨ לינארי ({compressionRatio?.toFixed(1)}% חיסכון)
      </Badge>
    );
  }
  
  if (isLinearizing) {
    return (
      <Badge variant="secondary" className="bg-blue-100 text-blue-800 border-blue-200 animate-pulse">
        🔄 מייצר גרסה לינארית...
      </Badge>
    );
  }

  if (pagesLength > 0) {
    return (
      <Badge variant="outline" className="text-purple-600 border-purple-200">
        📄 טעינה לפי עמודים ({pagesLength})
      </Badge>
    );
  }

  return (
    <Badge variant="outline" className="text-gray-600">
      📁 טעינה רגילה
    </Badge>
  );
};

export default PDFLinearizationBadge;

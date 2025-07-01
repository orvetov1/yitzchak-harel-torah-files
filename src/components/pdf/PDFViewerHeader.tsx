
import React from 'react';
import { Button } from '../ui/button';
import { Badge } from '../ui/badge';
import { Download, X, Zap } from 'lucide-react';

interface PDFViewerHeaderProps {
  fileName: string;
  currentPage: number;
  totalPages: number;
  viewMode: 'virtual' | 'standard';
  hasLinearizedVersion: boolean;
  isLinearizing: boolean;
  compressionRatio?: number;
  pdfFileId?: string;
  fileUrl: string;
  onClose: () => void;
  onLinearizeRequest: () => void;
}

const PDFViewerHeader = ({
  fileName,
  currentPage,
  totalPages,
  viewMode,
  hasLinearizedVersion,
  isLinearizing,
  compressionRatio,
  pdfFileId,
  fileUrl,
  onClose,
  onLinearizeRequest
}: PDFViewerHeaderProps) => {
  const renderStrategyBadge = () => {
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

    return (
      <Badge variant="outline" className="text-gray-600">
        📁 טעינה רגילה
      </Badge>
    );
  };

  return (
    <div className="bg-white border-b border-border p-4 flex items-center justify-between">
      <div className="flex items-center gap-4">
        <h2 className="hebrew-title text-lg font-semibold">{fileName}</h2>
        {totalPages > 0 && (
          <span className="hebrew-text text-sm text-muted-foreground">
            עמוד {currentPage} מתוך {totalPages}
          </span>
        )}
        {renderStrategyBadge()}
      </div>
      <div className="flex items-center gap-2">
        {!hasLinearizedVersion && !isLinearizing && pdfFileId && viewMode === 'standard' && (
          <Button
            variant="outline"
            size="sm"
            onClick={onLinearizeRequest}
            className="hebrew-text text-xs"
          >
            <Zap size={16} className="ml-1" />
            צור גרסה לינארית
          </Button>
        )}
        <Button variant="outline" onClick={() => window.open(fileUrl, '_blank')}>
          <Download size={16} />
        </Button>
        <Button variant="outline" onClick={onClose}>
          <X size={16} />
        </Button>
      </div>
    </div>
  );
};

export default PDFViewerHeader;

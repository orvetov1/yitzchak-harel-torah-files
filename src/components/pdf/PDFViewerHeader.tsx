
import React from 'react';
import { Button } from '../ui/button';
import { Download, X, Zap } from 'lucide-react';
import { Badge } from '../ui/badge';

interface PDFViewerHeaderProps {
  fileName: string;
  currentPage: number;
  totalPages: number;
  onDownload: () => void;
  onClose: () => void;
  onLinearizeRequest?: () => void;
  canLinearize: boolean;
  isLinearizing: boolean;
  linearizationBadge: React.ReactNode;
}

const PDFViewerHeader = ({
  fileName,
  currentPage,
  totalPages,
  onDownload,
  onClose,
  onLinearizeRequest,
  canLinearize,
  isLinearizing,
  linearizationBadge
}: PDFViewerHeaderProps) => {
  return (
    <div className="bg-white border-b border-border p-4 flex items-center justify-between">
      <div className="flex items-center gap-4">
        <h2 className="hebrew-title text-lg font-semibold">{fileName}</h2>
        <span className="hebrew-text text-sm text-muted-foreground">
          עמוד {currentPage} מתוך {totalPages}
        </span>
        {linearizationBadge}
      </div>
      <div className="flex items-center gap-2">
        {canLinearize && !isLinearizing && onLinearizeRequest && (
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
        <Button variant="outline" onClick={onDownload}>
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

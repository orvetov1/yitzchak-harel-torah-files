
import React from 'react';
import { Button } from '../ui/button';
import { Download, X, Maximize, Minimize } from 'lucide-react';

interface PDFModalHeaderProps {
  fileName: string;
  currentPage: number;
  totalPages: number;
  fileSize: number;
  loading: boolean;
  error: string | null;
  isFullscreen: boolean;
  useEnhancedViewer: boolean;
  hasLinearizedVersion: boolean;
  isLinearizing: boolean;
  compressionRatio?: number;
  canRequestLinearization: boolean;
  onDownload: () => void;
  onClose: () => void;
  onToggleFullscreen: () => void;
  onToggleViewer: () => void;
  onRequestLinearization: () => void;
}

const PDFModalHeader = ({
  fileName,
  currentPage,
  totalPages,
  fileSize,
  loading,
  error,
  isFullscreen,
  useEnhancedViewer,
  hasLinearizedVersion,
  isLinearizing,
  compressionRatio,
  canRequestLinearization,
  onDownload,
  onClose,
  onToggleFullscreen,
  onToggleViewer,
  onRequestLinearization
}: PDFModalHeaderProps) => {
  return (
    <div className="bg-white border-b border-border p-4 flex items-center justify-between">
      <div className="flex items-center gap-4">
        <h2 className="hebrew-title text-lg font-semibold">{fileName}</h2>
        {!loading && !error && totalPages > 0 && (
          <span className="hebrew-text text-sm text-muted-foreground">
            עמוד {currentPage} מתוך {totalPages}
          </span>
        )}
        {fileSize > 0 && (
          <span className="hebrew-text text-xs text-muted-foreground">
            ({Math.round(fileSize / 1024)}KB)
          </span>
        )}
        
        {/* Enhanced viewer toggle */}
        <Button
          variant="outline"
          size="sm"
          onClick={onToggleViewer}
          className="hebrew-text text-xs"
        >
          {useEnhancedViewer ? '📊 רגיל' : '✨ משופר'}
        </Button>
        
        {/* Linearization status indicator */}
        {hasLinearizedVersion && (
          <span className="hebrew-text text-xs text-green-600 bg-green-50 px-2 py-1 rounded">
            ✨ גרסה לינארית ({compressionRatio?.toFixed(1)}% חיסכון)
          </span>
        )}
        {isLinearizing && (
          <span className="hebrew-text text-xs text-blue-600 bg-blue-50 px-2 py-1 rounded animate-pulse">
            🔄 יוצר גרסה לינארית...
          </span>
        )}
      </div>
      
      <div className="flex items-center gap-2">
        {/* Add linearization button if not linearized yet */}
        {canRequestLinearization && (
          <Button
            variant="outline"
            size="sm"
            onClick={onRequestLinearization}
            className="hebrew-text text-xs"
            disabled={loading}
          >
            ⚡ צור לינארי
          </Button>
        )}
        <Button variant="outline" onClick={onDownload} disabled={loading}>
          <Download size={16} />
        </Button>
        <Button variant="outline" onClick={onToggleFullscreen}>
          {isFullscreen ? <Minimize size={16} /> : <Maximize size={16} />}
        </Button>
        <Button variant="outline" onClick={onClose}>
          <X size={16} />
        </Button>
      </div>
    </div>
  );
};

export default PDFModalHeader;

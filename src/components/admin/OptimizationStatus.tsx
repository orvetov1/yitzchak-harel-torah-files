
import React from 'react';
import { Badge } from '../ui/badge';
import { Button } from '../ui/button';
import { RefreshCw, Zap, CheckCircle, AlertCircle } from 'lucide-react';

interface OptimizationStatusProps {
  processingStatus?: string;
  hasOptimizedVersion: boolean;
  compressionRatio?: number;
  onRequestOptimization?: () => void;
  isOptimizing?: boolean;
}

const OptimizationStatus = ({ 
  processingStatus, 
  hasOptimizedVersion, 
  compressionRatio,
  onRequestOptimization,
  isOptimizing = false
}: OptimizationStatusProps) => {
  const getStatusBadge = () => {
    if (hasOptimizedVersion) {
      return (
        <Badge variant="default" className="bg-green-100 text-green-800 border-green-200">
          <CheckCircle size={12} className="mr-1" />
          ✨ מותאם ({compressionRatio?.toFixed(1)}% חיסכון)
        </Badge>
      );
    }

    if (isOptimizing || processingStatus === 'optimizing') {
      return (
        <Badge variant="secondary" className="bg-blue-100 text-blue-800 border-blue-200 animate-pulse">
          <RefreshCw size={12} className="mr-1 animate-spin" />
          🔄 מייעל...
        </Badge>
      );
    }

    if (processingStatus === 'failed') {
      return (
        <Badge variant="destructive" className="bg-red-100 text-red-800 border-red-200">
          <AlertCircle size={12} className="mr-1" />
          ❌ כשל
        </Badge>
      );
    }

    return (
      <Badge variant="outline" className="text-gray-600">
        ⏳ לא מותאם
      </Badge>
    );
  };

  const showOptimizeButton = !hasOptimizedVersion && !isOptimizing && 
                            processingStatus !== 'optimizing' && 
                            onRequestOptimization;

  return (
    <div className="flex items-center gap-2">
      {getStatusBadge()}
      {showOptimizeButton && (
        <Button
          variant="outline"
          size="sm"
          onClick={onRequestOptimization}
          className="hebrew-text text-xs h-6 px-2"
        >
          <Zap size={10} className="mr-1" />
          ייעל
        </Button>
      )}
    </div>
  );
};

export default OptimizationStatus;

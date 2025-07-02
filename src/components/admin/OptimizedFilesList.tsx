
import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Button } from '../ui/button';
import { Badge } from '../ui/badge';
import { Eye, Download, Trash2, Zap } from 'lucide-react';
import { usePDFFiles } from '../../hooks/usePDFFiles';
import { usePDFOptimization } from '../../hooks/usePDFOptimization';
import { useOptimizationPolling } from '../../hooks/useOptimizationPolling';
import OptimizationStatus from './OptimizationStatus';
import VirtualPDFViewer from '../VirtualPDFViewer';

const OptimizedFilesList = () => {
  const { items, isLoading, error, reload } = usePDFFiles();
  const [selectedPDF, setSelectedPDF] = useState<any>(null);
  const [optimizingFiles, setOptimizingFiles] = useState<Set<string>>(new Set());

  const handleViewPDF = (item: any) => {
    console.log(`📖 Opening PDF viewer for: ${item.title}`);
    setSelectedPDF(item);
  };

  const handleClosePDF = () => {
    console.log(`❌ Closing PDF viewer`);
    setSelectedPDF(null);
  };

  const handleRequestOptimization = async (pdfFileId: string) => {
    setOptimizingFiles(prev => new Set([...prev, pdfFileId]));
    
    // The usePDFOptimization hook will handle the actual optimization request
    // We just need to track that it's in progress
  };

  const handleOptimizationComplete = (pdfFileId: string) => {
    setOptimizingFiles(prev => {
      const newSet = new Set(prev);
      newSet.delete(pdfFileId);
      return newSet;
    });
    reload(); // Use reload instead of refetch
  };

  if (isLoading) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="text-center hebrew-text">טוען רשימת קבצים...</div>
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="text-center hebrew-text text-red-600">{error}</div>
        </CardContent>
      </Card>
    );
  }

  return (
    <>
      <Card>
        <CardHeader>
          <CardTitle className="hebrew-title">ניהול אופטימיזציה של קבצים</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {items.length === 0 ? (
              <div className="text-center hebrew-text text-muted-foreground py-8">
                אין קבצים להצגה
              </div>
            ) : (
              items.map((item) => {
                const isOptimizing = optimizingFiles.has(item.id);
                
                return (
                  <div key={item.id}>
                    <FileOptimizationItem
                      item={item}
                      isOptimizing={isOptimizing}
                      onView={() => handleViewPDF(item)}
                      onRequestOptimization={() => handleRequestOptimization(item.id)}
                      onOptimizationComplete={() => handleOptimizationComplete(item.id)}
                    />
                  </div>
                );
              })
            )}
          </div>
        </CardContent>
      </Card>

      {/* הסרנו את העטיפה הכפולה - רק VirtualPDFViewer */}
      {selectedPDF && (
        <VirtualPDFViewer
          pdfFileId={selectedPDF.id}
          onClose={handleClosePDF}
        />
      )}
    </>
  );
};

interface FileOptimizationItemProps {
  item: any;
  isOptimizing: boolean;
  onView: () => void;
  onRequestOptimization: () => void;
  onOptimizationComplete: () => void;
}

const FileOptimizationItem = ({ 
  item, 
  isOptimizing, 
  onView, 
  onRequestOptimization,
  onOptimizationComplete 
}: FileOptimizationItemProps) => {
  const optimization = usePDFOptimization(item.filePath, item.id);
  
  // Poll for optimization status if currently optimizing
  useOptimizationPolling({
    pdfFileId: item.id,
    enabled: isOptimizing || optimization.isOptimizing,
    onOptimizationComplete: (data) => {
      console.log('✅ Optimization completed:', data);
      onOptimizationComplete();
    },
    onOptimizationFailed: (error) => {
      console.error('❌ Optimization failed:', error);
      onOptimizationComplete(); // Still need to stop the loading state
    }
  });

  const handleOptimize = async () => {
    onRequestOptimization();
    await optimization.requestOptimization();
  };

  return (
    <div className="flex items-center justify-between p-4 border border-border rounded-lg">
      <div className="flex-1">
        <div className="flex items-center gap-3 mb-2">
          <h3 className="hebrew-title font-medium">{item.title}</h3>
          <OptimizationStatus
            processingStatus={item.processing_status}
            hasOptimizedVersion={optimization.hasOptimizedVersion}
            compressionRatio={optimization.compressionRatio}
            isOptimizing={isOptimizing || optimization.isOptimizing}
            onRequestOptimization={handleOptimize}
          />
        </div>
        <div className="flex items-center gap-4 text-sm text-muted-foreground hebrew-text">
          <span>קטגוריה: {item.category || 'לא מוגדר'}</span>
          {optimization.originalSize && (
            <span>גודל: {Math.round(optimization.originalSize / 1024)}KB</span>
          )}
          {optimization.originalSize && optimization.optimizedSize && (
            <span className="text-green-600">
              חיסכון: {Math.round((optimization.originalSize - optimization.optimizedSize) / 1024)}KB
            </span>
          )}
        </div>
      </div>
      <div className="flex items-center gap-2">
        <Button variant="outline" size="sm" onClick={onView}>
          <Eye size={16} />
        </Button>
        <Button 
          variant="outline" 
          size="sm" 
          onClick={() => window.open(item.filePath, '_blank')}
        >
          <Download size={16} />
        </Button>
      </div>
    </div>
  );
};

export default OptimizedFilesList;

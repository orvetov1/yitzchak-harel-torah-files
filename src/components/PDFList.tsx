
import React, { useState } from 'react';
import { Download, Eye } from 'lucide-react';
import PDFViewer from './PDFViewer';
import PDFSkeleton from './PDFSkeleton';

interface PDFItem {
  id: string;
  title: string;
  description?: string;
  filePath: string;
  category: string;
}

interface PDFListProps {
  items: PDFItem[];
  category: string;
  isLoading?: boolean;
}

const PDFList = ({ items, category, isLoading = false }: PDFListProps) => {
  const [viewerState, setViewerState] = useState<{
    isOpen: boolean;
    fileUrl: string;
    fileName: string;
  }>({
    isOpen: false,
    fileUrl: '',
    fileName: ''
  });

  const [loadingDownloads, setLoadingDownloads] = useState<Set<string>>(new Set());

  const handleDownload = async (filePath: string, fileName: string, itemId: string) => {
    try {
      setLoadingDownloads(prev => new Set(prev).add(itemId));
      
      const response = await fetch(filePath);
      if (!response.ok) {
        throw new Error('Network response was not ok');
      }
      
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      
      const link = document.createElement('a');
      link.href = url;
      link.download = fileName.endsWith('.pdf') ? fileName : `${fileName}.pdf`;
      link.style.display = 'none';
      
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      
      window.URL.revokeObjectURL(url);
      
      console.log(`Downloaded: ${fileName}`);
    } catch (error) {
      console.error('Download failed:', error);
      window.open(filePath, '_blank');
    } finally {
      setLoadingDownloads(prev => {
        const newSet = new Set(prev);
        newSet.delete(itemId);
        return newSet;
      });
    }
  };

  const handleView = (filePath: string, fileName: string) => {
    console.log(`Opening PDF viewer for: ${fileName}`);
    setViewerState({
      isOpen: true,
      fileUrl: filePath,
      fileName: fileName
    });
  };

  const closeViewer = () => {
    setViewerState({
      isOpen: false,
      fileUrl: '',
      fileName: ''
    });
  };

  if (isLoading) {
    return (
      <div className="space-y-6">
        {[...Array(3)].map((_, index) => (
          <PDFSkeleton key={index} />
        ))}
      </div>
    );
  }

  if (items.length === 0) {
    return (
      <div className="text-center py-12">
        <div className="hebrew-text text-muted-foreground">
          עדיין לא הועלו קבצים בקטגוריה זו
        </div>
      </div>
    );
  }

  return (
    <>
      <div className="space-y-6">
        {items.map((item) => (
          <div key={item.id} className="bg-card border border-border rounded-lg p-6 shadow-sm hover:shadow-md transition-shadow">
            <div className="flex flex-col gap-4">
              <div className="flex-1">
                <h3 className="hebrew-title text-lg font-semibold text-foreground mb-2">
                  {item.title}
                </h3>
                {item.description && (
                  <p className="hebrew-text text-muted-foreground text-sm leading-relaxed">
                    {item.description}
                  </p>
                )}
              </div>
              
              <div className="flex gap-3 pt-2">
                <button
                  onClick={() => handleView(item.filePath, item.title)}
                  className="flex items-center gap-2 px-4 py-2 bg-secondary text-secondary-foreground hover:bg-secondary/80 rounded-md transition-colors hebrew-text text-sm font-medium"
                  aria-label={`צפה ב${item.title}`}
                >
                  <Eye size={16} />
                  צפה
                </button>
                
                <button
                  onClick={() => handleDownload(item.filePath, item.title, item.id)}
                  disabled={loadingDownloads.has(item.id)}
                  className="flex items-center gap-2 px-4 py-2 bg-primary text-primary-foreground hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed rounded-md transition-colors hebrew-text text-sm font-medium"
                  aria-label={`הורד את ${item.title}`}
                >
                  {loadingDownloads.has(item.id) ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                      מוריד...
                    </>
                  ) : (
                    <>
                      <Download size={16} />
                      הורד
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>

      <PDFViewer
        fileUrl={viewerState.fileUrl}
        fileName={viewerState.fileName}
        isOpen={viewerState.isOpen}
        onClose={closeViewer}
      />
    </>
  );
};

export default PDFList;


import React, { useState } from 'react';
import { Download, Eye } from 'lucide-react';
import PDFViewer from './PDFViewer';

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
}

const PDFList = ({ items, category }: PDFListProps) => {
  const [viewerState, setViewerState] = useState<{
    isOpen: boolean;
    fileUrl: string;
    fileName: string;
  }>({
    isOpen: false,
    fileUrl: '',
    fileName: ''
  });

  const handleDownload = async (filePath: string, fileName: string) => {
    try {
      // Use fetch to download the file properly
      const response = await fetch(filePath);
      if (!response.ok) {
        throw new Error('Network response was not ok');
      }
      
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      
      // Create a temporary link element for download
      const link = document.createElement('a');
      link.href = url;
      link.download = fileName.endsWith('.pdf') ? fileName : `${fileName}.pdf`;
      link.style.display = 'none';
      
      // Add to document, click, and remove
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      
      // Clean up the blob URL
      window.URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Download failed:', error);
      // Fallback: open in new tab if download fails
      window.open(filePath, '_blank');
    }
  };

  const handleView = (filePath: string, fileName: string) => {
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
                  onClick={() => handleDownload(item.filePath, item.title)}
                  className="flex items-center gap-2 px-4 py-2 bg-primary text-primary-foreground hover:bg-primary/90 rounded-md transition-colors hebrew-text text-sm font-medium"
                  aria-label={`הורד את ${item.title}`}
                >
                  <Download size={16} />
                  הורד
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

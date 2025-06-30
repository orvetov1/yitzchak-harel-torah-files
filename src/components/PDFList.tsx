
import React, { useState } from 'react';
import { Button } from './ui/button';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Eye, Download } from 'lucide-react';
import PDFSkeleton from './PDFSkeleton';
import LazyPDFViewer from './LazyPDFViewer';

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
  const [selectedPDF, setSelectedPDF] = useState<PDFItem | null>(null);
  const [viewerOpen, setViewerOpen] = useState(false);

  const handleView = (item: PDFItem) => {
    setSelectedPDF(item);
    setViewerOpen(true);
  };

  const handleDownload = async (item: PDFItem) => {
    try {
      // Use the full URL directly from filePath
      const fileUrl = item.filePath;
      
      // Try to download via fetch first
      const response = await fetch(fileUrl);
      if (!response.ok) {
        throw new Error('Failed to fetch file');
      }
      
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = item.title.endsWith('.pdf') ? item.title : `${item.title}.pdf`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Download failed:', error);
      // Fallback: open in new tab
      window.open(item.filePath, '_blank');
    }
  };

  if (isLoading) {
    return (
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {Array.from({ length: 6 }).map((_, index) => (
          <PDFSkeleton key={index} />
        ))}
      </div>
    );
  }

  if (items.length === 0) {
    return (
      <div className="text-center py-12">
        <p className="hebrew-text text-lg text-muted-foreground">
          אין קבצים זמינים בקטגוריה זו כרגע
        </p>
      </div>
    );
  }

  return (
    <>
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {items.map((item) => (
          <Card key={item.id} className="hover:shadow-lg transition-shadow">
            <CardHeader>
              <CardTitle className="hebrew-title text-lg leading-tight">
                {item.title}
              </CardTitle>
              {item.description && (
                <p className="hebrew-text text-sm text-muted-foreground leading-relaxed">
                  {item.description}
                </p>
              )}
            </CardHeader>
            <CardContent>
              <div className="flex gap-2 justify-end">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleView(item)}
                  className="hebrew-text"
                >
                  <Eye size={16} className="ml-2" />
                  צפה
                </Button>
                <Button
                  variant="default"
                  size="sm"
                  onClick={() => handleDownload(item)}
                  className="hebrew-text"
                >
                  <Download size={16} className="ml-2" />
                  הורד
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {selectedPDF && (
        <LazyPDFViewer
          pdfFileId={selectedPDF.id}
          fileName={selectedPDF.title}
          isOpen={viewerOpen}
          onClose={() => {
            setViewerOpen(false);
            setSelectedPDF(null);
          }}
        />
      )}
    </>
  );
};

export default PDFList;

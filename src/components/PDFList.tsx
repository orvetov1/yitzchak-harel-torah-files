
import React from 'react';
import { Download, Eye } from 'lucide-react';

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
  const handleDownload = (filePath: string, fileName: string) => {
    // Create a temporary link element for download
    const link = document.createElement('a');
    link.href = filePath;
    link.download = fileName;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleView = (filePath: string) => {
    // Open PDF in new tab for viewing
    window.open(filePath, '_blank');
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
                onClick={() => handleView(item.filePath)}
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
  );
};

export default PDFList;

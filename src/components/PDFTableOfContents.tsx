
import React from 'react';
import { ScrollArea } from './ui/scroll-area';
import { Button } from './ui/button';
import { usePDFTableOfContents } from '@/hooks/usePDFTableOfContents';

interface PDFTableOfContentsProps {
  pdfFileId: string;
  currentPage: number;
  onPageSelect: (pageNumber: number) => void;
  className?: string;
}

const PDFTableOfContents = ({ 
  pdfFileId, 
  currentPage, 
  onPageSelect, 
  className = "" 
}: PDFTableOfContentsProps) => {
  const { tableOfContents, isLoading, error } = usePDFTableOfContents(pdfFileId);

  if (isLoading) {
    return (
      <div className={`p-4 ${className}`}>
        <div className="hebrew-text text-sm text-muted-foreground">
          טוען תוכן עניינים...
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className={`p-4 ${className}`}>
        <div className="hebrew-text text-sm text-red-600">
          {error}
        </div>
      </div>
    );
  }

  if (tableOfContents.length === 0) {
    return (
      <div className={`p-4 ${className}`}>
        <div className="hebrew-text text-sm text-muted-foreground">
          אין תוכן עניינים זמין לקובץ זה
        </div>
      </div>
    );
  }

  return (
    <div className={`${className}`}>
      <div className="p-4 border-b border-border">
        <h3 className="hebrew-title font-semibold text-lg">תוכן עניינים</h3>
      </div>
      
      <ScrollArea className="flex-1">
        <div className="p-2">
          {tableOfContents.map((item) => (
            <Button
              key={item.id}
              variant={currentPage === item.page_number ? "secondary" : "ghost"}
              className={`
                w-full justify-start text-right hebrew-text mb-1 h-auto py-3
                ${item.level > 1 ? `mr-${(item.level - 1) * 4}` : ''}
              `}
              onClick={() => onPageSelect(item.page_number)}
            >
              <div className="flex flex-col items-start w-full">
                <div className="font-medium text-sm leading-relaxed">
                  {item.chapter_title}
                </div>
                <div className="text-xs text-muted-foreground">
                  עמוד {item.page_number}
                </div>
              </div>
            </Button>
          ))}
        </div>
      </ScrollArea>
    </div>
  );
};

export default PDFTableOfContents;

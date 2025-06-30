
import React, { useEffect } from 'react';
import { Button } from './ui/button';
import { Download, X, ExternalLink } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';

interface LazyPDFViewerProps {
  pdfFileId: string;
  fileName: string;
  isOpen: boolean;
  onClose: () => void;
}

const LazyPDFViewer = ({ pdfFileId, fileName, isOpen, onClose }: LazyPDFViewerProps) => {
  // Get the PDF file path from the database
  const [pdfUrl, setPdfUrl] = React.useState<string>('');
  const [isLoading, setIsLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);

  React.useEffect(() => {
    if (!isOpen || !pdfFileId) return;

    const fetchPdfUrl = async () => {
      try {
        setIsLoading(true);
        setError(null);
        
        // Get the PDF file info from the database
        const { data: pdfData, error: fetchError } = await supabase
          .from('pdf_files')
          .select('file_path')
          .eq('id', pdfFileId)
          .single();

        if (fetchError) throw fetchError;
        
        setPdfUrl(pdfData.file_path);
      } catch (err) {
        console.error('Error fetching PDF URL:', err);
        setError('שגיאה בטעינת הקובץ');
      } finally {
        setIsLoading(false);
      }
    };

    fetchPdfUrl();
  }, [pdfFileId, isOpen]);

  // Auto-open PDF in new tab when viewer opens
  useEffect(() => {
    if (isOpen && pdfUrl && !isLoading && !error) {
      window.open(pdfUrl, '_blank');
      // Close the viewer immediately after opening the PDF
      onClose();
    }
  }, [isOpen, pdfUrl, isLoading, error, onClose]);

  const handleDownload = async () => {
    if (!pdfUrl) return;

    try {
      const response = await fetch(pdfUrl);
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = fileName.endsWith('.pdf') ? fileName : `${fileName}.pdf`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Download failed:', error);
      // Fallback: open in new tab
      window.open(pdfUrl, '_blank');
    }
  };

  const handleOpenInNewTab = () => {
    if (pdfUrl) {
      window.open(pdfUrl, '_blank');
    }
  };

  if (!isOpen) return null;

  // Loading state
  if (isLoading) {
    return (
      <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm">
        <div className="flex flex-col h-full">
          <div className="bg-white border-b border-border p-4 flex items-center justify-between">
            <h2 className="hebrew-title text-lg font-semibold">{fileName}</h2>
            <Button variant="outline" onClick={onClose}>
              <X size={16} />
            </Button>
          </div>
          <div className="flex-1 flex items-center justify-center">
            <div className="text-center hebrew-text space-y-4">
              <div className="animate-spin rounded-full h-16 w-16 border-b-4 border-primary mx-auto"></div>
              <div className="text-xl font-medium">טוען קובץ PDF...</div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Error state
  if (error) {
    return (
      <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm">
        <div className="flex flex-col h-full">
          <div className="bg-white border-b border-border p-4 flex items-center justify-between">
            <h2 className="hebrew-title text-lg font-semibold">{fileName}</h2>
            <Button variant="outline" onClick={onClose}>
              <X size={16} />
            </Button>
          </div>
          <div className="flex-1 flex items-center justify-center">
            <div className="text-center hebrew-text space-y-4 p-8">
              <div className="text-red-600 text-lg font-medium">{error}</div>
              <div className="flex gap-2 justify-center">
                <Button onClick={handleOpenInNewTab} className="hebrew-text">
                  <ExternalLink size={16} className="mr-2" />
                  פתח בטאב חדש
                </Button>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // PDF ready - show options dialog
  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm">
      <div className="flex items-center justify-center h-full p-4">
        <div className="bg-white rounded-lg shadow-xl max-w-md w-full p-6">
          <div className="flex items-center justify-between mb-6">
            <h2 className="hebrew-title text-lg font-semibold">{fileName}</h2>
            <Button variant="outline" size="sm" onClick={onClose}>
              <X size={16} />
            </Button>
          </div>
          
          <div className="text-center hebrew-text space-y-4">
            <div className="text-muted-foreground mb-6">
              הקובץ מוכן לצפייה. לחץ על אחד מהכפתורים להמשך:
            </div>
            
            <div className="flex flex-col gap-3">
              <Button 
                onClick={handleOpenInNewTab} 
                className="hebrew-text w-full"
                size="lg"
              >
                <ExternalLink size={20} className="ml-2" />
                פתח בטאב חדש
              </Button>
              
              <Button 
                onClick={handleDownload} 
                variant="outline" 
                className="hebrew-text w-full"
                size="lg"
              >
                <Download size={20} className="ml-2" />
                הורד למחשב
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default LazyPDFViewer;

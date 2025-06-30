
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Download, Trash2 } from 'lucide-react';

interface PDFFile {
  id: string;
  title: string;
  description: string;
  file_path: string;
  file_name: string;
  category_id: string;
  file_size: number;
  created_at: string;
  categories: {
    name: string;
    slug: string;
  };
}

interface FilesListProps {
  pdfFiles: PDFFile[];
  onDeleteFile: (fileId: string, filePath: string) => void;
}

export const FilesList = ({ pdfFiles, onDeleteFile }: FilesListProps) => {
  return (
    <Card className="mt-8">
      <CardHeader>
        <CardTitle className="hebrew-title">רשימת קבצים</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {pdfFiles.map((file) => (
            <div key={file.id} className="flex items-center justify-between p-4 border rounded-lg">
              <div className="flex-1">
                <h3 className="hebrew-title font-semibold">{file.title}</h3>
                <p className="hebrew-text text-sm text-muted-foreground">
                  {file.categories.name} • {Math.round(file.file_size / 1024)} KB
                </p>
                {file.description && (
                  <p className="hebrew-text text-sm mt-1">{file.description}</p>
                )}
              </div>
              
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => window.open(file.file_path, '_blank')}
                >
                  <Download className="h-4 w-4" />
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => onDeleteFile(file.id, file.file_path)}
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            </div>
          ))}
          
          {pdfFiles.length === 0 && (
            <div className="text-center py-8 hebrew-text text-muted-foreground">
              עדיין לא הועלו קבצים
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
};

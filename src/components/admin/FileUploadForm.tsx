
import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Upload } from 'lucide-react';
import { useFileUpload } from '@/hooks/useFileUpload';

interface Category {
  id: string;
  name: string;
  slug: string;
}

interface FileUploadFormProps {
  categories: Category[];
  onUploadSuccess: () => void;
}

export const FileUploadForm = ({ categories, onUploadSuccess }: FileUploadFormProps) => {
  const [uploadTitle, setUploadTitle] = useState('');
  const [uploadDescription, setUploadDescription] = useState('');
  const [uploadCategory, setUploadCategory] = useState('');
  const [uploadFile, setUploadFile] = useState<File | null>(null);
  
  const { uploadFile: handleUpload, isUploading } = useFileUpload();

  const handleFileUpload = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!uploadFile || !uploadTitle || !uploadCategory) {
      return;
    }

    const success = await handleUpload({
      file: uploadFile,
      title: uploadTitle,
      description: uploadDescription,
      categoryId: uploadCategory,
    });

    if (success) {
      setUploadTitle('');
      setUploadDescription('');
      setUploadCategory('');
      setUploadFile(null);
      
      // Reset file input
      const fileInput = document.querySelector('input[type="file"]') as HTMLInputElement;
      if (fileInput) fileInput.value = '';
      
      onUploadSuccess();
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="hebrew-title flex items-center">
          <Upload className="mr-2" />
          העלאת קובץ PDF חדש
        </CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleFileUpload} className="space-y-4">
          <div>
            <Label className="hebrew-text">כותרת הקובץ</Label>
            <Input
              value={uploadTitle}
              onChange={(e) => setUploadTitle(e.target.value)}
              className="hebrew-text"
              required
            />
          </div>
          
          <div>
            <Label className="hebrew-text">תיאור (אופציונלי)</Label>
            <Textarea
              value={uploadDescription}
              onChange={(e) => setUploadDescription(e.target.value)}
              className="hebrew-text"
              rows={3}
            />
          </div>
          
          <div>
            <Label className="hebrew-text">קטגוריה</Label>
            <Select value={uploadCategory} onValueChange={setUploadCategory} required>
              <SelectTrigger>
                <SelectValue placeholder="בחר קטגוריה" />
              </SelectTrigger>
              <SelectContent>
                {categories.map((category) => (
                  <SelectItem key={category.id} value={category.id}>
                    {category.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          
          <div>
            <Label className="hebrew-text">קובץ PDF</Label>
            <Input
              type="file"
              accept=".pdf"
              onChange={(e) => setUploadFile(e.target.files?.[0] || null)}
              required
            />
          </div>
          
          <Button type="submit" disabled={isUploading} className="w-full hebrew-text">
            {isUploading ? 'מעלה...' : 'העלה קובץ'}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
};

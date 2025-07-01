
import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Upload, FileText } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { TableOfContentsForm } from './TableOfContentsForm';
import { useFileUpload } from '@/hooks/useFileUpload';

interface Category {
  id: string;
  name: string;
  slug: string;
}

interface TableOfContentsItem {
  id: string;
  chapter_title: string;
  page_number: number;
  level: number;
  order_index: number;
}

interface FileUploadFormProps {
  categories: Category[];
  onUploadSuccess: () => void;
}

export const FileUploadForm = ({ categories, onUploadSuccess }: FileUploadFormProps) => {
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    categoryId: ''
  });
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [tableOfContents, setTableOfContents] = useState<TableOfContentsItem[]>([]);
  
  const { uploadFile, isUploading } = useFileUpload();

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file && file.type === 'application/pdf') {
      setSelectedFile(file);
    } else {
      toast.error('אנא בחר קובץ PDF בלבד');
    }
  };

  const handleUpload = async () => {
    if (!selectedFile || !formData.title || !formData.categoryId) {
      toast.error('אנא מלא את כל השדות הנדרשים');
      return;
    }

    console.log('🚀 Starting upload process from FileUploadForm');
    console.log('Original file name from form:', selectedFile.name);

    try {
      // Use the useFileUpload hook which includes sanitization
      const success = await uploadFile({
        file: selectedFile,
        title: formData.title,
        description: formData.description,
        categoryId: formData.categoryId
      });

      if (success) {
        // Handle table of contents if provided
        if (tableOfContents.length > 0) {
          // We need to get the file ID first - let's fetch the most recent file for this category
          const { data: recentFile, error: fetchError } = await supabase
            .from('pdf_files')
            .select('id')
            .eq('category_id', formData.categoryId)
            .eq('title', formData.title)
            .order('created_at', { ascending: false })
            .limit(1)
            .single();

          if (fetchError) {
            console.error('Error fetching recent file:', fetchError);
          } else if (recentFile) {
            const tocInserts = tableOfContents.map(item => ({
              pdf_file_id: recentFile.id,
              chapter_title: item.chapter_title,
              page_number: item.page_number,
              level: item.level,
              order_index: item.order_index
            }));

            const { error: tocError } = await supabase
              .from('pdf_table_of_contents')
              .insert(tocInserts);

            if (tocError) {
              console.error('Error inserting table of contents:', tocError);
              toast.error('הקובץ הועלה בהצלחה אך הייתה שגיאה בשמירת תוכן העניינים');
            }
          }
        }

        // Reset form
        setFormData({ title: '', description: '', categoryId: '' });
        setSelectedFile(null);
        setTableOfContents([]);
        
        // Reset file input
        const fileInput = document.getElementById('file-upload') as HTMLInputElement;
        if (fileInput) fileInput.value = '';

        onUploadSuccess();
      }

    } catch (error) {
      console.error('Upload error in FileUploadForm:', error);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="hebrew-title flex items-center gap-2">
          <FileText className="h-5 w-5" />
          העלאת קובץ PDF חדש
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div>
          <Label htmlFor="title" className="hebrew-text">כותרת הקובץ</Label>
          <Input
            id="title"
            value={formData.title}
            onChange={(e) => setFormData({ ...formData, title: e.target.value })}
            placeholder="הזן כותרת לקובץ"
            className="hebrew-text"
            required
          />
        </div>

        <div>
          <Label htmlFor="description" className="hebrew-text">תיאור (אופציונלי)</Label>
          <Textarea
            id="description"
            value={formData.description}
            onChange={(e) => setFormData({ ...formData, description: e.target.value })}
            placeholder="הזן תיאור קצר לקובץ"
            className="hebrew-text"
          />
        </div>

        <div>
          <Label htmlFor="category" className="hebrew-text">קטגוריה</Label>
          <Select value={formData.categoryId} onValueChange={(value) => setFormData({ ...formData, categoryId: value })}>
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
          <Label htmlFor="file-upload" className="hebrew-text">בחירת קובץ PDF</Label>
          <Input
            id="file-upload"
            type="file"
            accept=".pdf"
            onChange={handleFileSelect}
            className="hebrew-text"
            required
          />
          {selectedFile && (
            <div className="text-sm text-muted-foreground mt-1 hebrew-text">
              נבחר: {selectedFile.name} ({Math.round(selectedFile.size / 1024)} KB)
            </div>
          )}
        </div>

        <TableOfContentsForm
          items={tableOfContents}
          onChange={setTableOfContents}
        />

        <Button 
          onClick={handleUpload} 
          disabled={isUploading || !selectedFile}
          className="w-full hebrew-text"
        >
          <Upload className="h-4 w-4 ml-2" />
          {isUploading ? 'מעלה...' : 'העלה קובץ'}
        </Button>
      </CardContent>
    </Card>
  );
};

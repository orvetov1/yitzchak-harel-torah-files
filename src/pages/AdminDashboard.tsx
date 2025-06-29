
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAdmin } from '../hooks/useAdmin';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { toast } from 'sonner';
import { Upload, Download, Edit, Trash2, LogOut, Key } from 'lucide-react';

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

interface Category {
  id: string;
  name: string;
  slug: string;
}

const AdminDashboard = () => {
  const { adminUser, logout, changePassword, isAuthenticated } = useAdmin();
  const navigate = useNavigate();
  const [pdfFiles, setPdfFiles] = useState<PDFFile[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  
  // Upload form state
  const [uploadTitle, setUploadTitle] = useState('');
  const [uploadDescription, setUploadDescription] = useState('');
  const [uploadCategory, setUploadCategory] = useState('');
  const [uploadFile, setUploadFile] = useState<File | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  
  // Password change state
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isChangingPassword, setIsChangingPassword] = useState(false);

  useEffect(() => {
    if (!isAuthenticated) {
      navigate('/admin');
      return;
    }
    
    loadData();
  }, [isAuthenticated, navigate]);

  const loadData = async () => {
    try {
      // Load categories
      const { data: categoriesData, error: categoriesError } = await supabase
        .from('categories')
        .select('*')
        .order('name');

      if (categoriesError) throw categoriesError;
      setCategories(categoriesData || []);

      // Load PDF files
      const { data: filesData, error: filesError } = await supabase
        .from('pdf_files')
        .select(`
          *,
          categories (
            name,
            slug
          )
        `)
        .order('created_at', { ascending: false });

      if (filesError) throw filesError;
      setPdfFiles(filesData || []);
    } catch (error) {
      console.error('Error loading data:', error);
      toast.error('שגיאה בטעינת הנתונים');
    } finally {
      setIsLoading(false);
    }
  };

  const handleFileUpload = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!uploadFile || !uploadTitle || !uploadCategory) {
      toast.error('אנא מלא את כל השדות הנדרשים');
      return;
    }

    setIsUploading(true);
    try {
      // Upload file to storage
      const fileName = `${Date.now()}-${uploadFile.name}`;
      const { data: uploadData, error: uploadError } = await supabase.storage
        .from('pdf-files')
        .upload(fileName, uploadFile);

      if (uploadError) throw uploadError;

      // Get public URL
      const { data: { publicUrl } } = supabase.storage
        .from('pdf-files')
        .getPublicUrl(fileName);

      // Save file info to database
      const { error: dbError } = await supabase
        .from('pdf_files')
        .insert({
          title: uploadTitle,
          description: uploadDescription,
          file_path: publicUrl,
          file_name: uploadFile.name,
          category_id: uploadCategory,
          file_size: uploadFile.size,
          uploaded_by: adminUser?.id
        });

      if (dbError) throw dbError;

      toast.success('הקובץ הועלה בהצלחה');
      setUploadTitle('');
      setUploadDescription('');
      setUploadCategory('');
      setUploadFile(null);
      loadData();
    } catch (error) {
      console.error('Upload error:', error);
      toast.error('שגיאה בהעלאת הקובץ');
    } finally {
      setIsUploading(false);
    }
  };

  const handleDeleteFile = async (fileId: string, filePath: string) => {
    if (!confirm('האם אתה בטוח שברצונך למחוק את הקובץ?')) return;

    try {
      // Delete from database
      const { error: dbError } = await supabase
        .from('pdf_files')
        .delete()
        .eq('id', fileId);

      if (dbError) throw dbError;

      // Delete from storage
      const fileName = filePath.split('/').pop();
      if (fileName) {
        await supabase.storage
          .from('pdf-files')
          .remove([fileName]);
      }

      toast.success('הקובץ נמחק בהצלחה');
      loadData();
    } catch (error) {
      console.error('Delete error:', error);
      toast.error('שגיאה במחיקת הקובץ');
    }
  };

  const handlePasswordChange = async (e: React.FormEvent) => {
    e.preventDefault();
    if (newPassword !== confirmPassword) {
      toast.error('הסיסמאות החדשות אינן תואמות');
      return;
    }

    setIsChangingPassword(true);
    const result = await changePassword(currentPassword, newPassword);
    
    if (result.success) {
      toast.success('הסיסמה שונתה בהצלחה');
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
    } else {
      toast.error(result.error || 'שגיאה בשינוי הסיסמה');
    }
    
    setIsChangingPassword(false);
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="hebrew-text">טוען...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background p-4">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="flex justify-between items-center mb-8">
          <h1 className="hebrew-title text-3xl font-bold text-primary">
            ממשק ניהול האתר
          </h1>
          <div className="flex gap-4">
            <Dialog>
              <DialogTrigger asChild>
                <Button variant="outline" size="sm">
                  <Key className="mr-2 h-4 w-4" />
                  שנה סיסמה
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle className="hebrew-title">שינוי סיסמה</DialogTitle>
                </DialogHeader>
                <form onSubmit={handlePasswordChange} className="space-y-4">
                  <div>
                    <Label className="hebrew-text">סיסמה נוכחית</Label>
                    <Input
                      type="password"
                      value={currentPassword}
                      onChange={(e) => setCurrentPassword(e.target.value)}
                      required
                    />
                  </div>
                  <div>
                    <Label className="hebrew-text">סיסמה חדשה</Label>
                    <Input
                      type="password"
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                      required
                    />
                  </div>
                  <div>
                    <Label className="hebrew-text">אימות סיסמה חדשה</Label>
                    <Input
                      type="password"
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      required
                    />
                  </div>
                  <Button type="submit" disabled={isChangingPassword} className="w-full hebrew-text">
                    {isChangingPassword ? 'משנה...' : 'עדכן סיסמה'}
                  </Button>
                </form>
              </DialogContent>
            </Dialog>
            
            <Button variant="outline" onClick={logout}>
              <LogOut className="mr-2 h-4 w-4" />
              התנתק
            </Button>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Upload Form */}
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

          {/* Statistics */}
          <Card>
            <CardHeader>
              <CardTitle className="hebrew-title">סטטיסטיקות</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex justify-between">
                  <span className="hebrew-text">סה״כ קבצים:</span>
                  <span className="font-bold">{pdfFiles.length}</span>
                </div>
                {categories.map((category) => (
                  <div key={category.id} className="flex justify-between">
                    <span className="hebrew-text">{category.name}:</span>
                    <span className="font-bold">
                      {pdfFiles.filter(f => f.category_id === category.id).length}
                    </span>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Files List */}
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
                      onClick={() => handleDeleteFile(file.id, file.file_path)}
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
      </div>
    </div>
  );
};

export default AdminDashboard;

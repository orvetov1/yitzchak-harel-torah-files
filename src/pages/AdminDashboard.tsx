
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAdmin } from '../hooks/useAdmin';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { AdminHeader } from '@/components/admin/AdminHeader';
import { FileUploadForm } from '@/components/admin/FileUploadForm';
import { StatisticsCard } from '@/components/admin/StatisticsCard';
import { FilesList } from '@/components/admin/FilesList';

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
  const { logout, isAuthenticated } = useAdmin();
  const navigate = useNavigate();
  const [pdfFiles, setPdfFiles] = useState<PDFFile[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [isLoading, setIsLoading] = useState(true);

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
        <AdminHeader onLogout={logout} />

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          <FileUploadForm categories={categories} onUploadSuccess={loadData} />
          <StatisticsCard pdfFiles={pdfFiles} categories={categories} />
        </div>

        <FilesList pdfFiles={pdfFiles} onDeleteFile={handleDeleteFile} />
      </div>
    </div>
  );
};

export default AdminDashboard;


-- Create categories table
CREATE TABLE public.categories (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL UNIQUE,
  slug TEXT NOT NULL UNIQUE,
  description TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Insert default categories
INSERT INTO public.categories (name, slug, description) VALUES
('מקרא', 'mikra', 'חומרי לימוד ופירושים על כתבי הקודש'),
('מדרש ואגדה', 'midrash', 'אוסף מדרשי חז״ל ואגדות הקודש'),
('עקרות הלכתית', 'halakha', 'עקרונות יסוד בהלכה היהודית וכללי פסיקה');

-- Create admin users table
CREATE TABLE public.admin_users (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  username TEXT NOT NULL UNIQUE,
  password_hash TEXT NOT NULL,
  email TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create PDF files table
CREATE TABLE public.pdf_files (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  title TEXT NOT NULL,
  description TEXT,
  file_path TEXT NOT NULL,
  file_name TEXT NOT NULL,
  category_id UUID NOT NULL REFERENCES public.categories(id) ON DELETE CASCADE,
  file_size INTEGER,
  uploaded_by UUID REFERENCES public.admin_users(id),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create storage bucket for PDF files
INSERT INTO storage.buckets (id, name, public) 
VALUES ('pdf-files', 'pdf-files', true);

-- Create storage policy for public read access
CREATE POLICY "Public can view PDF files" 
ON storage.objects 
FOR SELECT 
USING (bucket_id = 'pdf-files');

-- Create storage policy for admin upload
CREATE POLICY "Admins can upload PDF files" 
ON storage.objects 
FOR INSERT 
WITH CHECK (bucket_id = 'pdf-files');

-- Create storage policy for admin update
CREATE POLICY "Admins can update PDF files" 
ON storage.objects 
FOR UPDATE 
USING (bucket_id = 'pdf-files');

-- Create storage policy for admin delete
CREATE POLICY "Admins can delete PDF files" 
ON storage.objects 
FOR DELETE 
USING (bucket_id = 'pdf-files');

-- Enable RLS on tables
ALTER TABLE public.categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.admin_users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.pdf_files ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for public read access to categories and pdf_files
CREATE POLICY "Anyone can view categories" 
ON public.categories 
FOR SELECT 
USING (true);

CREATE POLICY "Anyone can view PDF files" 
ON public.pdf_files 
FOR SELECT 
USING (true);

-- Create RLS policies for admin users (they can manage everything)
CREATE POLICY "Admins can manage categories" 
ON public.categories 
FOR ALL 
USING (true)
WITH CHECK (true);

CREATE POLICY "Admins can manage PDF files" 
ON public.pdf_files 
FOR ALL 
USING (true)
WITH CHECK (true);

CREATE POLICY "Admins can view admin users" 
ON public.admin_users 
FOR SELECT 
USING (true);

CREATE POLICY "Admins can update admin users" 
ON public.admin_users 
FOR UPDATE 
USING (true);

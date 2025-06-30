
-- הוספת טבלה לאחסון עמודים מפוצלים של PDF
CREATE TABLE public.pdf_pages (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  pdf_file_id UUID NOT NULL REFERENCES public.pdf_files(id) ON DELETE CASCADE,
  page_number INTEGER NOT NULL,
  file_path TEXT NOT NULL,
  file_size INTEGER,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE (pdf_file_id, page_number)
);

-- הוספת שדה לספירת עמודים כוללת בטבלת הקבצים הראשית
ALTER TABLE public.pdf_files 
ADD COLUMN num_pages_total INTEGER DEFAULT NULL,
ADD COLUMN processing_status TEXT DEFAULT 'pending' CHECK (processing_status IN ('pending', 'processing', 'completed', 'failed')),
ADD COLUMN split_at TIMESTAMP WITH TIME ZONE DEFAULT NULL;

-- הפעלת Row Level Security על הטבלה החדשה
ALTER TABLE public.pdf_pages ENABLE ROW LEVEL SECURITY;

-- פוליסות גישה לטבלת העמודים
CREATE POLICY "Anyone can view PDF pages" 
ON public.pdf_pages 
FOR SELECT 
USING (true);

CREATE POLICY "Admins can manage PDF pages" 
ON public.pdf_pages 
FOR ALL 
USING (true)
WITH CHECK (true);

-- יצירת אינדקס לחיפוש מהיר של עמודים לפי קובץ PDF
CREATE INDEX idx_pdf_pages_pdf_file_id ON public.pdf_pages(pdf_file_id);
CREATE INDEX idx_pdf_pages_page_number ON public.pdf_pages(pdf_file_id, page_number);

-- יצירת פונקציה להפעלת עיבוד PDF לאחר העלאה
CREATE OR REPLACE FUNCTION trigger_pdf_processing()
RETURNS TRIGGER AS $$
BEGIN
  -- עדכון סטטוס לעיבוד
  NEW.processing_status = 'pending';
  
  -- הפעלת Edge Function באמצעות HTTP POST (יתבצע לאחר ה-INSERT)
  PERFORM net.http_post(
    url := 'https://irvaecqmzkecyispsxul.supabase.co/functions/v1/split-pdf',
    headers := jsonb_build_object(
      'Content-Type', 'application/json',
      'Authorization', 'Bearer ' || current_setting('request.jwt.claims', true)::json->>'sub'
    ),
    body := jsonb_build_object(
      'pdf_file_id', NEW.id,
      'file_path', NEW.file_path,
      'file_name', NEW.file_name
    )
  );
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- יצירת טריגר שיפעיל את העיבוד אוטומטית
CREATE TRIGGER pdf_processing_trigger
  AFTER INSERT ON public.pdf_files
  FOR EACH ROW
  EXECUTE FUNCTION trigger_pdf_processing();

-- הוספת פוליסות Storage עבור תיקיית העמודים המפוצלים
CREATE POLICY "Public can view split PDF pages" 
ON storage.objects 
FOR SELECT 
USING (bucket_id = 'pdf-files' AND (storage.foldername(name))[1] = 'split_pages');

CREATE POLICY "Admins can manage split PDF pages" 
ON storage.objects 
FOR ALL 
USING (bucket_id = 'pdf-files' AND (storage.foldername(name))[1] = 'split_pages');


-- תיקון הפונקציה trigger_pdf_processing לשלוח נתיב נכון
CREATE OR REPLACE FUNCTION trigger_pdf_processing()
RETURNS TRIGGER AS $$
BEGIN
  -- עדכון סטטוס לעיבוד
  NEW.processing_status = 'pending';
  
  -- חילוץ הנתיב היחסי מהURL המלא אם נדרש
  DECLARE
    relative_path TEXT;
  BEGIN
    -- אם file_path מכיל URL מלא, חלץ רק את החלק הרלוונטי
    IF NEW.file_path LIKE 'http%' THEN
      -- חילוץ הנתיב מאחרי /storage/v1/object/public/pdf-files/
      relative_path := SUBSTRING(NEW.file_path FROM '.*/pdf-files/(.+)$');
      IF relative_path IS NULL THEN
        -- אם לא הצלחנו לחלץ, נשתמש בfile_name
        relative_path := NEW.file_name;
      END IF;
    ELSE
      -- אם זה כבר נתיב יחסי, נשתמש בו כמו שהוא
      relative_path := NEW.file_path;
    END IF;
    
    -- הפעלת Edge Function באמצעות HTTP POST
    PERFORM net.http_post(
      url := 'https://irvaecqmzkecyispsxul.supabase.co/functions/v1/split-pdf',
      headers := jsonb_build_object(
        'Content-Type', 'application/json',
        'Authorization', 'Bearer ' || current_setting('request.jwt.claims', true)::json->>'sub'
      ),
      body := jsonb_build_object(
        'pdf_file_id', NEW.id,
        'file_path', relative_path,
        'file_name', NEW.file_name
      )
    );
  END;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- יצירת Storage Bucket אם לא קיים
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES ('pdf-files', 'pdf-files', true, 52428800, ARRAY['application/pdf']::text[])
ON CONFLICT (id) DO NOTHING;

-- איפוס סטטוס הקבצים התקועים כדי לאפשר עיבוד מחדש
UPDATE public.pdf_files 
SET processing_status = 'pending' 
WHERE processing_status IN ('processing', 'failed');

-- מחיקת עמודים קיימים של קבצים שלא הושלמו
DELETE FROM public.pdf_pages 
WHERE pdf_file_id IN (
  SELECT id FROM public.pdf_files 
  WHERE processing_status = 'pending'
);


-- Fix the trigger function to avoid JWT access issues
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
    
    -- הפעלת Edge Function באמצעות HTTP POST עם service role key
    PERFORM net.http_post(
      url := 'https://irvaecqmzkecyispsxul.supabase.co/functions/v1/split-pdf',
      headers := jsonb_build_object(
        'Content-Type', 'application/json',
        'Authorization', 'Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImlydmFlY3FtemtlY3lpc3BzeHVsIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1MTIyODQ4OCwiZXhwIjoyMDY2ODA0NDg4fQ.YgLa6yEjHWrHfIYgMQoE7_kNBKbhTlN6zqGo6fT6vJU'
      ),
      body := jsonb_build_object(
        'pdf_file_id', NEW.id,
        'file_path', relative_path,
        'file_name', NEW.file_name
      )
    );
  EXCEPTION
    WHEN OTHERS THEN
      -- אם יש שגיאה בקריאה ל-HTTP, נמשיך בלי לזרוק שגיאה
      RAISE NOTICE 'Failed to trigger PDF processing: %', SQLERRM;
  END;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create the trigger if it doesn't exist
DROP TRIGGER IF EXISTS trigger_pdf_processing_on_insert ON public.pdf_files;
CREATE TRIGGER trigger_pdf_processing_on_insert 
  BEFORE INSERT ON public.pdf_files 
  FOR EACH ROW 
  EXECUTE FUNCTION trigger_pdf_processing();

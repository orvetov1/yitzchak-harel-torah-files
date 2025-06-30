
-- הסרה מלאה של הטריגר והפונקציה הבעייתיים
DROP TRIGGER IF EXISTS pdf_processing_trigger ON public.pdf_files;
DROP TRIGGER IF EXISTS trigger_pdf_processing_on_insert ON public.pdf_files;
DROP FUNCTION IF EXISTS public.trigger_pdf_processing();

-- וידוא שעמודת processing_status מוגדרת כראוי
ALTER TABLE public.pdf_files 
ALTER COLUMN processing_status SET DEFAULT 'pending';

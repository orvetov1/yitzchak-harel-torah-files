
-- הסרת הטריגר הבעייתי
DROP TRIGGER IF EXISTS trigger_pdf_processing_on_insert ON public.pdf_files;
DROP TRIGGER IF EXISTS pdf_processing_trigger ON public.pdf_files;

-- הסרת הפונקציה הבעייתית
DROP FUNCTION IF EXISTS trigger_pdf_processing();

-- עדכון טבלת pdf_files להבטיח שהשדה processing_status מוגדר כברירת מחדל
ALTER TABLE public.pdf_files 
ALTER COLUMN processing_status SET DEFAULT 'pending';

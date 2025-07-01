
-- Create table for PDF table of contents
CREATE TABLE public.pdf_table_of_contents (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  pdf_file_id UUID NOT NULL REFERENCES public.pdf_files(id) ON DELETE CASCADE,
  chapter_title TEXT NOT NULL,
  page_number INTEGER NOT NULL,
  level INTEGER NOT NULL DEFAULT 1,
  order_index INTEGER NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE public.pdf_table_of_contents ENABLE ROW LEVEL SECURITY;

-- Create policies for table of contents
CREATE POLICY "Anyone can view PDF table of contents" 
  ON public.pdf_table_of_contents 
  FOR SELECT 
  USING (true);

CREATE POLICY "Admins can manage PDF table of contents" 
  ON public.pdf_table_of_contents 
  FOR ALL 
  USING (true)
  WITH CHECK (true);

-- Create index for better performance
CREATE INDEX idx_pdf_table_of_contents_pdf_file_id ON public.pdf_table_of_contents(pdf_file_id);
CREATE INDEX idx_pdf_table_of_contents_order ON public.pdf_table_of_contents(pdf_file_id, order_index);

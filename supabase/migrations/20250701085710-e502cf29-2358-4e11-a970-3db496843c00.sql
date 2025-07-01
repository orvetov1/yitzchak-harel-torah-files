
-- Add optimization-related columns to pdf_files table
ALTER TABLE pdf_files 
ADD COLUMN optimized_file_path TEXT,
ADD COLUMN original_size INTEGER,
ADD COLUMN optimized_size INTEGER,
ADD COLUMN compression_ratio NUMERIC(5,2),
ADD COLUMN optimization_completed_at TIMESTAMP WITH TIME ZONE;

-- Update the processing_status column to have better default and constraints
ALTER TABLE pdf_files 
ALTER COLUMN processing_status SET DEFAULT 'pending';

-- Add check constraint for processing_status values
ALTER TABLE pdf_files 
ADD CONSTRAINT processing_status_check 
CHECK (processing_status IN ('pending', 'processing', 'completed', 'failed', 'optimizing', 'optimized'));

-- Create index for faster queries on processing status
CREATE INDEX idx_pdf_files_processing_status ON pdf_files(processing_status);

-- Create index for optimization queries
CREATE INDEX idx_pdf_files_optimization ON pdf_files(optimized_file_path, processing_status) WHERE optimized_file_path IS NOT NULL;

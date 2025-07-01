
import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import { PDFDocument } from 'https://esm.sh/pdf-lib@1.17.1'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

interface OptimizePDFRequest {
  pdf_file_id: string;
  file_path: string;
  file_name: string;
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    if (req.method !== 'POST') {
      return new Response('Method not allowed', { 
        status: 405, 
        headers: corsHeaders 
      });
    }

    const { pdf_file_id, file_path, file_name }: OptimizePDFRequest = await req.json();
    console.log('🚀 Starting PDF optimization for:', { pdf_file_id, file_path, file_name });

    // Update status to processing
    await supabase
      .from('pdf_files')
      .update({ 
        processing_status: 'optimizing',
        updated_at: new Date().toISOString()
      })
      .eq('id', pdf_file_id);

    // Download the original PDF
    console.log('📥 Downloading original PDF from:', file_path);
    const { data: fileData, error: downloadError } = await supabase.storage
      .from('pdf-files')
      .download(file_path);

    if (downloadError || !fileData) {
      throw new Error(`Failed to download PDF: ${downloadError?.message}`);
    }

    const originalBuffer = await fileData.arrayBuffer();
    const originalSize = originalBuffer.byteLength;
    console.log(`📊 Original PDF size: ${Math.round(originalSize / 1024)}KB`);

    // Load PDF with pdf-lib
    const pdfDoc = await PDFDocument.load(originalBuffer);
    const pageCount = pdfDoc.getPageCount();
    console.log(`📄 PDF has ${pageCount} pages`);

    // Create optimized version with linearization hints
    // This helps with streaming and progressive loading
    const optimizedPdfBytes = await pdfDoc.save({
      useObjectStreams: false, // Better for streaming
      addDefaultPage: false,
      objectsPerTick: 50, // Process in smaller chunks
      updateFieldAppearances: false // Skip unnecessary updates
    });

    const optimizedSize = optimizedPdfBytes.byteLength;
    const compressionRatio = ((originalSize - optimizedSize) / originalSize * 100);
    console.log(`✅ Optimized PDF size: ${Math.round(optimizedSize / 1024)}KB (${compressionRatio.toFixed(1)}% reduction)`);

    // Generate optimized file path
    const pathParts = file_path.split('.');
    const optimizedPath = `${pathParts[0]}-optimized.${pathParts[1]}`;

    // Upload optimized PDF
    const { error: uploadError } = await supabase.storage
      .from('pdf-files')
      .upload(optimizedPath, optimizedPdfBytes, {
        contentType: 'application/pdf',
        upsert: true
      });

    if (uploadError) {
      throw new Error(`Failed to upload optimized PDF: ${uploadError.message}`);
    }

    // Get public URL for optimized file
    const { data: { publicUrl } } = supabase.storage
      .from('pdf-files')
      .getPublicUrl(optimizedPath);

    // Update database with optimization results
    const { error: dbError } = await supabase
      .from('pdf_files')
      .update({
        processing_status: 'optimized',
        optimized_file_path: publicUrl,
        original_size: originalSize,
        optimized_size: optimizedSize,
        compression_ratio: compressionRatio,
        num_pages_total: pageCount,
        optimization_completed_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      })
      .eq('id', pdf_file_id);

    if (dbError) {
      console.error('❌ Database update failed:', dbError);
      throw dbError;
    }

    console.log('🎉 PDF optimization completed successfully');

    return new Response(
      JSON.stringify({
        success: true,
        pdf_file_id,
        original_size: originalSize,
        optimized_size: optimizedSize,
        compression_ratio: compressionRatio,
        page_count: pageCount,
        optimized_url: publicUrl
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      }
    );

  } catch (error) {
    console.error('❌ PDF optimization failed:', error);
    
    return new Response(
      JSON.stringify({
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error occurred'
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500,
      }
    );
  }
});

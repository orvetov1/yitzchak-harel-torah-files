// supabase/functions/optimize-pdf/index.ts
import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import { PDFDocument } from 'https://esm.sh/pdf-lib@1.17.1'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

interface OptimizePDFRequest {
  pdf_file_id: string;
  file_path: string; // This should be the relative path for storage operations
  file_name: string;
}

serve(async (req) => {
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

    // The file_path received by this function should already be the relative path
    // if coming from the trigger, but we add a safety check just in case.
    let relativePathForStorage = file_path;
    if (file_path.includes('/storage/v1/object/public/pdf-files/')) {
        const match = file_path.match(/\/pdf-files\/(.+)$/);
        relativePathForStorage = match ? match[1] : file_name; // Fallback to file_name
    } else if (file_path.startsWith('http')) {
        relativePathForStorage = file_name;
    }
    console.log(`📁 Using relative path for storage (optimization): ${relativePathForStorage}`);

    // Download the original PDF
    console.log('📥 Downloading original PDF from:', relativePathForStorage);
    const { data: fileData, error: downloadError } = await supabase.storage
      .from('pdf-files')
      .download(relativePathForStorage);

    if (downloadError || !fileData) {
      throw new Error(`Failed to download PDF: ${downloadError?.message}`);
    }

    const originalBuffer = await fileData.arrayBuffer();
    const originalSize = originalBuffer.byteLength;
    console.log(`📊 Original PDF size: ${Math.round(originalSize / 1024)}KB`);

    const pdfDoc = await PDFDocument.load(originalBuffer);
    const pageCount = pdfDoc.getPageCount();
    console.log(`📄 PDF has ${pageCount} pages`);

    const optimizedPdfBytes = await pdfDoc.save({
      useObjectStreams: false,
      addDefaultPage: false,
      objectsPerTick: 50,
      updateFieldAppearances: false
    });

    const optimizedSize = optimizedPdfBytes.byteLength;
    const compressionRatio = ((originalSize - optimizedSize) / originalSize * 100);
    console.log(`✅ Optimized PDF size: ${Math.round(optimizedSize / 1024)}KB (${compressionRatio.toFixed(1)}% reduction)`);

    const pathParts = relativePathForStorage.split('.');
    const optimizedPath = `${pathParts[0]}-optimized.${pathParts[1]}`;

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

    await supabase
      .from('pdf_files')
      .update({
        processing_status: 'optimized',
        optimized_file_path: publicUrl, // Store the full public URL
        original_size: originalSize,
        optimized_size: optimizedSize,
        compression_ratio: compressionRatio,
        num_pages_total: pageCount,
        optimization_completed_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      })
      .eq('id', pdf_file_id);

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
    
    // Update processing status to failed
    try {
      const supabase = createClient(
        Deno.env.get('SUPABASE_URL') ?? '',
        Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
      );
      
      const requestBody = await req.clone().json();
      if (requestBody.pdf_file_id) {
        await supabase
          .from('pdf_files')
          .update({ processing_status: 'failed' })
          .eq('id', requestBody.pdf_file_id);
      }
    } catch (updateError) {
      console.error('❌ Failed to update error status:', updateError);
    }
    
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
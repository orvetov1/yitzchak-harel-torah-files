
import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
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

    const { pdf_file_id } = await req.json();
    console.log('🔄 Auto-triggering optimization for PDF:', pdf_file_id);

    // Get file details
    const { data: fileData, error: fileError } = await supabase
      .from('pdf_files')
      .select('file_path, file_name, file_size')
      .eq('id', pdf_file_id)
      .single();

    if (fileError || !fileData) {
      throw new Error(`Failed to get file details: ${fileError?.message}`);
    }

    // Only auto-optimize files larger than 1MB or with more than 50 pages
    const shouldOptimize = fileData.file_size > 1024 * 1024; // 1MB threshold

    if (!shouldOptimize) {
      console.log('📄 File too small for optimization, skipping');
      return new Response(JSON.stringify({ 
        success: true, 
        optimized: false, 
        reason: 'File size below threshold' 
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Extract relative path
    let relativePath = fileData.file_path;
    if (fileData.file_path.includes('/storage/v1/object/public/pdf-files/')) {
      const match = fileData.file_path.match(/\/pdf-files\/(.+)$/);
      relativePath = match ? match[1] : fileData.file_name;
    }

    // Call the optimize-pdf function
    const { error: optimizeError } = await supabase.functions.invoke('optimize-pdf', {
      body: {
        pdf_file_id,
        file_path: relativePath,
        file_name: fileData.file_name
      }
    });

    if (optimizeError) {
      console.error('❌ Auto-optimization failed:', optimizeError);
      throw optimizeError;
    }

    console.log('✅ Auto-optimization started successfully');

    return new Response(JSON.stringify({
      success: true,
      optimized: true,
      pdf_file_id
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('❌ Auto-optimization trigger failed:', error);
    
    return new Response(JSON.stringify({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 500,
    });
  }
});

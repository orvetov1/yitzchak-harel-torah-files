
import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

interface LinearizePDFRequest {
  pdf_file_id: string;
  file_path: string;
  file_name: string;
}

// Check if Ghostscript is available
async function checkGhostscriptAvailability(): Promise<boolean> {
  try {
    const gsProcess = new Deno.Command('gs', {
      args: ['--version'],
      stdout: 'piped',
      stderr: 'piped'
    });
    
    const { code } = await gsProcess.output();
    return code === 0;
  } catch (error) {
    console.error('❌ Ghostscript not available:', error);
    return false;
  }
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

    const { pdf_file_id, file_path, file_name }: LinearizePDFRequest = await req.json();
    console.log('🚀 Starting PDF linearization for:', { pdf_file_id, file_path, file_name });

    // Check Ghostscript availability first
    const gsAvailable = await checkGhostscriptAvailability();
    if (!gsAvailable) {
      console.error('❌ Ghostscript not available - falling back to optimize-pdf function');
      
      // Update status to indicate fallback
      await supabase
        .from('pdf_files')
        .update({ 
          processing_status: 'optimizing',
          updated_at: new Date().toISOString()
        })
        .eq('id', pdf_file_id);

      // Call the optimize-pdf function as fallback
      const { error: optimizeError } = await supabase.functions.invoke('optimize-pdf', {
        body: { pdf_file_id, file_path, file_name }
      });

      if (optimizeError) {
        throw new Error(`Fallback optimization failed: ${optimizeError.message}`);
      }

      return new Response(
        JSON.stringify({
          success: true,
          pdf_file_id,
          message: 'Used optimization fallback (Ghostscript not available)',
          fallback_used: true
        }),
        {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 200,
        }
      );
    }

    // Update status to linearizing
    await supabase
      .from('pdf_files')
      .update({ 
        processing_status: 'linearizing',
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

    // Create temporary files for Ghostscript processing
    const inputFile = `/tmp/input_${pdf_file_id}.pdf`;
    const outputFile = `/tmp/linearized_${pdf_file_id}.pdf`;

    try {
      // Write input file
      await Deno.writeFile(inputFile, new Uint8Array(originalBuffer));

      // Run Ghostscript for linearization and optimization
      const gsCommand = [
        'gs',
        '-dNOPAUSE',
        '-dBATCH',
        '-dSAFER',
        '-dQUIET',
        '-sDEVICE=pdfwrite',
        '-dFastWebView=true',        // Enable linearization
        '-dPDFSETTINGS=/screen',     // Optimize for screen viewing
        '-dEmbedAllFonts=true',      // Embed fonts for consistency
        '-dSubsetFonts=true',        // Subset fonts to reduce size
        '-dCompressFonts=true',      // Compress fonts
        '-dOptimize=true',           // General optimization
        '-dAutoRotatePages=/None',   // Preserve original orientation
        `-sOutputFile=${outputFile}`,
        inputFile
      ];

      console.log('🔄 Running Ghostscript linearization...');
      const gsProcess = new Deno.Command('gs', {
        args: gsCommand.slice(1),
        stdout: 'piped',
        stderr: 'piped'
      });

      const { code, stdout, stderr } = await gsProcess.output();
      const stdoutText = new TextDecoder().decode(stdout);
      const stderrText = new TextDecoder().decode(stderr);

      if (code !== 0) {
        console.error('❌ Ghostscript failed:', { code, stdout: stdoutText, stderr: stderrText });
        throw new Error(`Ghostscript failed with code ${code}: ${stderrText}`);
      }

      console.log('✅ Ghostscript completed successfully');

      // Read the linearized PDF
      const linearizedBuffer = await Deno.readFile(outputFile);
      const linearizedSize = linearizedBuffer.byteLength;
      const compressionRatio = ((originalSize - linearizedSize) / originalSize * 100);
      
      console.log(`📈 Linearized PDF size: ${Math.round(linearizedSize / 1024)}KB (${compressionRatio.toFixed(1)}% reduction)`);

      // Generate linearized file path
      const pathParts = file_path.split('.');
      const linearizedPath = `${pathParts[0]}-linearized.${pathParts[1]}`;

      // Upload linearized PDF
      const { error: uploadError } = await supabase.storage
        .from('pdf-files')
        .upload(linearizedPath, linearizedBuffer, {
          contentType: 'application/pdf',
          upsert: true
        });

      if (uploadError) {
        throw new Error(`Failed to upload linearized PDF: ${uploadError.message}`);
      }

      // Get public URL for linearized file
      const { data: { publicUrl } } = supabase.storage
        .from('pdf-files')
        .getPublicUrl(linearizedPath);

      // Update database with linearization results
      const { error: dbError } = await supabase
        .from('pdf_files')
        .update({
          processing_status: 'linearized',
          optimized_file_path: publicUrl,
          original_size: originalSize,
          optimized_size: linearizedSize,
          compression_ratio: compressionRatio,
          optimization_completed_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        })
        .eq('id', pdf_file_id);

      if (dbError) {
        console.error('❌ Database update failed:', dbError);
        throw dbError;
      }

      console.log('🎉 PDF linearization completed successfully');

      return new Response(
        JSON.stringify({
          success: true,
          pdf_file_id,
          original_size: originalSize,
          linearized_size: linearizedSize,
          compression_ratio: compressionRatio,
          linearized_url: publicUrl,
          is_linearized: true,
          fallback_used: false
        }),
        {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 200,
        }
      );

    } finally {
      // Cleanup temporary files
      try {
        await Deno.remove(inputFile);
        await Deno.remove(outputFile);
      } catch (cleanupError) {
        console.warn('⚠️ Failed to cleanup temp files:', cleanupError);
      }
    }

  } catch (error) {
    console.error('❌ PDF linearization failed:', error);
    
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
        error: error instanceof Error ? error.message : 'Unknown error occurred',
        fallback_used: false
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500,
      }
    );
  }
});

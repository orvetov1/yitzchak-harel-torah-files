// supabase/functions/split-pdf/index.ts
import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import { PDFDocument } from 'https://esm.sh/pdf-lib@1.17.1'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    const { pdf_file_id, file_path: original_file_path, file_name } = await req.json(); // Renamed file_path to original_file_path for clarity
    
    console.log(`🚀 Starting PDF split for file: ${file_name} (ID: ${pdf_file_id})`);
    console.log(`📁 Original file path received: ${original_file_path}`);

    // Update processing status to 'processing'
    await supabaseClient
      .from('pdf_files')
      .update({ processing_status: 'processing' })
      .eq('id', pdf_file_id);

    // Ensure we are using a relative path for storage operations
    let relativePathForStorage = original_file_path;
    // If the path looks like a public URL, extract the part after 'pdf-files/'
    if (original_file_path.includes('/storage/v1/object/public/pdf-files/')) {
      const match = original_file_path.match(/\/pdf-files\/(.+)$/);
      relativePathForStorage = match ? match[1] : file_name; // Fallback to file_name if regex fails
    } else if (original_file_path.startsWith('http')) {
      // If it's a full URL but not the exact Supabase public URL format, try to infer from filename
      relativePathForStorage = file_name;
    }
    // If it's already a relative path (e.g., from an internal trigger), it remains unchanged

    console.log(`📁 Using relative path for storage: ${relativePathForStorage}`);

    // Download the original PDF file from storage
    console.log(`📥 Downloading PDF from storage path: ${relativePathForStorage}`);
    const { data: fileData, error: downloadError } = await supabaseClient.storage
      .from('pdf-files')
      .download(relativePathForStorage);

    if (downloadError) {
      console.error(`❌ Download error:`, downloadError);
      throw new Error(`Failed to download PDF: ${downloadError.message}`);
    }

    if (!fileData) {
      throw new Error('No file data received from storage');
    }

    const pdfBytes = await fileData.arrayBuffer();
    console.log(`📄 PDF downloaded successfully, size: ${pdfBytes.byteLength} bytes`);

    const pdfDoc = await PDFDocument.load(pdfBytes);
    const totalPages = pdfDoc.getPageCount();
    console.log(`📊 Total pages in PDF: ${totalPages}`);

    await supabaseClient
      .from('pdf_files')
      .update({ num_pages_total: totalPages })
      .eq('id', pdf_file_id);

    const pageInserts = [];
    
    for (let pageIndex = 0; pageIndex < totalPages; pageIndex++) {
      const pageNumber = pageIndex + 1;
      console.log(`🔄 Processing page ${pageNumber}/${totalPages}`);

      const singlePageDoc = await PDFDocument.create();
      const [copiedPage] = await singlePageDoc.copyPages(pdfDoc, [pageIndex]);
      singlePageDoc.addPage(copiedPage);

      const singlePageBytes = await singlePageDoc.save();
      
      const splitPagePath = `split_pages/${pdf_file_id}/page_${pageNumber}.pdf`;
      
      const { error: uploadError } = await supabaseClient.storage
        .from('pdf-files')
        .upload(splitPagePath, singlePageBytes, {
          contentType: 'application/pdf',
          upsert: true
        });

      if (uploadError) {
        console.error(`❌ Failed to upload page ${pageNumber}: ${uploadError.message}`);
        continue;
      }

      pageInserts.push({
        pdf_file_id,
        page_number: pageNumber,
        file_path: splitPagePath,
        file_size: singlePageBytes.length
      });

      console.log(`✅ Page ${pageNumber} uploaded successfully (${singlePageBytes.length} bytes)`);
    }

    if (pageInserts.length === 0) {
      throw new Error('No pages were successfully processed');
    }

    const { error: insertError } = await supabaseClient
      .from('pdf_pages')
      .insert(pageInserts);

    if (insertError) {
      console.error(`❌ Database insert error:`, insertError);
      throw new Error(`Failed to insert page records: ${insertError.message}`);
    }

    await supabaseClient
      .from('pdf_files')
      .update({ 
        processing_status: 'completed',
        split_at: new Date().toISOString()
      })
      .eq('id', pdf_file_id);

    console.log(`🎉 PDF split completed successfully: ${totalPages} pages processed, ${pageInserts.length} pages saved`);

    return new Response(
      JSON.stringify({ 
        success: true, 
        message: `PDF split into ${totalPages} pages successfully`,
        pages_created: pageInserts.length,
        total_pages: totalPages
      }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200 
      }
    );

  } catch (error) {
    console.error('❌ PDF splitting failed:', error);

    try {
      const requestBody = await req.clone().json();
      if (requestBody.pdf_file_id) {
        const supabaseClient = createClient(
          Deno.env.get('SUPABASE_URL') ?? '',
          Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
        );
        
        await supabaseClient
          .from('pdf_files')
          .update({ processing_status: 'failed' })
          .eq('id', requestBody.pdf_file_id);
        
        console.log(`📝 Updated processing status to 'failed' for PDF: ${requestBody.pdf_file_id}`);
      }
    } catch (updateError) {
      console.error('❌ Failed to update error status:', updateError);
    }

    return new Response(
      JSON.stringify({ 
        success: false, 
        error: error instanceof Error ? error.message : 'Unknown error'
      }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500 
      }
    );
  }
});
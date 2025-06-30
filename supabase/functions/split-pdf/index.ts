
import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import { PDFDocument } from 'https://esm.sh/pdf-lib@1.17.1'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseClient = createClient(
      'https://irvaecqmzkecyispsxul.supabase.co',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    const { pdf_file_id, file_path, file_name } = await req.json();
    
    console.log(`🚀 Starting PDF split for file: ${file_name} (ID: ${pdf_file_id})`);

    // Update processing status to 'processing'
    await supabaseClient
      .from('pdf_files')
      .update({ processing_status: 'processing' })
      .eq('id', pdf_file_id);

    // Download the original PDF file from storage
    console.log(`📥 Downloading PDF from: ${file_path}`);
    const { data: fileData, error: downloadError } = await supabaseClient.storage
      .from('pdf-files')
      .download(file_path);

    if (downloadError) {
      throw new Error(`Failed to download PDF: ${downloadError.message}`);
    }

    // Convert blob to array buffer
    const pdfBytes = await fileData.arrayBuffer();
    console.log(`📄 PDF downloaded, size: ${pdfBytes.byteLength} bytes`);

    // Load PDF document
    const pdfDoc = await PDFDocument.load(pdfBytes);
    const totalPages = pdfDoc.getPageCount();
    console.log(`📊 Total pages in PDF: ${totalPages}`);

    // Update total pages count in database
    await supabaseClient
      .from('pdf_files')
      .update({ num_pages_total: totalPages })
      .eq('id', pdf_file_id);

    // Split PDF into individual pages
    const pageInserts = [];
    
    for (let pageIndex = 0; pageIndex < totalPages; pageIndex++) {
      const pageNumber = pageIndex + 1;
      console.log(`🔄 Processing page ${pageNumber}/${totalPages}`);

      // Create new PDF document with single page
      const singlePageDoc = await PDFDocument.create();
      const [copiedPage] = await singlePageDoc.copyPages(pdfDoc, [pageIndex]);
      singlePageDoc.addPage(copiedPage);

      // Generate PDF bytes for the single page
      const singlePageBytes = await singlePageDoc.save();
      
      // Create file path for the split page
      const splitPagePath = `split_pages/${pdf_file_id}/page_${pageNumber}.pdf`;
      
      // Upload single page to storage
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

      // Prepare data for batch insert
      pageInserts.push({
        pdf_file_id,
        page_number: pageNumber,
        file_path: splitPagePath,
        file_size: singlePageBytes.length
      });

      console.log(`✅ Page ${pageNumber} uploaded successfully (${singlePageBytes.length} bytes)`);
    }

    // Batch insert all pages to database
    const { error: insertError } = await supabaseClient
      .from('pdf_pages')
      .insert(pageInserts);

    if (insertError) {
      throw new Error(`Failed to insert page records: ${insertError.message}`);
    }

    // Update processing status to 'completed'
    await supabaseClient
      .from('pdf_files')
      .update({ 
        processing_status: 'completed',
        split_at: new Date().toISOString()
      })
      .eq('id', pdf_file_id);

    console.log(`🎉 PDF split completed successfully: ${totalPages} pages processed`);

    return new Response(
      JSON.stringify({ 
        success: true, 
        message: `PDF split into ${totalPages} pages successfully`,
        pages_created: pageInserts.length 
      }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200 
      }
    );

  } catch (error) {
    console.error('❌ PDF splitting failed:', error);

    // Update processing status to 'failed' if we have the PDF file ID
    try {
      const body = await req.clone().json();
      if (body.pdf_file_id) {
        const supabaseClient = createClient(
          'https://irvaecqmzkecyispsxul.supabase.co',
          Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
        );
        
        await supabaseClient
          .from('pdf_files')
          .update({ processing_status: 'failed' })
          .eq('id', body.pdf_file_id);
      }
    } catch (updateError) {
      console.error('Failed to update error status:', updateError);
    }

    return new Response(
      JSON.stringify({ 
        success: false, 
        error: error.message 
      }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500 
      }
    );
  }
});

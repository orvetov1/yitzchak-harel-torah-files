
import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

// This webhook is triggered by database triggers when a new PDF is uploaded
serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const payload = await req.json();
    console.log('📥 PDF upload webhook triggered:', payload);

    // Check if this is a new insert with a PDF file
    if (payload.type === 'INSERT' && payload.record) {
      const pdfFile = payload.record;
      
      // Wait a bit for the file to be fully uploaded
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      // Trigger auto-optimization
      const supabase = createClient(
        Deno.env.get('SUPABASE_URL') ?? '',
        Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
      );

      const { error } = await supabase.functions.invoke('auto-optimize-trigger', {
        body: { pdf_file_id: pdfFile.id }
      });

      if (error) {
        console.error('❌ Failed to trigger auto-optimization:', error);
      } else {
        console.log('✅ Auto-optimization triggered successfully for:', pdfFile.id);
      }
    }

    return new Response(JSON.stringify({ success: true }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('❌ Webhook error:', error);
    
    return new Response(JSON.stringify({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 500,
    });
  }
});

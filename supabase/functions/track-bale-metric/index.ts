import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.54.0';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { baleId, metricType } = await req.json();

    if (!baleId || !metricType) {
      throw new Error('Missing baleId or metricType');
    }

    if (metricType !== 'view' && metricType !== 'add_to_cart') {
      throw new Error('Invalid metricType. Must be "view" or "add_to_cart"');
    }

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_ANON_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Check if metrics record exists for this bale
    const { data: existing, error: fetchError } = await supabase
      .from('bale_metrics')
      .select('*')
      .eq('bale_id', baleId)
      .maybeSingle();

    if (fetchError) {
      throw fetchError;
    }

    if (existing) {
      // Update existing record
      const updateData = metricType === 'view'
        ? { view_count: existing.view_count + 1 }
        : { add_to_cart_count: existing.add_to_cart_count + 1 };

      const { error: updateError } = await supabase
        .from('bale_metrics')
        .update(updateData)
        .eq('bale_id', baleId);

      if (updateError) {
        throw updateError;
      }
    } else {
      // Create new record
      const insertData = {
        bale_id: baleId,
        view_count: metricType === 'view' ? 1 : 0,
        add_to_cart_count: metricType === 'add_to_cart' ? 1 : 0,
      };

      const { error: insertError } = await supabase
        .from('bale_metrics')
        .insert(insertData);

      if (insertError) {
        throw insertError;
      }
    }

    console.log(`Metric tracked: ${metricType} for bale ${baleId}`);

    return new Response(
      JSON.stringify({ success: true }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('Error tracking metric:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { 
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    );
  }
});

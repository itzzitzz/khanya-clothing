import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.7.1';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { stockItemId, prompt, showPeople } = await req.json();
    
    const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY');
    const SUPABASE_URL = Deno.env.get('SUPABASE_URL');
    const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');

    if (!LOVABLE_API_KEY || !SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
      throw new Error('Missing required environment variables');
    }

    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

    console.log(`Generating image for stock item ID: ${stockItemId}`);
    console.log(`Prompt: ${prompt}`);

    const response = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${LOVABLE_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'google/gemini-2.5-flash-image-preview',
        messages: [
          {
            role: 'user',
            content: prompt
          }
        ],
        modalities: ['image', 'text']
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error(`AI Gateway error:`, response.status, errorText);
      
      let remainingCredits = null;
      try {
        const errorData = JSON.parse(errorText);
        if (errorData.remaining_credits !== undefined) {
          remainingCredits = errorData.remaining_credits;
        }
      } catch (e) {
        // Couldn't parse error response
      }
      
      if (response.status === 402) {
        return new Response(
          JSON.stringify({ 
            success: false,
            creditError: true,
            errorMessage: errorText,
            remainingCredits
          }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      } else if (response.status === 429) {
        return new Response(
          JSON.stringify({ 
            success: false,
            rateLimitError: true,
            errorMessage: errorText,
            remainingCredits
          }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
      
      throw new Error(`AI Gateway error: ${response.status} - ${errorText}`);
    }

    const data = await response.json();
    const imageBase64 = data.choices?.[0]?.message?.images?.[0]?.image_url?.url;

    if (!imageBase64) {
      console.error('No image returned from AI');
      return new Response(
        JSON.stringify({ 
          success: false,
          errorMessage: 'No image returned from AI'
        }),
        { 
          status: 500,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      );
    }

    // Extract base64 data
    const base64Data = imageBase64.replace(/^data:image\/\w+;base64,/, '');
    const imageBuffer = Uint8Array.from(atob(base64Data), c => c.charCodeAt(0));

    // Upload to storage
    const fileName = `stock-item-${stockItemId}-${Date.now()}.png`;
    const { data: uploadData, error: uploadError } = await supabase.storage
      .from('product-images')
      .upload(fileName, imageBuffer, {
        contentType: 'image/png',
        upsert: false
      });

    if (uploadError) {
      console.error('Upload error:', uploadError);
      throw uploadError;
    }

    // Get public URL
    const { data: { publicUrl } } = supabase.storage
      .from('product-images')
      .getPublicUrl(fileName);

    // Check existing images count for this stock item
    const { count } = await supabase
      .from('stock_item_images')
      .select('*', { count: 'exact', head: true })
      .eq('stock_item_id', stockItemId);

    // Insert image record
    const { error: insertError } = await supabase
      .from('stock_item_images')
      .insert({
        stock_item_id: stockItemId,
        image_url: publicUrl,
        is_primary: (count || 0) === 0, // First image is primary
        display_order: count || 0
      });

    if (insertError) {
      console.error('Insert error:', insertError);
      throw insertError;
    }

    // Try to extract remaining credits from response headers or metadata
    let remainingCredits = null;
    try {
      // Check if the AI gateway returns credit info in headers
      const creditHeader = response.headers.get('x-remaining-credits');
      if (creditHeader) {
        remainingCredits = parseInt(creditHeader);
      }
    } catch (e) {
      console.log('Could not extract remaining credits from response');
    }

    console.log(`Successfully generated and uploaded image for stock item ${stockItemId}`);

    return new Response(
      JSON.stringify({ 
        success: true,
        imageUrl: publicUrl,
        remainingCredits
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('Error in generate-single-stock-image:', error);
    return new Response(
      JSON.stringify({ 
        success: false,
        error: error.message 
      }),
      { 
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );
  }
});

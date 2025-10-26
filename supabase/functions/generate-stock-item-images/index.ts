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
    const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY');
    const SUPABASE_URL = Deno.env.get('SUPABASE_URL');
    const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');

    if (!LOVABLE_API_KEY || !SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
      throw new Error('Missing required environment variables');
    }

    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

    // Fetch all stock items
    const { data: stockItems, error: fetchError } = await supabase
      .from('stock_items')
      .select('*')
      .order('id');

    if (fetchError) throw fetchError;
    if (!stockItems || stockItems.length === 0) {
      throw new Error('No stock items found');
    }

    console.log(`Generating images for ${stockItems.length} stock items`);

    const results = [];

    for (const item of stockItems) {
      console.log(`Generating images for: ${item.name}`);
      
      // Generate 2 images for each stock item
      for (let i = 0; i < 2; i++) {
        try {
          const prompt = `Professional product photography of ${item.name}. ${item.description}. Age range: ${item.age_range || 'all ages'}. Clean white background, high quality, e-commerce style, well-lit, centered composition.`;
          
          console.log(`Generating image ${i + 1} for ${item.name}`);
          
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
            console.error(`AI Gateway error for ${item.name}:`, response.status, errorText);
            continue;
          }

          const data = await response.json();
          const imageBase64 = data.choices?.[0]?.message?.images?.[0]?.image_url?.url;

          if (!imageBase64) {
            console.error(`No image returned for ${item.name}`);
            continue;
          }

          // Extract base64 data
          const base64Data = imageBase64.replace(/^data:image\/\w+;base64,/, '');
          const imageBuffer = Uint8Array.from(atob(base64Data), c => c.charCodeAt(0));

          // Upload to storage
          const fileName = `stock-item-${item.id}-${Date.now()}-${i}.png`;
          const { data: uploadData, error: uploadError } = await supabase.storage
            .from('product-images')
            .upload(fileName, imageBuffer, {
              contentType: 'image/png',
              upsert: false
            });

          if (uploadError) {
            console.error(`Upload error for ${item.name}:`, uploadError);
            continue;
          }

          // Get public URL
          const { data: { publicUrl } } = supabase.storage
            .from('product-images')
            .getPublicUrl(fileName);

          // Check existing images count for this stock item
          const { count } = await supabase
            .from('stock_item_images')
            .select('*', { count: 'exact', head: true })
            .eq('stock_item_id', item.id);

          // Insert image record
          const { error: insertError } = await supabase
            .from('stock_item_images')
            .insert({
              stock_item_id: item.id,
              image_url: publicUrl,
              is_primary: (count || 0) === 0, // First image is primary
              display_order: count || 0
            });

          if (insertError) {
            console.error(`Insert error for ${item.name}:`, insertError);
            continue;
          }

          results.push({
            stockItemId: item.id,
            stockItemName: item.name,
            imageNumber: i + 1,
            imageUrl: publicUrl,
            success: true
          });

          console.log(`Successfully generated image ${i + 1} for ${item.name}`);
        } catch (error) {
          console.error(`Error generating image for ${item.name}:`, error);
          results.push({
            stockItemId: item.id,
            stockItemName: item.name,
            imageNumber: i + 1,
            success: false,
            error: error.message
          });
        }
      }
    }

    return new Response(
      JSON.stringify({ 
        message: 'Image generation completed',
        totalItems: stockItems.length,
        results 
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('Error in generate-stock-item-images:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { 
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );
  }
});

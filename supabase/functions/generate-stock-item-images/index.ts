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
    const { showPeople = true } = await req.json();
    
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

    // Get image counts for each stock item
    const itemsWithCounts = await Promise.all(
      stockItems.map(async (item) => {
        const { count } = await supabase
          .from('stock_item_images')
          .select('*', { count: 'exact', head: true })
          .eq('stock_item_id', item.id);
        return { ...item, imageCount: count || 0 };
      })
    );

    // Sort by image count (ascending) - prioritize items with no images first
    const sortedItems = itemsWithCounts.sort((a, b) => a.imageCount - b.imageCount);

    console.log(`Generating images for ${sortedItems.length} stock items (prioritizing items with fewest images)`);

    const results = [];
    let creditError = false;
    let rateLimitError = false;
    let shouldStop = false;

    for (const item of sortedItems) {
      if (shouldStop) {
        console.log(`Stopping generation due to insufficient credits. Generated images for ${results.filter(r => r.success).length} items so far.`);
        break;
      }

      console.log(`Generating images for: ${item.name} (current count: ${item.imageCount})`);
      
      // Generate 1 image for each stock item
      for (let i = 0; i < 1; i++) {
        if (shouldStop) break;
        try {
          const basePrompt = `Professional product photography of ${item.name}. ${item.description}. Age range: ${item.age_range || 'all ages'}.`;
          const stylePrompt = showPeople 
            ? 'Black model wearing the clothes, natural pose, clean white background, high quality, e-commerce style, well-lit, centered composition.'
            : 'Just the clothes without any people, flat lay or on mannequin, clean white background, high quality, e-commerce style, well-lit, centered composition.';
          const prompt = `${basePrompt} ${stylePrompt}`;
          
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
            
            // Track specific error types and stop if out of credits
            if (response.status === 402) {
              creditError = true;
              shouldStop = true;
              console.log('Insufficient credits - stopping image generation');
              console.log('Full error response:', errorText);
            } else if (response.status === 429) {
              rateLimitError = true;
              shouldStop = true;
              console.log('Rate limit exceeded - stopping image generation');
            }
            
            results.push({
              stockItemId: item.id,
              stockItemName: item.name,
              imageNumber: i + 1,
              success: false,
              error: response.status === 402 ? 'insufficient_credits' : response.status === 429 ? 'rate_limit' : 'api_error',
              errorDetails: errorText
            });
            break; // Stop trying more images for this item
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

    const successCount = results.filter(r => r.success).length;
    const errorMessage = creditError 
      ? results.find(r => r.error === 'insufficient_credits')?.errorDetails || 'Insufficient credits'
      : rateLimitError 
      ? 'Rate limit exceeded'
      : null;

    return new Response(
      JSON.stringify({ 
        message: 'Image generation completed',
        totalItems: stockItems.length,
        successCount,
        results,
        creditError,
        rateLimitError,
        errorMessage
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

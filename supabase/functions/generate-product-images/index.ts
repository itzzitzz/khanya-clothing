import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.3';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);
    const lovableApiKey = Deno.env.get('LOVABLE_API_KEY');

    if (!lovableApiKey) {
      throw new Error('LOVABLE_API_KEY not configured');
    }

    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      throw new Error('No authorization header');
    }

    const token = authHeader.replace('Bearer ', '');
    const { data: { user }, error: authError } = await supabase.auth.getUser(token);

    if (authError || !user) {
      throw new Error('Unauthorized');
    }

    const { data: roles } = await supabase
      .from('user_roles')
      .select('role')
      .eq('user_id', user.id)
      .eq('role', 'admin')
      .maybeSingle();

    if (!roles) {
      throw new Error('Admin access required');
    }

    const body = await req.json();
    const { product_id, product_name, product_description } = body;

    if (!product_id || !product_name) {
      throw new Error('Product ID and name required');
    }

    console.log(`Generating 5 portrait images for product: ${product_name}`);

    const generatedImages = [];

    // Generate 5 portrait images
    for (let i = 0; i < 5; i++) {
      const prompt = `Create a professional product photography image in portrait orientation (9:16 aspect ratio) of ${product_name}. ${product_description || ''} The image should be clean, well-lit, and suitable for e-commerce. Focus on the product with a clean background. Style: professional product photography, studio lighting, high quality. Variation ${i + 1}.`;

      console.log(`Generating image ${i + 1}/5 with prompt:`, prompt);

      const response = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${lovableApiKey}`,
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
        })
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error(`AI Gateway error for image ${i + 1}:`, response.status, errorText);
        
        if (response.status === 429) {
          throw new Error('Rate limit exceeded. Please try again later.');
        }
        if (response.status === 402) {
          throw new Error('Payment required. Please add credits to your Lovable workspace.');
        }
        
        throw new Error(`AI Gateway error: ${response.status}`);
      }

      const data = await response.json();
      const imageBase64 = data.choices?.[0]?.message?.images?.[0]?.image_url?.url;

      if (!imageBase64) {
        throw new Error(`Failed to generate image ${i + 1}`);
      }

      // Upload to Supabase Storage
      const base64Data = imageBase64.split(',')[1];
      const buffer = Uint8Array.from(atob(base64Data), c => c.charCodeAt(0));
      const fileName = `${product_id}-${Date.now()}-${i}.png`;

      const { data: uploadData, error: uploadError } = await supabase.storage
        .from('product-images')
        .upload(fileName, buffer, {
          contentType: 'image/png',
          upsert: false
        });

      if (uploadError) {
        console.error(`Upload error for image ${i + 1}:`, uploadError);
        throw uploadError;
      }

      const { data: { publicUrl } } = supabase.storage
        .from('product-images')
        .getPublicUrl(fileName);

      console.log(`Image ${i + 1}/5 uploaded:`, publicUrl);
      generatedImages.push(publicUrl);
    }

    // Add new images to database (keep existing ones)
    const mysql = await import('https://deno.land/x/mysql@v2.12.1/mod.ts');
    const client = await new mysql.Client().connect({
      hostname: Deno.env.get('MYSQL_HOST')!,
      username: Deno.env.get('MYSQL_USERNAME')!,
      password: Deno.env.get('MYSQL_PASSWORD')!,
      db: Deno.env.get('MYSQL_DATABASE')!,
      port: 3306,
    });

    // Get the highest display_order for this product
    const result = await client.query(
      'SELECT MAX(display_order) as max_order FROM product_images WHERE product_id = ?',
      [product_id]
    );
    const maxOrder = result[0]?.max_order !== null ? result[0].max_order : -1;

    // Insert new images starting from the next display_order
    for (let i = 0; i < generatedImages.length; i++) {
      const newDisplayOrder = maxOrder + 1 + i;
      await client.execute(
        'INSERT INTO product_images (product_id, image_path, is_primary, display_order) VALUES (?, ?, ?, ?)',
        [product_id, generatedImages[i], 0, newDisplayOrder]
      );
    }

    // Update product's main image only if it doesn't have one
    const productResult = await client.query(
      'SELECT image_path FROM products WHERE id = ?',
      [product_id]
    );
    
    if (!productResult[0]?.image_path || productResult[0].image_path === '') {
      await client.execute(
        'UPDATE products SET image_path = ? WHERE id = ?',
        [generatedImages[0], product_id]
      );
    }

    await client.close();

    return new Response(
      JSON.stringify({ 
        success: true, 
        message: `Generated ${generatedImages.length} portrait images`,
        images: generatedImages
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Error generating product images:', error);
    return new Response(
      JSON.stringify({ success: false, error: error.message }),
      {
        status: error.message.includes('Unauthorized') || error.message.includes('Admin') ? 403 : 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }
});

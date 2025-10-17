import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.3';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface Product {
  id: number;
  category_id: number;
  name: string;
  description: string;
  image_path: string;
  quantity_per_10kg: number;
  price_per_10kg: number;
  price_per_piece: number;
  age_range: string | null;
}

interface Category {
  id: number;
  name: string;
  icon_name: string;
  display_order: number;
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const mysqlHost = Deno.env.get('MYSQL_HOST');
    const mysqlDatabase = Deno.env.get('MYSQL_DATABASE');
    const mysqlUsername = Deno.env.get('MYSQL_USERNAME');
    const mysqlPassword = Deno.env.get('MYSQL_PASSWORD');

    if (!mysqlHost || !mysqlDatabase || !mysqlUsername || !mysqlPassword) {
      throw new Error('Missing database configuration');
    }

    console.log(`Connecting to MySQL database ${mysqlDatabase} at ${mysqlHost}...`);

    // Import MySQL client
    const mysql = await import('https://deno.land/x/mysql@v2.12.1/mod.ts');
    
    const client = await new mysql.Client().connect({
      hostname: mysqlHost,
      username: mysqlUsername,
      password: mysqlPassword,
      db: mysqlDatabase,
      port: 3306,
    });

    console.log('Connected to MySQL successfully');

    // Fetch categories
    const categoriesResult = await client.query(
      `SELECT id, name, icon_name, display_order FROM categories ORDER BY display_order, id`
    );

    // Fetch active products
    const productsResult = await client.query(
      `SELECT id, category_id, name, description, image_path, image_alt_text, 
              quantity_per_10kg, price_per_10kg, price_per_piece, age_range, display_order
       FROM products 
       WHERE is_active = 1 
       ORDER BY category_id, display_order, id`
    );

    // Fetch all product images
    const imagesResult = await client.query(
      `SELECT id, product_id, image_path, image_alt_text, is_primary, display_order
       FROM product_images
       ORDER BY product_id, is_primary DESC, display_order`
    );

    await client.close();

    // The MySQL client returns results directly
    const categories = Array.isArray(categoriesResult) ? categoriesResult : (categoriesResult.rows || []);
    const products = Array.isArray(productsResult) ? productsResult : (productsResult.rows || []);
    const images = Array.isArray(imagesResult) ? imagesResult : (imagesResult.rows || []);

    // Group images by product_id
    const imagesByProduct = images.reduce((acc: any, img: any) => {
      if (!acc[img.product_id]) {
        acc[img.product_id] = [];
      }
      acc[img.product_id].push(img);
      return acc;
    }, {});

    // Add images array to each product
    const productsWithImages = products.map((product: any) => ({
      ...product,
      images: imagesByProduct[product.id] || []
    }));

    console.log(`Fetched ${categories.length} categories, ${products.length} products, and ${images.length} images`);

    return new Response(
      JSON.stringify({ 
        success: true,
        categories,
        products: productsWithImages
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  } catch (error) {
    console.error('Error fetching bale products:', error);
    return new Response(
      JSON.stringify({ 
        success: false,
        error: error.message 
      }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }
});

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
  description: string;
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

    console.log('Connecting to MySQL database...');

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
      `SELECT id, name, description FROM categories ORDER BY id`
    );
    
    // Fetch products
    const productsResult = await client.query(
      `SELECT id, category_id, name, description, image_path, quantity_per_10kg, 
              price_per_10kg, price_per_piece, age_range 
       FROM products 
       ORDER BY category_id, id`
    );

    await client.close();

    const categories = categoriesResult.rows || [];
    const products = productsResult.rows || [];

    console.log(`Fetched ${categories.length} categories and ${products.length} products`);

    return new Response(
      JSON.stringify({ 
        success: true,
        categories,
        products 
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

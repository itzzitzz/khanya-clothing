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
    // Check authentication
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      throw new Error('No authorization header');
    }

    const token = authHeader.replace('Bearer ', '');
    const { data: { user }, error: authError } = await supabase.auth.getUser(token);

    if (authError || !user) {
      throw new Error('Unauthorized');
    }

    // Check admin role
    const { data: roles } = await supabase
      .from('user_roles')
      .select('role')
      .eq('user_id', user.id)
      .eq('role', 'admin')
      .maybeSingle();

    if (!roles) {
      throw new Error('Admin access required');
    }

    const mysqlHost = Deno.env.get('MYSQL_HOST');
    const mysqlDatabase = Deno.env.get('MYSQL_DATABASE');
    const mysqlUsername = Deno.env.get('MYSQL_USERNAME');
    const mysqlPassword = Deno.env.get('MYSQL_PASSWORD');

    if (!mysqlHost || !mysqlDatabase || !mysqlUsername || !mysqlPassword) {
      throw new Error('Missing database configuration');
    }

    const mysql = await import('https://deno.land/x/mysql@v2.12.1/mod.ts');
    const client = await new mysql.Client().connect({
      hostname: mysqlHost,
      username: mysqlUsername,
      password: mysqlPassword,
      db: mysqlDatabase,
      port: 3306,
    });

    const body = await req.json();
    const { action, id } = body;

    if (action === 'list') {
      // List all products (including inactive)
      const result = await client.query(
        `SELECT id, category_id, name, description, image_path, image_alt_text,
                quantity_per_10kg, price_per_10kg, price_per_piece, age_range, 
                display_order, is_active
         FROM products 
         ORDER BY category_id, display_order, id`
      );
      const products = Array.isArray(result) ? result : (result.rows || []);
      
      await client.close();
      
      return new Response(
        JSON.stringify({ success: true, products }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    if (action === 'create') {
      // Create new product
      const {
        category_id, name, description, image_path, image_alt_text,
        quantity_per_10kg, price_per_10kg, price_per_piece, age_range, display_order
      } = body;

      await client.execute(
        `INSERT INTO products (category_id, name, description, image_path, image_alt_text,
                               quantity_per_10kg, price_per_10kg, price_per_piece, age_range, 
                               display_order, is_active)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 1)`,
        [category_id, name, description, image_path, image_alt_text,
         quantity_per_10kg, price_per_10kg, price_per_piece, age_range, display_order || 0]
      );

      await client.close();

      return new Response(
        JSON.stringify({ success: true, message: 'Product created' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    if (action === 'update') {
      // Update product
      if (!id) throw new Error('Product ID required');
      
      const {
        category_id, name, description, image_path, image_alt_text,
        quantity_per_10kg, price_per_10kg, price_per_piece, age_range, 
        display_order, is_active
      } = body;

      await client.execute(
        `UPDATE products 
         SET category_id = ?, name = ?, description = ?, image_path = ?, image_alt_text = ?,
             quantity_per_10kg = ?, price_per_10kg = ?, price_per_piece = ?, 
             age_range = ?, display_order = ?, is_active = ?
         WHERE id = ?`,
        [category_id, name, description, image_path, image_alt_text,
         quantity_per_10kg, price_per_10kg, price_per_piece, age_range, 
         display_order, is_active ? 1 : 0, id]
      );

      await client.close();

      return new Response(
        JSON.stringify({ success: true, message: 'Product updated' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    if (action === 'delete') {
      // Delete product
      if (!id) throw new Error('Product ID required');

      await client.execute('DELETE FROM products WHERE id = ?', [id]);
      await client.close();

      return new Response(
        JSON.stringify({ success: true, message: 'Product deleted' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    throw new Error('Method not allowed');

  } catch (error) {
    console.error('Error managing products:', error);
    return new Response(
      JSON.stringify({ success: false, error: error.message }),
      {
        status: error.message.includes('Unauthorized') || error.message.includes('Admin') ? 403 : 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }
});
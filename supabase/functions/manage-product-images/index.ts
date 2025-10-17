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
    const { action, product_id, id, image_path, is_primary, display_order } = body;

    if (action === 'list') {
      // List images for a product
      if (!product_id) throw new Error('Product ID required');
      
      const result = await client.query(
        `SELECT id, product_id, image_path, is_primary, display_order
         FROM product_images
         WHERE product_id = ?
         ORDER BY is_primary DESC, display_order`,
        [product_id]
      );
      const images = Array.isArray(result) ? result : (result.rows || []);
      
      await client.close();
      
      return new Response(
        JSON.stringify({ success: true, images }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    if (action === 'create') {
      // Add new image

      await client.execute(
        `INSERT INTO product_images (product_id, image_path, is_primary, display_order)
         VALUES (?, ?, ?, ?)`,
        [product_id, image_path, is_primary ? 1 : 0, display_order || 0]
      );

      await client.close();

      return new Response(
        JSON.stringify({ success: true, message: 'Image added' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    if (action === 'update') {
      // Update image
      if (!id) throw new Error('Image ID required');

      await client.execute(
        `UPDATE product_images 
         SET is_primary = ?, display_order = ?
         WHERE id = ?`,
        [is_primary ? 1 : 0, display_order, id]
      );

      await client.close();

      return new Response(
        JSON.stringify({ success: true, message: 'Image updated' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    if (action === 'delete') {
      // Delete image
      if (!id) throw new Error('Image ID required');

      await client.execute('DELETE FROM product_images WHERE id = ?', [id]);
      await client.close();

      return new Response(
        JSON.stringify({ success: true, message: 'Image deleted' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    throw new Error('Method not allowed');

  } catch (error) {
    console.error('Error managing product images:', error);
    return new Response(
      JSON.stringify({ success: false, error: error.message }),
      {
        status: error.message.includes('Unauthorized') || error.message.includes('Admin') ? 403 : 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }
});
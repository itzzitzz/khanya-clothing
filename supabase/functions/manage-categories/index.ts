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
    const { action, id, name, icon_name, display_order } = body;

    if (action === 'list') {
      // List all categories
      const result = await client.query(
        'SELECT id, name, icon_name, display_order FROM categories ORDER BY display_order, id'
      );
      const categories = Array.isArray(result) ? result : (result.rows || []);
      
      await client.close();
      
      return new Response(
        JSON.stringify({ success: true, categories }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    if (action === 'create') {
      // Create new category

      await client.execute(
        'INSERT INTO categories (name, icon_name, display_order) VALUES (?, ?, ?)',
        [name, icon_name, display_order || 0]
      );

      await client.close();

      return new Response(
        JSON.stringify({ success: true, message: 'Category created' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    if (action === 'update') {
      // Update category
      if (!id) throw new Error('Category ID required');

      await client.execute(
        'UPDATE categories SET name = ?, icon_name = ?, display_order = ? WHERE id = ?',
        [name, icon_name, display_order, id]
      );

      await client.close();

      return new Response(
        JSON.stringify({ success: true, message: 'Category updated' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    if (action === 'delete') {
      // Delete category
      if (!id) throw new Error('Category ID required');

      await client.execute('DELETE FROM categories WHERE id = ?', [id]);
      await client.close();

      return new Response(
        JSON.stringify({ success: true, message: 'Category deleted' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    throw new Error('Method not allowed');

  } catch (error) {
    console.error('Error managing categories:', error);
    return new Response(
      JSON.stringify({ success: false, error: error.message }),
      {
        status: error.message.includes('Unauthorized') || error.message.includes('Admin') ? 403 : 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }
});
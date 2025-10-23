import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.54.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface TrackOrderRequest {
  email: string;
  order_number?: string;
}

const handler = async (req: Request): Promise<Response> => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { email, order_number }: TrackOrderRequest = await req.json();

    if (!email) {
      return new Response(
        JSON.stringify({ error: "Email is required" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Build query
    let query = supabase
      .from("orders")
      .select(`
        *,
        order_items (*)
      `)
      .eq("customer_email", email.toLowerCase())
      .order("created_at", { ascending: false });

    // Filter by order number if provided
    if (order_number) {
      query = query.eq("order_number", order_number);
    }

    const { data: orders, error: fetchError } = await query;

    if (fetchError) {
      console.error("Database error:", fetchError);
      throw fetchError;
    }

    if (!orders || orders.length === 0) {
      return new Response(
        JSON.stringify({ error: "No orders found" }),
        { status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    console.log(`Found ${orders.length} orders for:`, email);

    return new Response(
      JSON.stringify({ success: true, orders }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error: any) {
    console.error("Error in track-order:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
};

serve(handler);

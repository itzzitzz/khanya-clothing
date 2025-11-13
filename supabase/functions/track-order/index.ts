import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.54.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface TrackOrderRequest {
  email?: string;
  phone?: string;
  order_number?: string;
}

const handler = async (req: Request): Promise<Response> => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { email, phone, order_number }: TrackOrderRequest = await req.json();

    if (!email && !phone) {
      return new Response(
        JSON.stringify({ error: "Email or phone number is required" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Normalize phone number if provided - create multiple format variations
    let phoneFormats: string[] = [];
    if (phone) {
      // Remove all non-digits
      const digitsOnly = phone.replace(/\D/g, '');
      
      // Generate all possible formats to search
      if (digitsOnly.startsWith('27')) {
        const nationalNumber = digitsOnly.substring(2);
        phoneFormats = [
          `+${digitsOnly}`,           // +27721731393
          digitsOnly,                  // 27721731393
          `0${nationalNumber}`,        // 0721731393
        ];
      } else if (digitsOnly.startsWith('0')) {
        const nationalNumber = digitsOnly.substring(1);
        phoneFormats = [
          `+27${nationalNumber}`,      // +27721731393
          `27${nationalNumber}`,       // 27721731393
          digitsOnly,                  // 0721731393
        ];
      } else {
        // Assume it's a national number without 0
        phoneFormats = [
          `+27${digitsOnly}`,          // +27721731393
          `27${digitsOnly}`,           // 27721731393
          `0${digitsOnly}`,            // 0721731393
        ];
      }
      
      console.log(`Phone search formats: ${phoneFormats.join(', ')}`);
    }

    // Build query
    let query = supabase
      .from("orders")
      .select(`
        *,
        order_items (*),
        order_status_history (
          id,
          status,
          changed_at,
          notes
        )
      `);

    // Filter by email or phone (with multiple format support)
    if (email) {
      query = query.eq("customer_email", email.toLowerCase());
    } else if (phoneFormats.length > 0) {
      // Search for orders where phone matches any of the formats
      query = query.in("customer_phone", phoneFormats);
    }

    // Filter by order number if provided
    if (order_number) {
      query = query.eq("order_number", order_number);
    }

    query = query.order("created_at", { ascending: false });

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

    console.log(`Found ${orders.length} orders for:`, email || phone);

    // Sort status history chronologically for each order
    orders.forEach(order => {
      if (order.order_status_history) {
        order.order_status_history.sort((a: any, b: any) => 
          new Date(a.changed_at).getTime() - new Date(b.changed_at).getTime()
        );
      }
    });

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

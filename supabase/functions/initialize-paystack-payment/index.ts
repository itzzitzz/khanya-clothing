import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.54.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface InitializePaymentRequest {
  email: string;
  amount: number; // in Rands
  order_number: string;
  callback_url?: string;
}

const handler = async (req: Request): Promise<Response> => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { email, amount, order_number, callback_url }: InitializePaymentRequest = await req.json();
    
    console.log(`Initializing Paystack payment for order ${order_number}, amount R${amount}`);

    if (!email || !amount || !order_number) {
      return new Response(
        JSON.stringify({ error: "Missing required fields: email, amount, order_number" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const paystackSecretKey = Deno.env.get("PAYSTACK_SECRET_KEY");
    if (!paystackSecretKey) {
      console.error("PAYSTACK_SECRET_KEY not configured");
      return new Response(
        JSON.stringify({ error: "Payment service not configured" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Convert Rands to kobo (Paystack uses smallest currency unit)
    const amountInKobo = Math.round(amount * 100);

    // Initialize transaction with Paystack
    const paystackResponse = await fetch("https://api.paystack.co/transaction/initialize", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${paystackSecretKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        email,
        amount: amountInKobo,
        currency: "ZAR",
        reference: order_number,
        callback_url: callback_url || undefined,
        metadata: {
          order_number,
          custom_fields: [
            {
              display_name: "Order Number",
              variable_name: "order_number",
              value: order_number,
            }
          ]
        }
      }),
    });

    const paystackData = await paystackResponse.json();
    console.log("Paystack response:", JSON.stringify(paystackData));

    if (!paystackData.status) {
      console.error("Paystack error:", paystackData.message);
      return new Response(
        JSON.stringify({ error: paystackData.message || "Failed to initialize payment" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    return new Response(
      JSON.stringify({
        success: true,
        authorization_url: paystackData.data.authorization_url,
        access_code: paystackData.data.access_code,
        reference: paystackData.data.reference,
      }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );

  } catch (error: any) {
    console.error("Error in initialize-paystack-payment:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
};

serve(handler);

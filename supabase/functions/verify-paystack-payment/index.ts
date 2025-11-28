import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.54.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface VerifyPaymentRequest {
  reference: string;
  skip_order_update?: boolean; // For card payments where order doesn't exist yet
}

const handler = async (req: Request): Promise<Response> => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { reference, skip_order_update }: VerifyPaymentRequest = await req.json();
    
    console.log(`Verifying Paystack payment for reference: ${reference}, skip_order_update: ${skip_order_update}`);

    if (!reference) {
      return new Response(
        JSON.stringify({ error: "Missing reference" }),
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

    // Verify transaction with Paystack
    const paystackResponse = await fetch(`https://api.paystack.co/transaction/verify/${encodeURIComponent(reference)}`, {
      method: "GET",
      headers: {
        "Authorization": `Bearer ${paystackSecretKey}`,
      },
    });

    const paystackData = await paystackResponse.json();
    console.log("Paystack verification response:", JSON.stringify(paystackData));

    if (!paystackData.status || paystackData.data.status !== "success") {
      console.error("Payment not successful:", paystackData);
      return new Response(
        JSON.stringify({ 
          success: false, 
          payment_verified: false,
          error: paystackData.message || "Payment verification failed",
          status: paystackData.data?.status || "unknown"
        }),
        { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const amountPaid = paystackData.data.amount / 100; // Convert from kobo to Rands

    // If skip_order_update is true, just return the verification result without updating any order
    // (for card payments where order will be created after payment verification)
    if (skip_order_update) {
      console.log(`Payment verified for reference ${reference}, amount: R${amountPaid} - skipping order update`);
      return new Response(
        JSON.stringify({
          success: true,
          payment_verified: true,
          amount: amountPaid,
          reference: reference,
        }),
        { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // For existing orders (legacy flow), update the order in database
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    const orderNumber = paystackData.data.reference;

    // Update order payment status
    const { data: order, error: orderError } = await supabase
      .from("orders")
      .update({
        payment_tracking_status: "Fully Paid",
        amount_paid: amountPaid,
        payment_status: "paid",
      })
      .eq("order_number", orderNumber)
      .select()
      .single();

    if (orderError) {
      console.error("Error updating order:", orderError);
      // Payment was successful but order update failed - log this critical error
      return new Response(
        JSON.stringify({ 
          success: true, 
          payment_verified: true,
          order_updated: false,
          error: "Payment received but order update failed. Please contact support.",
          amount: amountPaid,
          reference: orderNumber,
        }),
        { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    console.log(`Order ${orderNumber} updated - payment confirmed: R${amountPaid}`);

    return new Response(
      JSON.stringify({
        success: true,
        payment_verified: true,
        order_updated: true,
        amount: amountPaid,
        reference: orderNumber,
        order_id: order.id,
      }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );

  } catch (error: any) {
    console.error("Error in verify-paystack-payment:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
};

serve(handler);

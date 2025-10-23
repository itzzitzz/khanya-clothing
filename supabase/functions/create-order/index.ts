import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.54.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface OrderItem {
  product_id: number;
  product_name: string;
  product_image: string;
  quantity: number;
  price_per_unit: number;
}

interface CreateOrderRequest {
  customer_email: string;
  customer_name: string;
  customer_phone: string;
  delivery_address: string;
  delivery_city: string;
  delivery_province: string;
  delivery_postal_code: string;
  payment_method: string;
  items: OrderItem[];
}

const handler = async (req: Request): Promise<Response> => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const orderData: CreateOrderRequest = await req.json();

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Generate order number
    const { data: orderNumberData, error: orderNumberError } = await supabase
      .rpc("generate_order_number");

    if (orderNumberError) {
      console.error("Error generating order number:", orderNumberError);
      throw orderNumberError;
    }

    const orderNumber = orderNumberData as string;

    // Calculate total
    const totalAmount = orderData.items.reduce(
      (sum, item) => sum + item.price_per_unit * item.quantity,
      0
    );

    // Create order
    const { data: order, error: orderError } = await supabase
      .from("orders")
      .insert({
        order_number: orderNumber,
        customer_email: orderData.customer_email.toLowerCase(),
        customer_name: orderData.customer_name,
        customer_phone: orderData.customer_phone,
        delivery_address: orderData.delivery_address,
        delivery_city: orderData.delivery_city,
        delivery_province: orderData.delivery_province,
        delivery_postal_code: orderData.delivery_postal_code,
        payment_method: orderData.payment_method,
        total_amount: totalAmount,
      })
      .select()
      .single();

    if (orderError) {
      console.error("Error creating order:", orderError);
      throw orderError;
    }

    // Create order items
    const orderItems = orderData.items.map((item) => ({
      order_id: order.id,
      product_id: item.product_id,
      product_name: item.product_name,
      product_image: item.product_image,
      quantity: item.quantity,
      price_per_unit: item.price_per_unit,
      subtotal: item.price_per_unit * item.quantity,
    }));

    const { error: itemsError } = await supabase
      .from("order_items")
      .insert(orderItems);

    if (itemsError) {
      console.error("Error creating order items:", itemsError);
      throw itemsError;
    }

    // Send confirmation email
    const resendApiKey = Deno.env.get("RESEND_API_KEY");
    if (resendApiKey) {
      try {
        await fetch("https://api.resend.com/emails", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${resendApiKey}`,
          },
          body: JSON.stringify({
            from: Deno.env.get("FROM_EMAIL") || "onboarding@resend.dev",
            to: [orderData.customer_email],
            subject: `Order Confirmation - ${orderNumber}`,
            html: `
              <h2>Order Confirmation</h2>
              <p>Thank you for your order, ${orderData.customer_name}!</p>
              <p><strong>Order Number:</strong> ${orderNumber}</p>
              <p><strong>Total Amount:</strong> R${totalAmount.toFixed(2)}</p>
              <p><strong>Payment Method:</strong> ${orderData.payment_method.replace(/_/g, " ").toUpperCase()}</p>
              
              ${orderData.payment_method === 'eft' ? `
                <h3>EFT Payment Details</h3>
                <p>Please transfer R${totalAmount.toFixed(2)} to:</p>
                <p><strong>Bank:</strong> First National Bank<br>
                <strong>Account Name:</strong> Your Business Name<br>
                <strong>Account Number:</strong> 1234567890<br>
                <strong>Branch Code:</strong> 250655<br>
                <strong>Reference:</strong> ${orderNumber}</p>
                <p>You will receive an email once payment has been confirmed.</p>
              ` : ''}
              
              ${orderData.payment_method === 'fnb_ewallet' ? `
                <h3>FNB e-Wallet Payment Details</h3>
                <p>Please send R${totalAmount.toFixed(2)} via FNB e-Wallet to:</p>
                <p><strong>Cell Number:</strong> 0821234567<br>
                <strong>Reference:</strong> ${orderNumber}</p>
                <p>You will receive an email once payment has been confirmed.</p>
              ` : ''}
              
              <h3>Delivery Address</h3>
              <p>${orderData.delivery_address}<br>
              ${orderData.delivery_city}, ${orderData.delivery_province}<br>
              ${orderData.delivery_postal_code}</p>
              
              <p>FREE delivery to anywhere in South Africa!</p>
            `,
          }),
        });
      } catch (emailError) {
        console.error("Failed to send confirmation email:", emailError);
        // Don't fail the order creation if email fails
      }
    }

    console.log("Order created successfully:", orderNumber);

    return new Response(
      JSON.stringify({ 
        success: true, 
        order_number: orderNumber,
        order_id: order.id,
        total_amount: totalAmount
      }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error: any) {
    console.error("Error in create-order:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
};

serve(handler);

import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { Resend } from "npm:resend@2.0.0";

const resend = new Resend(Deno.env.get("RESEND_API_KEY"));

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface NotificationRequest {
  type: 'page_visit' | 'add_to_cart' | 'view_cart' | 'proceed_checkout' | 'pin_request' | 'pin_verified';
  bale_name?: string;
  bale_price?: number;
  cart_total?: number;
  cart_count?: number;
  email?: string;
  phone?: string;
  method?: 'email' | 'sms';
}

const handler = async (req: Request): Promise<Response> => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { type, bale_name, bale_price, cart_total, cart_count, email, phone, method }: NotificationRequest = await req.json();

    let subject = "";
    let html = "";

    if (type === "page_visit") {
      subject = "Customer viewing View Order Bales page";
      html = `
        <h2>Page Visit Notification</h2>
        <p>A customer has landed on the /view-order-bales page.</p>
        <p><strong>Time:</strong> ${new Date().toLocaleString('en-ZA', { timeZone: 'Africa/Johannesburg' })}</p>
      `;
    } else if (type === "add_to_cart") {
      subject = "Customer added bale to cart";
      html = `
        <h2>Add to Cart Notification</h2>
        <p>A customer has added a bale to their cart.</p>
        <p><strong>Bale:</strong> ${bale_name}</p>
        <p><strong>Price:</strong> R${bale_price?.toFixed(2)}</p>
        <p><strong>Time:</strong> ${new Date().toLocaleString('en-ZA', { timeZone: 'Africa/Johannesburg' })}</p>
      `;
    } else if (type === "view_cart") {
      subject = "Customer viewing cart";
      html = `
        <h2>View Cart Notification</h2>
        <p>A customer has clicked to view their cart.</p>
        <p><strong>Items in cart:</strong> ${cart_count || 0}</p>
        <p><strong>Cart total:</strong> R${cart_total?.toFixed(2) || '0.00'}</p>
        <p><strong>Time:</strong> ${new Date().toLocaleString('en-ZA', { timeZone: 'Africa/Johannesburg' })}</p>
      `;
    } else if (type === "proceed_checkout") {
      subject = "Customer proceeding to checkout";
      html = `
        <h2>Proceed to Checkout Notification</h2>
        <p>A customer has clicked "Proceed to Checkout".</p>
        <p><strong>Items in cart:</strong> ${cart_count || 0}</p>
        <p><strong>Cart total:</strong> R${cart_total?.toFixed(2) || '0.00'}</p>
        <p><strong>Time:</strong> ${new Date().toLocaleString('en-ZA', { timeZone: 'Africa/Johannesburg' })}</p>
      `;
    } else if (type === "pin_request") {
      subject = "Customer requested verification PIN";
      html = `
        <h2>PIN Request Notification</h2>
        <p>A customer has requested a verification PIN.</p>
        <p><strong>Method:</strong> ${method === 'email' ? 'Email' : 'SMS'}</p>
        <p><strong>Contact:</strong> ${email || phone || 'Unknown'}</p>
        <p><strong>Time:</strong> ${new Date().toLocaleString('en-ZA', { timeZone: 'Africa/Johannesburg' })}</p>
      `;
    } else if (type === "pin_verified") {
      subject = "Customer successfully verified PIN";
      html = `
        <h2>PIN Verified Notification</h2>
        <p>A customer has successfully entered their PIN and logged in.</p>
        <p><strong>Method:</strong> ${method === 'email' ? 'Email' : 'SMS'}</p>
        <p><strong>Contact:</strong> ${email || phone || 'Unknown'}</p>
        <p><strong>Time:</strong> ${new Date().toLocaleString('en-ZA', { timeZone: 'Africa/Johannesburg' })}</p>
      `;
    }

    console.log(`Sending ${type} notification email`);

    const emailResponse = await resend.emails.send({
      from: "Khanya Store <onboarding@resend.dev>",
      to: ["sales@khanya.store"],
      subject: subject,
      html: html,
    });

    console.log("Email sent successfully:", emailResponse);

    return new Response(JSON.stringify({ success: true, emailResponse }), {
      status: 200,
      headers: {
        "Content-Type": "application/json",
        ...corsHeaders,
      },
    });
  } catch (error: any) {
    console.error("Error in send-sales-notification function:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        status: 500,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      }
    );
  }
};

serve(handler);

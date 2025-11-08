import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { Resend } from "npm:resend@2.0.0";

const resend = new Resend(Deno.env.get("RESEND_API_KEY"));

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface NotificationRequest {
  type: 'page_visit' | 'add_to_cart';
  bale_name?: string;
  bale_price?: number;
}

const handler = async (req: Request): Promise<Response> => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { type, bale_name, bale_price }: NotificationRequest = await req.json();

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

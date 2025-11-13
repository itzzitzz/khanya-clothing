import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { Resend } from "npm:resend@2.0.0";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.54.0";

const resend = new Resend(Deno.env.get("RESEND_API_KEY"));
const twilioAccountSid = Deno.env.get("TWILIO_ACCOUNT_SID");
const twilioAuthToken = Deno.env.get("TWILIO_AUTH_TOKEN");
const twilioPhoneNumber = Deno.env.get("TWILIO_PHONE_NUMBER");

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface PaymentReminderRequest {
  order_id: string;
}

const handler = async (req: Request): Promise<Response> => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { order_id }: PaymentReminderRequest = await req.json();

    if (!order_id) {
      throw new Error("order_id is required");
    }

    // Initialize Supabase client
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Fetch order details
    const { data: order, error: orderError } = await supabase
      .from("orders")
      .select("*")
      .eq("id", order_id)
      .single();

    if (orderError || !order) {
      throw new Error("Order not found");
    }

    console.log(`Sending payment reminder for order: ${order.order_number}`);

    const amount = Number(order.total_amount).toFixed(2);
    const reference = order.order_number;

    // Prepare email HTML
    const emailHtml = `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>Payment Reminder - Khanya Clothing Bales</title>
        </head>
        <body style="margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; background-color: #f8f9fa;">
          <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #f8f9fa; padding: 40px 20px;">
            <tr>
              <td align="center">
                <table width="600" cellpadding="0" cellspacing="0" style="background-color: #ffffff; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);">
                  <!-- Header -->
                  <tr>
                    <td style="background: linear-gradient(135deg, #f59e0b 0%, #d97706 100%); padding: 40px 30px; text-align: center;">
                      <h1 style="margin: 0; color: #ffffff; font-size: 28px; font-weight: bold;">
                        🎉 Your Order is Almost Ready!
                      </h1>
                    </td>
                  </tr>
                  
                  <!-- Content -->
                  <tr>
                    <td style="padding: 40px 30px;">
                      <p style="margin: 0 0 20px 0; color: #374151; font-size: 16px; line-height: 1.6;">
                        Hi <strong>${order.customer_name}</strong>,
                      </p>
                      
                      <p style="margin: 0 0 20px 0; color: #374151; font-size: 16px; line-height: 1.6;">
                        Great news! We've got your bales ready to pack and ship. We're just waiting for your payment to clear so we can get them on their way to you! 🚚
                      </p>
                      
                      <div style="background-color: #fef3c7; border-left: 4px solid #f59e0b; padding: 20px; margin: 30px 0; border-radius: 8px;">
                        <h2 style="margin: 0 0 15px 0; color: #92400e; font-size: 20px; font-weight: bold;">
                          Payment Details
                        </h2>
                        <table width="100%" cellpadding="8" cellspacing="0">
                          <tr>
                            <td style="color: #92400e; font-weight: 600; padding: 8px 0;">Order Number:</td>
                            <td style="color: #92400e; font-weight: bold; padding: 8px 0;">${reference}</td>
                          </tr>
                          <tr>
                            <td style="color: #92400e; font-weight: 600; padding: 8px 0;">Amount Due:</td>
                            <td style="color: #92400e; font-weight: bold; font-size: 18px; padding: 8px 0;">R ${amount}</td>
                          </tr>
                        </table>
                      </div>
                      
                      <h3 style="margin: 30px 0 15px 0; color: #1f2937; font-size: 18px; font-weight: bold;">
                        💳 Payment Options:
                      </h3>
                      
                      <div style="background-color: #f3f4f6; padding: 20px; border-radius: 8px; margin-bottom: 20px;">
                        <h4 style="margin: 0 0 12px 0; color: #1f2937; font-size: 16px; font-weight: bold;">
                          Option 1: Bank Transfer (EFT)
                        </h4>
                        <table width="100%" cellpadding="6" cellspacing="0">
                          <tr>
                            <td style="color: #4b5563; font-weight: 600;">Bank:</td>
                            <td style="color: #1f2937; font-weight: 500;">FNB</td>
                          </tr>
                          <tr>
                            <td style="color: #4b5563; font-weight: 600;">Account Name:</td>
                            <td style="color: #1f2937; font-weight: 500;">Khanya Clothing Bales</td>
                          </tr>
                          <tr>
                            <td style="color: #4b5563; font-weight: 600;">Account Number:</td>
                            <td style="color: #1f2937; font-weight: 500;">62XXXXXXXXXX</td>
                          </tr>
                          <tr>
                            <td style="color: #4b5563; font-weight: 600;">Branch Code:</td>
                            <td style="color: #1f2937; font-weight: 500;">250655</td>
                          </tr>
                          <tr>
                            <td style="color: #4b5563; font-weight: 600;">Reference:</td>
                            <td style="color: #dc2626; font-weight: bold;">${reference}</td>
                          </tr>
                        </table>
                      </div>
                      
                      <div style="background-color: #f3f4f6; padding: 20px; border-radius: 8px; margin-bottom: 20px;">
                        <h4 style="margin: 0 0 12px 0; color: #1f2937; font-size: 16px; font-weight: bold;">
                          Option 2: FNB E-Wallet
                        </h4>
                        <table width="100%" cellpadding="6" cellspacing="0">
                          <tr>
                            <td style="color: #4b5563; font-weight: 600;">Cellphone Number:</td>
                            <td style="color: #1f2937; font-weight: bold; font-size: 16px;">083 305 4532</td>
                          </tr>
                          <tr>
                            <td style="color: #4b5563; font-weight: 600;">Reference:</td>
                            <td style="color: #dc2626; font-weight: bold;">${reference}</td>
                          </tr>
                        </table>
                      </div>
                      
                      <div style="background-color: #dcfce7; border-left: 4px solid #16a34a; padding: 20px; margin: 30px 0; border-radius: 8px;">
                        <p style="margin: 0; color: #166534; font-size: 15px; line-height: 1.6;">
                          <strong>📦 What happens next?</strong><br>
                          Once your payment clears, we'll immediately pack your bales and arrange FREE delivery to your address or your nearest PAXI location (PEP store). You'll receive tracking details as soon as your order is dispatched!
                        </p>
                      </div>
                      
                      <p style="margin: 20px 0 0 0; color: #374151; font-size: 16px; line-height: 1.6;">
                        Got questions? Just reply to this email or give us a call. We're here to help!
                      </p>
                      
                      <p style="margin: 20px 0 0 0; color: #374151; font-size: 16px; line-height: 1.6;">
                        Exciting times ahead for your business! 🎊
                      </p>
                      
                      <p style="margin: 20px 0 0 0; color: #374151; font-size: 16px; line-height: 1.6;">
                        <strong>Team Khanya</strong><br>
                        <span style="color: #6b7280; font-size: 14px;">Quality Clothing Bales for Your Success</span>
                      </p>
                    </td>
                  </tr>
                  
                  <!-- Footer -->
                  <tr>
                    <td style="background-color: #f9fafb; padding: 30px; text-align: center; border-top: 1px solid #e5e7eb;">
                      <p style="margin: 0; color: #6b7280; font-size: 14px;">
                        This is an automated reminder for order <strong>${reference}</strong>
                      </p>
                    </td>
                  </tr>
                </table>
              </td>
            </tr>
          </table>
        </body>
      </html>
    `;

    // Send email
    const emailResponse = await resend.emails.send({
      from: "Khanya Clothing Bales <onboarding@resend.dev>",
      to: [order.customer_email],
      subject: `Payment Reminder - Order ${reference} Ready to Ship! 🎉`,
      html: emailHtml,
    });

    console.log("Payment reminder email sent:", emailResponse);

    // Send SMS
    const smsBody = `Hi ${order.customer_name}! Your bales are ready to ship! 🎉 Please complete payment of R${amount} for order ${reference}. EFT: FNB 62XXXXXXXXXX (Ref: ${reference}) OR FNB E-Wallet: 083 305 4532 (Ref: ${reference}). FREE delivery once paid! - Khanya Clothing`;

    const smsResponse = await fetch(
      `https://api.twilio.com/2010-04-01/Accounts/${twilioAccountSid}/Messages.json`,
      {
        method: "POST",
        headers: {
          "Authorization": "Basic " + btoa(`${twilioAccountSid}:${twilioAuthToken}`),
          "Content-Type": "application/x-www-form-urlencoded",
        },
        body: new URLSearchParams({
          To: order.customer_phone,
          From: twilioPhoneNumber!,
          Body: smsBody,
        }),
      }
    );

    if (!smsResponse.ok) {
      const smsError = await smsResponse.text();
      console.error("SMS sending failed:", smsError);
    } else {
      console.log("Payment reminder SMS sent successfully");
    }

    return new Response(
      JSON.stringify({ 
        success: true, 
        message: "Payment reminder sent successfully",
        email_sent: !!emailResponse,
        sms_sent: smsResponse.ok
      }),
      {
        status: 200,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      }
    );
  } catch (error: any) {
    console.error("Error in send-payment-reminder function:", error);
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

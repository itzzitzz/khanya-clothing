import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.54.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface SendNoteRequest {
  order_id: string;
  note: string;
}

// Branded email template with Khanya logo (hosted on primary domain for reliability)
const LOGO_URL = "https://khanya.store/khanya-logo.png";

function getEmailTemplate(content: string): string {
  return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
    </head>
    <body style="margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; background-color: #f5f5f0;">
      <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #f5f5f0; padding: 40px 20px;">
        <tr>
          <td align="center">
            <table width="600" cellpadding="0" cellspacing="0" style="background-color: #ffffff; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);">
              <!-- Logo Header -->
              <tr>
                <td style="background: linear-gradient(135deg, #2E4D38 0%, #1a3a24 100%); padding: 30px; text-align: center;">
                  <img src="${LOGO_URL}" alt="Khanya" width="180" style="display: block; margin: 0 auto;" />
                </td>
              </tr>
              
              <!-- Content -->
              ${content}
              
              <!-- Footer -->
              <tr>
                <td style="background: linear-gradient(135deg, #D6A220 0%, #b8891a 100%); padding: 25px; text-align: center;">
                  <p style="margin: 0 0 10px 0; color: #ffffff; font-size: 14px; font-weight: 600;">
                    Quality Clothing Bales for Your Success
                  </p>
                  <p style="margin: 0; color: rgba(255,255,255,0.9); font-size: 12px;">
                    Questions? Contact us at <a href="mailto:sales@khanya.store" style="color: #ffffff; text-decoration: underline;">sales@khanya.store</a>
                  </p>
                </td>
              </tr>
              <tr>
                <td style="background-color: #2E4D38; padding: 15px; text-align: center;">
                  <p style="margin: 0; color: rgba(255,255,255,0.7); font-size: 11px;">
                    © ${new Date().getFullYear()} Khanya. All rights reserved.
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
}

const handler = async (req: Request): Promise<Response> => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { order_id, note }: SendNoteRequest = await req.json();

    if (!order_id || !note) {
      return new Response(
        JSON.stringify({ error: "Order ID and note are required" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Get order details
    const { data: order, error: fetchError } = await supabase
      .from("orders")
      .select("*")
      .eq("id", order_id)
      .single();

    if (fetchError || !order) {
      console.error("Order not found:", fetchError);
      throw new Error("Order not found");
    }

    // Log note to order status history
    const { error: historyError } = await supabase
      .from("order_status_history")
      .insert({
        order_id: order_id,
        status: "note",
        notes: note,
        changed_at: new Date().toISOString()
      });

    if (historyError) {
      console.error("Error logging note to history:", historyError);
    }

    let emailSent = false;
    let smsSent = false;

    // Send email with note
    const resendApiKey = Deno.env.get("RESEND_API_KEY");
    if (resendApiKey) {
      try {
        const emailContent = `
          <tr>
            <td style="padding: 40px 30px;">
              <h1 style="margin: 0 0 20px 0; color: #2E4D38; font-size: 24px; text-align: center;">📝 Order Update</h1>
              
              <p style="margin: 0 0 20px 0; color: #333; font-size: 16px; line-height: 1.6;">
                Hello <strong>${order.customer_name}</strong>,
              </p>
              
              <p style="margin: 0 0 20px 0; color: #333; font-size: 16px; line-height: 1.6;">
                We have an update regarding your order:
              </p>
              
              <div style="background: #f5f5f0; border-radius: 8px; padding: 15px; margin: 20px 0; text-align: center;">
                <p style="margin: 0; color: #666; font-size: 14px;">Order Number</p>
                <p style="margin: 5px 0 0 0; color: #D6A220; font-size: 20px; font-weight: bold;">${order.order_number}</p>
              </div>
              
              <div style="background: linear-gradient(135deg, #e8f4fd 0%, #d1e9fc 100%); border-left: 4px solid #2E4D38; padding: 20px; margin: 25px 0; border-radius: 0 8px 8px 0;">
                <p style="margin: 0 0 10px 0; color: #2E4D38; font-size: 14px; font-weight: 600;">Message from Khanya:</p>
                <p style="margin: 0; color: #333; font-size: 16px; line-height: 1.6; white-space: pre-wrap;">${note}</p>
              </div>
              
              <p style="margin: 20px 0 0 0; color: #333; font-size: 16px; line-height: 1.6;">
                If you have any questions, please don't hesitate to contact us.
              </p>
            </td>
          </tr>
        `;

        const htmlBody = getEmailTemplate(emailContent);

        const emailResponse = await fetch("https://api.resend.com/emails", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${resendApiKey}`,
          },
          body: JSON.stringify({
            from: "Khanya <noreply@mail.khanya.store>",
            to: [order.customer_email],
            subject: `Order Update - ${order.order_number}`,
            html: htmlBody,
          }),
        });

        if (emailResponse.ok) {
          console.log("Note email sent successfully");
          emailSent = true;
        } else {
          const emailError = await emailResponse.text();
          console.error("Email send error:", emailError);
        }
      } catch (emailError) {
        console.error("Failed to send email:", emailError);
      }
    }

    // Send SMS with note
    try {
      const winsmsApiKey = Deno.env.get("WINSMS_API_KEY");
      
      if (winsmsApiKey) {
        // Format phone number for WinSMS (27XXXXXXXXX format)
        let formattedPhone = order.customer_phone.replace(/[\s\-\+\(\)]/g, '');
        if (formattedPhone.startsWith('0')) {
          formattedPhone = '27' + formattedPhone.substring(1);
        } else if (!formattedPhone.startsWith('27')) {
          formattedPhone = '27' + formattedPhone;
        }

        // SMS message with branding prefix (max 160 chars total, 20 for branding, 140 for note)
        const smsMessage = `Khanya: ${note}`;
        
        const requestBody = {
          message: smsMessage,
          recipients: [
            {
              mobileNumber: formattedPhone
            }
          ]
        };

        console.log("Sending SMS via WinSMS to:", formattedPhone);
        
        const smsResponse = await fetch("https://api.winsms.co.za/api/rest/v1/sms/outgoing/send", {
          method: "POST",
          headers: {
            "Accept": "application/json",
            "Content-Type": "application/json",
            "AUTHORIZATION": winsmsApiKey
          },
          body: JSON.stringify(requestBody)
        });
        
        const smsResponseData = await smsResponse.json();
        
        if (smsResponse.ok) {
          console.log("SMS sent successfully:", smsResponseData);
          smsSent = true;
        } else {
          console.error("WinSMS error:", smsResponseData);
        }
      }
    } catch (smsError) {
      console.error("Failed to send SMS:", smsError);
    }

    console.log("Order note sent:", order_id, "Email:", emailSent, "SMS:", smsSent);

    return new Response(
      JSON.stringify({ success: true, emailSent, smsSent }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error: any) {
    console.error("Error in send-order-note:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
};

serve(handler);

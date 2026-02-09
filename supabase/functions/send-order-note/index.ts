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
        const baseStyles = `
          <style>
            body { font-family: Inter, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, Cantarell, 'Fira Sans', 'Droid Sans', 'Helvetica Neue', Arial, sans-serif; line-height: 1.6; color: #1f2e27; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; background: #faf9f6; }
            .header { background: linear-gradient(135deg, #2E4D38 0%, #234130 100%); color: white; padding: 30px 20px; text-align: center; border-radius: 8px 8px 0 0; }
            .content { background: #ffffff; padding: 30px 20px; border: 1px solid #d9ded6; border-top: none; }
            .order-number { font-size: 18px; font-weight: bold; color: #D6A220; margin: 10px 0; }
            .note-box { background: #e8f4fd; border-left: 4px solid #2196F3; padding: 15px; margin: 20px 0; border-radius: 4px; }
            .footer { text-align: center; color: #6b7b73; font-size: 12px; margin-top: 30px; padding: 20px; border-top: 1px solid #d9ded6; }
          </style>
        `;

        const htmlBody = `
          ${baseStyles}
          <div class="container">
            <div class="header">
              <h1 style="margin: 0; font-size: 28px;">📝 Order Update</h1>
            </div>
            <div class="content">
              <p>Hello ${order.customer_name},</p>
              <p>We have an update regarding your order:</p>
              <div class="order-number">Order Number: ${order.order_number}</div>
              <div class="note-box">
                <strong>Message from Khanya:</strong>
                <p style="margin: 10px 0 0 0; white-space: pre-wrap;">${note}</p>
              </div>
              <p>If you have any questions, please don't hesitate to contact us.</p>
            </div>
            <div class="footer">
              <p>Questions? Contact us at <a href="mailto:sales@khanya.store">sales@khanya.store</a></p>
              <p>© ${new Date().getFullYear()} Khanya. All rights reserved.</p>
            </div>
          </div>
        `;

        const emailResponse = await fetch("https://api.resend.com/emails", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${resendApiKey}`,
          },
          body: JSON.stringify({
            from: "Khanya <sales@khanya.store>",
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

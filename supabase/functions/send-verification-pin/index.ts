import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.54.0";
import { Resend } from "npm:resend@2.0.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface VerificationRequest {
  email?: string;
  phone?: string;
  method: 'email' | 'sms';
}

// Branded email template with Khanya logo
const LOGO_URL = "https://khanya-resell-africa.lovable.app/email-assets/khanya-logo.png?v=1";

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
    const { email, phone, method }: VerificationRequest = await req.json();

    if (method === 'email' && (!email || !email.includes("@"))) {
      return new Response(
        JSON.stringify({ error: "Invalid email address" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    if (method === 'sms' && !phone) {
      return new Response(
        JSON.stringify({ error: "Phone number is required for SMS verification" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Generate 6-digit PIN
    const pinCode = Math.floor(100000 + Math.random() * 900000).toString();
    
    // Set expiration to 10 minutes from now
    const expiresAt = new Date();
    expiresAt.setMinutes(expiresAt.getMinutes() + 10);

    // Create Supabase client
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Store PIN in database
    const { error: dbError } = await supabase
      .from("email_verifications")
      .insert({
        email: email ? email.toLowerCase() : null,
        phone: phone || null,
        pin_code: pinCode,
        expires_at: expiresAt.toISOString(),
        verified: false,
      });

    if (dbError) {
      console.error("Database error:", dbError);
      throw dbError;
    }

    if (method === 'email') {
      // Send email verification
      const resendApiKey = Deno.env.get("RESEND_API_KEY");
      if (!resendApiKey) {
        throw new Error("Missing RESEND_API_KEY");
      }

      const resend = new Resend(resendApiKey);
      const subject = `${pinCode} - Your Verification PIN - Khanya`;
      
      const emailContent = `
        <tr>
          <td style="padding: 40px 30px; text-align: center;">
            <h1 style="margin: 0 0 20px 0; color: #2E4D38; font-size: 24px;">🔐 Verification Code</h1>
            
            <p style="margin: 0 0 30px 0; color: #333; font-size: 16px; line-height: 1.6;">
              Enter this PIN to verify your email address:
            </p>
            
            <div style="background: linear-gradient(135deg, #f5f5f0 0%, #e8e8e0 100%); border-radius: 12px; padding: 30px; margin: 0 auto 30px; max-width: 250px; border: 2px solid #D6A220;">
              <p style="margin: 0; font-size: 36px; letter-spacing: 8px; color: #2E4D38; font-weight: bold;">${pinCode}</p>
            </div>
            
            <p style="margin: 0 0 10px 0; color: #666; font-size: 14px;">
              This PIN will expire in <strong>10 minutes</strong>.
            </p>
            
            <p style="margin: 20px 0 0 0; color: #999; font-size: 13px;">
              If you didn't request this, please ignore this email.
            </p>
          </td>
        </tr>
      `;

      const htmlBody = getEmailTemplate(emailContent);

      const emailResponse = await resend.emails.send({
        from: "Khanya <noreply@mail.khanya.store>",
        to: [email!],
        subject,
        html: htmlBody,
      });

      console.log("Email sent successfully:", emailResponse);
      console.log("PIN sent to email:", email);
    } else {
      // Send SMS verification via WinSMS JSON API
      const winsmsApiKey = Deno.env.get("WINSMS_API_KEY");
      const winsmsUsername = Deno.env.get("WINSMS_USERNAME");

      console.log("WinSMS credentials check:", {
        hasApiKey: !!winsmsApiKey,
        hasUsername: !!winsmsUsername
      });

      if (!winsmsApiKey || !winsmsUsername) {
        throw new Error("Missing WinSMS credentials");
      }

      // Validate and format phone number for WinSMS
      let formattedPhone = phone!.replace(/[\s\-\+\(\)]/g, '');
      
      // Ensure it's a valid South African number
      if (formattedPhone.startsWith('0')) {
        formattedPhone = '27' + formattedPhone.substring(1);
      } else if (!formattedPhone.startsWith('27')) {
        formattedPhone = '27' + formattedPhone;
      }

      // Validate phone number length (SA numbers should be 11 digits with country code)
      if (formattedPhone.length !== 11) {
        console.error("Invalid phone number length:", formattedPhone);
        throw new Error(`Invalid phone number format. Expected 11 digits, got ${formattedPhone.length}`);
      }

      const message = `Khanya code: ${pinCode}. Expires in 10 min.`;

      console.log("Sending SMS via WinSMS JSON API:", {
        phone: formattedPhone,
        messageLength: message.length
      });

      // Use WinSMS JSON API with correct endpoint and header format
      const requestBody = {
        message: message,
        recipients: [
          {
            mobileNumber: formattedPhone
          }
        ]
      };

      const response = await fetch("https://api.winsms.co.za/api/rest/v1/sms/outgoing/send", {
        method: "POST",
        headers: {
          "Accept": "application/json",
          "Content-Type": "application/json",
          "AUTHORIZATION": winsmsApiKey
        },
        body: JSON.stringify(requestBody)
      });

      const responseData = await response.json();
      console.log("WinSMS API Response:", {
        status: response.status,
        statusText: response.statusText,
        body: responseData
      });

      if (!response.ok) {
        throw new Error(`WinSMS API error: ${responseData.message || JSON.stringify(responseData)}`);
      }

      console.log("SMS sent successfully via WinSMS");
      console.log("PIN sent to phone:", phone);
    }

    console.log("PIN sent successfully to:", email || phone);

    // Send notification to sales team
    try {
      await fetch(`${supabaseUrl}/functions/v1/send-sales-notification`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${supabaseKey}`,
        },
        body: JSON.stringify({
          type: 'pin_request',
          email: email || null,
          phone: phone || null,
          method: method
        })
      });
    } catch (notifError) {
      console.error('Error sending sales notification:', notifError);
      // Don't fail the request if notification fails
    }

    return new Response(
      JSON.stringify({ 
        success: true, 
        message: method === 'email' ? "PIN sent to your email" : "PIN sent to your phone"
      }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error: any) {
    console.error("Error in send-verification-pin:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
};

serve(handler);

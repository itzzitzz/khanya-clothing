import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.54.0";
import { Resend } from "npm:resend@2.0.0";
// Using SMTP relay instead of Resend direct

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface VerificationRequest {
  email?: string;
  phone?: string;
  method: 'email' | 'sms';
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
      
      const htmlBody = `
        <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, Cantarell, 'Fira Sans', 'Droid Sans', 'Helvetica Neue', Arial, sans-serif; line-height: 1.6; color: #222;">
          <h2 style="margin: 0 0 16px;">Email Verification</h2>
          <p>Your verification PIN is:</p>
          <div style="background: #f5f5f5; border-radius: 8px; padding: 20px; text-align: center; margin: 20px 0;">
            <h1 style="font-size: 32px; letter-spacing: 8px; color: #000; margin: 0;">${pinCode}</h1>
          </div>
          <p>This PIN will expire in 10 minutes.</p>
          <p style="color: #666; font-size: 14px;">If you didn't request this, please ignore this email.</p>
          <hr style="border: none; border-top: 1px solid #ddd; margin: 20px 0;" />
          <p style="font-size: 13px; color: #888;">Khanya - Quality secondhand clothing bales</p>
        </div>
      `;

      const emailResponse = await resend.emails.send({
        from: "Khanya <noreply@mail.khanya.store>",
        to: [email!],
        subject,
        html: htmlBody,
      });

      console.log("Email sent successfully:", emailResponse);
      console.log("PIN sent to email:", email);
    } else {
      // Send SMS verification via WinSMS
      const winsmsApiKey = Deno.env.get("WINSMS_API_KEY");
      const winsmsUsername = Deno.env.get("WINSMS_USERNAME");

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

      const message = `Your Khanya verification code is: ${pinCode}. This code expires in 10 minutes.`;

      console.log("WinSMS Request - Username:", winsmsUsername, "Phone:", formattedPhone);

      // Use correct WinSMS API endpoint (api.winsms.co.za not www.winsms.co.za)
      const winsmsUrl = `https://api.winsms.co.za/api/batchmessage.asp?user=${encodeURIComponent(winsmsUsername)}&password=${encodeURIComponent(winsmsApiKey)}&message=${encodeURIComponent(message)}&numbers=${formattedPhone}`;

      const response = await fetch(winsmsUrl, {
        method: "GET",
      });

      const responseText = await response.text();
      console.log("WinSMS Full Response:", {
        status: response.status,
        statusText: response.statusText,
        body: responseText
      });

      // Parse WinSMS response - format is "number=status&" or "FAIL&"
      if (responseText.startsWith('FAIL&')) {
        throw new Error('Invalid WinSMS credentials');
      }

      // Check if the response contains an error for the number
      const responseParts = responseText.split('&');
      const numberResponse = responseParts[0]; // e.g., "27828521112=374" or "27828521112=INSUFFICIENT CREDITS"
      
      if (numberResponse && numberResponse.includes('=')) {
        const [, status] = numberResponse.split('=');
        
        if (status !== undefined && isNaN(Number(status))) {
          // Status is not a number, it's an error message
          throw new Error(`WinSMS error: ${status}`);
        }
        
        console.log("SMS sent successfully via WinSMS. Message ID:", status);
      }

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

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
      // Send SMS verification via Twilio
      const accountSid = Deno.env.get("TWILIO_ACCOUNT_SID");
      const authToken = Deno.env.get("TWILIO_AUTH_TOKEN");
      const twilioPhone = Deno.env.get("TWILIO_PHONE_NUMBER");

      if (!accountSid || !authToken || !twilioPhone) {
        throw new Error("Missing Twilio credentials");
      }

      const message = `Your Khanya verification code is: ${pinCode}. This code expires in 10 minutes.`;

      const response = await fetch(
        `https://api.twilio.com/2010-04-01/Accounts/${accountSid}/Messages.json`,
        {
          method: "POST",
          headers: {
            "Authorization": `Basic ${btoa(`${accountSid}:${authToken}`)}`,
            "Content-Type": "application/x-www-form-urlencoded",
          },
          body: new URLSearchParams({
            To: phone!,
            From: twilioPhone,
            Body: message,
          }),
        }
      );

      if (!response.ok) {
        const error = await response.text();
        console.error("Twilio error:", error);
        throw new Error(`Failed to send SMS: ${error}`);
      }

      const smsResponse = await response.json();
      console.log("SMS sent successfully:", smsResponse);
      console.log("PIN sent to phone:", phone);
    }

    console.log("PIN sent successfully to:", email || phone);

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

import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { Resend } from "npm:resend@2.0.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface ContactFormData {
  name: string;
  phone: string;
  email: string;
  note: string;
}

const handler = async (req: Request): Promise<Response> => {
  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { name, phone, email, note }: ContactFormData = await req.json();

    const resendApiKey = Deno.env.get("RESEND_API_KEY");
    if (!resendApiKey) {
      throw new Error("Missing RESEND_API_KEY");
    }

    const resend = new Resend(resendApiKey);
    const subject = "New Khanya website enquiry";

    const textBody = `
Name: ${name}
Phone: ${phone}
Email: ${email}
Message: ${note}

---
This enquiry was submitted via the Khanya website contact form.
    `.trim();

    const htmlBody = `
      <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, Cantarell, 'Fira Sans', 'Droid Sans', 'Helvetica Neue', Arial, sans-serif; line-height: 1.6; color: #222;">
        <h2 style="margin: 0 0 12px;">New Khanya website enquiry</h2>
        <table cellpadding="6" cellspacing="0" style="border-collapse: collapse;">
          <tr><td style="vertical-align: top;"><strong>Name</strong></td><td>${name}</td></tr>
          <tr><td style="vertical-align: top;"><strong>Phone</strong></td><td>${phone}</td></tr>
          <tr><td style="vertical-align: top;"><strong>Email</strong></td><td>${email}</td></tr>
          <tr><td style="vertical-align: top;"><strong>Message</strong></td><td style="white-space: pre-wrap;">${note}</td></tr>
        </table>
        <p style="margin-top:16px; font-size: 13px; color: #666;">This enquiry was submitted via the Khanya website contact form.</p>
      </div>
    `;

    const fromAddress = "Khanya <noreply@mail.khanya.store>";
    const toAddress = ["sales@khanya.store"];

    const emailResponse = await resend.emails.send({
      from: fromAddress,
      to: toAddress,
      subject,
      html: htmlBody,
      reply_to: email,
    });

    console.log("Email sent successfully:", emailResponse);

    return new Response(
      JSON.stringify({ success: true, message: "Email sent successfully" }),
      {
        status: 200,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      }
    );
  } catch (error: any) {
    console.error("Error in send-contact-email function:", error);
    return new Response(
      JSON.stringify({ success: false, error: error.message }),
      {
        status: 500,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      }
    );
  }
};

serve(handler);

import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.54.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface Recipient {
  email: string;
  name: string;
}

interface SendCampaignRequest {
  campaign_id: string;
  recipients: Recipient[];
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

function generateThankYouEmailHTML(customerName: string): string {
  const emailContent = `
    <tr>
      <td style="padding: 40px 30px;">
        <h1 style="margin: 0 0 25px 0; color: #2E4D38; font-size: 26px; text-align: center;">Thank You! 💚</h1>
        
        <p style="margin: 0 0 20px 0; color: #333; font-size: 16px; line-height: 1.7;">
          Hello <strong>${customerName}</strong>,
        </p>
        
        <p style="margin: 0 0 20px 0; color: #333; font-size: 16px; line-height: 1.7;">
          We wanted to take a moment to say <strong>thank you</strong> for choosing Khanya for your clothing bale purchases. Your support means the world to us!
        </p>
        
        <p style="margin: 0 0 20px 0; color: #333; font-size: 16px; line-height: 1.7;">
          We truly appreciate your business and hope that our products have helped you grow your reselling venture. At Khanya, we're committed to providing quality bales at great prices, and your trust in us makes it all worthwhile.
        </p>
        
        <p style="margin: 0 0 25px 0; color: #333; font-size: 16px; line-height: 1.7;">
          If you've had a positive experience with us, we'd be incredibly grateful if you could share it with others. Your feedback helps other entrepreneurs find us and helps us improve!
        </p>
        
        <!-- Review CTA Box -->
        <div style="background: linear-gradient(135deg, #fef9e7 0%, #fff7ed 100%); border: 2px solid #D6A220; border-radius: 12px; padding: 25px; margin: 30px 0; text-align: center;">
          <p style="margin: 0 0 10px 0; font-size: 24px;">⭐⭐⭐⭐⭐</p>
          <p style="margin: 0 0 5px 0; font-size: 18px; font-weight: bold; color: #2E4D38;">Enjoyed your experience?</p>
          <p style="margin: 0 0 20px 0; font-size: 14px; color: #666;">Your feedback helps other customers find us!</p>
          <a href="https://www.google.com/search?hl=en-ZA&gl=za&q=Khanya+Clothing+Store,+0A+Jubie+Rd,+Barbeque+Downs,+Midrand,+1684&ludocid=12962748148169130712&lsig=AB86z5XBdMcvSXdinNFyJ3lib1lJ#lrd=0x1e95717a6f700c7d:0xb3e4eec2dc7942d8,3" target="_blank" style="display: inline-block; background: linear-gradient(135deg, #D6A220 0%, #b8891a 100%); color: white; padding: 14px 28px; text-decoration: none; border-radius: 8px; font-weight: 600; font-size: 16px;">Leave a Google Review</a>
          <p style="margin: 15px 0 0 0; font-size: 12px; color: #888;">It only takes a minute and means the world to us! 🙏</p>
        </div>
        
        <p style="margin: 0 0 20px 0; color: #333; font-size: 16px; line-height: 1.7;">
          Ready to stock up again? Visit our store at <a href="https://khanya.store" style="color: #2E4D38; font-weight: bold; text-decoration: none;">khanya.store</a> to see our latest bales!
        </p>
        
        <p style="margin: 0 0 25px 0; color: #333; font-size: 16px; line-height: 1.7;">
          Thank you once again for being part of the Khanya family. We look forward to serving you again soon!
        </p>
        
        <p style="margin: 30px 0 0 0; color: #333; font-size: 16px;">
          Warm regards,<br>
          <strong style="color: #2E4D38;">The Khanya Team</strong>
        </p>
      </td>
    </tr>
  `;

  return getEmailTemplate(emailContent);
}

const handler = async (req: Request): Promise<Response> => {
  console.log("send-marketing-campaign function called");
  
  // Handle CORS preflight
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const resendApiKey = Deno.env.get("RESEND_API_KEY");

    if (!resendApiKey) {
      console.error("RESEND_API_KEY not configured");
      throw new Error("Email service not configured");
    }

    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    const { campaign_id, recipients }: SendCampaignRequest = await req.json();

    if (!campaign_id || !recipients || recipients.length === 0) {
      throw new Error("campaign_id and recipients are required");
    }

    console.log(`Processing campaign ${campaign_id} for ${recipients.length} recipients`);

    // Get campaign details
    const { data: campaign, error: campaignError } = await supabase
      .from("marketing_campaigns")
      .select("*")
      .eq("id", campaign_id)
      .single();

    if (campaignError || !campaign) {
      console.error("Campaign not found:", campaignError);
      throw new Error("Campaign not found");
    }

    console.log(`Campaign found: ${campaign.name}`);

    const successfulSends: string[] = [];
    const failedSends: string[] = [];

    // Send emails to each recipient
    for (const recipient of recipients) {
      try {
        console.log(`Sending email to ${recipient.email}`);
        
        const emailResponse = await fetch("https://api.resend.com/emails", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${resendApiKey}`,
          },
          body: JSON.stringify({
            from: "Khanya <noreply@mail.khanya.store>",
            to: [recipient.email],
            subject: "Thank You for Choosing Khanya! 💚",
            html: generateThankYouEmailHTML(recipient.name),
          }),
        });

        if (!emailResponse.ok) {
          const errorText = await emailResponse.text();
          console.error(`Failed to send email to ${recipient.email}:`, errorText);
          failedSends.push(recipient.email);
          continue;
        }

        console.log(`Email sent successfully to ${recipient.email}`);

        // Record the send in the database
        const { error: insertError } = await supabase
          .from("campaign_sends")
          .insert({
            campaign_id: campaign_id,
            customer_email: recipient.email,
            customer_name: recipient.name,
          });

        if (insertError) {
          console.error(`Failed to record send for ${recipient.email}:`, insertError);
          // Email was sent but record failed - still count as success
        }

        successfulSends.push(recipient.email);
      } catch (emailError) {
        console.error(`Error sending to ${recipient.email}:`, emailError);
        failedSends.push(recipient.email);
      }
    }

    console.log(`Campaign completed: ${successfulSends.length} sent, ${failedSends.length} failed`);

    return new Response(
      JSON.stringify({
        success: true,
        sent: successfulSends.length,
        failed: failedSends.length,
        failedEmails: failedSends,
      }),
      {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  } catch (error: any) {
    console.error("Error in send-marketing-campaign:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
};

serve(handler);

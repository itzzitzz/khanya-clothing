import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { Resend } from "npm:resend@2.0.0";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.54.0";

const resend = new Resend(Deno.env.get("RESEND_API_KEY"));
const winsmsApiKey = Deno.env.get("WINSMS_API_KEY");
const winsmsUsername = Deno.env.get("WINSMS_USERNAME");

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface PaymentReminderRequest {
  order_id: string;
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

// Normalize South African phone numbers to E.164 (+27...)
function normalizeZaPhone(phone: string): string {
  const raw = String(phone || '').trim().replace(/[^0-9+]/g, '');
  if (!raw) return raw;
  if (raw.startsWith('+')) return raw;
  if (raw.startsWith('27')) return `+${raw}`;
  if (raw.startsWith('0')) return `+27${raw.slice(1)}`;
  if (/^\d{9,10}$/.test(raw)) {
    return `+27${raw.replace(/^0/, '')}`;
  }
  return raw;
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

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    const { data: order, error: orderError } = await supabase
      .from("orders")
      .select("*")
      .eq("id", order_id)
      .single();

    if (orderError || !order) {
      throw new Error("Order not found");
    }

    console.log(`Sending payment reminder for order: ${order.order_number}`);

    const customerEmail = (order.customer_email || '').trim();
    const hasValidEmail = customerEmail && customerEmail.includes('@') && customerEmail.includes('.');

    const totalAmount = Number(order.total_amount);
    const amountPaid = Number(order.amount_paid || 0);
    const amountOwing = totalAmount - amountPaid;
    const paymentStatus = order.payment_tracking_status || 'Awaiting payment';
    const orderStatus = order.order_status || 'new_order';
    const reference = order.order_number;

    const getOrderStatusMessage = () => {
      switch (orderStatus) {
        case 'new_order': return 'Your order is confirmed and ready to be packed';
        case 'packing': return 'Great news! Your order is currently being packed';
        case 'shipped': return 'Exciting! Your order has been shipped and is on its way';
        case 'delivered': return 'Your order has been delivered';
        default: return 'Your order is being processed';
      }
    };

    const getPaymentMessage = () => {
      if (paymentStatus === 'Fully Paid') {
        return 'Thank you! Your payment has been received in full.';
      } else if (paymentStatus === 'Partially Paid') {
        return `We've received R${amountPaid.toFixed(2)} of your payment. There's still R${amountOwing.toFixed(2)} outstanding.`;
      } else {
        return `We're waiting for your payment of R${amountOwing.toFixed(2)} to process your order.`;
      }
    };

    const getEmailIntro = () => {
      if (orderStatus === 'delivered') {
        return "We hope you're enjoying your bales! However, we notice there's still an outstanding payment.";
      } else if (orderStatus === 'shipped') {
        return "Your bales are on their way! To ensure smooth processing, please complete the outstanding payment.";
      } else if (orderStatus === 'packing') {
        return "Exciting news! We're packing your bales right now. To ensure quick dispatch, please complete the payment.";
      } else {
        return "Great news! We've got your bales ready to pack and ship. We're just waiting for your payment to clear so we can get them on their way to you! 🚚";
      }
    };

    const statusEmoji = orderStatus === 'delivered' ? '✅' : 
                        orderStatus === 'shipped' ? '🚚' :
                        orderStatus === 'packing' ? '📦' : '💰';

    const getWhatsNext = () => {
      if (orderStatus === 'delivered') {
        return 'Your order has been delivered! Once your outstanding payment clears, your account will be settled. Thank you for your business!';
      } else if (orderStatus === 'shipped') {
        return 'Your bales are on their way to you! Once your payment clears, everything will be settled. You can expect delivery soon!';
      } else if (orderStatus === 'packing') {
        return "Your bales are being packed right now! Once your payment clears, we'll dispatch them immediately with FREE delivery.";
      } else {
        return "Once your payment clears, we'll immediately pack your bales and arrange FREE delivery to your address or your nearest PAXI location (PEP store).";
      }
    };

    const emailContent = `
      <tr>
        <td style="padding: 40px 30px;">
          <h1 style="margin: 0 0 25px 0; color: #2E4D38; font-size: 24px; text-align: center;">${statusEmoji} Payment Reminder</h1>
          
          <p style="margin: 0 0 20px 0; color: #333; font-size: 16px; line-height: 1.6;">
            Hi <strong>${order.customer_name}</strong>,
          </p>
          
          <p style="margin: 0 0 25px 0; color: #333; font-size: 16px; line-height: 1.6;">
            ${getEmailIntro()}
          </p>
          
          <!-- Order Number -->
          <div style="background: #f5f5f0; border-radius: 8px; padding: 15px; margin: 20px 0; text-align: center;">
            <p style="margin: 0; color: #666; font-size: 14px;">Order Number</p>
            <p style="margin: 5px 0 0 0; color: #D6A220; font-size: 20px; font-weight: bold;">${reference}</p>
          </div>

          <!-- Order Status Box -->
          <div style="background: linear-gradient(135deg, #e8f4fd 0%, #d1e9fc 100%); border-left: 4px solid #2E4D38; padding: 20px; margin: 25px 0; border-radius: 0 8px 8px 0;">
            <p style="margin: 0 0 5px 0; color: #2E4D38; font-size: 14px; font-weight: 600;">📋 Current Status</p>
            <p style="margin: 0; color: #333; font-size: 16px; font-weight: 600;">${getOrderStatusMessage()}</p>
          </div>
          
          <!-- Payment Status Box -->
          <div style="background: linear-gradient(135deg, #fef9e7 0%, #fef3c7 100%); border-left: 4px solid #D6A220; padding: 20px; margin: 25px 0; border-radius: 0 8px 8px 0;">
            <p style="margin: 0 0 10px 0; color: #92400e; font-size: 14px; font-weight: 600;">💰 Payment Status</p>
            <p style="margin: 0 0 15px 0; color: #92400e; font-size: 15px;">${getPaymentMessage()}</p>
            <table width="100%" cellpadding="6" cellspacing="0">
              ${amountPaid > 0 ? `
              <tr>
                <td style="color: #666; font-size: 14px;">Amount Paid:</td>
                <td style="color: #16a34a; font-weight: bold; font-size: 14px;">R${amountPaid.toFixed(2)}</td>
              </tr>
              ` : ''}
              <tr>
                <td style="color: #666; font-size: 14px;">Amount ${amountPaid > 0 ? 'Still ' : ''}Owing:</td>
                <td style="color: #dc2626; font-weight: bold; font-size: 18px;">R${amountOwing.toFixed(2)}</td>
              </tr>
              <tr>
                <td style="color: #666; font-size: 14px;">Total:</td>
                <td style="color: #333; font-weight: bold; font-size: 14px;">R${totalAmount.toFixed(2)}</td>
              </tr>
            </table>
          </div>
          
          <h3 style="margin: 30px 0 15px 0; color: #2E4D38; font-size: 18px; font-weight: bold;">
            💳 Payment Options
          </h3>
          
          <!-- Bank Transfer -->
          <div style="background: #f5f5f0; padding: 20px; border-radius: 8px; margin-bottom: 15px;">
            <p style="margin: 0 0 12px 0; color: #2E4D38; font-size: 16px; font-weight: bold;">Option 1: Bank Transfer (EFT)</p>
            <table width="100%" cellpadding="4" cellspacing="0">
              <tr><td style="color: #666; width: 120px;">Bank:</td><td style="color: #333; font-weight: 500;">FNB</td></tr>
              <tr><td style="color: #666;">Account Name:</td><td style="color: #333; font-weight: 500;">Khanya Clothing Bales</td></tr>
              <tr><td style="color: #666;">Account Number:</td><td style="color: #333; font-weight: 500;">63173001256</td></tr>
              <tr><td style="color: #666;">Branch Code:</td><td style="color: #333; font-weight: 500;">250655</td></tr>
              <tr><td style="color: #666;">Reference:</td><td style="color: #D6A220; font-weight: bold;">${reference}</td></tr>
            </table>
          </div>
          
          <!-- E-Wallet -->
          <div style="background: #f5f5f0; padding: 20px; border-radius: 8px; margin-bottom: 25px;">
            <p style="margin: 0 0 12px 0; color: #2E4D38; font-size: 16px; font-weight: bold;">Option 2: FNB E-Wallet</p>
            <table width="100%" cellpadding="4" cellspacing="0">
              <tr><td style="color: #666; width: 120px;">Cellphone:</td><td style="color: #333; font-weight: bold; font-size: 16px;">083 305 4532</td></tr>
              <tr><td style="color: #666;">Reference:</td><td style="color: #D6A220; font-weight: bold;">${reference}</td></tr>
            </table>
          </div>
          
          <!-- What's Next Box -->
          <div style="background: linear-gradient(135deg, #d1fae5 0%, #a7f3d0 100%); border-left: 4px solid #16a34a; padding: 20px; margin: 25px 0; border-radius: 0 8px 8px 0;">
            <p style="margin: 0 0 10px 0; color: #166534; font-size: 14px; font-weight: 600;">📦 What happens next?</p>
            <p style="margin: 0; color: #166534; font-size: 15px; line-height: 1.6;">${getWhatsNext()}</p>
          </div>
          
          <p style="margin: 25px 0 0 0; color: #333; font-size: 16px; line-height: 1.6;">
            Got questions? Just reply to this email or give us a call. We're here to help!
          </p>
          
          <p style="margin: 25px 0 0 0; color: #333; font-size: 16px;">
            <strong style="color: #2E4D38;">Team Khanya</strong>
          </p>
        </td>
      </tr>
    `;

    const emailHtml = getEmailTemplate(emailContent);

    let emailResponse: any = null;
    let emailSent = false;
    let emailError = null;

    if (hasValidEmail) {
      const emailSubject = orderStatus === 'delivered' 
        ? `Payment Outstanding - Order ${reference}`
        : orderStatus === 'shipped'
        ? `Payment Reminder - Order ${reference} Shipped! 🚚`
        : orderStatus === 'packing'
        ? `Payment Reminder - Order ${reference} Being Packed! 📦`
        : `Payment Reminder - Order ${reference} Ready to Ship! 🎉`;

      emailResponse = await resend.emails.send({
        from: "Khanya <noreply@mail.khanya.store>",
        to: [customerEmail],
        subject: emailSubject,
        html: emailHtml,
      });

      console.log("Payment reminder email sent:", emailResponse);
      
      if (emailResponse.error) {
        emailError = emailResponse.error.message;
        console.error("Email sending failed:", emailResponse.error);
      } else {
        emailSent = true;
      }
    } else {
      emailError = 'No valid email address on file';
      console.warn(`Skipping email for order ${reference} - no valid email address: "${order.customer_email}"`);
    }

    // Send SMS
    const getSmsMessage = () => {
      const statusText = orderStatus === 'delivered' ? 'delivered' :
                         orderStatus === 'shipped' ? 'shipped' :
                         orderStatus === 'packing' ? 'packing' : 'ready';
      
      const amountText = amountPaid > 0 
        ? `R${amountOwing.toFixed(0)} owing`
        : `R${amountOwing.toFixed(0)} due`;
      
      return `Order ${reference} ${statusText}. ${amountText}. Pay FNB 63173001256 ref ${reference} - Khanya`;
    };

    const smsBody = getSmsMessage();
    const toPhone = normalizeZaPhone(order.customer_phone);
    let smsData: any = null;
    let smsSent = false;
    let smsError = null;

    try {
      const formattedPhone = toPhone.replace(/[\s\-\+\(\)]/g, '');
      
      const requestBody = {
        message: smsBody,
        recipients: [{ mobileNumber: formattedPhone }]
      };

      const smsResponse = await fetch("https://api.winsms.co.za/api/rest/v1/sms/outgoing/send", {
        method: "POST",
        headers: {
          "Accept": "application/json",
          "Content-Type": "application/json",
          "AUTHORIZATION": winsmsApiKey!
        },
        body: JSON.stringify(requestBody)
      });

      const smsResponseData = await smsResponse.json();

      if (!smsResponse.ok) {
        smsError = JSON.stringify(smsResponseData);
        console.warn("SMS sending failed (non-critical):", smsResponseData);
      } else {
        smsData = smsResponseData;
        smsSent = true;
        console.log("Payment reminder SMS sent successfully via WinSMS:", smsResponseData);
      }
    } catch (smsErr: any) {
      smsError = smsErr.message;
      console.warn("SMS sending failed (non-critical):", smsErr);
    }

    let responseMessage = '';
    if (emailSent && smsSent) {
      responseMessage = "Payment reminder sent via email and SMS successfully";
    } else if (emailSent && !smsSent) {
      responseMessage = "Payment reminder sent via email (SMS failed)";
    } else if (!emailSent && smsSent) {
      responseMessage = "Payment reminder sent via SMS only (no valid email on file)";
    } else {
      responseMessage = "Failed to send payment reminder - no valid email and SMS failed";
    }

    return new Response(
      JSON.stringify({
        success: emailSent || smsSent,
        message: responseMessage,
        emailSent,
        smsSent,
        emailError: emailSent ? null : emailError,
        smsError: smsSent ? null : smsError,
      }),
      {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  } catch (error: any) {
    console.error("Error in send-payment-reminder:", error);
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

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

// Normalize South African phone numbers to E.164 (+27...)
function normalizeZaPhone(phone: string): string {
  const raw = String(phone || '').trim().replace(/[^0-9+]/g, '');
  if (!raw) return raw;
  if (raw.startsWith('+')) return raw; // assume already E.164
  if (raw.startsWith('27')) return `+${raw}`;
  if (raw.startsWith('0')) return `+27${raw.slice(1)}`;
  // If 9-10 digits without prefix, assume ZA national number
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

    const totalAmount = Number(order.total_amount);
    const amountPaid = Number(order.amount_paid || 0);
    const amountOwing = totalAmount - amountPaid;
    const paymentStatus = order.payment_tracking_status || 'Awaiting payment';
    const orderStatus = order.order_status || 'new_order';
    const reference = order.order_number;

    // Dynamic status messages
    const getOrderStatusMessage = () => {
      switch (orderStatus) {
        case 'new_order':
          return 'Your order is confirmed and ready to be packed';
        case 'packing':
          return 'Great news! Your order is currently being packed';
        case 'shipped':
          return 'Exciting! Your order has been shipped and is on its way';
        case 'delivered':
          return 'Your order has been delivered';
        default:
          return 'Your order is being processed';
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
                        orderStatus === 'packing' ? '📦' : '🎉';

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
                         ${statusEmoji} Payment Reminder - Order ${reference}
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
                         ${getEmailIntro()}
                       </p>

                       <!-- Order Status -->
                       <div style="background-color: #eff6ff; border-left: 4px solid #3b82f6; padding: 20px; margin: 30px 0; border-radius: 8px;">
                         <h2 style="margin: 0 0 10px 0; color: #1e40af; font-size: 18px; font-weight: bold;">
                           📋 Current Order Status
                         </h2>
                         <p style="margin: 0; color: #1e40af; font-size: 16px; font-weight: 600;">
                           ${getOrderStatusMessage()}
                         </p>
                       </div>
                       
                       <div style="background-color: #fef3c7; border-left: 4px solid #f59e0b; padding: 20px; margin: 30px 0; border-radius: 8px;">
                         <h2 style="margin: 0 0 15px 0; color: #92400e; font-size: 20px; font-weight: bold;">
                           💰 Payment Status
                         </h2>
                         <p style="margin: 0 0 15px 0; color: #92400e; font-size: 15px;">
                           ${getPaymentMessage()}
                         </p>
                         <table width="100%" cellpadding="8" cellspacing="0">
                           <tr>
                             <td style="color: #92400e; font-weight: 600; padding: 8px 0;">Order Number:</td>
                             <td style="color: #92400e; font-weight: bold; padding: 8px 0;">${reference}</td>
                           </tr>
                           ${amountPaid > 0 ? `
                           <tr>
                             <td style="color: #92400e; font-weight: 600; padding: 8px 0;">Amount Paid:</td>
                             <td style="color: #16a34a; font-weight: bold; padding: 8px 0;">R ${amountPaid.toFixed(2)}</td>
                           </tr>
                           ` : ''}
                           <tr>
                             <td style="color: #92400e; font-weight: 600; padding: 8px 0;">Amount ${amountPaid > 0 ? 'Still ' : ''}Owing:</td>
                             <td style="color: #dc2626; font-weight: bold; font-size: 18px; padding: 8px 0;">R ${amountOwing.toFixed(2)}</td>
                           </tr>
                           <tr>
                             <td style="color: #92400e; font-weight: 600; padding: 8px 0;">Total Amount:</td>
                             <td style="color: #92400e; font-weight: bold; padding: 8px 0;">R ${totalAmount.toFixed(2)}</td>
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
                            <td style="color: #1f2937; font-weight: 500;">63173001256</td>
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
                          ${orderStatus === 'delivered' 
                            ? 'Your order has been delivered! Once your outstanding payment clears, your account will be settled. Thank you for your business!' 
                            : orderStatus === 'shipped'
                            ? 'Your bales are on their way to you! Once your payment clears, everything will be settled. You can expect delivery soon!'
                            : orderStatus === 'packing'
                            ? 'Your bales are being packed right now! Once your payment clears, we\'ll dispatch them immediately with FREE delivery to your address or nearest PAXI location (PEP store).'
                            : 'Once your payment clears, we\'ll immediately pack your bales and arrange FREE delivery to your address or your nearest PAXI location (PEP store). You\'ll receive tracking details as soon as your order is dispatched!'}
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
    const emailSubject = orderStatus === 'delivered' 
      ? `Payment Outstanding - Order ${reference}`
      : orderStatus === 'shipped'
      ? `Payment Reminder - Order ${reference} Shipped! 🚚`
      : orderStatus === 'packing'
      ? `Payment Reminder - Order ${reference} Being Packed! 📦`
      : `Payment Reminder - Order ${reference} Ready to Ship! 🎉`;

    const emailResponse = await resend.emails.send({
      from: "Khanya <noreply@mail.khanya.store>",
      to: [order.customer_email],
      subject: emailSubject,
      html: emailHtml,
    });

    console.log("Payment reminder email sent:", emailResponse);
    
    if (emailResponse.error) {
      console.error("Email sending failed:", emailResponse.error);
      throw new Error(`Email failed: ${emailResponse.error.message}`);
    }

    // Send SMS with dynamic message (non-blocking - won't fail if SMS errors)
    const getSmsMessage = () => {
      const statusText = orderStatus === 'delivered' ? 'delivered' :
                         orderStatus === 'shipped' ? 'shipped' :
                         orderStatus === 'packing' ? 'being packed' : 'ready';
      
      const paymentText = amountPaid > 0 
        ? `R${amountPaid.toFixed(2)} received. Still owing: R${amountOwing.toFixed(2)}`
        : `Payment needed: R${amountOwing.toFixed(2)}`;
      
      return `Hi ${order.customer_name}! Order ${reference} is ${statusText}. ${paymentText}. ${statusEmoji} Pay: FNB 63173001256 OR E-Wallet 083 305 4532 (Ref: ${reference}) - Khanya`;
    };

    const smsBody = getSmsMessage();
    const toPhone = normalizeZaPhone(order.customer_phone);
    let smsData: any = null;
    let smsSent = false;
    let smsError = null;

    try {
      const smsResponse = await fetch(
        `https://api.twilio.com/2010-04-01/Accounts/${twilioAccountSid}/Messages.json`,
        {
          method: "POST",
          headers: {
            "Authorization": "Basic " + btoa(`${twilioAccountSid}:${twilioAuthToken}`),
            "Content-Type": "application/x-www-form-urlencoded",
          },
          body: new URLSearchParams({
            To: toPhone,
            From: twilioPhoneNumber!,
            Body: smsBody,
          }),
        }
      );

      if (!smsResponse.ok) {
        const errorText = await smsResponse.text();
        smsError = errorText;
        console.warn("SMS sending failed (non-critical):", errorText);
        console.warn("Note: If using Twilio trial account, verify the phone number at twilio.com/user/account/phone-numbers/verified");
      } else {
        smsData = await smsResponse.json();
        smsSent = true;
        console.log("Payment reminder SMS sent successfully:", smsData);
      }
    } catch (smsErr: any) {
      smsError = smsErr.message;
      console.warn("SMS sending failed (non-critical):", smsErr);
    }

    return new Response(
      JSON.stringify({ 
        success: true, 
        message: smsSent 
          ? "Payment reminder sent via email and SMS successfully"
          : "Payment reminder sent via email (SMS failed - see warning)",
        email_sent: !!emailResponse,
        sms_sent: smsSent,
        sms_sid: smsData?.sid,
        sms_status: smsData?.status,
        sms_error: smsError,
        to_phone: toPhone
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

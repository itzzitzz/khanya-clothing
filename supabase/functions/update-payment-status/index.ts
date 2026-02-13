import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { Resend } from "npm:resend@2.0.0";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.54.0";

const resend = new Resend(Deno.env.get("RESEND_API_KEY"));
const winsmsApiKey = Deno.env.get("WINSMS_API_KEY");

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface UpdatePaymentStatusRequest {
  order_id: string;
  new_payment_status: string;
  amount_paid?: number;
  refund_reason?: string;
}

// Normalize South African phone numbers to 27XXXXXXXXX format for WinSMS
function normalizeZaPhone(phone: string): string {
  const raw = String(phone || '').trim().replace(/[^0-9]/g, '');
  if (!raw) return raw;
  if (raw.startsWith('27') && raw.length === 11) return raw;
  if (raw.startsWith('0') && raw.length === 10) return `27${raw.slice(1)}`;
  if (raw.length === 9) return `27${raw}`;
  return raw;
}

const handler = async (req: Request): Promise<Response> => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { order_id, new_payment_status, amount_paid, refund_reason }: UpdatePaymentStatusRequest = await req.json();

    if (!order_id || !new_payment_status) {
      return new Response(
        JSON.stringify({ error: "order_id and new_payment_status are required" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Fetch current order details
    const { data: order, error: fetchError } = await supabase
      .from("orders")
      .select("*")
      .eq("id", order_id)
      .single();

    if (fetchError || !order) {
      console.error("Order not found:", fetchError);
      throw new Error("Order not found");
    }

    const previousStatus = order.payment_tracking_status;
    console.log(`Updating payment status for order ${order.order_number}: ${previousStatus} -> ${new_payment_status}`);

    // Update order payment status
    const updateData: any = {
      payment_tracking_status: new_payment_status,
    };
    if (amount_paid !== undefined) {
      updateData.amount_paid = amount_paid;
    }
    if (refund_reason !== undefined) {
      updateData.refund_reason = refund_reason;
    }

    const { error: updateError } = await supabase
      .from("orders")
      .update(updateData)
      .eq("id", order_id);

    if (updateError) {
      console.error("Error updating payment status:", updateError);
      throw updateError;
    }

    // Refetch updated order
    const { data: updatedOrder } = await supabase
      .from("orders")
      .select("*")
      .eq("id", order_id)
      .single();

    const finalOrder = updatedOrder || { ...order, ...updateData };

    // Send notifications
    const totalAmount = Number(finalOrder.total_amount);
    const amountPaidNow = Number(finalOrder.amount_paid || 0);
    const amountOwing = totalAmount - amountPaidNow;
    const reference = finalOrder.order_number;
    const orderStatus = finalOrder.order_status || 'new_order';

    // Validate customer email
    const customerEmail = (finalOrder.customer_email || '').trim();
    const hasValidEmail = customerEmail && customerEmail.includes('@') && customerEmail.includes('.');

    // Generate email content based on payment status change
    let subject = '';
    let emailBody = '';
    let smsMessage = '';

    const getOrderStatusLabel = () => {
      switch (orderStatus) {
        case 'new_order': return 'awaiting packing';
        case 'packing': return 'being packed';
        case 'shipped': return 'shipped';
        case 'delivered': return 'delivered';
        default: return 'processing';
      }
    };

    // Branded email template with Khanya logo (hosted on primary domain for reliability)
    const LOGO_URL = "https://khanya.store/khanya-logo.png";
    
    const getEmailTemplate = (content: string) => `
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
                  <td style="background-color: #f2ecbd; padding: 30px; text-align: center;">
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

    if (new_payment_status === 'Refunded') {
      subject = `🔄 Refund Processed - Order ${reference}`;
      smsMessage = `Order ${reference}: Your refund has been processed. Contact sales@khanya.store for queries. - Khanya`;
      
      const emailContent = `
        <tr>
          <td style="padding: 40px 30px;">
            <h1 style="margin: 0 0 25px 0; color: #2E4D38; font-size: 26px; text-align: center;">🔄 Refund Processed</h1>
            
            <p style="margin: 0 0 20px 0; color: #333; font-size: 16px; line-height: 1.7;">
              Hi <strong>${finalOrder.customer_name}</strong>,
            </p>
            <p style="margin: 0 0 20px 0; color: #333; font-size: 16px; line-height: 1.7;">
              We've processed a refund for your order <strong>${reference}</strong>.
            </p>
            
            <div style="background-color: #fef2f2; border-left: 4px solid #ef4444; padding: 20px; margin: 25px 0; border-radius: 8px;">
              <h2 style="margin: 0 0 15px 0; color: #991b1b; font-size: 18px; font-weight: bold;">
                🔄 Refund Details
              </h2>
              <table width="100%" cellpadding="8" cellspacing="0">
                <tr>
                  <td style="color: #991b1b; font-weight: 600;">Order Number:</td>
                  <td style="color: #991b1b; font-weight: bold;">${reference}</td>
                </tr>
                <tr>
                  <td style="color: #991b1b; font-weight: 600;">Order Amount:</td>
                  <td style="color: #991b1b; font-weight: bold;">R ${totalAmount.toFixed(2)}</td>
                </tr>
                <tr>
                  <td style="color: #991b1b; font-weight: 600;">Status:</td>
                  <td style="color: #ef4444; font-weight: bold;">REFUNDED</td>
                </tr>
                ${finalOrder.refund_reason ? `
                <tr>
                  <td style="color: #991b1b; font-weight: 600;">Reason:</td>
                  <td style="color: #991b1b;">${finalOrder.refund_reason}</td>
                </tr>
                ` : ''}
              </table>
            </div>
            
            <p style="margin: 30px 0 0 0; color: #333; font-size: 16px;">
              If you have any questions, please contact us.<br>
              <strong style="color: #2E4D38;">The Khanya Team</strong>
            </p>
          </td>
        </tr>
      `;
      
      emailBody = getEmailTemplate(emailContent);
    } else if (new_payment_status === 'Fully Paid') {
      subject = `✅ Payment Confirmed - Order ${reference}`;
      smsMessage = `Order ${reference}: Payment of R${totalAmount.toFixed(0)} confirmed! Your order is ${getOrderStatusLabel()}. Thank you! - Khanya`;
      
      const emailContent = `
        <tr>
          <td style="padding: 40px 30px;">
            <h1 style="margin: 0 0 25px 0; color: #2E4D38; font-size: 26px; text-align: center;">✅ Payment Confirmed!</h1>
            
            <p style="margin: 0 0 20px 0; color: #333; font-size: 16px; line-height: 1.7;">
              Hi <strong>${finalOrder.customer_name}</strong>,
            </p>
            <p style="margin: 0 0 20px 0; color: #333; font-size: 16px; line-height: 1.7;">
              Great news! We've received your full payment for order <strong>${reference}</strong>. Thank you! 🎉
            </p>
            
            <div style="background-color: #dcfce7; border-left: 4px solid #16a34a; padding: 20px; margin: 25px 0; border-radius: 8px;">
              <h2 style="margin: 0 0 15px 0; color: #166534; font-size: 18px; font-weight: bold;">
                💰 Payment Details
              </h2>
              <table width="100%" cellpadding="8" cellspacing="0">
                <tr>
                  <td style="color: #166534; font-weight: 600;">Order Number:</td>
                  <td style="color: #166534; font-weight: bold;">${reference}</td>
                </tr>
                <tr>
                  <td style="color: #166534; font-weight: 600;">Amount Paid:</td>
                  <td style="color: #166534; font-weight: bold; font-size: 18px;">R ${totalAmount.toFixed(2)}</td>
                </tr>
                <tr>
                  <td style="color: #166534; font-weight: 600;">Status:</td>
                  <td style="color: #16a34a; font-weight: bold;">✅ FULLY PAID</td>
                </tr>
              </table>
            </div>
            
            <div style="background-color: #eff6ff; border-left: 4px solid #3b82f6; padding: 20px; margin: 25px 0; border-radius: 8px;">
              <p style="margin: 0; color: #1e40af; font-size: 15px; line-height: 1.6;">
                <strong>📦 Order Status:</strong> Your order is currently <strong>${getOrderStatusLabel()}</strong>.
                ${orderStatus === 'new_order' || orderStatus === 'packing' 
                  ? "We'll start packing and dispatch your bales soon with FREE delivery!" 
                  : orderStatus === 'shipped' 
                  ? "Your bales are on their way to you!"
                  : "Your order has been delivered. Enjoy!"}
              </p>
            </div>
            
            <p style="margin: 30px 0 0 0; color: #333; font-size: 16px;">
              Thank you for choosing Khanya! 🙏<br>
              <strong style="color: #2E4D38;">The Khanya Team</strong>
            </p>
          </td>
        </tr>
      `;
      
      emailBody = getEmailTemplate(emailContent);
    } else if (new_payment_status === 'Partially Paid') {
      subject = `💰 Partial Payment Received - Order ${reference}`;
      smsMessage = `Order ${reference}: R${amountPaidNow.toFixed(0)} received. R${amountOwing.toFixed(0)} still due. Pay FNB 63173001256 ref ${reference} - Khanya`;
      
      const emailContent = `
        <tr>
          <td style="padding: 40px 30px;">
            <h1 style="margin: 0 0 25px 0; color: #2E4D38; font-size: 26px; text-align: center;">💰 Partial Payment Received!</h1>
            
            <p style="margin: 0 0 20px 0; color: #333; font-size: 16px; line-height: 1.7;">
              Hi <strong>${finalOrder.customer_name}</strong>,
            </p>
            <p style="margin: 0 0 20px 0; color: #333; font-size: 16px; line-height: 1.7;">
              Thank you! We've received a partial payment for your order <strong>${reference}</strong>. Here's a summary:
            </p>
            
            <div style="background-color: #dbeafe; border-left: 4px solid #3b82f6; padding: 20px; margin: 25px 0; border-radius: 8px;">
              <h2 style="margin: 0 0 15px 0; color: #1e40af; font-size: 18px; font-weight: bold;">
                💳 Payment Summary
              </h2>
              <table width="100%" cellpadding="8" cellspacing="0">
                <tr>
                  <td style="color: #1e40af; font-weight: 600;">Order Number:</td>
                  <td style="color: #1e40af; font-weight: bold;">${reference}</td>
                </tr>
                <tr>
                  <td style="color: #1e40af; font-weight: 600;">Total Amount:</td>
                  <td style="color: #1e40af; font-weight: bold;">R ${totalAmount.toFixed(2)}</td>
                </tr>
                <tr>
                  <td style="color: #16a34a; font-weight: 600;">Amount Paid:</td>
                  <td style="color: #16a34a; font-weight: bold; font-size: 18px;">R ${amountPaidNow.toFixed(2)}</td>
                </tr>
                <tr>
                  <td style="color: #dc2626; font-weight: 600;">Amount Outstanding:</td>
                  <td style="color: #dc2626; font-weight: bold; font-size: 18px;">R ${amountOwing.toFixed(2)}</td>
                </tr>
              </table>
            </div>
            
            <div style="background-color: #fef3c7; border-left: 4px solid #f59e0b; padding: 20px; margin: 25px 0; border-radius: 8px;">
              <h3 style="margin: 0 0 12px 0; color: #92400e; font-size: 16px; font-weight: bold;">
                💳 Pay the Remaining Balance:
              </h3>
              <p style="margin: 0 0 10px 0; color: #92400e; font-size: 14px;">
                <strong>EFT:</strong> FNB Account 63173001256, Branch 250655<br>
                <strong>E-Wallet:</strong> 083 305 4532<br>
                <strong>Reference:</strong> ${reference}
              </p>
            </div>
            
            <div style="background-color: #eff6ff; border-left: 4px solid #3b82f6; padding: 20px; margin: 25px 0; border-radius: 8px;">
              <p style="margin: 0; color: #1e40af; font-size: 15px; line-height: 1.6;">
                <strong>📦 Order Status:</strong> Your order is currently <strong>${getOrderStatusLabel()}</strong>.
                Once your full payment is received, we'll ensure smooth delivery!
              </p>
            </div>
            
            <p style="margin: 30px 0 0 0; color: #333; font-size: 16px;">
              Thank you for your payment!<br>
              <strong style="color: #2E4D38;">The Khanya Team</strong>
            </p>
          </td>
        </tr>
      `;
      
      emailBody = getEmailTemplate(emailContent);
    } else {
      // Awaiting payment - no notification needed for this status change
      console.log("Payment status changed to Awaiting payment - no notification sent");
      return new Response(
        JSON.stringify({ 
          success: true, 
          message: "Payment status updated (no notification for Awaiting payment status)",
          emailSent: false,
          smsSent: false
        }),
        { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Send email
    let emailSent = false;
    let emailError = null;
    
    if (hasValidEmail && emailBody) {
      try {
        const emailResponse = await resend.emails.send({
          from: "Khanya <noreply@mail.khanya.store>",
          to: [customerEmail],
          subject: subject,
          html: emailBody,
        });
        
        if (emailResponse.error) {
          emailError = emailResponse.error.message;
          console.error("Email sending failed:", emailResponse.error);
        } else {
          emailSent = true;
          console.log("Payment status email sent:", emailResponse);
        }
      } catch (err: any) {
        emailError = err.message;
        console.error("Email error:", err);
      }
    } else if (!hasValidEmail) {
      emailError = "No valid email address";
      console.warn(`No valid email for order ${reference}`);
    }

    // Send SMS
    let smsSent = false;
    let smsError = null;
    
    if (smsMessage && winsmsApiKey) {
      try {
        const formattedPhone = normalizeZaPhone(finalOrder.customer_phone);
        
        const requestBody = {
          message: smsMessage.substring(0, 150), // Max 150 chars
          recipients: [{ mobileNumber: formattedPhone }]
        };

        const smsResponse = await fetch("https://api.winsms.co.za/api/rest/v1/sms/outgoing/send", {
          method: "POST",
          headers: {
            "Accept": "application/json",
            "Content-Type": "application/json",
            "AUTHORIZATION": winsmsApiKey
          },
          body: JSON.stringify(requestBody)
        });

        const smsData = await smsResponse.json();
        
        if (!smsResponse.ok) {
          smsError = JSON.stringify(smsData);
          console.warn("SMS failed:", smsData);
        } else {
          smsSent = true;
          console.log("Payment status SMS sent:", smsData);
        }
      } catch (err: any) {
        smsError = err.message;
        console.warn("SMS error:", err);
      }
    }

    // Build response message
    let responseMessage = '';
    if (emailSent && smsSent) {
      responseMessage = "Payment status updated and notifications sent via email and SMS";
    } else if (emailSent) {
      responseMessage = "Payment status updated and email sent (SMS failed)";
    } else if (smsSent) {
      responseMessage = "Payment status updated and SMS sent (email failed)";
    } else {
      responseMessage = "Payment status updated (notifications failed)";
    }

    return new Response(
      JSON.stringify({ 
        success: true, 
        message: responseMessage,
        emailSent,
        smsSent,
        emailError,
        smsError,
        previousStatus,
        newStatus: new_payment_status
      }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );

  } catch (error: any) {
    console.error("Error in update-payment-status:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
};

serve(handler);

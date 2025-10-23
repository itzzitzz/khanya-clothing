import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.54.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface UpdateStatusRequest {
  order_id: string;
  new_status: string;
  payment_status?: string;
}

const STATUS_LABELS: Record<string, string> = {
  new_order: "New Order",
  packing: "Packing",
  shipped: "Shipped",
  delivered: "Delivered",
};

const handler = async (req: Request): Promise<Response> => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { order_id, new_status, payment_status }: UpdateStatusRequest = await req.json();

    if (!order_id || !new_status) {
      return new Response(
        JSON.stringify({ error: "Order ID and status are required" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Get order details first
    const { data: order, error: fetchError } = await supabase
      .from("orders")
      .select("*")
      .eq("id", order_id)
      .single();

    if (fetchError || !order) {
      console.error("Order not found:", fetchError);
      throw new Error("Order not found");
    }

    // Update order status
    const updateData: any = { order_status: new_status };
    if (payment_status) {
      updateData.payment_status = payment_status;
    }

    const { error: updateError } = await supabase
      .from("orders")
      .update(updateData)
      .eq("id", order_id);

    if (updateError) {
      console.error("Error updating order:", updateError);
      throw updateError;
    }

    // Send status update email
    const resendApiKey = Deno.env.get("RESEND_API_KEY");
    if (resendApiKey) {
      try {
        const statusLabel = STATUS_LABELS[new_status] || new_status;
        
        // Generate email content based on status
        let subject = '';
        let htmlBody = '';
        
        const baseStyles = `
          <style>
            body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, Cantarell, 'Fira Sans', 'Droid Sans', 'Helvetica Neue', Arial, sans-serif; line-height: 1.6; color: #333; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { background: linear-gradient(135deg, #2563eb 0%, #1e40af 100%); color: white; padding: 30px 20px; text-align: center; border-radius: 8px 8px 0 0; }
            .content { background: #ffffff; padding: 30px 20px; border: 1px solid #e5e7eb; border-top: none; }
            .order-number { font-size: 18px; font-weight: bold; color: #2563eb; margin: 10px 0; }
            .status-badge { display: inline-block; padding: 8px 16px; border-radius: 6px; font-weight: 600; margin: 15px 0; }
            .status-packing { background: #fef3c7; color: #92400e; }
            .status-shipped { background: #dbeafe; color: #1e40af; }
            .status-delivered { background: #d1fae5; color: #065f46; }
            .info-box { background: #f9fafb; border-left: 4px solid #2563eb; padding: 15px; margin: 20px 0; border-radius: 4px; }
            .footer { text-align: center; color: #6b7280; font-size: 12px; margin-top: 30px; padding: 20px; border-top: 1px solid #e5e7eb; }
            .button { display: inline-block; background: #2563eb; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; margin: 10px 0; }
          </style>
        `;
        
        if (new_status === 'new_order') {
          subject = `Order Confirmation - ${order.order_number}`;
          htmlBody = `
            ${baseStyles}
            <div class="container">
              <div class="header">
                <h1 style="margin: 0; font-size: 28px;">Order Confirmed!</h1>
              </div>
              <div class="content">
                <p>Hello ${order.customer_name},</p>
                <p>Thank you for your order! We've received your order and will begin processing it once payment is confirmed.</p>
                <div class="order-number">Order Number: ${order.order_number}</div>
                <div class="info-box">
                  <strong>What happens next?</strong>
                  <p style="margin: 10px 0 0 0;">Once we confirm your payment, we'll start preparing your bales for shipment. You'll receive an email update at each step of the process.</p>
                </div>
                <p><strong>Order Total:</strong> R${Number(order.total_amount).toFixed(2)}</p>
                <p><strong>Delivery Address:</strong><br>
                ${order.delivery_address}<br>
                ${order.delivery_city}, ${order.delivery_province} ${order.delivery_postal_code}</p>
              </div>
              <div class="footer">
                <p>Questions? Contact us at <a href="mailto:sales@khanya.store">sales@khanya.store</a></p>
                <p>© ${new Date().getFullYear()} Khanya. All rights reserved.</p>
              </div>
            </div>
          `;
        } else if (new_status === 'packing') {
          subject = `Payment Confirmed - We're Packing Your Order! ${order.order_number}`;
          htmlBody = `
            ${baseStyles}
            <div class="container">
              <div class="header">
                <h1 style="margin: 0; font-size: 28px;">🎉 Payment Confirmed!</h1>
              </div>
              <div class="content">
                <p>Hello ${order.customer_name},</p>
                <p>Great news! Your payment has been confirmed and we're now packing your order.</p>
                <div class="order-number">Order Number: ${order.order_number}</div>
                <span class="status-badge status-packing">Packing in Progress</span>
                <div class="info-box">
                  <strong>What's happening now?</strong>
                  <p style="margin: 10px 0 0 0;">Our team is carefully preparing your bales for shipment. You'll receive another update once your order has been dispatched.</p>
                </div>
                <p><strong>Estimated Delivery:</strong> 3-5 business days after shipment</p>
              </div>
              <div class="footer">
                <p>Questions? Contact us at <a href="mailto:sales@khanya.store">sales@khanya.store</a></p>
                <p>© ${new Date().getFullYear()} Khanya. All rights reserved.</p>
              </div>
            </div>
          `;
        } else if (new_status === 'shipped') {
          subject = `Your Order is On Its Way! ${order.order_number}`;
          htmlBody = `
            ${baseStyles}
            <div class="container">
              <div class="header">
                <h1 style="margin: 0; font-size: 28px;">📦 Order Shipped!</h1>
              </div>
              <div class="content">
                <p>Hello ${order.customer_name},</p>
                <p>Excellent news! Your order has been shipped and is on its way to you.</p>
                <div class="order-number">Order Number: ${order.order_number}</div>
                <span class="status-badge status-shipped">In Transit</span>
                <div class="info-box">
                  <strong>Delivery Information</strong>
                  <p style="margin: 10px 0 0 0;"><strong>Shipping To:</strong><br>
                  ${order.delivery_address}<br>
                  ${order.delivery_city}, ${order.delivery_province} ${order.delivery_postal_code}</p>
                  <p style="margin: 10px 0 0 0;"><strong>Estimated Delivery:</strong> 3-5 business days</p>
                </div>
                <p>Please ensure someone is available to receive the delivery. You'll receive a final confirmation once your order has been delivered.</p>
              </div>
              <div class="footer">
                <p>Questions? Contact us at <a href="mailto:sales@khanya.store">sales@khanya.store</a></p>
                <p>© ${new Date().getFullYear()} Khanya. All rights reserved.</p>
              </div>
            </div>
          `;
        } else if (new_status === 'delivered') {
          subject = `Order Delivered Successfully! ${order.order_number}`;
          htmlBody = `
            ${baseStyles}
            <div class="container">
              <div class="header">
                <h1 style="margin: 0; font-size: 28px;">✅ Delivered!</h1>
              </div>
              <div class="content">
                <p>Hello ${order.customer_name},</p>
                <p>Your order has been successfully delivered! We hope you're satisfied with your purchase.</p>
                <div class="order-number">Order Number: ${order.order_number}</div>
                <span class="status-badge status-delivered">Delivered</span>
                <div class="info-box">
                  <strong>Thank you for choosing Khanya!</strong>
                  <p style="margin: 10px 0 0 0;">We appreciate your business. If you have any questions or concerns about your order, please don't hesitate to reach out.</p>
                </div>
                <p>We'd love to hear about your experience! If you're satisfied with our service, please consider ordering from us again.</p>
              </div>
              <div class="footer">
                <p>Questions or feedback? Contact us at <a href="mailto:sales@khanya.store">sales@khanya.store</a></p>
                <p>© ${new Date().getFullYear()} Khanya. All rights reserved.</p>
              </div>
            </div>
          `;
        }
        
        await fetch("https://api.resend.com/emails", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${resendApiKey}`,
          },
          body: JSON.stringify({
            from: "Khanya <noreply@mail.khanya.store>",
            to: [order.customer_email],
            subject: subject,
            html: htmlBody,
          }),
        });
      } catch (emailError) {
        console.error("Failed to send status update email:", emailError);
        // Don't fail the status update if email fails
      }
    }

    console.log("Order status updated:", order_id, new_status);

    return new Response(
      JSON.stringify({ success: true }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error: any) {
    console.error("Error in update-order-status:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
};

serve(handler);

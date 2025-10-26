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

function generateInvoiceHTML(order: any): string {
  const orderDate = new Date(order.created_at).toLocaleDateString('en-ZA', { 
    year: 'numeric', 
    month: 'long', 
    day: 'numeric' 
  });

  return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <style>
        body { font-family: Inter, 'Helvetica', 'Arial', sans-serif; margin: 0; padding: 40px; color: #1f2e27; background: #faf9f6; }
        .header { text-align: center; margin-bottom: 40px; }
        .header h1 { font-size: 36px; margin: 0; color: #2E4D38; }
        .company { margin-bottom: 30px; }
        .company h2 { font-size: 20px; margin: 0 0 5px 0; color: #2E4D38; }
        .company p { margin: 2px 0; font-size: 12px; color: #6b7b73; }
        .invoice-details { float: right; text-align: right; margin-bottom: 30px; }
        .invoice-details p { margin: 3px 0; font-size: 12px; }
        .invoice-details strong { font-weight: bold; color: #2E4D38; }
        .bill-to { margin-bottom: 30px; clear: both; padding-top: 20px; }
        .bill-to h3 { font-size: 14px; margin: 0 0 10px 0; font-weight: bold; color: #2E4D38; }
        .bill-to p { margin: 3px 0; font-size: 12px; }
        .delivery { margin-bottom: 40px; }
        .delivery h3 { font-size: 14px; margin: 0 0 10px 0; font-weight: bold; color: #2E4D38; }
        .delivery p { margin: 3px 0; font-size: 12px; }
        table { width: 100%; border-collapse: collapse; margin: 30px 0; background: white; }
        thead { background: #f4f7f5; }
        th { padding: 12px; text-align: left; font-size: 12px; font-weight: bold; border-bottom: 2px solid #d9ded6; color: #2E4D38; }
        td { padding: 12px; font-size: 12px; border-bottom: 1px solid #d9ded6; }
        .bale-header { padding: 15px 12px 8px 12px !important; font-size: 13px; font-weight: bold; background: #f9fafb; color: #2E4D38; }
        .bale-item { padding: 8px 12px 8px 24px !important; font-size: 11px; border-bottom: 1px solid #eee; }
        .discount-row { background: #fef9e7; }
        .savings-row { background: #d1fae5; }
        .bale-total { background: #f4f7f5; font-weight: bold; }
        .total-row { background: #2E4D38; color: white; font-weight: bold; font-size: 16px; }
        .footer { margin-top: 40px; padding-top: 20px; border-top: 2px solid #d9ded6; text-align: center; font-size: 11px; color: #6b7b73; }
        .footer p { margin: 5px 0; }
        .no-vat { background: #fef9e7; padding: 15px; border-radius: 6px; margin-top: 20px; font-size: 11px; text-align: center; border-left: 3px solid #D6A220; }
      </style>
    </head>
    <body>
      <div class="header">
        <h1>INVOICE</h1>
      </div>

      <div class="company">
        <h2>Khanya</h2>
        <p>sales@khanya.store</p>
        <p>www.khanya.store</p>
      </div>

      <div class="invoice-details">
        <p><strong>Invoice Number:</strong> ${order.order_number}</p>
        <p><strong>Date:</strong> ${orderDate}</p>
        <p><strong>Payment Status:</strong> ${order.payment_status.toUpperCase()}</p>
      </div>

      <div class="bill-to">
        <h3>BILL TO:</h3>
        <p>${order.customer_name}</p>
        <p>${order.customer_email}</p>
        <p>${order.customer_phone}</p>
      </div>

      <div class="delivery">
        <h3>DELIVERY ADDRESS:</h3>
        <p>${order.delivery_address}</p>
        <p>${order.delivery_city}, ${order.delivery_province} ${order.delivery_postal_code}</p>
      </div>

      <table>
        <thead>
          <tr>
            <th>Item</th>
            <th style="text-align: center;">Qty</th>
            <th style="text-align: right;">Price</th>
            <th style="text-align: right;">Total</th>
          </tr>
        </thead>
        <tbody>
          ${order.order_items.map((item: any) => {
            const baleItems = item.bale_details?.bale_items || [];
            const itemsSubtotal = baleItems.reduce((sum: number, bi: any) => 
              sum + (bi.stock_items?.selling_price || 0) * bi.quantity, 0);
            const baleDiscount = itemsSubtotal - item.price_per_unit;
            const hasDiscount = baleDiscount > 0;
            
            return `
            <tr>
              <td colspan="4" class="bale-header">${item.product_name} (x${item.quantity})</td>
            </tr>
            ${baleItems.map((baleItem: any) => `
              <tr>
                <td class="bale-item">${baleItem.stock_items?.name || 'Item'}</td>
                <td style="text-align: center; padding: 8px 12px; font-size: 11px; border-bottom: 1px solid #eee;">${baleItem.quantity}</td>
                <td style="text-align: right; padding: 8px 12px; font-size: 11px; border-bottom: 1px solid #eee;">R${(baleItem.stock_items?.selling_price || 0).toFixed(2)}</td>
                <td style="text-align: right; padding: 8px 12px; font-size: 11px; border-bottom: 1px solid #eee;">R${((baleItem.stock_items?.selling_price || 0) * baleItem.quantity).toFixed(2)}</td>
              </tr>
            `).join('')}
            ${hasDiscount ? `
              <tr class="discount-row">
                <td colspan="3" style="padding: 8px 12px 8px 24px; font-size: 11px; font-style: italic; color: #8b7217;">Individual Items Subtotal:</td>
                <td style="padding: 8px 12px; font-size: 11px; text-align: right; color: #8b7217;">R${itemsSubtotal.toFixed(2)}</td>
              </tr>
              <tr class="savings-row">
                <td colspan="3" style="padding: 8px 12px 8px 24px; font-size: 11px; font-weight: bold; color: #065f46;">Bale Discount per unit:</td>
                <td style="padding: 8px 12px; font-size: 11px; text-align: right; font-weight: bold; color: #065f46;">-R${baleDiscount.toFixed(2)}</td>
              </tr>
            ` : ''}
            <tr class="bale-total">
              <td colspan="3" style="padding: 10px 12px; font-size: 12px;">Bale Price (x${item.quantity}):</td>
              <td style="padding: 10px 12px; font-size: 12px; text-align: right;">R${Number(item.subtotal).toFixed(2)}</td>
            </tr>
          `}).join('')}
          <tr class="total-row">
            <td colspan="3" style="padding: 15px 12px;">TOTAL</td>
            <td style="padding: 15px 12px; text-align: right;">R${Number(order.total_amount).toFixed(2)}</td>
          </tr>
        </tbody>
      </table>

      <div class="no-vat">
        <p>This invoice does not include VAT. Khanya is not VAT registered.</p>
      </div>

      <div class="footer">
        <p>Thank you for your business!</p>
        <p>© ${new Date().getFullYear()} Khanya. All rights reserved.</p>
      </div>
    </body>
    </html>
  `;
}

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

    // Get order details with items and bale details
    const { data: order, error: fetchError } = await supabase
      .from("orders")
      .select(`
        *,
        order_items (
          id,
          product_id,
          product_name,
          quantity,
          price_per_unit,
          subtotal
        )
      `)
      .eq("id", order_id)
      .single();

    if (fetchError || !order) {
      console.error("Order not found:", fetchError);
      throw new Error("Order not found");
    }

    // Fetch bale details for each order item
    const baleDetailsPromises = order.order_items.map(async (item: any) => {
      const { data: baleData } = await supabase
        .from('bales')
        .select(`
          id,
          actual_selling_price,
          bale_items (
            id,
            quantity,
            stock_items (
              id,
              name,
              selling_price
            )
          )
        `)
        .eq('id', item.product_id)
        .single();
      
      return {
        ...item,
        bale_details: baleData
      };
    });

    const itemsWithBaleDetails = await Promise.all(baleDetailsPromises);
    order.order_items = itemsWithBaleDetails;

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
            body { font-family: Inter, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, Cantarell, 'Fira Sans', 'Droid Sans', 'Helvetica Neue', Arial, sans-serif; line-height: 1.6; color: #1f2e27; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; background: #faf9f6; }
            .header { background: linear-gradient(135deg, #2E4D38 0%, #234130 100%); color: white; padding: 30px 20px; text-align: center; border-radius: 8px 8px 0 0; }
            .content { background: #ffffff; padding: 30px 20px; border: 1px solid #d9ded6; border-top: none; }
            .order-number { font-size: 18px; font-weight: bold; color: #D6A220; margin: 10px 0; }
            .status-badge { display: inline-block; padding: 8px 16px; border-radius: 6px; font-weight: 600; margin: 15px 0; }
            .status-packing { background: #fef9e7; color: #8b7217; }
            .status-shipped { background: #e8f1ed; color: #2E4D38; }
            .status-delivered { background: #d1fae5; color: #065f46; }
            .info-box { background: #f4f7f5; border-left: 4px solid #2E4D38; padding: 15px; margin: 20px 0; border-radius: 4px; }
            .footer { text-align: center; color: #6b7b73; font-size: 12px; margin-top: 30px; padding: 20px; border-top: 1px solid #d9ded6; }
            .button { display: inline-block; background: #D6A220; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; margin: 10px 0; font-weight: 600; }
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
          
          const orderDate = new Date(order.created_at).toLocaleDateString('en-ZA', { 
            year: 'numeric', 
            month: 'long', 
            day: 'numeric' 
          });
          
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
            
            <div style="max-width: 600px; margin: 40px auto; padding: 40px; background: white; border: 2px solid #d9ded6; font-family: Inter, Arial, sans-serif;">
              <div style="text-align: center; margin-bottom: 30px;">
                <h1 style="font-size: 36px; margin: 0; color: #2E4D38;">INVOICE</h1>
              </div>
              
              <div style="margin-bottom: 20px;">
                <h2 style="font-size: 18px; margin: 0 0 5px 0; color: #2E4D38;">Khanya</h2>
                <p style="margin: 2px 0; font-size: 12px; color: #6b7b73;">sales@khanya.store</p>
                <p style="margin: 2px 0; font-size: 12px; color: #6b7b73;">www.khanya.store</p>
              </div>
              
              <div style="text-align: right; margin-bottom: 20px;">
                <p style="margin: 3px 0; font-size: 12px;"><strong>Invoice Number:</strong> ${order.order_number}</p>
                <p style="margin: 3px 0; font-size: 12px;"><strong>Date:</strong> ${orderDate}</p>
                <p style="margin: 3px 0; font-size: 12px;"><strong>Payment Status:</strong> PAID</p>
              </div>
              
              <div style="margin-bottom: 20px; clear: both;">
                <h3 style="font-size: 14px; margin: 0 0 10px 0; font-weight: bold; color: #2E4D38;">BILL TO:</h3>
                <p style="margin: 3px 0; font-size: 12px;">${order.customer_name}</p>
                <p style="margin: 3px 0; font-size: 12px;">${order.customer_email}</p>
                <p style="margin: 3px 0; font-size: 12px;">${order.customer_phone}</p>
              </div>
              
              <div style="margin-bottom: 30px;">
                <h3 style="font-size: 14px; margin: 0 0 10px 0; font-weight: bold; color: #2E4D38;">DELIVERY ADDRESS:</h3>
                <p style="margin: 3px 0; font-size: 12px;">${order.delivery_address}</p>
                <p style="margin: 3px 0; font-size: 12px;">${order.delivery_city}, ${order.delivery_province} ${order.delivery_postal_code}</p>
              </div>
              
              <table style="width: 100%; border-collapse: collapse; margin: 20px 0;">
                <thead style="background: #f4f7f5;">
                  <tr>
                    <th style="padding: 12px; text-align: left; font-size: 12px; font-weight: bold; border-bottom: 2px solid #d9ded6; color: #2E4D38;">Item</th>
                    <th style="padding: 12px; text-align: center; font-size: 12px; font-weight: bold; border-bottom: 2px solid #d9ded6; color: #2E4D38;">Qty</th>
                    <th style="padding: 12px; text-align: right; font-size: 12px; font-weight: bold; border-bottom: 2px solid #d9ded6; color: #2E4D38;">Price</th>
                    <th style="padding: 12px; text-align: right; font-size: 12px; font-weight: bold; border-bottom: 2px solid #d9ded6; color: #2E4D38;">Total</th>
                  </tr>
                </thead>
                <tbody>
                  ${order.order_items.map((item: any) => {
                    const baleItems = item.bale_details?.bale_items || [];
                    const itemsSubtotal = baleItems.reduce((sum: number, bi: any) => 
                      sum + (bi.stock_items?.selling_price || 0) * bi.quantity, 0);
                    const baleDiscount = itemsSubtotal - item.price_per_unit;
                    const hasDiscount = baleDiscount > 0;
                    
                    return `
                    <tr>
                      <td colspan="4" style="padding: 15px 12px 8px 12px; font-size: 13px; font-weight: bold; background: #f9fafb; border-bottom: 1px solid #d9ded6; color: #2E4D38;">${item.product_name} (x${item.quantity})</td>
                    </tr>
                    ${baleItems.map((baleItem: any) => `
                      <tr>
                        <td style="padding: 8px 12px 8px 24px; font-size: 11px; border-bottom: 1px solid #eee;">${baleItem.stock_items?.name || 'Item'}</td>
                        <td style="padding: 8px 12px; font-size: 11px; text-align: center; border-bottom: 1px solid #eee;">${baleItem.quantity}</td>
                        <td style="padding: 8px 12px; font-size: 11px; text-align: right; border-bottom: 1px solid #eee;">R${(baleItem.stock_items?.selling_price || 0).toFixed(2)}</td>
                        <td style="padding: 8px 12px; font-size: 11px; text-align: right; border-bottom: 1px solid #eee;">R${((baleItem.stock_items?.selling_price || 0) * baleItem.quantity).toFixed(2)}</td>
                      </tr>
                    `).join('')}
                    ${hasDiscount ? `
                      <tr style="background: #fef9e7;">
                        <td colspan="3" style="padding: 8px 12px 8px 24px; font-size: 11px; font-style: italic; color: #8b7217;">Individual Items Subtotal:</td>
                        <td style="padding: 8px 12px; font-size: 11px; text-align: right; color: #8b7217;">R${itemsSubtotal.toFixed(2)}</td>
                      </tr>
                      <tr style="background: #d1fae5;">
                        <td colspan="3" style="padding: 8px 12px 8px 24px; font-size: 11px; font-weight: bold; color: #065f46;">Bale Discount per unit:</td>
                        <td style="padding: 8px 12px; font-size: 11px; text-align: right; font-weight: bold; color: #065f46;">-R${baleDiscount.toFixed(2)}</td>
                      </tr>
                    ` : ''}
                    <tr style="background: #f4f7f5;">
                      <td colspan="3" style="padding: 10px 12px; font-size: 12px; font-weight: bold; border-bottom: 1px solid #d9ded6;">Bale Price (x${item.quantity}):</td>
                      <td style="padding: 10px 12px; font-size: 12px; text-align: right; font-weight: bold; border-bottom: 1px solid #d9ded6;">R${Number(item.subtotal).toFixed(2)}</td>
                    </tr>
                  `}).join('')}
                  <tr style="background: #2E4D38; color: white;">
                    <td colspan="3" style="padding: 15px 12px; font-size: 16px; font-weight: bold;">TOTAL</td>
                    <td style="padding: 15px 12px; font-size: 16px; text-align: right; font-weight: bold;">R${Number(order.total_amount).toFixed(2)}</td>
                  </tr>
                </tbody>
              </table>
              
              <div style="background: #fef9e7; padding: 15px; border-radius: 6px; margin-top: 20px; text-align: center; border-left: 3px solid #D6A220;">
                <p style="margin: 0; font-size: 11px; color: #1f2e27;">This invoice does not include VAT. Khanya is not VAT registered.</p>
              </div>
              
              <div style="margin-top: 30px; padding-top: 20px; border-top: 2px solid #d9ded6; text-align: center;">
                <p style="margin: 5px 0; font-size: 11px; color: #6b7b73;">Thank you for your business!</p>
                <p style="margin: 5px 0; font-size: 11px; color: #6b7b73;">© ${new Date().getFullYear()} Khanya. All rights reserved.</p>
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
        
        // No attachments needed - invoice is embedded in email body for packing status
        const emailPayload: any = {
          from: "Khanya <noreply@mail.khanya.store>",
          to: [order.customer_email],
          subject: subject,
          html: htmlBody,
        };

        await fetch("https://api.resend.com/emails", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${resendApiKey}`,
          },
          body: JSON.stringify(emailPayload),
        });
        
        console.log(`Status update email sent successfully to ${order.customer_email} for status: ${new_status}`);
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

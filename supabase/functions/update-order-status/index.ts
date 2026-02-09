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
  note?: string;
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
        ${order.delivery_complex ? `<p>${order.delivery_complex}</p>` : ''}
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
    const { order_id, new_status, payment_status, note }: UpdateStatusRequest = await req.json();

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

    // Log status change to history (with optional note)
    const { error: historyError } = await supabase
      .from("order_status_history")
      .insert({
        order_id: order_id,
        status: new_status,
        notes: note || null,
        changed_at: new Date().toISOString()
      });

    if (historyError) {
      console.error("Error logging status history:", historyError);
      // Don't throw - history logging is not critical
    }

    // If payment status is being set to 'paid', deduct bale quantities from stock
    if (payment_status === 'paid') {
      console.log("Payment confirmed - deducting bale quantities from stock");
      
      for (const item of order.order_items) {
        const baleId = item.product_id;
        const quantityOrdered = item.quantity;
        
        // Get current stock
        const { data: currentBale, error: baleError } = await supabase
          .from('bales')
          .select('quantity_in_stock')
          .eq('id', baleId)
          .single();
        
        if (baleError) {
          console.error(`Error fetching bale ${baleId}:`, baleError);
          continue;
        }
        
        const newStock = Math.max(0, currentBale.quantity_in_stock - quantityOrdered);
        
        // Update bale stock
        const { error: stockUpdateError } = await supabase
          .from('bales')
          .update({ quantity_in_stock: newStock })
          .eq('id', baleId);
        
        if (stockUpdateError) {
          console.error(`Error updating stock for bale ${baleId}:`, stockUpdateError);
        } else {
          console.log(`Updated bale ${baleId}: ${currentBale.quantity_in_stock} -> ${newStock}`);
        }
      }
    }

    // Send status update email
    const resendApiKey = Deno.env.get("RESEND_API_KEY");
    if (resendApiKey) {
      try {
        const statusLabel = STATUS_LABELS[new_status] || new_status;
        
        // Generate email content based on status
        let subject = '';
        let emailContent = '';
        
        // Branded email template with Khanya logo
        const LOGO_URL = "https://khanya-resell-africa.lovable.app/email-assets/khanya-logo.png?v=1";
        
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
        
        if (new_status === 'new_order') {
          subject = `Order Confirmation - ${order.order_number}`;
          const contentHtml = `
            <tr>
              <td style="padding: 30px;">
                <h2 style="margin: 0 0 20px 0; color: #2E4D38; font-size: 24px;">Order Confirmed!</h2>
                <p style="color: #333; line-height: 1.6;">Hello ${order.customer_name},</p>
                <p style="color: #333; line-height: 1.6;">Thank you for your order! We've received your order and will begin processing it once payment is confirmed.</p>
                <div style="background: #f4f7f5; border-radius: 8px; padding: 15px; margin: 20px 0; text-align: center;">
                  <p style="margin: 0; font-size: 12px; color: #666;">Order Number</p>
                  <p style="margin: 5px 0 0 0; font-size: 20px; font-weight: bold; color: #D6A220;">${order.order_number}</p>
                </div>
                <div style="background: #fef3c7; border-left: 4px solid #f59e0b; padding: 12px; margin: 15px 0; border-radius: 4px;">
                  <p style="margin: 0; font-size: 14px; color: #92400e;">
                    <strong>Payment Status:</strong> ${order.payment_tracking_status || 'Awaiting payment'}
                  </p>
                  <p style="margin: 8px 0 0 0; font-size: 13px; color: #92400e;">
                    Amount Paid: <strong>R${Number(order.amount_paid || 0).toFixed(2)}</strong> / Total: <strong>R${Number(order.total_amount).toFixed(2)}</strong>
                  </p>
                </div>
                <div style="background: #e8f5e9; border-radius: 8px; padding: 15px; margin: 20px 0;">
                  <strong style="color: #2E4D38;">What happens next?</strong>
                  <p style="margin: 10px 0 0 0; color: #333; line-height: 1.6;">Once we confirm your payment, we'll start preparing your bales for shipment. You'll receive an email update at each step of the process.</p>
                </div>
                <p style="color: #333;"><strong>Order Total:</strong> R${Number(order.total_amount).toFixed(2)}</p>
                <p style="color: #333;"><strong>Delivery Address:</strong><br>
                ${order.delivery_complex ? `${order.delivery_complex}<br>` : ''}${order.delivery_address}<br>
                ${order.delivery_city}, ${order.delivery_province} ${order.delivery_postal_code}</p>
              </td>
            </tr>
          `;
          emailContent = getEmailTemplate(contentHtml);
        } else if (new_status === 'packing') {
          const totalAmount = Number(order.total_amount);
          const amountPaid = Number(order.amount_paid || 0);
          const amountOwing = totalAmount - amountPaid;
          const paymentStatus = order.payment_tracking_status || 'Awaiting payment';
          const isFullyPaid = paymentStatus === 'Fully Paid';
          
          const emailHeading = isFullyPaid 
            ? '🎉 Payment Confirmed - We\'re Packing Your Order!'
            : paymentStatus === 'Partially Paid'
            ? '📦 Packing Your Order - Partial Payment Received'
            : '📦 Packing Your Order - Payment Still Needed';
          
          subject = `${isFullyPaid ? 'Payment Confirmed - ' : ''}Order Being Packed! ${order.order_number}`;
          
          const paymentMessage = isFullyPaid
            ? 'Great news! Your payment has been confirmed and we\'re now packing your order.'
            : paymentStatus === 'Partially Paid'
            ? `We've received R${amountPaid.toFixed(2)} of your payment and are packing your order. Please arrange payment for the remaining R${amountOwing.toFixed(2)} as soon as possible.`
            : `We're packing your order! Please note there is still R${amountOwing.toFixed(2)} outstanding. Kindly complete your payment to avoid delays.`;
          
          const paymentBoxColor = isFullyPaid ? '#d1fae5' : paymentStatus === 'Partially Paid' ? '#fef3c7' : '#fee2e2';
          const paymentBorderColor = isFullyPaid ? '#10b981' : paymentStatus === 'Partially Paid' ? '#f59e0b' : '#ef4444';
          const paymentTextColor = isFullyPaid ? '#065f46' : paymentStatus === 'Partially Paid' ? '#92400e' : '#991b1b';
          
          const orderDate = new Date(order.created_at).toLocaleDateString('en-ZA', { 
            year: 'numeric', 
            month: 'long', 
            day: 'numeric' 
          });
          
          const contentHtml = `
            <tr>
              <td style="padding: 30px;">
                <h2 style="margin: 0 0 20px 0; color: #2E4D38; font-size: 24px;">${emailHeading}</h2>
                <p style="color: #333; line-height: 1.6;">Hello ${order.customer_name},</p>
                <p style="color: #333; line-height: 1.6;">${paymentMessage}</p>
                <div style="background: #f4f7f5; border-radius: 8px; padding: 15px; margin: 20px 0; text-align: center;">
                  <p style="margin: 0; font-size: 12px; color: #666;">Order Number</p>
                  <p style="margin: 5px 0 0 0; font-size: 20px; font-weight: bold; color: #D6A220;">${order.order_number}</p>
                  <span style="display: inline-block; background: #3b82f6; color: white; padding: 4px 12px; border-radius: 20px; font-size: 12px; margin-top: 10px;">Packing in Progress</span>
                </div>
                <div style="background: ${paymentBoxColor}; border-left: 4px solid ${paymentBorderColor}; padding: 12px; margin: 15px 0; border-radius: 4px;">
                  <p style="margin: 0; font-size: 14px; color: ${paymentTextColor};">
                    <strong>Payment Status:</strong> ${paymentStatus}
                  </p>
                  <p style="margin: 8px 0 0 0; font-size: 13px; color: ${paymentTextColor};">
                    Amount Paid: <strong>R${amountPaid.toFixed(2)}</strong> / Total: <strong>R${totalAmount.toFixed(2)}</strong>
                  </p>
                  ${!isFullyPaid ? `<p style="margin: 8px 0 0 0; font-size: 14px; font-weight: bold; color: ${paymentTextColor};">Amount Still Owing: <strong style="font-size: 16px;">R${amountOwing.toFixed(2)}</strong></p>` : ''}
                </div>
                ${!isFullyPaid ? `
                  <div style="background: #fef3c7; border-left: 4px solid #f59e0b; padding: 15px; margin: 20px 0; border-radius: 4px;">
                    <p style="margin: 0 0 10px 0; font-weight: bold; color: #92400e;">Payment Details</p>
                    <p style="margin: 5px 0; font-size: 13px; color: #92400e;"><strong>Bank:</strong> FNB</p>
                    <p style="margin: 5px 0; font-size: 13px; color: #92400e;"><strong>Account:</strong> 63173001256</p>
                    <p style="margin: 5px 0; font-size: 13px; color: #92400e;"><strong>Branch Code:</strong> 250655</p>
                    <p style="margin: 5px 0; font-size: 13px; color: #92400e;"><strong>E-Wallet:</strong> 083 305 4532</p>
                    <p style="margin: 5px 0; font-size: 13px; color: #dc2626; font-weight: bold;"><strong>Reference:</strong> ${order.order_number}</p>
                  </div>
                ` : ''}
                <div style="background: #e8f5e9; border-radius: 8px; padding: 15px; margin: 20px 0;">
                  <strong style="color: #2E4D38;">What's happening now?</strong>
                  <p style="margin: 10px 0 0 0; color: #333; line-height: 1.6;">Our team is carefully preparing your bales for shipment. You'll receive another update once your order has been dispatched.</p>
                </div>
                <p style="color: #333;"><strong>Estimated Delivery:</strong> 3-5 business days after shipment</p>
              </td>
            </tr>
          `;
          emailContent = getEmailTemplate(contentHtml);
        } else if (new_status === 'shipped') {
          const totalAmount = Number(order.total_amount);
          const amountPaid = Number(order.amount_paid || 0);
          const amountOwing = totalAmount - amountPaid;
          const paymentStatus = order.payment_tracking_status || 'Awaiting payment';
          const isFullyPaid = paymentStatus === 'Fully Paid';
          
          subject = `Your Order is On Its Way! ${order.order_number}`;
          const contentHtml = `
            <tr>
              <td style="padding: 30px;">
                <h2 style="margin: 0 0 20px 0; color: #2E4D38; font-size: 24px;">📦 Order Shipped!</h2>
                <p style="color: #333; line-height: 1.6;">Hello ${order.customer_name},</p>
                <p style="color: #333; line-height: 1.6;">Excellent news! Your order has been shipped and is on its way to you.</p>
                <div style="background: #f4f7f5; border-radius: 8px; padding: 15px; margin: 20px 0; text-align: center;">
                  <p style="margin: 0; font-size: 12px; color: #666;">Order Number</p>
                  <p style="margin: 5px 0 0 0; font-size: 20px; font-weight: bold; color: #D6A220;">${order.order_number}</p>
                  <span style="display: inline-block; background: #8b5cf6; color: white; padding: 4px 12px; border-radius: 20px; font-size: 12px; margin-top: 10px;">In Transit</span>
                </div>
                ${note ? `
                  <div style="background: #e8f4fd; border-left: 4px solid #2196F3; padding: 15px; margin: 20px 0; border-radius: 4px;">
                    <strong style="color: #1565C0;">📝 Shipping Note:</strong>
                    <p style="margin: 10px 0 0 0; white-space: pre-wrap; color: #1565C0;">${note}</p>
                  </div>
                ` : ''}
                <div style="background: ${isFullyPaid ? '#d1fae5' : '#fee2e2'}; border-left: 4px solid ${isFullyPaid ? '#10b981' : '#ef4444'}; padding: 12px; margin: 15px 0; border-radius: 4px;">
                  <p style="margin: 0; font-size: 14px; color: ${isFullyPaid ? '#065f46' : '#991b1b'};">
                    <strong>Payment Status:</strong> ${paymentStatus}
                  </p>
                  <p style="margin: 8px 0 0 0; font-size: 13px; color: ${isFullyPaid ? '#065f46' : '#991b1b'};">
                    Amount Paid: <strong>R${amountPaid.toFixed(2)}</strong> / Total: <strong>R${totalAmount.toFixed(2)}</strong>
                  </p>
                  ${!isFullyPaid ? `<p style="margin: 8px 0 0 0; font-size: 14px; font-weight: bold; color: #991b1b;">Amount Still Owing: <strong style="font-size: 16px;">R${amountOwing.toFixed(2)}</strong></p>` : ''}
                </div>
                ${!isFullyPaid ? `
                  <div style="background: #fef3c7; border-left: 4px solid #f59e0b; padding: 15px; margin: 20px 0; border-radius: 4px;">
                    <p style="margin: 0 0 10px 0; font-weight: bold; color: #92400e;">⚠️ Payment Outstanding - Please Complete</p>
                    <p style="margin: 5px 0; font-size: 13px; color: #92400e;"><strong>Bank:</strong> FNB</p>
                    <p style="margin: 5px 0; font-size: 13px; color: #92400e;"><strong>Account:</strong> 63173001256</p>
                    <p style="margin: 5px 0; font-size: 13px; color: #92400e;"><strong>E-Wallet:</strong> 083 305 4532</p>
                    <p style="margin: 5px 0; font-size: 13px; color: #dc2626; font-weight: bold;"><strong>Reference:</strong> ${order.order_number}</p>
                  </div>
                ` : ''}
                <div style="background: #e8f5e9; border-radius: 8px; padding: 15px; margin: 20px 0;">
                  <strong style="color: #2E4D38;">Delivery Information</strong>
                  <p style="margin: 10px 0 0 0; color: #333;"><strong>Shipping To:</strong><br>
                  ${order.delivery_complex ? `${order.delivery_complex}<br>` : ''}${order.delivery_address}<br>
                  ${order.delivery_city}, ${order.delivery_province} ${order.delivery_postal_code}</p>
                  <p style="margin: 10px 0 0 0; color: #333;"><strong>Estimated Delivery:</strong> 3-5 business days</p>
                </div>
                <p style="color: #333;">Please ensure someone is available to receive the delivery. You'll receive a final confirmation once your order has been delivered.</p>
              </td>
            </tr>
          `;
          emailContent = getEmailTemplate(contentHtml);
        } else if (new_status === 'delivered') {
          const totalAmount = Number(order.total_amount);
          const amountPaid = Number(order.amount_paid || 0);
          const amountOwing = totalAmount - amountPaid;
          const paymentStatus = order.payment_tracking_status || 'Awaiting payment';
          const isFullyPaid = paymentStatus === 'Fully Paid';
          
          subject = `Order Delivered Successfully! ${order.order_number}`;
          const contentHtml = `
            <tr>
              <td style="padding: 30px;">
                <h2 style="margin: 0 0 20px 0; color: #2E4D38; font-size: 24px;">✅ Delivered!</h2>
                <p style="color: #333; line-height: 1.6;">Hello ${order.customer_name},</p>
                <p style="color: #333; line-height: 1.6;">Your order has been successfully delivered! We hope you're satisfied with your purchase.</p>
                <div style="background: #f4f7f5; border-radius: 8px; padding: 15px; margin: 20px 0; text-align: center;">
                  <p style="margin: 0; font-size: 12px; color: #666;">Order Number</p>
                  <p style="margin: 5px 0 0 0; font-size: 20px; font-weight: bold; color: #D6A220;">${order.order_number}</p>
                  <span style="display: inline-block; background: #10b981; color: white; padding: 4px 12px; border-radius: 20px; font-size: 12px; margin-top: 10px;">Delivered</span>
                </div>
                <div style="background: ${isFullyPaid ? '#d1fae5' : '#fee2e2'}; border-left: 4px solid ${isFullyPaid ? '#10b981' : '#ef4444'}; padding: 12px; margin: 15px 0; border-radius: 4px;">
                  <p style="margin: 0; font-size: 14px; color: ${isFullyPaid ? '#065f46' : '#991b1b'};">
                    <strong>Payment Status:</strong> ${paymentStatus}
                  </p>
                  <p style="margin: 8px 0 0 0; font-size: 13px; color: ${isFullyPaid ? '#065f46' : '#991b1b'};">
                    Amount Paid: <strong>R${amountPaid.toFixed(2)}</strong> / Total: <strong>R${totalAmount.toFixed(2)}</strong>
                  </p>
                  ${!isFullyPaid ? `<p style="margin: 8px 0 0 0; font-size: 14px; font-weight: bold; color: #991b1b;">Amount Still Owing: <strong style="font-size: 16px;">R${amountOwing.toFixed(2)}</strong></p>` : ''}
                </div>
                ${!isFullyPaid ? `
                  <div style="background: #fef3c7; border-left: 4px solid #f59e0b; padding: 15px; margin: 20px 0; border-radius: 4px;">
                    <p style="margin: 0 0 10px 0; font-weight: bold; color: #92400e;">⚠️ Payment Outstanding - Please Complete Immediately</p>
                    <p style="margin: 5px 0; font-size: 13px; color: #92400e;">Your order has been delivered but payment is still outstanding. Please settle the balance as soon as possible.</p>
                    <p style="margin: 10px 0 5px 0; font-size: 13px; color: #92400e;"><strong>Bank:</strong> FNB</p>
                    <p style="margin: 5px 0; font-size: 13px; color: #92400e;"><strong>Account:</strong> 63173001256</p>
                    <p style="margin: 5px 0; font-size: 13px; color: #92400e;"><strong>E-Wallet:</strong> 083 305 4532</p>
                    <p style="margin: 5px 0; font-size: 13px; color: #dc2626; font-weight: bold;"><strong>Reference:</strong> ${order.order_number}</p>
                  </div>
                ` : ''}
                <div style="background: #e8f5e9; border-radius: 8px; padding: 15px; margin: 20px 0;">
                  <strong style="color: #2E4D38;">Thank you for choosing Khanya!</strong>
                  <p style="margin: 10px 0 0 0; color: #333; line-height: 1.6;">We appreciate your business. If you have any questions or concerns about your order, please don't hesitate to reach out.</p>
                </div>
                <p style="color: #333;">We'd love to hear about your experience! If you're satisfied with our service, please consider ordering from us again.</p>
                
                <div style="background: linear-gradient(135deg, #fef9e7 0%, #fff7ed 100%); border: 2px solid #D6A220; border-radius: 12px; padding: 25px; margin: 25px 0; text-align: center;">
                  <p style="margin: 0 0 10px 0; font-size: 20px;">⭐⭐⭐⭐⭐</p>
                  <p style="margin: 0 0 5px 0; font-size: 18px; font-weight: bold; color: #2E4D38;">Enjoyed your experience?</p>
                  <p style="margin: 0 0 15px 0; font-size: 14px; color: #6b7b73;">Your feedback helps other customers find us and helps us improve!</p>
                  <a href="https://www.google.com/search?hl=en-ZA&gl=za&q=Khanya+Clothing+Store,+0A+Jubie+Rd,+Barbeque+Downs,+Midrand,+1684&ludocid=12962748148169130712&lsig=AB86z5XBdMcvSXdinNFyJ3lib1lJ#lrd=0x1e95717a6f700c7d:0xb3e4eec2dc7942d8,3" target="_blank" style="display: inline-block; background: #D6A220; color: white; padding: 14px 28px; text-decoration: none; border-radius: 8px; font-weight: 600; font-size: 16px;">Leave a Google Review</a>
                  <p style="margin: 15px 0 0 0; font-size: 12px; color: #8b7b73;">It only takes a minute and means the world to us! 🙏</p>
                </div>
              </td>
            </tr>
          `;
          emailContent = getEmailTemplate(contentHtml);
        }
        
        // Only send email if we have content
        if (emailContent && subject) {
          const emailPayload: any = {
            from: "Khanya <noreply@mail.khanya.store>",
            to: [order.customer_email],
            subject: subject,
            html: emailContent,
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
        }
        
        console.log(`Status update email sent successfully to ${order.customer_email} for status: ${new_status}`);
        
        // Send SMS notification
        try {
          const twilioAccountSid = Deno.env.get("TWILIO_ACCOUNT_SID");
          const twilioAuthToken = Deno.env.get("TWILIO_AUTH_TOKEN");
          const twilioPhoneNumber = Deno.env.get("TWILIO_PHONE_NUMBER");
          
          if (twilioAccountSid && twilioAuthToken && twilioPhoneNumber) {
            const statusLabel = STATUS_LABELS[new_status] || new_status;
            const paymentStatus = order.payment_tracking_status || 'Awaiting payment';
            
            // Create friendly SMS message based on status (max 150 chars)
            let smsMessage = '';
            
            if (new_status === 'new_order') {
              smsMessage = `Order ${order.order_number} confirmed! ${paymentStatus}. We'll pack once payment clears. Thanks! - Khanya`;
            } else if (new_status === 'packing') {
              smsMessage = `Order ${order.order_number} being packed! ${paymentStatus}. Ships soon! - Khanya`;
            } else if (new_status === 'shipped') {
              smsMessage = `Order ${order.order_number} shipped! ${paymentStatus}. Arrives 3-5 days. - Khanya`;
            } else if (new_status === 'delivered') {
              const reviewUrl = 'http://bit.ly/4pnRo4W';
              if (paymentStatus === 'Fully Paid') {
                smsMessage = `Order ${order.order_number} delivered! Thanks! Review us: ${reviewUrl} - Khanya`;
              } else {
                smsMessage = `Order ${order.order_number} delivered! Pay: FNB 63173001256, Ref: ${order.order_number}. Review: ${reviewUrl} - Khanya`;
              }
            }
            
            const winsmsApiKey = Deno.env.get("WINSMS_API_KEY");
            const winsmsUsername = Deno.env.get("WINSMS_USERNAME");
            
            const formattedPhone = order.customer_phone.replace(/[\s\-\+\(\)]/g, '');
            
            const requestBody = {
              message: smsMessage,
              recipients: [
                {
                  mobileNumber: formattedPhone
                }
              ]
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
            
            if (smsResponse.ok) {
              console.log(`SMS notification sent successfully via WinSMS to ${order.customer_phone} for status: ${new_status}`);
            } else {
              console.error('WinSMS error:', smsResponseData);
            }
          }
        } catch (smsError) {
          console.error("Failed to send SMS notification:", smsError);
          // Don't fail the status update if SMS fails
        }
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

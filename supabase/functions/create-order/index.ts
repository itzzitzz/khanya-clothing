import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.54.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface OrderItem {
  product_id: number;
  product_name: string;
  product_image: string;
  quantity: number;
  price_per_unit: number;
}

interface CreateOrderRequest {
  customer_email: string;
  customer_name: string;
  customer_phone: string;
  delivery_address: string;
  delivery_city: string;
  delivery_province: string;
  delivery_postal_code: string;
  payment_method: string;
  items: OrderItem[];
}

const handler = async (req: Request): Promise<Response> => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const orderData: CreateOrderRequest = await req.json();

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Generate order number
    const { data: orderNumberData, error: orderNumberError } = await supabase
      .rpc("generate_order_number");

    if (orderNumberError) {
      console.error("Error generating order number:", orderNumberError);
      throw orderNumberError;
    }

    const orderNumber = orderNumberData as string;

    // Calculate total
    const totalAmount = orderData.items.reduce(
      (sum, item) => sum + item.price_per_unit * item.quantity,
      0
    );

    // Create order
    const { data: order, error: orderError } = await supabase
      .from("orders")
      .insert({
        order_number: orderNumber,
        customer_email: orderData.customer_email.toLowerCase(),
        customer_name: orderData.customer_name,
        customer_phone: orderData.customer_phone,
        delivery_address: orderData.delivery_address,
        delivery_city: orderData.delivery_city,
        delivery_province: orderData.delivery_province,
        delivery_postal_code: orderData.delivery_postal_code,
        payment_method: orderData.payment_method,
        total_amount: totalAmount,
      })
      .select()
      .single();

    if (orderError) {
      console.error("Error creating order:", orderError);
      throw orderError;
    }

    // Create order items
    const orderItems = orderData.items.map((item) => ({
      order_id: order.id,
      product_id: item.product_id,
      product_name: item.product_name,
      product_image: item.product_image,
      quantity: item.quantity,
      price_per_unit: item.price_per_unit,
      subtotal: item.price_per_unit * item.quantity,
    }));

    const { error: itemsError } = await supabase
      .from("order_items")
      .insert(orderItems);

    if (itemsError) {
      console.error("Error creating order items:", itemsError);
      throw itemsError;
    }

    // Fetch bale numbers and stock item details for the ordered items
    const baleIds = orderData.items.map(item => item.product_id);
    const { data: balesData } = await supabase
      .from("bales")
      .select("id, bale_number, description")
      .in("id", baleIds);

    const baleNumbersMap = balesData?.reduce((acc, bale) => {
      acc[bale.id] = bale.bale_number;
      return acc;
    }, {} as Record<number, string>) || {};

    // Fetch bale items with stock item details for fulfillment
    const { data: baleItemsData } = await supabase
      .from("bale_items")
      .select(`
        bale_id,
        quantity,
        stock_items (
          name,
          description,
          age_range
        )
      `)
      .in("bale_id", baleIds);

    // Organize stock items by bale
    const stockItemsByBale = baleItemsData?.reduce((acc, baleItem) => {
      if (!acc[baleItem.bale_id]) {
        acc[baleItem.bale_id] = [];
      }
      const stockItem = baleItem.stock_items as any;
      acc[baleItem.bale_id].push({
        name: stockItem.name,
        description: stockItem.description,
        age_range: stockItem.age_range,
        quantity: baleItem.quantity
      });
      return acc;
    }, {} as Record<number, any[]>) || {};

    // Send confirmation emails
    const resendApiKey = Deno.env.get("RESEND_API_KEY");
    if (resendApiKey) {
      try {
        const baseStyles = `
          <style>
            body { font-family: Inter, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, Cantarell, 'Fira Sans', 'Droid Sans', 'Helvetica Neue', Arial, sans-serif; line-height: 1.6; color: #1f2e27; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; background: #faf9f6; }
            .header { background: linear-gradient(135deg, #2E4D38 0%, #234130 100%); color: white; padding: 30px 20px; text-align: center; border-radius: 8px 8px 0 0; }
            .content { background: #ffffff; padding: 30px 20px; border: 1px solid #d9ded6; border-top: none; }
            .order-number { font-size: 18px; font-weight: bold; color: #D6A220; margin: 10px 0; }
            .info-box { background: #f4f7f5; border-left: 4px solid #2E4D38; padding: 15px; margin: 20px 0; border-radius: 4px; }
            .payment-details { background: #fef9e7; border-left: 4px solid #D6A220; padding: 15px; margin: 20px 0; border-radius: 4px; }
            .footer { text-align: center; color: #6b7b73; font-size: 12px; margin-top: 30px; padding: 20px; border-top: 1px solid #d9ded6; }
            table { width: 100%; border-collapse: collapse; margin: 15px 0; }
            th, td { padding: 10px; text-align: left; border-bottom: 1px solid #d9ded6; }
            th { background: #f4f7f5; font-weight: bold; color: #2E4D38; }
            .button { display: inline-block; background: #D6A220; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; margin: 10px 0; font-weight: 600; }
          </style>
        `;

        // Customer confirmation email
        const customerHtml = `
          ${baseStyles}
          <div class="container">
            <div class="header">
              <h1 style="margin: 0; font-size: 28px;">Order Confirmed!</h1>
            </div>
            <div class="content">
              <p>Hello ${orderData.customer_name},</p>
              <p>Thank you for your order! We've received your order and will begin processing it once payment is confirmed.</p>
              <div class="order-number">Order Number: ${orderNumber}</div>
              
              <table>
                <thead>
                  <tr>
                    <th>Item</th>
                    <th>Qty</th>
                    <th>Price</th>
                    <th>Total</th>
                  </tr>
                </thead>
                <tbody>
                  ${orderData.items.map(item => `
                    <tr>
                      <td>${item.product_name}</td>
                      <td>${item.quantity}</td>
                      <td>R${item.price_per_unit.toFixed(2)}</td>
                      <td>R${(item.price_per_unit * item.quantity).toFixed(2)}</td>
                    </tr>
                  `).join('')}
                  <tr style="font-weight: bold; background: #f9fafb;">
                    <td colspan="3">Total Amount:</td>
                    <td>R${totalAmount.toFixed(2)}</td>
                  </tr>
                </tbody>
              </table>
              
              ${orderData.payment_method === 'eft' ? `
                <div class="payment-details">
                  <h3 style="margin-top: 0; color: #2E4D38;">EFT Payment Details</h3>
                  <p>Please deposit <strong>R${totalAmount.toFixed(2)}</strong> into the following account and send proof of payment to <strong>sales@khanya.store</strong>:</p>
                  <p><strong>Bank:</strong> First National Bank (FNB)<br>
                  <strong>Branch Code:</strong> 250655<br>
                  <strong>Account Number:</strong> 63173001256<br>
                  <strong>Reference:</strong> ${orderNumber}</p>
                  <p><em>Important: Please use your order number ${orderNumber} as the payment reference.</em></p>
                  <p style="margin-top: 10px; font-size: 13px;">Your order will be packed and couriered as soon as payment has reflected. You will be kept up to date on the status of your order by email.</p>
                </div>
              ` : ''}
              
              ${orderData.payment_method === 'fnb_ewallet' ? `
                <div class="payment-details">
                  <h3 style="margin-top: 0;">FNB e-Wallet Payment Details</h3>
                  <p>Please send <strong>R${totalAmount.toFixed(2)}</strong> via FNB e-Wallet to:</p>
                  <p><strong>Cell Number:</strong> 0821234567<br>
                  <strong>Reference:</strong> ${orderNumber}</p>
                  <p><em>Important: Please use your order number as the payment reference.</em></p>
                </div>
              ` : ''}
              
              <div class="info-box">
                <strong>What happens next?</strong>
                <p style="margin: 10px 0 0 0;">Once we confirm your payment, we'll start preparing your bales for shipment. You'll receive email updates at each step of the process.</p>
              </div>
              
              <p><strong>Delivery Address:</strong><br>
              ${orderData.delivery_address}<br>
              ${orderData.delivery_city}, ${orderData.delivery_province} ${orderData.delivery_postal_code}</p>
              
              <p style="color: #059669; font-weight: bold;">✓ FREE delivery to anywhere in South Africa!</p>
            </div>
            <div class="footer">
              <p>Questions? Contact us at <a href="mailto:sales@khanya.store">sales@khanya.store</a></p>
              <p>© ${new Date().getFullYear()} Khanya. All rights reserved.</p>
            </div>
          </div>
        `;

        // Sales notification email
        const salesHtml = `
          ${baseStyles}
          <style>
            .stock-breakdown { background: #f0f9ff; border: 2px solid #3b82f6; padding: 15px; margin: 15px 0; border-radius: 6px; }
            .stock-breakdown h4 { margin: 0 0 10px 0; color: #1e40af; font-size: 16px; }
            .stock-item { padding: 8px; margin: 5px 0; background: white; border-left: 3px solid #60a5fa; border-radius: 3px; }
            .stock-item-name { font-weight: bold; color: #1e3a8a; }
            .stock-item-qty { display: inline-block; background: #dbeafe; color: #1e40af; padding: 2px 8px; border-radius: 3px; font-weight: bold; margin-left: 8px; }
            .packing-header { background: #fef3c7; border: 2px solid #f59e0b; padding: 12px; margin: 20px 0; border-radius: 6px; text-align: center; }
          </style>
          <div class="container">
            <div class="header">
              <h1 style="margin: 0; font-size: 28px;">New Order Received!</h1>
            </div>
            <div class="content">
              <div class="order-number">Order Number: ${orderNumber}</div>
              
              <h3>Customer Information</h3>
              <p><strong>Name:</strong> ${orderData.customer_name}<br>
              <strong>Email:</strong> ${orderData.customer_email}<br>
              <strong>Phone:</strong> ${orderData.customer_phone}</p>
              
              <div class="packing-header">
                <strong style="color: #92400e; font-size: 16px;">⚠️ PACKING LIST - STOCK ITEMS TO INCLUDE IN EACH BALE</strong>
              </div>
              
              ${orderData.items.map(item => {
                const stockItems = stockItemsByBale[item.product_id] || [];
                return `
                  <div class="stock-breakdown">
                    <h4>📦 ${baleNumbersMap[item.product_id] || 'N/A'} - ${item.product_name}</h4>
                    <p style="margin: 5px 0 10px 0; font-size: 13px; color: #64748b;">Quantity ordered: ${item.quantity}</p>
                    ${stockItems.length > 0 ? `
                      <div style="margin-top: 10px;">
                        <strong style="color: #1e40af;">Stock items to pack:</strong>
                        ${stockItems.map(stockItem => `
                          <div class="stock-item">
                            <span class="stock-item-name">${stockItem.name}</span>
                            <span class="stock-item-qty">${stockItem.quantity}x</span>
                            ${stockItem.age_range ? `<span style="font-size: 12px; color: #64748b; margin-left: 8px;">(${stockItem.age_range})</span>` : ''}
                            ${stockItem.description ? `<div style="font-size: 12px; color: #64748b; margin-top: 4px;">${stockItem.description}</div>` : ''}
                          </div>
                        `).join('')}
                      </div>
                    ` : '<p style="color: #ef4444;">⚠️ No stock items found for this bale!</p>'}
                  </div>
                `;
              }).join('')}
              
              <h3>Order Summary</h3>
              <table>
                <thead>
                  <tr>
                    <th>Bale #</th>
                    <th>Item</th>
                    <th>Qty</th>
                    <th>Price</th>
                    <th>Total</th>
                  </tr>
                </thead>
                <tbody>
                  ${orderData.items.map(item => `
                    <tr>
                      <td style="font-family: monospace; font-size: 11px;">${baleNumbersMap[item.product_id] || 'N/A'}</td>
                      <td>${item.product_name}</td>
                      <td>${item.quantity}</td>
                      <td>R${item.price_per_unit.toFixed(2)}</td>
                      <td>R${(item.price_per_unit * item.quantity).toFixed(2)}</td>
                    </tr>
                  `).join('')}
                  <tr style="font-weight: bold; background: #f9fafb;">
                    <td colspan="4">Total Amount:</td>
                    <td>R${totalAmount.toFixed(2)}</td>
                  </tr>
                </tbody>
              </table>
              
              <div class="info-box">
                <strong>Payment Method:</strong> ${orderData.payment_method.replace(/_/g, " ").toUpperCase()}<br>
                <strong>Payment Status:</strong> Pending
              </div>
              
              <h3>Delivery Address</h3>
              <p>${orderData.delivery_address}<br>
              ${orderData.delivery_city}, ${orderData.delivery_province} ${orderData.delivery_postal_code}</p>
            </div>
            <div class="footer">
              <p>View order details in the admin panel</p>
              <p>© ${new Date().getFullYear()} Khanya. All rights reserved.</p>
            </div>
          </div>
        `;

        // Send customer confirmation email
        await fetch("https://api.resend.com/emails", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${resendApiKey}`,
          },
          body: JSON.stringify({
            from: "Khanya <noreply@mail.khanya.store>",
            to: [orderData.customer_email],
            subject: `Order Confirmation - ${orderNumber}`,
            html: customerHtml,
          }),
        });

        // Send sales notification email
        await fetch("https://api.resend.com/emails", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${resendApiKey}`,
          },
          body: JSON.stringify({
            from: "Khanya <noreply@mail.khanya.store>",
            to: ["orders@khanya.store"],
            subject: `New Order - ${orderNumber}`,
            html: salesHtml,
          }),
        });

        console.log("Order confirmation emails sent successfully");
      } catch (emailError) {
        console.error("Failed to send confirmation emails:", emailError);
        // Don't fail the order creation if email fails
      }
    }

    console.log("Order created successfully:", orderNumber);

    return new Response(
      JSON.stringify({ 
        success: true, 
        order_number: orderNumber,
        order_id: order.id,
        total_amount: totalAmount
      }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error: any) {
    console.error("Error in create-order:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
};

serve(handler);

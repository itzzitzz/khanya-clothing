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
  delivery_complex?: string;
  delivery_address: string;
  delivery_city: string;
  delivery_province: string;
  delivery_postal_code: string;
  payment_method: string;
  items: OrderItem[];
  is_paid?: boolean; // Flag for card payments that are already paid
  paystack_reference?: string;
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

    // Determine payment status based on is_paid flag (for card payments)
    const isPaid = orderData.is_paid === true;
    const paymentTrackingStatus = isPaid ? 'Fully Paid' : 'Awaiting payment';
    const amountPaid = isPaid ? totalAmount : 0;

    // Create order
    const { data: order, error: orderError } = await supabase
      .from("orders")
      .insert({
        order_number: orderNumber,
        customer_email: orderData.customer_email.toLowerCase(),
        customer_name: orderData.customer_name,
        customer_phone: orderData.customer_phone,
        delivery_complex: orderData.delivery_complex || null,
        delivery_address: orderData.delivery_address,
        delivery_city: orderData.delivery_city,
        delivery_province: orderData.delivery_province,
        delivery_postal_code: orderData.delivery_postal_code,
        payment_method: orderData.payment_method,
        total_amount: totalAmount,
        payment_tracking_status: paymentTrackingStatus,
        amount_paid: amountPaid,
        payment_status: isPaid ? 'paid' : 'pending',
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
        // Customer confirmation email - different content based on payment status
        const paymentStatusHtml = isPaid 
          ? `<div style="background: #d1fae5; border-left: 4px solid #10b981; padding: 12px; margin: 15px 0; border-radius: 4px;">
              <p style="margin: 0; font-size: 14px; color: #065f46;">
                <strong>Payment Status:</strong> <span style="background: #a7f3d0; padding: 4px 8px; border-radius: 4px; font-weight: bold;">✓ Fully Paid</span>
              </p>
              <p style="margin: 8px 0 0 0; font-size: 13px; color: #065f46;">
                Amount Paid: <strong>R${totalAmount.toFixed(2)}</strong>
              </p>
            </div>`
          : `<div style="background: #fef3c7; border-left: 4px solid #f59e0b; padding: 12px; margin: 15px 0; border-radius: 4px;">
              <p style="margin: 0; font-size: 14px; color: #92400e;">
                <strong>Payment Status:</strong> <span style="background: #fde68a; padding: 4px 8px; border-radius: 4px; font-weight: bold;">Awaiting payment</span>
              </p>
              <p style="margin: 8px 0 0 0; font-size: 13px; color: #92400e;">
                Amount Due: <strong>R${totalAmount.toFixed(2)}</strong>
              </p>
            </div>`;

        const introText = isPaid
          ? `Thank you for your order and payment! We've received everything and will start preparing your bales for shipment right away.`
          : `Thank you for your order! We've received your order and will begin processing it once payment is confirmed.`;

        const customerHtml = `
          <div style="max-width: 600px; margin: 0 auto; padding: 20px; background: #faf9f6; font-family: Inter, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, Cantarell, 'Fira Sans', 'Droid Sans', 'Helvetica Neue', Arial, sans-serif;">
            <div style="background: linear-gradient(135deg, #2E4D38 0%, #234130 100%); color: white; padding: 30px 20px; text-align: center; border-radius: 8px 8px 0 0;">
              <h1 style="margin: 0; font-size: 28px;">${isPaid ? 'Order Confirmed & Paid!' : 'Order Confirmed!'}</h1>
            </div>
            <div style="background: #ffffff; padding: 30px 20px; border: 1px solid #d9ded6; border-top: none;">
              <p style="line-height: 1.6; color: #1f2e27;">Hello ${orderData.customer_name},</p>
              <p style="line-height: 1.6; color: #1f2e27;">${introText}</p>
              <div style="font-size: 18px; font-weight: bold; color: #D6A220; margin: 10px 0;">Order Number: ${orderNumber}</div>
              
              ${paymentStatusHtml}
              
              <table style="width: 100%; border-collapse: collapse; margin: 15px 0;">
                <thead>
                  <tr>
                    <th style="padding: 10px; text-align: left; border-bottom: 1px solid #d9ded6; background: #f4f7f5; font-weight: bold; color: #2E4D38;">Item</th>
                    <th style="padding: 10px; text-align: left; border-bottom: 1px solid #d9ded6; background: #f4f7f5; font-weight: bold; color: #2E4D38;">Qty</th>
                    <th style="padding: 10px; text-align: left; border-bottom: 1px solid #d9ded6; background: #f4f7f5; font-weight: bold; color: #2E4D38;">Price</th>
                    <th style="padding: 10px; text-align: left; border-bottom: 1px solid #d9ded6; background: #f4f7f5; font-weight: bold; color: #2E4D38;">Total</th>
                  </tr>
                </thead>
                <tbody>
                  ${orderData.items.map(item => `
                    <tr>
                      <td style="padding: 10px; text-align: left; border-bottom: 1px solid #d9ded6;">${item.product_name}</td>
                      <td style="padding: 10px; text-align: left; border-bottom: 1px solid #d9ded6;">${item.quantity}</td>
                      <td style="padding: 10px; text-align: left; border-bottom: 1px solid #d9ded6;">R${item.price_per_unit.toFixed(2)}</td>
                      <td style="padding: 10px; text-align: left; border-bottom: 1px solid #d9ded6;">R${(item.price_per_unit * item.quantity).toFixed(2)}</td>
                    </tr>
                  `).join('')}
                  <tr style="font-weight: bold; background: #f9fafb;">
                    <td colspan="3" style="padding: 10px; text-align: left; border-bottom: 1px solid #d9ded6;">Total Amount:</td>
                    <td style="padding: 10px; text-align: left; border-bottom: 1px solid #d9ded6;">R${totalAmount.toFixed(2)}</td>
                  </tr>
                </tbody>
              </table>
              
              ${!isPaid && orderData.payment_method === 'eft' ? `
                <div style="background: #fef9e7; border-left: 4px solid #D6A220; padding: 15px; margin: 20px 0; border-radius: 4px;">
                  <h3 style="margin-top: 0; color: #2E4D38;">EFT Payment Details</h3>
                  <p style="line-height: 1.6; color: #1f2e27;">Please deposit <strong>R${totalAmount.toFixed(2)}</strong> into the following account and send proof of payment to <strong>sales@khanya.store</strong>:</p>
                  <p style="line-height: 1.6; color: #1f2e27;"><strong>Bank:</strong> First National Bank (FNB)<br>
                  <strong>Branch Code:</strong> 250655<br>
                  <strong>Account Number:</strong> 63173001256<br>
                  <strong>Reference:</strong> ${orderNumber}</p>
                  <p style="line-height: 1.6; color: #1f2e27;"><em>Important: Please use your order number ${orderNumber} as the payment reference.</em></p>
                  <p style="margin-top: 15px; line-height: 1.6; color: #1f2e27;"><strong>Alternatively</strong>, we can also accept a payment by FNB E-Wallet to <strong>083 305 4532</strong>. Please send the proof of an E-Wallet payment to <strong>083 305 4532</strong> via WhatsApp or SMS and include the order number <strong>${orderNumber}</strong></p>
                  <p style="margin-top: 10px; font-size: 13px; line-height: 1.6; color: #1f2e27;">Your order will be packed and couriered as soon as payment has reflected. You will be kept up to date on the status of your order by email.</p>
                </div>
              ` : ''}
              
              ${!isPaid && orderData.payment_method === 'fnb_ewallet' ? `
                <div style="background: #fef9e7; border-left: 4px solid #D6A220; padding: 15px; margin: 20px 0; border-radius: 4px;">
                  <h3 style="margin-top: 0; color: #2E4D38;">FNB E-Wallet Payment Details</h3>
                  <p style="line-height: 1.6; color: #1f2e27;">Please send <strong>R${totalAmount.toFixed(2)}</strong> via FNB E-Wallet to:</p>
                  <p style="line-height: 1.6; color: #1f2e27;"><strong>Cell Number:</strong> 083 305 4532<br>
                  <strong>Reference:</strong> ${orderNumber}</p>
                  <p style="line-height: 1.6; color: #1f2e27;"><em>Important: Please use your order number as the payment reference.</em></p>
                </div>
              ` : ''}
              
              <div style="background: #f4f7f5; border-left: 4px solid #2E4D38; padding: 15px; margin: 20px 0; border-radius: 4px;">
                <strong>What happens next?</strong>
                <p style="margin: 10px 0 0 0; line-height: 1.6; color: #1f2e27;">${isPaid ? `We'll start preparing your bales for shipment right away. You'll receive email updates at each step of the process.` : `Once we confirm your payment, we'll start preparing your bales for shipment. You'll receive email updates at each step of the process.`}</p>
              </div>
              
              <p style="line-height: 1.6; color: #1f2e27;"><strong>Delivery Address:</strong><br>
              ${orderData.delivery_complex ? `${orderData.delivery_complex}<br>` : ''}${orderData.delivery_address}<br>
              ${orderData.delivery_city}, ${orderData.delivery_province} ${orderData.delivery_postal_code}</p>
              
              <p style="color: #059669; font-weight: bold; line-height: 1.6;">✓ FREE delivery to anywhere in South Africa!</p>
            </div>
            <div style="text-align: center; color: #6b7b73; font-size: 12px; margin-top: 30px; padding: 20px; border-top: 1px solid #d9ded6;">
              <p>Questions? Contact us at <a href="mailto:sales@khanya.store" style="color: #2E4D38;">sales@khanya.store</a></p>
              <p>© ${new Date().getFullYear()} Khanya. All rights reserved.</p>
            </div>
          </div>
        `;

        // Sales notification email
        const salesHtml = `
          <div style="max-width: 600px; margin: 0 auto; padding: 20px; background: #faf9f6; font-family: Inter, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, Cantarell, 'Fira Sans', 'Droid Sans', 'Helvetica Neue', Arial, sans-serif;">
            <div style="background: linear-gradient(135deg, #2E4D38 0%, #234130 100%); color: white; padding: 30px 20px; text-align: center; border-radius: 8px 8px 0 0;">
              <h1 style="margin: 0; font-size: 28px;">New Order Received!</h1>
            </div>
            <div style="background: #ffffff; padding: 30px 20px; border: 1px solid #d9ded6; border-top: none;">
              <div style="font-size: 18px; font-weight: bold; color: #D6A220; margin: 10px 0;">Order Number: ${orderNumber}</div>
              
              <h3>Customer Information</h3>
              <p style="line-height: 1.6; color: #1f2e27;"><strong>Name:</strong> ${orderData.customer_name}<br>
              <strong>Email:</strong> ${orderData.customer_email}<br>
              <strong>Phone:</strong> ${orderData.customer_phone}</p>
              
              <div style="background: #fef3c7; border: 2px solid #f59e0b; padding: 12px; margin: 20px 0; border-radius: 6px; text-align: center;">
                <strong style="color: #92400e; font-size: 16px;">⚠️ PACKING LIST - STOCK ITEMS TO INCLUDE IN EACH BALE</strong>
              </div>
              
              ${orderData.items.map(item => {
                const stockItems = stockItemsByBale[item.product_id] || [];
                return `
                  <div style="background: #f0f9ff; border: 2px solid #3b82f6; padding: 15px; margin: 15px 0; border-radius: 6px;">
                    <h4 style="margin: 0 0 10px 0; color: #1e40af; font-size: 16px;">📦 ${baleNumbersMap[item.product_id] || 'N/A'} - ${item.product_name}</h4>
                    <p style="margin: 5px 0 10px 0; font-size: 13px; color: #64748b;">Quantity ordered: ${item.quantity}</p>
                    ${stockItems.length > 0 ? `
                      <div style="margin-top: 10px;">
                        <strong style="color: #1e40af;">Stock items to pack:</strong>
                        ${stockItems.map(stockItem => `
                          <div style="padding: 8px; margin: 5px 0; background: white; border-left: 3px solid #60a5fa; border-radius: 3px;">
                            <span style="font-weight: bold; color: #1e3a8a;">${stockItem.name}</span>
                            <span style="display: inline-block; background: #dbeafe; color: #1e40af; padding: 2px 8px; border-radius: 3px; font-weight: bold; margin-left: 8px;">${stockItem.quantity}x</span>
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
              <table style="width: 100%; border-collapse: collapse; margin: 15px 0;">
                <thead>
                  <tr>
                    <th style="padding: 10px; text-align: left; border-bottom: 1px solid #d9ded6; background: #f4f7f5; font-weight: bold; color: #2E4D38;">Bale #</th>
                    <th style="padding: 10px; text-align: left; border-bottom: 1px solid #d9ded6; background: #f4f7f5; font-weight: bold; color: #2E4D38;">Item</th>
                    <th style="padding: 10px; text-align: left; border-bottom: 1px solid #d9ded6; background: #f4f7f5; font-weight: bold; color: #2E4D38;">Qty</th>
                    <th style="padding: 10px; text-align: left; border-bottom: 1px solid #d9ded6; background: #f4f7f5; font-weight: bold; color: #2E4D38;">Price</th>
                    <th style="padding: 10px; text-align: left; border-bottom: 1px solid #d9ded6; background: #f4f7f5; font-weight: bold; color: #2E4D38;">Total</th>
                  </tr>
                </thead>
                <tbody>
                  ${orderData.items.map(item => `
                    <tr>
                      <td style="padding: 10px; text-align: left; border-bottom: 1px solid #d9ded6; font-family: monospace; font-size: 11px;">${baleNumbersMap[item.product_id] || 'N/A'}</td>
                      <td style="padding: 10px; text-align: left; border-bottom: 1px solid #d9ded6;">${item.product_name}</td>
                      <td style="padding: 10px; text-align: left; border-bottom: 1px solid #d9ded6;">${item.quantity}</td>
                      <td style="padding: 10px; text-align: left; border-bottom: 1px solid #d9ded6;">R${item.price_per_unit.toFixed(2)}</td>
                      <td style="padding: 10px; text-align: left; border-bottom: 1px solid #d9ded6;">R${(item.price_per_unit * item.quantity).toFixed(2)}</td>
                    </tr>
                  `).join('')}
                  <tr style="font-weight: bold; background: #f9fafb;">
                    <td colspan="4" style="padding: 10px; text-align: left; border-bottom: 1px solid #d9ded6;">Total Amount:</td>
                    <td style="padding: 10px; text-align: left; border-bottom: 1px solid #d9ded6;">R${totalAmount.toFixed(2)}</td>
                  </tr>
                </tbody>
              </table>
              
              <div style="background: #f4f7f5; border-left: 4px solid #2E4D38; padding: 15px; margin: 20px 0; border-radius: 4px;">
                <strong>Payment Method:</strong> ${orderData.payment_method.replace(/_/g, " ").toUpperCase()}<br>
                <strong>Payment Status:</strong> ${isPaid ? '✅ PAID' : 'Pending'}
              </div>
              
              <h3>Delivery Address</h3>
              <p style="line-height: 1.6; color: #1f2e27;">${orderData.delivery_complex ? `${orderData.delivery_complex}<br>` : ''}${orderData.delivery_address}<br>
              ${orderData.delivery_city}, ${orderData.delivery_province} ${orderData.delivery_postal_code}</p>
            </div>
            <div style="text-align: center; color: #6b7b73; font-size: 12px; margin-top: 30px; padding: 20px; border-top: 1px solid #d9ded6;">
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

    // Send SMS notification to sales team
    try {
      const accountSid = Deno.env.get("TWILIO_ACCOUNT_SID");
      const authToken = Deno.env.get("TWILIO_AUTH_TOKEN");
      const twilioPhone = Deno.env.get("TWILIO_PHONE_NUMBER");

      const winsmsApiKey = Deno.env.get("WINSMS_API_KEY");
      const winsmsUsername = Deno.env.get("WINSMS_USERNAME");

      if (winsmsApiKey && winsmsUsername) {
        const smsMessage = `NEW ORDER ${orderNumber}! ${orderData.customer_name}, R${totalAmount.toFixed(2)}, ${orderData.payment_method.toUpperCase()}`;

        const requestBody = {
          message: smsMessage,
          recipients: [
            {
              mobileNumber: "27828521112"
            }
          ]
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

        const smsResponseData = await smsResponse.json();

        if (smsResponse.ok) {
          console.log("SMS notification sent to sales team via WinSMS");
        } else {
          console.error("Failed to send SMS notification via WinSMS:", smsResponseData);
        }
      }
    } catch (smsError) {
      console.error("Error sending SMS notification:", smsError);
      // Don't fail the order creation if SMS fails
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

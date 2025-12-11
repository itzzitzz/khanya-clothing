import { useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { Loader2 } from 'lucide-react';
import khanyaLogo from '@/assets/khanya-logo.png';

const Invoice = () => {
  const [searchParams] = useSearchParams();
  const orderId = searchParams.get('orderId');
  const [order, setOrder] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchOrderDetails = async () => {
      if (!orderId) {
        console.error('No orderId provided');
        setLoading(false);
        return;
      }

      try {
        console.log('Fetching order with ID:', orderId);
        
        const { data: { session } } = await supabase.auth.getSession();
        if (!session) {
          console.error('No active session');
          setLoading(false);
          return;
        }

        const { data: orderData, error: orderError } = await supabase
          .from('orders')
          .select(`
            *,
            order_items (
              *
            )
          `)
          .eq('id', orderId)
          .maybeSingle();

        if (orderError) {
          console.error('Order fetch error:', orderError);
          throw orderError;
        }

        if (!orderData) {
          console.error('No order found with ID:', orderId);
          setLoading(false);
          return;
        }

        console.log('Order fetched successfully:', orderData);

        // Fetch bale details for each order item
        const itemsWithBaleDetails = await Promise.all(
          (orderData.order_items || []).map(async (item: any) => {
            const { data: baleData } = await supabase
              .from('bales')
              .select(`
                id,
                bale_number,
                description,
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
          })
        );

        setOrder({
          ...orderData,
          order_items: itemsWithBaleDetails
        });
      } catch (error: any) {
        console.error('Error fetching order:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchOrderDetails();
  }, [orderId]);

  useEffect(() => {
    // Trigger print dialog after content loads
    if (!loading && order) {
      setTimeout(() => {
        window.print();
      }, 500);
    }
  }, [loading, order]);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  if (!order) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <p>Order not found</p>
      </div>
    );
  }

  const orderDate = new Date(order.created_at).toLocaleDateString('en-ZA', { 
    year: 'numeric', 
    month: 'long', 
    day: 'numeric' 
  });

  const getPaymentStatusDisplay = () => {
    if (order.payment_tracking_status === 'Fully Paid') {
      return 'FULLY PAID';
    } else if (order.payment_tracking_status === 'Partially Paid') {
      return `PARTIALLY PAID (R${Number(order.amount_paid || 0).toFixed(2)} / R${Number(order.total_amount).toFixed(2)})`;
    } else {
      return 'AWAITING PAYMENT';
    }
  };

  return (
    <div className="max-w-4xl mx-auto p-8 bg-white text-black print:p-12">
      <style>
        {`
          @media print {
            body * {
              visibility: hidden;
            }
            .print-container, .print-container * {
              visibility: visible;
            }
            .print-container {
              position: absolute;
              left: 0;
              top: 0;
              width: 100%;
            }
            @page {
              margin: 1.5cm;
            }
          }
        `}
      </style>

      <div className="print-container">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-5xl font-bold text-gray-900 mb-4">INVOICE</h1>
          <img src={khanyaLogo} alt="Khanya Logo" className="w-24 h-24 object-contain mx-auto mb-4" />
        </div>

        {/* Company & Invoice Details */}
        <div className="grid grid-cols-2 gap-8 mb-8">
          <div>
            <h2 className="text-2xl font-bold text-gray-900 mb-2">Khanya</h2>
            <p className="text-sm text-gray-600">sales@khanya.store</p>
            <p className="text-sm text-gray-600">www.khanya.store</p>
            <p className="text-sm text-gray-600">WhatsApp: 083 305 4532</p>
          </div>

          <div className="text-right">
            <p className="text-sm mb-1"><strong className="text-gray-900">Invoice Number:</strong> {order.order_number}</p>
            <p className="text-sm mb-1"><strong className="text-gray-900">Date:</strong> {orderDate}</p>
            <p className="text-sm mb-1">
              <strong className="text-gray-900">Payment Status:</strong>{' '}
              <span className={`font-bold ${
                order.payment_tracking_status === 'Fully Paid' 
                  ? 'text-green-600' 
                  : order.payment_tracking_status === 'Partially Paid'
                  ? 'text-blue-600'
                  : 'text-yellow-600'
              }`}>
                {getPaymentStatusDisplay()}
              </span>
            </p>
          </div>
        </div>

        {/* Bill To Section */}
        <div className="mb-8 bg-gray-50 p-4 rounded">
          <h3 className="text-base font-bold mb-3 text-gray-900">BILL TO:</h3>
          <p className="text-sm font-semibold">{order.customer_name}</p>
          <p className="text-sm">{order.customer_email}</p>
          <p className="text-sm">{order.customer_phone}</p>
        </div>

        {/* Delivery Address */}
        <div className="mb-8 bg-gray-50 p-4 rounded">
          <h3 className="text-base font-bold mb-3 text-gray-900">DELIVERY ADDRESS:</h3>
          {order.delivery_complex && <p className="text-sm">{order.delivery_complex}</p>}
          <p className="text-sm">{order.delivery_address}</p>
          <p className="text-sm">{order.delivery_city}, {order.delivery_province} {order.delivery_postal_code}</p>
        </div>

        {/* Invoice Items Table */}
        <table className="w-full border-collapse mb-8">
          <thead>
            <tr className="bg-gray-100">
              <th className="text-left py-3 px-3 text-sm font-bold text-gray-900 border-b-2 border-gray-300">Item</th>
              <th className="text-center py-3 px-3 text-sm font-bold text-gray-900 border-b-2 border-gray-300">Qty</th>
              <th className="text-right py-3 px-3 text-sm font-bold text-gray-900 border-b-2 border-gray-300">Price</th>
              <th className="text-right py-3 px-3 text-sm font-bold text-gray-900 border-b-2 border-gray-300">Total</th>
            </tr>
          </thead>
          <tbody>
            {order.order_items?.map((item: any) => {
              const baleItems = item.bale_details?.bale_items || [];
              const itemsSubtotal = baleItems.reduce((sum: number, bi: any) => 
                sum + (bi.stock_items?.selling_price || 0) * bi.quantity, 0);
              const baleDiscount = itemsSubtotal - item.price_per_unit;
              const hasDiscount = baleDiscount > 0;
              
              return (
                <tbody key={item.id}>
                  <tr>
                    <td colSpan={4} className="py-4 px-3 font-bold text-sm bg-gray-50 text-gray-900 border-b border-gray-200">
                      {item.product_name} (x{item.quantity})
                    </td>
                  </tr>
                  {baleItems.map((baleItem: any) => (
                    <tr key={baleItem.id}>
                      <td className="py-2 px-6 text-xs border-b border-gray-100">{baleItem.stock_items?.name || 'Item'}</td>
                      <td className="text-center py-2 px-3 text-xs border-b border-gray-100">{baleItem.quantity}</td>
                      <td className="text-right py-2 px-3 text-xs border-b border-gray-100">R{(baleItem.stock_items?.selling_price || 0).toFixed(2)}</td>
                      <td className="text-right py-2 px-3 text-xs border-b border-gray-100">R{((baleItem.stock_items?.selling_price || 0) * baleItem.quantity).toFixed(2)}</td>
                    </tr>
                  ))}
                  {hasDiscount && (
                    <>
                      <tr className="bg-yellow-50">
                        <td colSpan={3} className="py-2 px-6 text-xs italic text-yellow-800 border-b border-yellow-200">Individual Items Subtotal:</td>
                        <td className="py-2 px-3 text-xs text-right text-yellow-800 border-b border-yellow-200">R{itemsSubtotal.toFixed(2)}</td>
                      </tr>
                      <tr className="bg-green-50">
                        <td colSpan={3} className="py-2 px-6 text-xs font-bold text-green-800 border-b border-green-200">Bale Discount per unit:</td>
                        <td className="py-2 px-3 text-xs text-right font-bold text-green-800 border-b border-green-200">-R{baleDiscount.toFixed(2)}</td>
                      </tr>
                    </>
                  )}
                  <tr className="bg-gray-100">
                    <td colSpan={3} className="py-3 px-3 text-sm font-bold border-b border-gray-300">Bale Price (x{item.quantity}):</td>
                    <td className="py-3 px-3 text-sm text-right font-bold border-b border-gray-300">R{Number(item.subtotal).toFixed(2)}</td>
                  </tr>
                </tbody>
              );
            })}
            <tr className="bg-gray-900 text-white">
              <td colSpan={3} className="py-4 px-3 text-base font-bold">TOTAL</td>
              <td className="py-4 px-3 text-base text-right font-bold">R{Number(order.total_amount).toFixed(2)}</td>
            </tr>
          </tbody>
        </table>

        {/* Payment Information */}
        {order.payment_tracking_status !== 'Fully Paid' && (
          <div className="mb-8 bg-yellow-50 border-l-4 border-yellow-400 p-4 rounded">
            <h3 className="text-base font-bold mb-3 text-gray-900">PAYMENT INFORMATION</h3>
            <div className="space-y-2 text-sm">
              <p><strong>Amount Due:</strong> R{(Number(order.total_amount) - Number(order.amount_paid || 0)).toFixed(2)}</p>
              {Number(order.amount_paid || 0) > 0 && (
                <p><strong>Amount Paid:</strong> R{Number(order.amount_paid).toFixed(2)}</p>
              )}
              <p className="mt-3"><strong>Payment Methods:</strong></p>
              <div className="ml-4">
                <p><strong>EFT:</strong> FNB Account 63173001256</p>
                <p><strong>E-Wallet:</strong> 083 305 4532</p>
                <p><strong>Reference:</strong> {order.order_number}</p>
              </div>
            </div>
          </div>
        )}

        {/* VAT Notice */}
        <div className="bg-yellow-50 border-l-4 border-yellow-400 p-4 rounded mb-8 text-center">
          <p className="text-xs text-gray-700">This invoice does not include VAT. Khanya is not VAT registered.</p>
        </div>

        {/* Footer */}
        <div className="border-t-2 border-gray-300 pt-6 text-center">
          <p className="text-sm font-semibold mb-2">Thank you for your business!</p>
          <p className="text-xs text-gray-600">© {new Date().getFullYear()} Khanya. All rights reserved.</p>
          <p className="text-xs text-gray-600 mt-2">For queries, contact us at sales@khanya.store or WhatsApp 083 305 4532</p>
        </div>
      </div>
    </div>
  );
};

export default Invoice;

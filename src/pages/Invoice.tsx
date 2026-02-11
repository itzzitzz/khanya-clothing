import React, { useEffect, useState } from 'react';
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
    <div className="bg-white text-black">
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
              size: A4 portrait;
              margin: 15mm;
            }
          }
          .a4-page {
            width: 210mm;
            min-height: 297mm;
            margin: 0 auto;
            padding: 15mm;
            box-sizing: border-box;
          }
          @media screen {
            .a4-page {
              border: 1px solid #ccc;
              margin-bottom: 20px;
              background: white;
            }
          }
        `}
      </style>

      {/* Back to Admin Button */}
      <div className="no-print fixed top-4 right-4 z-50">
        <button
          onClick={() => window.location.href = '/admin'}
          className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-lg shadow-lg font-semibold"
        >
          ← Back to Admin
        </button>
      </div>

      <div className="print-container">
        <div className="a4-page">
          {/* Header */}
          <div className="flex items-start justify-between border-b-2 border-gray-800 pb-4 mb-6">
            <div className="flex items-center gap-4">
              <img src={khanyaLogo} alt="Khanya Logo" className="w-16 h-16 object-contain" />
              <div>
                <h1 className="text-2xl font-bold text-gray-900">Khanya</h1>
                <p className="text-xs text-gray-600">sales@khanya.store</p>
                <p className="text-xs text-gray-600">www.khanya.store</p>
                <p className="text-xs text-gray-600">WhatsApp: 083 305 4532</p>
              </div>
            </div>
            <div className="text-right">
              <h2 className="text-3xl font-bold text-gray-900 mb-2">INVOICE</h2>
              <p className="text-sm"><strong>Invoice #:</strong> {order.order_number}</p>
              <p className="text-sm"><strong>Date:</strong> {orderDate}</p>
              <p className="text-sm">
                <strong>Status:</strong>{' '}
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

          {/* Bill To & Delivery */}
          <div className="grid grid-cols-2 gap-6 mb-6">
            <div className="bg-gray-50 p-3 rounded">
              <h3 className="text-xs font-bold mb-2 text-gray-900 uppercase">Bill To</h3>
              <p className="text-sm font-semibold">{order.customer_name}</p>
              <p className="text-xs">{order.customer_email}</p>
              <p className="text-xs">{order.customer_phone}</p>
            </div>
            <div className="bg-gray-50 p-3 rounded">
              <h3 className="text-xs font-bold mb-2 text-gray-900 uppercase">Delivery Address</h3>
              {order.delivery_complex && <p className="text-xs">{order.delivery_complex}</p>}
              <p className="text-xs">{order.delivery_address}</p>
              <p className="text-xs">{order.delivery_city}, {order.delivery_province} {order.delivery_postal_code}</p>
            </div>
          </div>

          {/* Invoice Items Table */}
          <table className="w-full border-collapse mb-6" style={{ tableLayout: 'fixed' }}>
            <colgroup>
              <col style={{ width: '50%' }} />
              <col style={{ width: '10%' }} />
              <col style={{ width: '20%' }} />
              <col style={{ width: '20%' }} />
            </colgroup>
            <thead>
              <tr className="bg-gray-800 text-white">
                <th className="text-left py-2 px-3 text-xs font-bold">Item</th>
                <th className="text-center py-2 px-3 text-xs font-bold">Qty</th>
                <th className="text-right py-2 px-3 text-xs font-bold">Price</th>
                <th className="text-right py-2 px-3 text-xs font-bold">Total</th>
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
                  <React.Fragment key={item.id}>
                    <tr>
                      <td colSpan={4} className="py-2 px-3 font-bold text-xs bg-gray-100 text-gray-900 border-b border-gray-300">
                        {item.product_name} (x{item.quantity})
                      </td>
                    </tr>
                    {baleItems.map((baleItem: any) => (
                      <tr key={baleItem.id}>
                        <td className="py-1 px-3 pl-6 text-xs border-b border-gray-100">{baleItem.stock_items?.name || 'Item'}</td>
                        <td className="text-center py-1 px-3 text-xs border-b border-gray-100">{baleItem.quantity}</td>
                        <td className="text-right py-1 px-3 text-xs border-b border-gray-100">R{(baleItem.stock_items?.selling_price || 0).toFixed(2)}</td>
                        <td className="text-right py-1 px-3 text-xs border-b border-gray-100">R{((baleItem.stock_items?.selling_price || 0) * baleItem.quantity).toFixed(2)}</td>
                      </tr>
                    ))}
                    {hasDiscount && (
                      <>
                        <tr className="bg-yellow-50">
                          <td colSpan={3} className="py-1 px-3 pl-6 text-xs italic text-yellow-800 border-b border-yellow-200">Individual Items Subtotal:</td>
                          <td className="py-1 px-3 text-xs text-right text-yellow-800 border-b border-yellow-200">R{itemsSubtotal.toFixed(2)}</td>
                        </tr>
                        <tr className="bg-green-50">
                          <td colSpan={3} className="py-1 px-3 pl-6 text-xs font-bold text-green-800 border-b border-green-200">Bale Discount per unit:</td>
                          <td className="py-1 px-3 text-xs text-right font-bold text-green-800 border-b border-green-200">-R{baleDiscount.toFixed(2)}</td>
                        </tr>
                      </>
                    )}
                    <tr className="bg-gray-100">
                      <td colSpan={3} className="py-2 px-3 text-xs font-bold border-b border-gray-300">Bale Price (x{item.quantity}):</td>
                      <td className="py-2 px-3 text-xs text-right font-bold border-b border-gray-300">R{Number(item.subtotal).toFixed(2)}</td>
                    </tr>
                  </React.Fragment>
                );
              })}
            </tbody>
            <tfoot>
              <tr className="bg-gray-800 text-white">
                <td colSpan={3} className="py-3 px-3 text-sm font-bold">TOTAL</td>
                <td className="py-3 px-3 text-sm text-right font-bold">R{Number(order.total_amount).toFixed(2)}</td>
              </tr>
            </tfoot>
          </table>

          {/* Payment Information */}
          {order.payment_tracking_status !== 'Fully Paid' && (
            <div className="mb-6 bg-yellow-50 border-l-4 border-yellow-400 p-3 rounded text-sm">
              <h3 className="text-xs font-bold mb-2 text-gray-900 uppercase">Payment Information</h3>
              <p><strong>Amount Due:</strong> R{(Number(order.total_amount) - Number(order.amount_paid || 0)).toFixed(2)}</p>
              {Number(order.amount_paid || 0) > 0 && (
                <p><strong>Amount Paid:</strong> R{Number(order.amount_paid).toFixed(2)}</p>
              )}
              <p className="mt-2"><strong>EFT:</strong> FNB Account 63173001256 &nbsp;|&nbsp; <strong>E-Wallet:</strong> 083 305 4532 &nbsp;|&nbsp; <strong>Ref:</strong> {order.order_number}</p>
            </div>
          )}

          {/* VAT Notice */}
          <div className="bg-yellow-50 border-l-4 border-yellow-400 p-2 rounded mb-6 text-center">
            <p className="text-xs text-gray-700">This invoice does not include VAT. Khanya is not VAT registered.</p>
          </div>

          {/* Footer */}
          <div className="border-t-2 border-gray-300 pt-4 text-center">
            <p className="text-sm font-semibold mb-1">Thank you for your business!</p>
            <p className="text-xs text-gray-600">© {new Date().getFullYear()} Khanya · sales@khanya.store · WhatsApp 083 305 4532</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Invoice;

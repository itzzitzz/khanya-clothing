import { useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { Loader2 } from 'lucide-react';
import khanyaLogo from '@/assets/khanya-logo.png';

const PrintOrder = () => {
  const [searchParams] = useSearchParams();
  const orderId = searchParams.get('orderId');
  const [order, setOrder] = useState<any>(null);
  const [bales, setBales] = useState<any[]>([]);
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

        // Fetch order with items
        const { data: orderData, error: orderError } = await supabase
          .from('orders')
          .select(`
            *,
            order_items (
              *
            )
          `)
          .eq('id', orderId)
          .single();

        if (orderError) throw orderError;
        if (!orderData) {
          console.error('No order found');
          setLoading(false);
          return;
        }

        setOrder(orderData);

        // Fetch bale details for each order item
        const balePromises = orderData.order_items.map(async (item: any) => {
          const { data: baleData } = await supabase
            .from('bales')
            .select(`
              id,
              bale_number,
              description,
              product_categories (
                name
              ),
              bale_items (
                id,
                quantity,
                stock_items (
                  id,
                  name,
                  description,
                  age_range
                )
              )
            `)
            .eq('id', item.product_id)
            .maybeSingle();

          return { item, bale: baleData };
        });

        const baleResults = await Promise.all(balePromises);
        setBales(baleResults.filter(b => b.bale));

        console.log('Order and bales fetched successfully');
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
      }, 1000);
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

  const calculateTotalItems = (baleItems: any[]) => {
    return baleItems.reduce((sum, item) => sum + item.quantity, 0);
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
              margin: 1.5cm;
            }
            .page-break {
              page-break-after: always;
              break-after: page;
            }
          }
        `}
      </style>

      <div className="print-container">
        {/* Packing Lists - One per bale */}
        {bales.map(({ item, bale }, index) => (
          <div key={bale.id} className={index < bales.length ? 'page-break' : ''}>
            <div className="max-w-4xl mx-auto p-8">
              {/* Header with Branding */}
              <div className="border-b-2 border-gray-800 pb-6 mb-6">
                <div className="flex items-start gap-4">
                  <img src={khanyaLogo} alt="Khanya Logo" className="w-24 h-24 object-contain" />
                  <div>
                    <h1 className="text-4xl font-bold text-gray-900 mb-2">Khanya</h1>
                    <p className="text-lg text-gray-600 mb-3">Quality Clothing Bales</p>
                    <div className="space-y-1 text-sm">
                      <p className="flex items-center gap-2">
                        <span className="font-semibold">🌐 Website:</span>
                        <span className="text-blue-600">www.khanya.store</span>
                      </p>
                      <p className="flex items-center gap-2">
                        <span className="font-semibold">📧 Email:</span>
                        <span>sales@khanya.store</span>
                      </p>
                      <p className="flex items-center gap-2">
                        <span className="font-semibold">📱 WhatsApp:</span>
                        <span>083 305 4532</span>
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Bale Information */}
              <div className="mb-6 bg-gray-50 p-4 rounded">
                <h3 className="text-lg font-bold mb-2">
                  {bale.product_categories?.name || item.product_name}
                </h3>
                {bale.description && (
                  <p className="text-sm text-gray-600">{bale.description}</p>
                )}
              </div>

              {/* Bale Contents Table */}
              <div className="border-2 border-gray-800 rounded-lg p-4">
                <h3 className="text-xl font-bold mb-4 bg-gray-800 text-white p-3 -m-4 mb-4 rounded-t-lg">
                  STOCK ITEMS IN THIS BALE
                </h3>

                {bale.bale_items && bale.bale_items.length > 0 && (
                  <div>
                    <table className="w-full">
                      <thead>
                        <tr className="border-b-2 border-gray-300">
                          <th className="text-left py-2 font-semibold">Item Name</th>
                          <th className="text-left py-2 font-semibold">Description</th>
                          <th className="text-center py-2 font-semibold">Qty</th>
                        </tr>
                      </thead>
                      <tbody>
                        {bale.bale_items.map((baleItem: any) => {
                          const stockItem = baleItem.stock_items;
                          return (
                            <tr key={baleItem.id} className="border-b border-gray-200">
                              <td className="py-2">
                                <p className="font-medium">{stockItem?.name}</p>
                                {stockItem?.age_range && (
                                  <p className="text-xs text-gray-500">{stockItem.age_range}</p>
                                )}
                              </td>
                              <td className="py-2 text-sm text-gray-600">
                                {stockItem?.description || '-'}
                              </td>
                              <td className="py-2 text-center font-semibold">
                                {baleItem.quantity}
                              </td>
                            </tr>
                          );
                        })}
                        <tr className="border-t-2 border-gray-800 font-bold">
                          <td className="py-3" colSpan={2}>
                            TOTAL ITEMS IN BALE
                          </td>
                          <td className="py-3 text-center text-lg">
                            {calculateTotalItems(bale.bale_items)}
                          </td>
                        </tr>
                      </tbody>
                    </table>
                  </div>
                )}
              </div>

              {/* Footer */}
              <div className="mt-8 pt-4 border-t border-gray-300">
                <div className="text-center mb-4">
                  <p className="text-sm text-gray-600 mb-2">Quality clothing at great prices</p>
                  <div className="flex items-center justify-center gap-6 text-sm font-semibold">
                    <span className="text-blue-600">📱 WhatsApp Us</span>
                    <span className="text-gray-400">|</span>
                    <span className="text-blue-600">🌐 www.khanya.store</span>
                    <span className="text-gray-400">|</span>
                    <span className="text-blue-600">📧 sales@khanya.store</span>
                  </div>
                </div>
                <div className="bg-gray-800 text-white text-center py-3 rounded-b">
                  <p className="font-bold text-lg">Thank you for choosing Khanya!</p>
                  <p className="text-sm">Visit www.khanya.store for more great deals</p>
                </div>
              </div>
            </div>
          </div>
        ))}

        {/* Invoice Page */}
        <div className="page-break">
          <div className="max-w-4xl mx-auto p-8">
            {/* Invoice content - reuse from Invoice.tsx */}
            <div className="border-b-2 border-gray-800 pb-6 mb-6">
              <div className="flex items-start justify-between">
                <div className="flex items-start gap-4">
                  <img src={khanyaLogo} alt="Khanya Logo" className="w-24 h-24 object-contain" />
                  <div>
                    <h1 className="text-4xl font-bold text-gray-900 mb-2">Khanya</h1>
                    <p className="text-lg text-gray-600">Quality Clothing Bales</p>
                  </div>
                </div>
                <div className="text-right">
                  <h2 className="text-2xl font-bold mb-2">INVOICE</h2>
                  <p className="text-sm text-gray-600">Order #: {order.order_number}</p>
                  <p className="text-sm text-gray-600">
                    Date: {new Date(order.created_at).toLocaleDateString()}
                  </p>
                </div>
              </div>
            </div>

            {/* Customer & Delivery Info */}
            <div className="grid grid-cols-2 gap-6 mb-6">
              <div>
                <h3 className="font-bold text-lg mb-2">Bill To:</h3>
                <p className="font-semibold">{order.customer_name}</p>
                <p className="text-sm">{order.customer_email}</p>
                <p className="text-sm">{order.customer_phone}</p>
              </div>
              <div>
                <h3 className="font-bold text-lg mb-2">Ship To:</h3>
                <p className="text-sm">{order.delivery_address}</p>
                <p className="text-sm">{order.delivery_city}, {order.delivery_province}</p>
                <p className="text-sm">{order.delivery_postal_code}</p>
              </div>
            </div>

            {/* Order Items */}
            <div className="border-2 border-gray-800 rounded-lg overflow-hidden mb-6">
              <table className="w-full">
                <thead className="bg-gray-800 text-white">
                  <tr>
                    <th className="text-left py-3 px-4">Item</th>
                    <th className="text-center py-3 px-4">Qty</th>
                    <th className="text-right py-3 px-4">Price</th>
                    <th className="text-right py-3 px-4">Total</th>
                  </tr>
                </thead>
                <tbody>
                  {order.order_items.map((item: any) => (
                    <tr key={item.id} className="border-b border-gray-200">
                      <td className="py-3 px-4">{item.product_name}</td>
                      <td className="text-center py-3 px-4">{item.quantity}</td>
                      <td className="text-right py-3 px-4">R{item.price_per_unit.toFixed(2)}</td>
                      <td className="text-right py-3 px-4">R{item.subtotal.toFixed(2)}</td>
                    </tr>
                  ))}
                  <tr className="font-bold bg-gray-50">
                    <td colSpan={3} className="text-right py-3 px-4">TOTAL:</td>
                    <td className="text-right py-3 px-4">R{order.total_amount.toFixed(2)}</td>
                  </tr>
                </tbody>
              </table>
            </div>

            {/* Payment Status */}
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
              <div className="flex justify-between items-center">
                <div>
                  <p className="font-semibold">Payment Status: {order.payment_tracking_status}</p>
                  <p className="text-sm text-gray-600">Amount Paid: R{Number(order.amount_paid || 0).toFixed(2)} / R{Number(order.total_amount).toFixed(2)}</p>
                </div>
                {order.payment_tracking_status !== 'Fully Paid' && (
                  <p className="text-sm font-semibold text-orange-600">
                    Balance Due: R{(Number(order.total_amount) - Number(order.amount_paid || 0)).toFixed(2)}
                  </p>
                )}
              </div>
            </div>

            {/* Payment Instructions */}
            {order.payment_tracking_status !== 'Fully Paid' && (
              <div className="border-2 border-gray-800 rounded-lg p-4 mb-6">
                <h3 className="font-bold text-lg mb-3">Payment Instructions</h3>
                <div className="space-y-2 text-sm">
                  <p><strong>Bank:</strong> FNB</p>
                  <p><strong>Account Number:</strong> 63173001256</p>
                  <p><strong>Reference:</strong> {order.order_number}</p>
                  <p className="pt-2 border-t"><strong>OR E-Wallet:</strong> 083 305 4532</p>
                </div>
              </div>
            )}

            {/* Footer */}
            <div className="text-center text-sm text-gray-600">
              <p className="mb-2">Thank you for your business!</p>
              <p>🌐 www.khanya.store | 📧 sales@khanya.store | 📱 083 305 4532</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PrintOrder;
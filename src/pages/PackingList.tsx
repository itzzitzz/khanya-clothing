import { useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { Loader2 } from 'lucide-react';
import khanyaLogo from '@/assets/khanya-logo.png';

const PackingList = () => {
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
        
        // Check authentication first
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
                    description,
                    age_range
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

  const calculateTotalItems = (baleItems: any[]) => {
    return baleItems.reduce((sum, item) => sum + item.quantity, 0);
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
        {/* Header with Branding */}
        <div className="border-b-2 border-gray-800 pb-6 mb-6">
          <div className="flex items-start justify-between mb-4">
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
            <div className="text-right">
              <h2 className="text-2xl font-bold mb-3">PACKING LIST</h2>
              <div className="text-sm space-y-1">
                <div>
                  <p className="font-semibold">Order Number:</p>
                  <p className="text-lg">{order.order_number}</p>
                </div>
                <div>
                  <p className="font-semibold">Date:</p>
                  <p>{new Date(order.created_at).toLocaleDateString()}</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Customer Information */}
        <div className="mb-6 bg-gray-50 p-4 rounded">
          <h2 className="text-lg font-bold mb-3">SHIP TO:</h2>
          <div className="space-y-1">
            <p className="font-semibold">{order.customer_name}</p>
            <p>{order.customer_phone}</p>
            <p>{order.customer_email}</p>
            <p className="mt-2">{order.delivery_address}</p>
            <p>{order.delivery_city}, {order.delivery_province}</p>
            <p>{order.delivery_postal_code}</p>
          </div>
        </div>

        {/* Bales and Contents */}
        <div className="space-y-6">
          <h2 className="text-xl font-bold border-b border-gray-800 pb-2">BALE CONTENTS</h2>
          
          {order.order_items?.map((item: any, index: number) => (
            <div key={item.id} className="border-2 border-gray-800 rounded-lg p-4 page-break-inside-avoid">
              <div className="bg-gray-800 text-white p-3 -m-4 mb-4 rounded-t-lg">
                <div className="flex justify-between items-center">
                  <div>
                    <h3 className="text-lg font-bold">BALE #{index + 1}</h3>
                    {item.bale_details?.bale_number && (
                      <p className="text-sm font-mono">{item.bale_details.bale_number}</p>
                    )}
                  </div>
                  <div className="text-right">
                    <p className="text-sm">Quantity</p>
                    <p className="text-2xl font-bold">{item.quantity}</p>
                  </div>
                </div>
              </div>

              {item.bale_details?.description && (
                <div className="mb-4">
                  <p className="font-semibold text-sm text-gray-600 mb-1">Description:</p>
                  <p className="text-sm">{item.bale_details.description}</p>
                </div>
              )}

              {item.bale_details?.bale_items && item.bale_details.bale_items.length > 0 && (
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
                      {item.bale_details.bale_items.map((baleItem: any) => {
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
                          {calculateTotalItems(item.bale_details.bale_items)}
                        </td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          ))}
        </div>

        {/* Promotions */}
        <div className="mt-8 pt-6 border-t-2 border-gray-800">
          <h3 className="text-xl font-bold mb-4 text-center">EXCLUSIVE PROMOTIONS</h3>
          <div className="grid grid-cols-2 gap-6 mb-6">
            <div className="border-2 border-blue-600 rounded-lg p-4 bg-blue-50">
              <h4 className="font-bold text-lg mb-2 text-blue-800">🎯 Goal Achieved Reward</h4>
              <p className="text-sm mb-3">Place a second order within 1 week of your previous order to receive:</p>
              <div className="bg-white rounded p-3 mb-2">
                <p className="font-bold text-blue-600">10 FREE COAT-HANGERS</p>
                <p className="text-xs text-gray-600 mt-1">Perfect for displaying your clothing professionally</p>
              </div>
            </div>
            
            <div className="border-2 border-green-600 rounded-lg p-4 bg-green-50">
              <h4 className="font-bold text-lg mb-2 text-green-800">📦 Brand Builder Package</h4>
              <p className="text-sm mb-3">Order 8 bales in a month to receive your choice of:</p>
              <div className="bg-white rounded p-3 space-y-2">
                <p className="font-bold text-green-600">8 FREE Khanya Branded Caps</p>
                <p className="text-center font-semibold">OR</p>
                <p className="font-bold text-green-600">8 FREE Khanya Branded T-Shirts</p>
                <p className="text-xs text-gray-600 mt-2">Use yourself or give to your favourite customers!</p>
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="mt-6 pt-4 border-t border-gray-300">
          <div className="text-center mb-4">
            <p className="text-sm text-gray-600 mb-2">Please check all items carefully. Contact us immediately if there are any discrepancies.</p>
            <div className="flex items-center justify-center gap-6 text-sm font-semibold">
              <span className="text-blue-600">📱 WhatsApp Us</span>
              <span className="text-gray-400">|</span>
              <span className="text-blue-600">🌐 www.khanya.store</span>
              <span className="text-gray-400">|</span>
              <span className="text-blue-600">📧 sales@khanya.store</span>
            </div>
          </div>
          <div className="bg-gray-800 text-white text-center py-3 -mx-8 -mb-8 rounded-b">
            <p className="font-bold text-lg">Thank you for choosing Khanya!</p>
            <p className="text-sm">Visit www.khanya.store for more great deals</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PackingList;

import { useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { Loader2 } from 'lucide-react';
import khanyaLogo from '@/assets/khanya-logo.png';

const PrintPackingLists = () => {
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
          .maybeSingle();

        if (orderError) throw orderError;
        
        if (!orderData) {
          setLoading(false);
          return;
        }

        setOrder(orderData);

        // Fetch bale details for each order item
        const balePromises = orderData.order_items.map(async (item: any) => {
          const { data: baleData, error: baleError } = await supabase
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

          if (baleError) {
            console.error(`Error fetching bale ${item.product_id}:`, baleError);
          }

          return { item, bale: baleData };
        });

        const baleResults = await Promise.all(balePromises);
        const validBales = baleResults.filter(b => b.bale);
        setBales(validBales);
      } catch (error: any) {
        console.error('Error fetching order:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchOrderDetails();
  }, [orderId]);

  useEffect(() => {
    if (!loading && order && bales.length > 0) {
      setTimeout(() => {
        window.print();
      }, 800);
    }
  }, [loading, order, bales]);

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
              size: A5 portrait;
              margin: 8mm;
            }
            .page-break {
              page-break-after: always;
              break-after: page;
            }
            .no-print {
              display: none !important;
            }
          }
          
          /* A5 dimensions: 148mm × 210mm */
          .a5-page {
            width: 148mm;
            min-height: 210mm;
            max-height: 210mm;
            overflow: hidden;
            margin: 0 auto;
            padding: 6mm;
            box-sizing: border-box;
          }
          
          @media screen {
            .a5-page {
              border: 1px solid #ccc;
              margin-bottom: 20px;
              background: white;
            }
          }
        `}
      </style>

      {/* Back to Admin Button - Hidden during print */}
      <div className="no-print fixed top-4 right-4 z-50">
        <button
          onClick={() => window.location.href = '/admin'}
          className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-lg shadow-lg font-semibold"
        >
          ← Back to Admin
        </button>
      </div>

      <div className="print-container">
        {bales.map(({ item, bale }, index) => (
          <div 
            key={bale.id} 
            className={`a5-page ${index < bales.length - 1 ? 'page-break' : ''}`}
          >
            {/* Compact Header */}
            <div className="border-b border-gray-400 pb-2 mb-2">
              <div className="flex items-start justify-between gap-2">
                <div className="flex items-center gap-2">
                  <img src={khanyaLogo} alt="Khanya" className="w-10 h-10 object-contain" />
                  <div>
                    <h1 className="text-base font-bold text-gray-900 leading-tight">Khanya</h1>
                    <p className="text-[9px] text-gray-500">www.khanya.store</p>
                  </div>
                </div>
                <div className="text-right text-[9px] leading-tight">
                  <p className="font-semibold text-[10px]">{order.customer_name}</p>
                  <p>{order.customer_phone}</p>
                  <p className="truncate max-w-[100px]">{order.delivery_city}, {order.delivery_province}</p>
                </div>
              </div>
            </div>

            {/* Packing List Title */}
            <div className="mb-2 flex items-center justify-between bg-gray-800 text-white px-2 py-1 rounded">
              <span className="text-[10px] font-bold uppercase">Packing List</span>
              <span className="text-[10px] font-bold truncate max-w-[120px]">{item.product_name}</span>
            </div>

            {/* Bale Contents Table */}
            <div className="border border-gray-400 rounded overflow-hidden">
              {bale.bale_items && bale.bale_items.length > 0 && (
                <table className="w-full text-[9px]">
                  <thead>
                    <tr className="bg-gray-100 border-b border-gray-300">
                      <th className="text-left py-1 px-1.5 font-semibold">Item</th>
                      <th className="text-left py-1 px-1.5 font-semibold">Description</th>
                      <th className="text-center py-1 px-1.5 font-semibold w-8">Qty</th>
                    </tr>
                  </thead>
                  <tbody>
                    {bale.bale_items.map((baleItem: any, idx: number) => {
                      const stockItem = baleItem.stock_items;
                      return (
                        <tr 
                          key={baleItem.id} 
                          className={idx % 2 === 0 ? 'bg-white' : 'bg-gray-50'}
                        >
                          <td className="py-0.5 px-1.5 border-b border-gray-200">
                            <p className="font-medium leading-tight">{stockItem?.name}</p>
                            {stockItem?.age_range && (
                              <p className="text-[8px] text-gray-500">{stockItem.age_range}</p>
                            )}
                          </td>
                          <td className="py-0.5 px-1.5 text-gray-600 border-b border-gray-200 truncate max-w-[80px]">
                            {stockItem?.description || '-'}
                          </td>
                          <td className="py-0.5 px-1.5 text-center font-semibold border-b border-gray-200">
                            {baleItem.quantity}
                          </td>
                        </tr>
                      );
                    })}
                    <tr className="bg-gray-800 text-white font-bold">
                      <td className="py-1 px-1.5" colSpan={2}>
                        TOTAL ITEMS
                      </td>
                      <td className="py-1 px-1.5 text-center text-sm">
                        {calculateTotalItems(bale.bale_items)}
                      </td>
                    </tr>
                  </tbody>
                </table>
              )}
            </div>

            {/* Compact Footer */}
            <div className="mt-2 pt-1 border-t border-gray-300 text-center">
              <p className="text-[8px] text-gray-500">
                📱 083 305 4532 • 🌐 www.khanya.store • 📧 sales@khanya.store
              </p>
              <p className="text-[9px] font-bold text-gray-700 mt-0.5">Thank you for choosing Khanya!</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default PrintPackingLists;

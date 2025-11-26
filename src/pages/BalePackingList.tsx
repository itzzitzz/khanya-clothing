import { useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { Loader2 } from 'lucide-react';
import khanyaLogo from '@/assets/khanya-logo.png';

const BalePackingList = () => {
  const [searchParams] = useSearchParams();
  const baleId = searchParams.get('baleId');
  const [bale, setBale] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchBaleDetails = async () => {
      if (!baleId) {
        console.error('No baleId provided');
        setLoading(false);
        return;
      }

      try {
        console.log('Fetching bale with ID:', baleId);

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
          .eq('id', parseInt(baleId))
          .maybeSingle();

        if (baleError) {
          console.error('Bale fetch error:', baleError);
          throw baleError;
        }

        if (!baleData) {
          console.error('No bale found with ID:', baleId);
          setLoading(false);
          return;
        }

        console.log('Bale fetched successfully:', baleData);
        setBale(baleData);
      } catch (error: any) {
        console.error('Error fetching bale:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchBaleDetails();
  }, [baleId]);

  useEffect(() => {
    // Trigger print dialog after content loads
    if (!loading && bale) {
      setTimeout(() => {
        window.print();
      }, 500);
    }
  }, [loading, bale]);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  if (!bale) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <p>Bale not found</p>
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
            {bale.product_categories?.name || 'Bale'}
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
          <div className="bg-gray-800 text-white text-center py-3 -mx-8 -mb-8 rounded-b">
            <p className="font-bold text-lg">Thank you for choosing Khanya!</p>
            <p className="text-sm">Visit www.khanya.store for more great deals</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default BalePackingList;

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.54.0';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface BaleItem {
  id: number;
  quantity: number;
  line_item_price: number;
  stock_item: {
    id: number;
    name: string;
    description: string;
    age_range: string;
    selling_price: number;
    stock_on_hand: number;
    images: Array<{
      id: number;
      image_url: string;
      is_primary: boolean;
      display_order: number;
    }>;
  };
}

interface Bale {
  id: number;
  description: string;
  actual_selling_price: number;
  recommended_sale_price: number;
  total_cost_price: number;
  bale_profit: number;
  bale_margin_percentage: number;
  display_order: number;
  product_category_id: number;
  quantity_in_stock: number;
  is_in_stock: boolean;
  product_category: {
    id: number;
    name: string;
    description: string;
    display_order: number;
  };
  bale_items: BaleItem[];
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      {
        global: {
          headers: { Authorization: req.headers.get('Authorization')! },
        },
      }
    );

    // Fetch active bales with their product categories
    const { data: bales, error: balesError } = await supabaseClient
      .from('bales')
      .select(`
        id,
        description,
        actual_selling_price,
        recommended_sale_price,
        total_cost_price,
        bale_profit,
        bale_margin_percentage,
        display_order,
        product_category_id,
        quantity_in_stock,
        product_categories (
          id,
          name,
          description,
          display_order
        )
      `)
      .eq('active', true)
      .order('display_order', { ascending: true });

    if (balesError) throw balesError;

    // Fetch bale items with stock item details
    const baleIds = bales?.map(b => b.id) || [];
    
    const { data: baleItems, error: baleItemsError } = await supabaseClient
      .from('bale_items')
      .select(`
        id,
        bale_id,
        quantity,
        line_item_price,
        stock_items (
          id,
          name,
          description,
          age_range,
          selling_price,
          stock_on_hand
        )
      `)
      .in('bale_id', baleIds);

    if (baleItemsError) throw baleItemsError;

    // Fetch stock item images for all stock items
    const stockItemIds = baleItems?.map(bi => (bi.stock_items as any)?.id).filter(Boolean) || [];
    
    const { data: stockImages, error: stockImagesError } = await supabaseClient
      .from('stock_item_images')
      .select('*')
      .in('stock_item_id', stockItemIds)
      .order('display_order', { ascending: true });

    if (stockImagesError) throw stockImagesError;

    // Organize data
    const imagesByStockItem = stockImages?.reduce((acc, img) => {
      if (!acc[img.stock_item_id]) acc[img.stock_item_id] = [];
      acc[img.stock_item_id].push(img);
      return acc;
    }, {} as Record<number, any[]>) || {};

    const itemsByBale = baleItems?.reduce((acc, item) => {
      if (!acc[item.bale_id]) acc[item.bale_id] = [];
      const stockItem = item.stock_items as any;
      acc[item.bale_id].push({
        id: item.id,
        quantity: item.quantity,
        line_item_price: item.line_item_price,
        stock_item: {
          id: stockItem?.id,
          name: stockItem?.name,
          description: stockItem?.description,
          age_range: stockItem?.age_range,
          selling_price: stockItem?.selling_price,
          stock_on_hand: stockItem?.stock_on_hand ?? 0,
          images: imagesByStockItem[stockItem?.id] || []
        }
      });
      return acc;
    }, {} as Record<number, BaleItem[]>) || {};

    // Helper function to check if a bale is in stock
    // A bale is out of stock if any stock item has stock_on_hand < quantity required in the bale
    const checkBaleInStock = (baleItems: BaleItem[]): boolean => {
      if (!baleItems || baleItems.length === 0) return false;
      return baleItems.every(item => item.stock_item.stock_on_hand >= item.quantity);
    };

    // Combine bales with their items
    const balesWithItems: Bale[] = bales?.map(bale => {
      const items = itemsByBale[bale.id] || [];
      return {
        id: bale.id,
        description: bale.description,
        actual_selling_price: bale.actual_selling_price,
        recommended_sale_price: bale.recommended_sale_price,
        total_cost_price: bale.total_cost_price,
        bale_profit: bale.bale_profit,
        bale_margin_percentage: bale.bale_margin_percentage,
        display_order: bale.display_order,
        product_category_id: bale.product_category_id,
        quantity_in_stock: bale.quantity_in_stock,
        is_in_stock: checkBaleInStock(items),
        product_category: (bale.product_categories as any) || {},
        bale_items: items
      };
    }) || [];

    return new Response(
      JSON.stringify({ success: true, bales: balesWithItems }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('Error fetching bales:', error);
    return new Response(
      JSON.stringify({ success: false, error: error.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});

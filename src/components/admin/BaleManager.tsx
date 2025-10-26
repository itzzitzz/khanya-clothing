import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableRow, TableHeader } from "@/components/ui/table";
import { Trash2, Plus } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface StockItem {
  id: number;
  name: string;
  description: string;
  cost_price: number;
  selling_price: number;
}

interface ProductCategory {
  id: number;
  name: string;
  description: string | null;
}

interface BaleItem {
  stock_item_id: number;
  quantity: number;
  stock_item?: StockItem;
}

export const BaleManager = () => {
  const [stockItems, setStockItems] = useState<StockItem[]>([]);
  const [productCategories, setProductCategories] = useState<ProductCategory[]>([]);
  const [baleItems, setBaleItems] = useState<BaleItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedStockItem, setSelectedStockItem] = useState<number>(0);
  const [quantity, setQuantity] = useState<number>(1);
  const [formData, setFormData] = useState({
    product_category_id: 0,
    description: '',
    actual_selling_price: 0,
    display_order: 0
  });
  const { toast } = useToast();

  const loadData = async () => {
    try {
      const [itemsRes, categoriesRes] = await Promise.all([
        supabase.from('stock_items').select('id, name, description, cost_price, selling_price').eq('active', true),
        supabase.from('product_categories').select('*').eq('active', true).order('display_order')
      ]);

      if (itemsRes.data) setStockItems(itemsRes.data);
      if (categoriesRes.data) setProductCategories(categoriesRes.data);
    } catch (error: any) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const addBaleItem = () => {
    if (selectedStockItem === 0 || quantity <= 0) {
      toast({ title: "Error", description: "Please select a stock item and enter quantity", variant: "destructive" });
      return;
    }

    const stockItem = stockItems.find(s => s.id === selectedStockItem);
    if (!stockItem) return;

    const existingItem = baleItems.find(b => b.stock_item_id === selectedStockItem);
    if (existingItem) {
      setBaleItems(baleItems.map(b => 
        b.stock_item_id === selectedStockItem 
          ? { ...b, quantity: b.quantity + quantity }
          : b
      ));
    } else {
      setBaleItems([...baleItems, { 
        stock_item_id: selectedStockItem, 
        quantity,
        stock_item: stockItem 
      }]);
    }

    setSelectedStockItem(0);
    setQuantity(1);
  };

  const removeBaleItem = (stockItemId: number) => {
    setBaleItems(baleItems.filter(b => b.stock_item_id !== stockItemId));
  };

  const calculateTotals = () => {
    let totalCostPrice = 0;
    let recommendedSalePrice = 0;

    baleItems.forEach(item => {
      if (item.stock_item) {
        totalCostPrice += item.stock_item.cost_price * item.quantity;
        recommendedSalePrice += item.stock_item.selling_price * item.quantity;
      }
    });

    const actualSelling = formData.actual_selling_price || recommendedSalePrice;
    const baleProfit = actualSelling - totalCostPrice;
    const baleMargin = totalCostPrice > 0 ? (baleProfit / totalCostPrice) * 100 : 0;

    return {
      totalCostPrice,
      recommendedSalePrice,
      actualSelling,
      baleProfit,
      baleMargin
    };
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (baleItems.length === 0) {
      toast({ title: "Error", description: "Please add at least one item to the bale", variant: "destructive" });
      return;
    }

    try {
      const totals = calculateTotals();

      // Create the bale
      const { data: bale, error: baleError } = await supabase
        .from('bales')
        .insert([{
          product_category_id: formData.product_category_id,
          description: formData.description,
          recommended_sale_price: totals.recommendedSalePrice,
          total_cost_price: totals.totalCostPrice,
          bale_profit: totals.baleProfit,
          bale_margin_percentage: totals.baleMargin,
          actual_selling_price: totals.actualSelling,
          display_order: formData.display_order
        }])
        .select()
        .single();

      if (baleError) throw baleError;

      // Create bale items
      const baleItemsData = baleItems.map(item => ({
        bale_id: bale.id,
        stock_item_id: item.stock_item_id,
        quantity: item.quantity,
        line_item_price: (item.stock_item?.selling_price || 0) * item.quantity
      }));

      const { error: itemsError } = await supabase
        .from('bale_items')
        .insert(baleItemsData);

      if (itemsError) throw itemsError;

      toast({ title: "Success", description: "Bale created successfully" });
      
      // Reset form
      setBaleItems([]);
      setFormData({
        product_category_id: 0,
        description: '',
        actual_selling_price: 0,
        display_order: 0
      });
    } catch (error: any) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    }
  };

  const totals = calculateTotals();

  if (loading) return <div>Loading...</div>;

  return (
    <div className="space-y-6">
      <Card className="p-6">
        <h3 className="text-lg font-semibold mb-4">Build New Bale</h3>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <Label>Product Category</Label>
            <Select 
              value={formData.product_category_id.toString()} 
              onValueChange={(v) => setFormData({ ...formData, product_category_id: parseInt(v) })}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select product category" />
              </SelectTrigger>
              <SelectContent>
                {productCategories.map((cat) => (
                  <SelectItem key={cat.id} value={cat.id.toString()}>{cat.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div>
            <Label>Bale Description</Label>
            <Textarea 
              value={formData.description} 
              onChange={(e) => setFormData({ ...formData, description: e.target.value })} 
              required 
            />
          </div>

          <div>
            <Label>Display Order</Label>
            <Input 
              type="number"
              value={formData.display_order} 
              onChange={(e) => setFormData({ ...formData, display_order: parseInt(e.target.value) })} 
              required 
            />
          </div>

          <Card className="p-4 bg-muted">
            <h4 className="font-semibold mb-3">Add Stock Items</h4>
            <div className="flex gap-2">
              <div className="flex-1">
                <Select 
                  value={selectedStockItem.toString()} 
                  onValueChange={(v) => setSelectedStockItem(parseInt(v))}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select stock item" />
                  </SelectTrigger>
                  <SelectContent>
                    {stockItems.map((item) => (
                      <SelectItem key={item.id} value={item.id.toString()}>
                        {item.name} (R{item.selling_price.toFixed(2)})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="w-24">
                <Input 
                  type="number"
                  min="1"
                  placeholder="Qty"
                  value={quantity} 
                  onChange={(e) => setQuantity(parseInt(e.target.value))} 
                />
              </div>
              <Button type="button" onClick={addBaleItem}>
                <Plus className="h-4 w-4 mr-2" />
                Add
              </Button>
            </div>
          </Card>

          {baleItems.length > 0 && (
            <Card className="p-4">
              <h4 className="font-semibold mb-3">Bale Items</h4>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Item</TableHead>
                    <TableHead>Qty</TableHead>
                    <TableHead>Unit Price</TableHead>
                    <TableHead>Total</TableHead>
                    <TableHead></TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {baleItems.map((item) => (
                    <TableRow key={item.stock_item_id}>
                      <TableCell>
                        <div>
                          <div className="font-medium">{item.stock_item?.name}</div>
                          <div className="text-sm text-muted-foreground truncate max-w-xs">
                            {item.stock_item?.description}
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>{item.quantity}</TableCell>
                      <TableCell>R{item.stock_item?.selling_price.toFixed(2)}</TableCell>
                      <TableCell>R{((item.stock_item?.selling_price || 0) * item.quantity).toFixed(2)}</TableCell>
                      <TableCell>
                        <Button 
                          type="button"
                          size="sm" 
                          variant="destructive" 
                          onClick={() => removeBaleItem(item.stock_item_id)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>

              <div className="mt-4 space-y-2 border-t pt-4">
                <div className="flex justify-between">
                  <span className="font-medium">Total Cost Price:</span>
                  <span>R{totals.totalCostPrice.toFixed(2)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="font-medium">Recommended Sale Price:</span>
                  <span>R{totals.recommendedSalePrice.toFixed(2)}</span>
                </div>
                <div className="flex justify-between items-center">
                  <Label>Actual Selling Price:</Label>
                  <Input 
                    type="number"
                    step="0.01"
                    className="w-40"
                    value={formData.actual_selling_price || totals.recommendedSalePrice} 
                    onChange={(e) => setFormData({ ...formData, actual_selling_price: parseFloat(e.target.value) })} 
                  />
                </div>
                <div className="flex justify-between text-lg font-bold">
                  <span>Bale Profit:</span>
                  <span className={totals.baleProfit >= 0 ? 'text-green-600' : 'text-red-600'}>
                    R{totals.baleProfit.toFixed(2)}
                  </span>
                </div>
                <div className="flex justify-between text-lg font-bold">
                  <span>Bale Margin:</span>
                  <span className={totals.baleMargin >= 0 ? 'text-green-600' : 'text-red-600'}>
                    {totals.baleMargin.toFixed(1)}%
                  </span>
                </div>
              </div>
            </Card>
          )}

          <Button type="submit" disabled={baleItems.length === 0}>
            Create Bale
          </Button>
        </form>
      </Card>
    </div>
  );
};

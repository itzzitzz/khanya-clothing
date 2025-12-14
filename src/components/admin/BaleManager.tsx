import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableRow, TableHeader } from "@/components/ui/table";
import { Trash2, Plus, Edit, Loader2, Printer, GripVertical } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { DndContext, closestCenter, KeyboardSensor, PointerSensor, useSensor, useSensors, DragEndEvent, DragOverlay, DragStartEvent } from '@dnd-kit/core';
import { arrayMove, SortableContext, sortableKeyboardCoordinates, useSortable, verticalListSortingStrategy } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { cn } from "@/lib/utils";

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

interface Bale {
  id: number;
  product_category_id: number;
  description: string;
  recommended_sale_price: number;
  total_cost_price: number;
  bale_profit: number;
  bale_margin_percentage: number;
  actual_selling_price: number;
  display_order: number;
  active: boolean;
  quantity_in_stock: number;
  product_categories?: ProductCategory;
  bale_items?: Array<{
    id: number;
    quantity: number;
    line_item_price: number;
    stock_items?: StockItem;
  }>;
}

export const BaleManager = () => {
  const [stockItems, setStockItems] = useState<StockItem[]>([]);
  const [productCategories, setProductCategories] = useState<ProductCategory[]>([]);
  const [baleItems, setBaleItems] = useState<BaleItem[]>([]);
  const [bales, setBales] = useState<Bale[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [selectedStockItem, setSelectedStockItem] = useState<number>(0);
  const [quantity, setQuantity] = useState<number>(1);
  const [editingBaleId, setEditingBaleId] = useState<number | null>(null);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [baleToDelete, setBaleToDelete] = useState<number | null>(null);
  const [selectedCategoryFilter, setSelectedCategoryFilter] = useState<number>(0);
  const [activeDragId, setActiveDragId] = useState<number | null>(null);
  const [formData, setFormData] = useState({
    product_category_id: 0,
    description: '',
    actual_selling_price: 0,
    display_order: 0,
    quantity_in_stock: 1
  });
  const { toast } = useToast();

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8,
      },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  const loadData = async () => {
    try {
      const [itemsRes, categoriesRes, balesRes] = await Promise.all([
        supabase.from('stock_items').select('id, name, description, cost_price, selling_price').eq('active', true),
        supabase.from('product_categories').select('*').eq('active', true).order('display_order'),
        supabase.from('bales').select(`
          *,
          product_categories(id, name, description),
          bale_items(
            id,
            quantity,
            line_item_price,
            stock_items(id, name, description, cost_price, selling_price)
          )
        `).order('display_order')
      ]);

      if (itemsRes.data) setStockItems(itemsRes.data);
      if (categoriesRes.data) setProductCategories(categoriesRes.data);
      if (balesRes.data) setBales(balesRes.data as Bale[]);
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

    if (submitting) return; // Prevent double submission

    if (baleItems.length === 0) {
      toast({ title: "Error", description: "Please add at least one item to the bale", variant: "destructive" });
      return;
    }

    setSubmitting(true);
    try {
      const totals = calculateTotals();

      if (editingBaleId) {
        // Update existing bale
        const { error: baleError } = await supabase
          .from('bales')
          .update({
            product_category_id: formData.product_category_id,
            description: formData.description,
            recommended_sale_price: totals.recommendedSalePrice,
            total_cost_price: totals.totalCostPrice,
            bale_profit: totals.baleProfit,
            bale_margin_percentage: totals.baleMargin,
            actual_selling_price: totals.actualSelling,
            display_order: formData.display_order,
            quantity_in_stock: formData.quantity_in_stock
          })
          .eq('id', editingBaleId);

        if (baleError) throw baleError;

        // Delete existing bale items
        const { error: deleteError } = await supabase
          .from('bale_items')
          .delete()
          .eq('bale_id', editingBaleId);

        if (deleteError) throw deleteError;

        // Create new bale items
        const baleItemsData = baleItems.map(item => ({
          bale_id: editingBaleId,
          stock_item_id: item.stock_item_id,
          quantity: item.quantity,
          line_item_price: (item.stock_item?.selling_price || 0) * item.quantity
        }));

        const { error: itemsError } = await supabase
          .from('bale_items')
          .insert(baleItemsData);

        if (itemsError) throw itemsError;

        toast({ title: "Success", description: "Bale updated successfully" });
      } else {
        // Create new bale
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
            display_order: formData.display_order,
            quantity_in_stock: formData.quantity_in_stock
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
      }
      
      // Reset form and reload data
      setBaleItems([]);
      setFormData({
        product_category_id: 0,
        description: '',
        actual_selling_price: 0,
        display_order: 0,
        quantity_in_stock: 1
      });
      setEditingBaleId(null);
      await loadData();
    } catch (error: any) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    } finally {
      setSubmitting(false);
    }
  };

  const handleEditBale = (bale: Bale) => {
    setEditingBaleId(bale.id);
    setFormData({
      product_category_id: bale.product_category_id,
      description: bale.description,
      actual_selling_price: bale.actual_selling_price,
      display_order: bale.display_order,
      quantity_in_stock: bale.quantity_in_stock
    });
    
    // Load bale items
    const items: BaleItem[] = bale.bale_items?.map(item => ({
      stock_item_id: item.stock_items?.id || 0,
      quantity: item.quantity,
      stock_item: item.stock_items
    })) || [];
    
    setBaleItems(items);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleDragStart = (event: DragStartEvent) => {
    setActiveDragId(event.active.id as number);
  };

  const handleDragEnd = async (event: DragEndEvent) => {
    const { active, over } = event;
    setActiveDragId(null);

    if (!over || active.id === over.id) return;

    const filteredBales = bales.filter(b => b.product_category_id === selectedCategoryFilter);
    const oldIndex = filteredBales.findIndex(b => b.id === active.id);
    const newIndex = filteredBales.findIndex(b => b.id === over.id);

    if (oldIndex === -1 || newIndex === -1) return;

    const reorderedBales = arrayMove(filteredBales, oldIndex, newIndex);

    // Optimistically update UI
    const updatedBales = bales.map(bale => {
      const newOrderIndex = reorderedBales.findIndex(rb => rb.id === bale.id);
      if (newOrderIndex !== -1) {
        return { ...bale, display_order: newOrderIndex };
      }
      return bale;
    });
    setBales(updatedBales);

    // Update display_order in database
    try {
      const updates = reorderedBales.map((bale, index) => 
        supabase
          .from('bales')
          .update({ display_order: index })
          .eq('id', bale.id)
      );

      await Promise.all(updates);
      toast({ title: "Success", description: "Bale order updated" });
      await loadData();
    } catch (error: any) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
      await loadData(); // Reload to restore correct order
    }
  };

  const handleCancelEdit = () => {
    setEditingBaleId(null);
    setBaleItems([]);
    setFormData({
      product_category_id: 0,
      description: '',
      actual_selling_price: 0,
      display_order: 0,
      quantity_in_stock: 1
    });
  };

  const handleDeleteBale = async () => {
    if (!baleToDelete) return;

    try {
      // Delete bale items first
      const { error: itemsError } = await supabase
        .from('bale_items')
        .delete()
        .eq('bale_id', baleToDelete);

      if (itemsError) throw itemsError;

      // Delete bale
      const { error: baleError } = await supabase
        .from('bales')
        .delete()
        .eq('id', baleToDelete);

      if (baleError) throw baleError;

      toast({ title: "Success", description: "Bale deleted successfully" });
      await loadData();
    } catch (error: any) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    } finally {
      setDeleteDialogOpen(false);
      setBaleToDelete(null);
    }
  };

  const handlePrintBale = (baleId: number) => {
    window.open(`/bale-packing-list?baleId=${baleId}`, '_blank');
  };

  const totals = calculateTotals();

  const filteredBales = bales.filter(b => selectedCategoryFilter === 0 || b.product_category_id === selectedCategoryFilter);
  const isDraggingEnabled = selectedCategoryFilter !== 0;

  if (loading) return <div>Loading...</div>;

  // Sortable Card Component
  const SortableCard = ({ bale, isDraggingEnabled }: { bale: Bale, isDraggingEnabled: boolean }) => {
    const {
      attributes,
      listeners,
      setNodeRef,
      transform,
      transition,
      isDragging,
      isOver,
    } = useSortable({ id: bale.id, disabled: !isDraggingEnabled });

    const style = {
      transform: CSS.Transform.toString(transform),
      transition,
      opacity: isDragging ? 0.4 : 1,
    };

    return (
      <div className="relative">
        {/* Green drop indicator line */}
        {isOver && activeDragId !== bale.id && (
          <div className="absolute -left-2 top-0 bottom-0 w-1 bg-green-500 rounded-full z-50 animate-pulse" />
        )}
        <Card 
          ref={setNodeRef} 
          style={style} 
          className={cn(
            "p-4 space-y-3 relative",
            isDraggingEnabled && "cursor-grab active:cursor-grabbing",
            isDragging && "shadow-2xl ring-2 ring-primary"
          )}
        >
        {isDraggingEnabled && (
          <div 
            {...attributes} 
            {...listeners}
            className="absolute top-2 right-2 text-muted-foreground hover:text-foreground cursor-grab active:cursor-grabbing touch-none"
          >
            <GripVertical className="h-5 w-5" />
          </div>
        )}
        <div className="flex items-start justify-between">
          <div className="flex-1 pr-8">
            <div className="flex items-center gap-2 mb-1">
              <h4 className="font-semibold">{bale.description}</h4>
              {!bale.active && (
                <span className="text-xs bg-muted px-2 py-0.5 rounded">Inactive</span>
              )}
            </div>
            <p className="text-sm text-muted-foreground">
              {bale.product_categories?.name}
            </p>
          </div>
        </div>

        <div className="space-y-1 text-sm">
          {(() => {
            const totalItems = bale.bale_items?.reduce((sum, item) => sum + item.quantity, 0) || 0;
            // Calculate total value using stock item selling prices (source of truth)
            const totalValue = bale.bale_items?.reduce((sum, item) => sum + ((item.stock_items?.selling_price || 0) * item.quantity), 0) || 0;
            const stockItemUnitPrice = totalItems > 0 ? totalValue / totalItems : 0;
            // Recommended price = sum of (selling_price * quantity) for all items
            const recommendedPrice = totalValue;
            return (
              <>
                <div className="flex justify-between">
                  <span className="text-muted-foreground"># items in bale:</span>
                  <span>{totalItems}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">x Item Price:</span>
                  <span>R{stockItemUnitPrice.toFixed(2)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">= Recommended price:</span>
                  <span>R{recommendedPrice.toFixed(2)}</span>
                </div>
              </>
            );
          })()}
          <div className="flex justify-between items-center gap-2">
            <span className="text-muted-foreground">Actual Price:</span>
            <div className="flex items-center gap-1">
              <span className="text-muted-foreground">R</span>
              <Input 
                type="number"
                min="0"
                step="0.01"
                defaultValue={bale.actual_selling_price}
                onBlur={async (e) => {
                  const newPrice = parseFloat(e.target.value) || 0;
                  if (newPrice === bale.actual_selling_price) return;
                  const newProfit = newPrice - bale.total_cost_price;
                  const newMargin = bale.total_cost_price > 0 ? (newProfit / bale.total_cost_price) * 100 : 0;
                  try {
                    const { error } = await supabase
                      .from('bales')
                      .update({ 
                        actual_selling_price: newPrice,
                        bale_profit: newProfit,
                        bale_margin_percentage: newMargin
                      })
                      .eq('id', bale.id);
                    
                    if (error) throw error;
                    
                    await loadData();
                    toast({ title: "Success", description: "Price updated" });
                  } catch (error: any) {
                    toast({ title: "Error", description: error.message, variant: "destructive" });
                  }
                }}
                className="w-24 h-7 text-sm font-semibold"
                onClick={(e) => e.stopPropagation()}
              />
            </div>
          </div>
          <div className="flex justify-between">
            <span className="text-muted-foreground">Profit (Margin):</span>
            <span className={bale.bale_profit >= 0 ? 'text-green-600 font-semibold' : 'text-red-600 font-semibold'}>
              R{bale.bale_profit.toFixed(2)} ({bale.bale_margin_percentage.toFixed(1)}%)
            </span>
          </div>
          
          <div className="border-t pt-2 mt-2">
            <div className="flex justify-between items-center gap-2">
              <span className="text-muted-foreground">Qty in Stock:</span>
              <Input 
                type="number"
                min="0"
                value={bale.quantity_in_stock}
                onChange={async (e) => {
                  const newQty = parseInt(e.target.value) || 0;
                  try {
                    const { error } = await supabase
                      .from('bales')
                      .update({ quantity_in_stock: newQty })
                      .eq('id', bale.id);
                    
                    if (error) throw error;
                    
                    await loadData();
                    toast({ title: "Success", description: "Quantity updated" });
                  } catch (error: any) {
                    toast({ title: "Error", description: error.message, variant: "destructive" });
                  }
                }}
                className="w-20 h-7 text-sm"
                onClick={(e) => e.stopPropagation()}
              />
            </div>
          </div>
        </div>

        <div className="flex gap-2 pt-2">
          <Button 
            size="sm" 
            variant="outline"
            onClick={() => handlePrintBale(bale.id)}
            title="Print Bale Contents"
          >
            <Printer className="h-3 w-3" />
          </Button>
          <Button 
            size="sm" 
            variant="outline" 
            className="flex-1"
            onClick={() => handleEditBale(bale)}
          >
            <Edit className="h-3 w-3 mr-1" />
            Edit
          </Button>
          <Button 
            size="sm" 
            variant="destructive" 
            onClick={() => {
              setBaleToDelete(bale.id);
              setDeleteDialogOpen(true);
            }}
          >
            <Trash2 className="h-3 w-3" />
          </Button>
        </div>
      </Card>
      </div>
    );
  };

  return (
    <div className="space-y-6">
      <Card className="p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold">
            {editingBaleId ? 'Edit Bale' : 'Build New Bale'}
          </h3>
          {editingBaleId && (
            <Button type="button" variant="outline" onClick={handleCancelEdit}>
              Cancel Edit
            </Button>
          )}
        </div>
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

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label>Display Order</Label>
              <Input 
                type="number"
                value={formData.display_order} 
                onChange={(e) => setFormData({ ...formData, display_order: parseInt(e.target.value) })} 
                required 
              />
            </div>
            <div>
              <Label>Quantity in Stock</Label>
              <Input 
                type="number"
                min="0"
                value={formData.quantity_in_stock} 
                onChange={(e) => setFormData({ ...formData, quantity_in_stock: parseInt(e.target.value) || 0 })} 
                required 
              />
            </div>
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
                    {[...stockItems].sort((a, b) => a.name.localeCompare(b.name)).map((item) => (
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

          <Button type="submit" disabled={baleItems.length === 0 || submitting}>
            {submitting ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                {editingBaleId ? 'Updating...' : 'Creating...'}
              </>
            ) : (
              editingBaleId ? 'Update Bale' : 'Create Bale'
            )}
          </Button>
        </form>
      </Card>

      {/* Existing Bales Grid */}
      <Card className="p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold">Existing Bales</h3>
          <div className="w-64">
            <Select 
              value={selectedCategoryFilter.toString()} 
              onValueChange={(v) => setSelectedCategoryFilter(parseInt(v))}
            >
              <SelectTrigger>
                <SelectValue placeholder="Filter by category" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="0">All Categories</SelectItem>
                {productCategories.map((cat) => (
                  <SelectItem key={cat.id} value={cat.id.toString()}>{cat.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>
        
        {isDraggingEnabled && filteredBales.length > 0 && (
          <div className="mb-4 p-3 bg-primary/10 border border-primary/20 rounded-lg text-sm">
            <p className="text-foreground flex items-center gap-2">
              <GripVertical className="h-4 w-4" />
              <span>Drag and drop enabled. Use the grip icon to reorder bales within this category.</span>
            </p>
          </div>
        )}

        {filteredBales.length === 0 ? (
          <p className="text-muted-foreground text-center py-8">No bales found</p>
        ) : (
          <DndContext
            sensors={sensors}
            collisionDetection={closestCenter}
            onDragStart={handleDragStart}
            onDragEnd={handleDragEnd}
          >
            <SortableContext
              items={filteredBales.map(b => b.id)}
              strategy={verticalListSortingStrategy}
            >
              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                {filteredBales.map((bale) => (
                  <SortableCard key={bale.id} bale={bale} isDraggingEnabled={isDraggingEnabled} />
                ))}
              </div>
            </SortableContext>
            <DragOverlay>
              {activeDragId ? (
                <Card className="p-4 opacity-50 shadow-2xl rotate-2">
                  <h4 className="font-semibold">
                    {filteredBales.find(b => b.id === activeDragId)?.description}
                  </h4>
                </Card>
              ) : null}
            </DragOverlay>
          </DndContext>
        )}
      </Card>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently delete this bale and all its items. This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDeleteBale} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

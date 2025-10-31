import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableRow, TableHeader } from "@/components/ui/table";
import { Pencil, Trash2, Upload, ArrowUp, ArrowDown } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { Switch } from "@/components/ui/switch";
import { GenerateSingleImage } from "./GenerateSingleImage";

interface StockItem {
  id: number;
  stock_category_id: number;
  name: string;
  description: string;
  age_range: string | null;
  cost_price: number;
  selling_price: number;
  margin_percentage: number;
  stock_on_hand: number;
  display_order: number;
  active: boolean;
}

interface StockCategory {
  id: number;
  name: string;
}

interface StockItemImage {
  id: number;
  stock_item_id: number;
  image_url: string;
  is_primary: boolean;
  display_order: number;
}

export const StockItemManager = () => {
  const [stockItems, setStockItems] = useState<StockItem[]>([]);
  const [categories, setCategories] = useState<StockCategory[]>([]);
  const [images, setImages] = useState<StockItemImage[]>([]);
  const [imageCounts, setImageCounts] = useState<Record<number, number>>({});
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [editing, setEditing] = useState<StockItem | null>(null);
  const [formData, setFormData] = useState({
    stock_category_id: 0,
    name: '',
    description: '',
    age_range: '',
    cost_price: 0,
    selling_price: 0,
    margin_percentage: 50,
    stock_on_hand: 0,
    active: true
  });
  const { toast } = useToast();

  const loadData = async () => {
    try {
      const [itemsRes, categoriesRes, imagesCountRes] = await Promise.all([
        supabase.from('stock_items').select('*').order('name'),
        supabase.from('stock_categories').select('*').order('name'),
        supabase.from('stock_item_images').select('stock_item_id')
      ]);

      if (itemsRes.data) setStockItems(itemsRes.data);
      if (categoriesRes.data) setCategories(categoriesRes.data);
      
      // Count images per stock item
      if (imagesCountRes.data) {
        const counts: Record<number, number> = {};
        imagesCountRes.data.forEach((img: any) => {
          counts[img.stock_item_id] = (counts[img.stock_item_id] || 0) + 1;
        });
        setImageCounts(counts);
      }
    } catch (error: any) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  const loadImages = async (stockItemId: number) => {
    try {
      const { data } = await supabase
        .from('stock_item_images')
        .select('*')
        .eq('stock_item_id', stockItemId)
        .order('display_order');
      
      if (data) setImages(data);
    } catch (error: any) {
      console.error('Error loading images:', error);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const calculateSellingPrice = (costPrice: number, margin: number) => {
    return costPrice * (1 + margin / 100);
  };

  const calculateMargin = (costPrice: number, sellingPrice: number) => {
    if (costPrice === 0) return 0;
    return ((sellingPrice - costPrice) / costPrice) * 100;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (editing) {
        const { error } = await supabase
          .from('stock_items')
          .update(formData)
          .eq('id', editing.id);
        
        if (error) throw error;
        toast({ title: "Success", description: "Stock item updated" });
      } else {
        const { error } = await supabase
          .from('stock_items')
          .insert([formData]);
        
        if (error) throw error;
        toast({ title: "Success", description: "Stock item created" });
      }
      resetForm();
      loadData();
    } catch (error: any) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    }
  };

  const handleDelete = async (id: number) => {
    if (!confirm('Delete this stock item?')) return;
    
    try {
      const { error } = await supabase
        .from('stock_items')
        .delete()
        .eq('id', id);
      
      if (error) throw error;
      toast({ title: "Success", description: "Stock item deleted" });
      loadData();
    } catch (error: any) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    }
  };

  const handleEdit = (item: StockItem) => {
    setEditing(item);
    setFormData({
      stock_category_id: item.stock_category_id,
      name: item.name,
      description: item.description,
      age_range: item.age_range || '',
      cost_price: item.cost_price,
      selling_price: item.selling_price,
      margin_percentage: item.margin_percentage,
      stock_on_hand: item.stock_on_hand,
      active: item.active
    });
    loadImages(item.id);
  };

  const resetForm = () => {
    setEditing(null);
    setImages([]);
    setFormData({
      stock_category_id: 0,
      name: '',
      description: '',
      age_range: '',
      cost_price: 0,
      selling_price: 0,
      margin_percentage: 50,
      stock_on_hand: 0,
      active: true
    });
  };

  const moveStockItem = async (id: number, direction: 'up' | 'down', categoryId: number) => {
    const categoryItems = stockItems.filter(item => item.stock_category_id === categoryId);
    const index = categoryItems.findIndex(item => item.id === id);
    if (index === -1) return;
    if (direction === 'up' && index === 0) return;
    if (direction === 'down' && index === categoryItems.length - 1) return;

    const newIndex = direction === 'up' ? index - 1 : index + 1;
    const newCategoryItems = [...categoryItems];
    [newCategoryItems[index], newCategoryItems[newIndex]] = [newCategoryItems[newIndex], newCategoryItems[index]];

    try {
      await Promise.all(
        newCategoryItems.map((item, idx) => 
          supabase
            .from('stock_items')
            .update({ display_order: idx })
            .eq('id', item.id)
        )
      );
      
      const updatedItems = stockItems.map(item => {
        const updated = newCategoryItems.find(ci => ci.id === item.id);
        return updated ? { ...item, display_order: newCategoryItems.indexOf(updated) } : item;
      });
      setStockItems(updatedItems);
      toast({ title: "Success", description: "Stock item order updated" });
    } catch (error: any) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    }
  };

  const filteredItems = selectedCategory === 'all' 
    ? stockItems 
    : stockItems.filter(item => item.stock_category_id === parseInt(selectedCategory));

  const groupedItems = filteredItems.reduce((acc, item) => {
    const catId = item.stock_category_id;
    if (!acc[catId]) acc[catId] = [];
    acc[catId].push(item);
    return acc;
  }, {} as Record<number, StockItem[]>);

  const resizeImage = (file: File, maxWidth: number, maxHeight: number): Promise<Blob> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = (e) => {
        const img = new Image();
        img.onload = () => {
          const canvas = document.createElement('canvas');
          let width = img.width;
          let height = img.height;

          // Calculate new dimensions maintaining aspect ratio
          if (width > height) {
            if (width > maxWidth) {
              height = (height * maxWidth) / width;
              width = maxWidth;
            }
          } else {
            if (height > maxHeight) {
              width = (width * maxHeight) / height;
              height = maxHeight;
            }
          }

          canvas.width = width;
          canvas.height = height;

          const ctx = canvas.getContext('2d');
          ctx?.drawImage(img, 0, 0, width, height);

          canvas.toBlob(
            (blob) => {
              if (blob) resolve(blob);
              else reject(new Error('Failed to resize image'));
            },
            'image/jpeg',
            0.85
          );
        };
        img.onerror = reject;
        img.src = e.target?.result as string;
      };
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !editing) return;

    setUploading(true);
    try {
      // Resize image for portrait orientation (max 800px width, 1200px height)
      const resizedBlob = await resizeImage(file, 800, 1200);
      
      const fileExt = 'jpg';
      const fileName = `${Date.now()}-${Math.random().toString(36).substring(7)}.${fileExt}`;
      
      const { data: uploadData, error: uploadError } = await supabase.storage
        .from('product-images')
        .upload(fileName, resizedBlob);

      if (uploadError) throw uploadError;

      const { data: { publicUrl } } = supabase.storage
        .from('product-images')
        .getPublicUrl(fileName);

      const isFirst = images.length === 0;
      const { error } = await supabase
        .from('stock_item_images')
        .insert([{
          stock_item_id: editing.id,
          image_url: publicUrl,
          is_primary: isFirst,
          display_order: images.length
        }]);

      if (error) throw error;
      
      await loadImages(editing.id);
      toast({ title: "Success", description: "Image uploaded" });
    } catch (error: any) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    } finally {
      setUploading(false);
    }
  };

  const handleDeleteImage = async (imageId: number) => {
    if (!confirm('Delete this image?')) return;
    
    try {
      const { error } = await supabase
        .from('stock_item_images')
        .delete()
        .eq('id', imageId);
      
      if (error) throw error;
      if (editing) await loadImages(editing.id);
      toast({ title: "Success", description: "Image deleted" });
    } catch (error: any) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    }
  };

  if (loading) return <div>Loading...</div>;

  return (
    <div className="space-y-6">
      <Card className="p-6">
        <h3 className="text-lg font-semibold mb-4">{editing ? 'Edit' : 'Add'} Stock Item</h3>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <Label>Stock Category</Label>
            <Select 
              value={formData.stock_category_id.toString()} 
              onValueChange={(v) => setFormData({ ...formData, stock_category_id: parseInt(v) })}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select category" />
              </SelectTrigger>
              <SelectContent>
                {categories.map((cat) => (
                  <SelectItem key={cat.id} value={cat.id.toString()}>{cat.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div>
            <Label>Name</Label>
            <Input 
              value={formData.name} 
              onChange={(e) => setFormData({ ...formData, name: e.target.value })} 
              required 
            />
          </div>

          <div>
            <Label>Description</Label>
            <Textarea 
              value={formData.description} 
              onChange={(e) => setFormData({ ...formData, description: e.target.value })} 
              required 
            />
          </div>

          <div>
            <Label>Age Range</Label>
            <Input 
              value={formData.age_range} 
              onChange={(e) => setFormData({ ...formData, age_range: e.target.value })} 
              placeholder="e.g., 0-2 years"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label>Cost Price (R)</Label>
              <Input 
                type="number"
                step="0.01"
                value={formData.cost_price} 
                onChange={(e) => {
                  const costPrice = parseFloat(e.target.value);
                  const sellingPrice = calculateSellingPrice(costPrice, formData.margin_percentage);
                  setFormData({ 
                    ...formData, 
                    cost_price: costPrice,
                    selling_price: sellingPrice
                  });
                }} 
                required 
              />
            </div>

            <div>
              <Label>Margin %</Label>
              <Input 
                type="number"
                step="0.01"
                value={formData.margin_percentage} 
                onChange={(e) => {
                  const margin = parseFloat(e.target.value);
                  const sellingPrice = calculateSellingPrice(formData.cost_price, margin);
                  setFormData({ 
                    ...formData, 
                    margin_percentage: margin,
                    selling_price: sellingPrice
                  });
                }} 
                required 
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label>Selling Price (R)</Label>
              <Input 
                type="number"
                step="0.01"
                value={formData.selling_price} 
                onChange={(e) => {
                  const sellingPrice = parseFloat(e.target.value);
                  const margin = calculateMargin(formData.cost_price, sellingPrice);
                  setFormData({ 
                    ...formData, 
                    selling_price: sellingPrice,
                    margin_percentage: margin
                  });
                }} 
                required 
              />
            </div>

            <div>
              <Label>Stock on Hand</Label>
              <Input 
                type="number"
                value={formData.stock_on_hand} 
                onChange={(e) => setFormData({ ...formData, stock_on_hand: parseInt(e.target.value) })} 
                required 
              />
            </div>
          </div>

          <div className="flex items-center space-x-2">
            <Switch
              checked={formData.active}
              onCheckedChange={(checked) => setFormData({ ...formData, active: checked })}
            />
            <Label>Active</Label>
          </div>

          {editing && (
            <div className="space-y-4">
              <Label>Stock Item Images</Label>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <div className="flex gap-2">
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handleFileUpload}
                      className="hidden"
                      id="image-upload"
                    />
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => document.getElementById('image-upload')?.click()}
                      disabled={uploading}
                      className="w-full"
                    >
                      <Upload className="h-4 w-4 mr-2" />
                      {uploading ? 'Uploading...' : 'Upload Image'}
                    </Button>
                  </div>
                </div>

                <GenerateSingleImage
                  stockItemId={editing.id}
                  stockItemName={formData.name}
                  stockItemDescription={formData.description}
                  categoryName={categories.find(c => c.id === formData.stock_category_id)?.name || ''}
                  ageRange={formData.age_range}
                  onImageGenerated={() => loadImages(editing.id)}
                />
              </div>

              {images.length > 0 && (
                <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4 mt-4">
                  {images.map((img) => (
                    <div key={img.id} className="relative border rounded overflow-hidden">
                      <div className="aspect-square w-full bg-gray-50">
                        <img 
                          src={img.image_url} 
                          alt="Stock item" 
                          className="w-full h-full object-contain" 
                        />
                      </div>
                      <Button
                        type="button"
                        size="sm"
                        variant="destructive"
                        className="absolute top-2 right-2"
                        onClick={() => handleDeleteImage(img.id)}
                      >
                        <Trash2 className="h-3 w-3" />
                      </Button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          <div className="flex gap-2">
            <Button type="submit">
              {editing ? 'Update' : 'Create'}
            </Button>
            {editing && (
              <Button type="button" variant="outline" onClick={resetForm}>
                Cancel
              </Button>
            )}
          </div>
        </form>
      </Card>

      <Card className="p-6">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-lg font-semibold">Stock Items</h3>
          <div className="flex items-center gap-2">
            <Label>Filter:</Label>
            <Select value={selectedCategory} onValueChange={setSelectedCategory}>
              <SelectTrigger className="w-[200px]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Showing All</SelectItem>
                {categories.map((cat) => (
                  <SelectItem key={cat.id} value={cat.id.toString()}>{cat.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        {Object.entries(groupedItems).map(([categoryId, items]) => {
          const category = categories.find(c => c.id === parseInt(categoryId));
          return (
            <div key={categoryId} className="mb-8">
              <h4 className="text-md font-semibold mb-2 text-muted-foreground">{category?.name}</h4>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Name</TableHead>
                    <TableHead>Description</TableHead>
                    <TableHead>Age Range</TableHead>
                    <TableHead>Cost</TableHead>
                    <TableHead>Selling</TableHead>
                    <TableHead>Margin %</TableHead>
                    <TableHead>Stock</TableHead>
                    <TableHead>Photos</TableHead>
                    <TableHead>Active</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {items.map((item, index) => (
                    <TableRow key={item.id}>
                      <TableCell className="font-medium">{item.name}</TableCell>
                      <TableCell className="max-w-xs truncate">{item.description}</TableCell>
                      <TableCell>{item.age_range || '-'}</TableCell>
                      <TableCell>R{item.cost_price.toFixed(2)}</TableCell>
                      <TableCell>R{item.selling_price.toFixed(2)}</TableCell>
                      <TableCell>{item.margin_percentage.toFixed(1)}%</TableCell>
                      <TableCell>{item.stock_on_hand}</TableCell>
                      <TableCell>{imageCounts[item.id] || 0}</TableCell>
                      <TableCell>{item.active ? '✓' : '✗'}</TableCell>
                      <TableCell>
                        <div className="flex gap-2">
                          <Button 
                            size="sm" 
                            variant="outline" 
                            onClick={() => moveStockItem(item.id, 'up', item.stock_category_id)}
                            disabled={index === 0}
                          >
                            <ArrowUp className="h-4 w-4" />
                          </Button>
                          <Button 
                            size="sm" 
                            variant="outline" 
                            onClick={() => moveStockItem(item.id, 'down', item.stock_category_id)}
                            disabled={index === items.length - 1}
                          >
                            <ArrowDown className="h-4 w-4" />
                          </Button>
                          <Button size="sm" variant="outline" onClick={() => handleEdit(item)}>
                            <Pencil className="h-4 w-4" />
                          </Button>
                          <Button size="sm" variant="destructive" onClick={() => handleDelete(item.id)}>
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          );
        })}
      </Card>
    </div>
  );
};

import { useState, useEffect, useRef } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Pencil, Trash2, Upload } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { Switch } from "@/components/ui/switch";

interface Product {
  id: number;
  category_id: number;
  name: string;
  description: string;
  image_path: string;
  image_alt_text: string;
  quantity_per_10kg: number;
  price_per_10kg: number;
  price_per_piece: number;
  age_range: string | null;
  display_order: number;
  is_active: number;
}

interface Category {
  id: number;
  name: string;
}

interface ProductImage {
  id: number;
  product_id: number;
  image_path: string;
  display_order: number;
}

export const ProductManager = () => {
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [productImages, setProductImages] = useState<ProductImage[]>([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [editing, setEditing] = useState<Product | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [formData, setFormData] = useState({
    category_id: 0,
    name: '',
    description: '',
    image_path: '',
    image_alt_text: '',
    quantity_per_10kg: 0,
    price_per_10kg: 0,
    price_per_piece: 0,
    age_range: '',
    display_order: 0,
    is_active: true
  });
  const { toast } = useToast();

  const loadData = async () => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      
      const [productsRes, categoriesRes] = await Promise.all([
        supabase.functions.invoke('manage-products', {
          body: { action: 'list' },
          headers: { Authorization: `Bearer ${session?.access_token}` }
        }),
        supabase.functions.invoke('manage-categories', {
          body: { action: 'list' },
          headers: { Authorization: `Bearer ${session?.access_token}` }
        })
      ]);

      if (productsRes.data?.success) setProducts(productsRes.data.products);
      if (categoriesRes.data?.success) setCategories(categoriesRes.data.categories);
    } catch (error: any) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  const loadProductImages = async (productId: number) => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      const response = await supabase.functions.invoke('manage-product-images', {
        body: { action: 'list', product_id: productId },
        headers: { Authorization: `Bearer ${session?.access_token}` }
      });

      if (response.data?.success) {
        setProductImages(response.data.images || []);
      }
    } catch (error: any) {
      console.error('Error loading product images:', error);
    }
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploading(true);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      const fileExt = file.name.split('.').pop();
      const fileName = `${Date.now()}-${Math.random().toString(36).substring(7)}.${fileExt}`;
      const filePath = `${fileName}`;

      const { data: uploadData, error: uploadError } = await supabase.storage
        .from('product-images')
        .upload(filePath, file);

      if (uploadError) throw uploadError;

      const { data: { publicUrl } } = supabase.storage
        .from('product-images')
        .getPublicUrl(filePath);

      // If editing a product, add to product_images table
      if (editing) {
        await supabase.functions.invoke('manage-product-images', {
          body: {
            action: 'create',
            product_id: editing.id,
            image_path: publicUrl,
            display_order: productImages.length
          },
          headers: { Authorization: `Bearer ${session?.access_token}` }
        });
        await loadProductImages(editing.id);
      }

      // Update form with new image path
      setFormData({ ...formData, image_path: publicUrl });
      toast({ title: "Success", description: "Image uploaded successfully" });
    } catch (error: any) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    } finally {
      setUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const { data: { session } } = await supabase.auth.getSession();
      const action = editing ? 'update' : 'create';

      const response = await supabase.functions.invoke('manage-products', {
        body: { 
          action,
          id: editing?.id,
          ...formData 
        },
        headers: { Authorization: `Bearer ${session?.access_token}` }
      });

      if (response.data?.success) {
        toast({ title: "Success", description: response.data.message });
        resetForm();
        loadData();
      }
    } catch (error: any) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    }
  };

  const handleDelete = async (id: number) => {
    if (!confirm('Delete this product?')) return;
    
    try {
      const { data: { session } } = await supabase.auth.getSession();
      const response = await supabase.functions.invoke('manage-products', {
        body: { action: 'delete', id },
        headers: { Authorization: `Bearer ${session?.access_token}` }
      });

      if (response.data?.success) {
        toast({ title: "Success", description: "Product deleted" });
        loadData();
      }
    } catch (error: any) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    }
  };

  const handleEdit = (product: Product) => {
    setEditing(product);
    setFormData({
      category_id: product.category_id,
      name: product.name,
      description: product.description,
      image_path: product.image_path,
      image_alt_text: product.image_alt_text,
      quantity_per_10kg: product.quantity_per_10kg,
      price_per_10kg: product.price_per_10kg,
      price_per_piece: product.price_per_piece,
      age_range: product.age_range || '',
      display_order: product.display_order,
      is_active: product.is_active === 1
    });
    loadProductImages(product.id);
  };

  const resetForm = () => {
    setEditing(null);
    setProductImages([]);
    setFormData({
      category_id: 0,
      name: '',
      description: '',
      image_path: '',
      image_alt_text: '',
      quantity_per_10kg: 0,
      price_per_10kg: 0,
      price_per_piece: 0,
      age_range: '',
      display_order: 0,
      is_active: true
    });
  };

  if (loading) return <div>Loading...</div>;

  return (
    <div className="space-y-6">
      <Card className="p-6">
        <h3 className="text-lg font-semibold mb-4">{editing ? 'Edit' : 'Add'} Product</h3>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <Label>Category</Label>
            <Select value={formData.category_id.toString()} onValueChange={(v) => setFormData({ ...formData, category_id: parseInt(v) })}>
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
            <Input value={formData.name} onChange={(e) => setFormData({ ...formData, name: e.target.value })} required />
          </div>
          <div>
            <Label>Description</Label>
            <Textarea value={formData.description} onChange={(e) => setFormData({ ...formData, description: e.target.value })} required />
          </div>
          
          <div className="space-y-4">
            <Label>Product Image</Label>
            
            {/* Current image preview */}
            {formData.image_path && (
              <div className="border rounded-lg p-4">
                <img 
                  src={formData.image_path} 
                  alt="Current product" 
                  className="w-32 h-32 object-cover rounded"
                />
              </div>
            )}

            {/* Select from existing images */}
            {editing && productImages.length > 0 && (
              <div>
                <Label className="text-sm text-muted-foreground">Select from existing images</Label>
                <Select value={formData.image_path} onValueChange={(v) => setFormData({ ...formData, image_path: v })}>
                  <SelectTrigger>
                    <SelectValue placeholder="Choose an image" />
                  </SelectTrigger>
                  <SelectContent>
                    {productImages.map((img) => (
                      <SelectItem key={img.id} value={img.image_path}>
                        Image {img.display_order + 1}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}

            {/* Upload new image */}
            <div className="flex gap-2">
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                onChange={handleFileUpload}
                className="hidden"
              />
              <Button
                type="button"
                variant="outline"
                onClick={() => fileInputRef.current?.click()}
                disabled={uploading}
              >
                <Upload className="h-4 w-4 mr-2" />
                {uploading ? 'Uploading...' : 'Upload New Image'}
              </Button>
            </div>
          </div>

          <div>
            <Label>Image Alt Text</Label>
            <Input value={formData.image_alt_text} onChange={(e) => setFormData({ ...formData, image_alt_text: e.target.value })} required />
          </div>
          <div className="grid grid-cols-3 gap-4">
            <div>
              <Label>Qty per 10kg</Label>
              <Input type="number" value={formData.quantity_per_10kg} onChange={(e) => setFormData({ ...formData, quantity_per_10kg: parseInt(e.target.value) })} required />
            </div>
            <div>
              <Label>Price per 10kg</Label>
              <Input type="number" step="0.01" value={formData.price_per_10kg} onChange={(e) => setFormData({ ...formData, price_per_10kg: parseFloat(e.target.value) })} required />
            </div>
            <div>
              <Label>Price per Piece</Label>
              <Input type="number" step="0.01" value={formData.price_per_piece} onChange={(e) => setFormData({ ...formData, price_per_piece: parseFloat(e.target.value) })} required />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label>Age Range</Label>
              <Input value={formData.age_range} onChange={(e) => setFormData({ ...formData, age_range: e.target.value })} />
            </div>
            <div>
              <Label>Display Order</Label>
              <Input type="number" value={formData.display_order} onChange={(e) => setFormData({ ...formData, display_order: parseInt(e.target.value) })} required />
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Switch checked={formData.is_active} onCheckedChange={(v) => setFormData({ ...formData, is_active: v })} />
            <Label>Active</Label>
          </div>
          <div className="flex gap-2">
            <Button type="submit">{editing ? 'Update' : 'Create'}</Button>
            {editing && <Button type="button" variant="outline" onClick={resetForm}>Cancel</Button>}
          </div>
        </form>
      </Card>

      <Card className="p-6">
        <h3 className="text-lg font-semibold mb-4">Products</h3>
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead>Category</TableHead>
                <TableHead>Price</TableHead>
                <TableHead>Active</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {products.map((product) => (
                <TableRow key={product.id}>
                  <TableCell>{product.name}</TableCell>
                  <TableCell>{categories.find(c => c.id === product.category_id)?.name}</TableCell>
                  <TableCell>R{product.price_per_10kg}</TableCell>
                  <TableCell>{product.is_active ? 'Yes' : 'No'}</TableCell>
                  <TableCell>
                    <div className="flex gap-2">
                      <Button size="sm" variant="outline" onClick={() => handleEdit(product)}>
                        <Pencil className="h-4 w-4" />
                      </Button>
                      <Button size="sm" variant="destructive" onClick={() => handleDelete(product.id)}>
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </Card>
    </div>
  );
};
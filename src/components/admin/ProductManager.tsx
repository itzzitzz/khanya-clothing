import { useState, useEffect, useRef } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableRow, TableHeader } from "@/components/ui/table";
import { Pencil, Trash2, Upload, Star, GripVertical } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { Switch } from "@/components/ui/switch";

interface Product {
  id: number;
  category_id: number;
  name: string;
  description: string;
  image_path: string;
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
  is_primary: number;
  display_order: number;
}

export const ProductManager = () => {
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [productImages, setProductImages] = useState<ProductImage[]>([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [generating, setGenerating] = useState(false);
  const [editing, setEditing] = useState<Product | null>(null);
  const [draggedImage, setDraggedImage] = useState<ProductImage | null>(null);
  const [dragOverImage, setDragOverImage] = useState<ProductImage | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [formData, setFormData] = useState({
    category_id: 0,
    name: '',
    description: '',
    image_path: '',
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
        const isFirst = productImages.length === 0;
        await supabase.functions.invoke('manage-product-images', {
          body: {
            action: 'create',
            product_id: editing.id,
            image_path: publicUrl,
            is_primary: isFirst ? true : false,
            display_order: productImages.length
          },
          headers: { Authorization: `Bearer ${session?.access_token}` }
        });
        await loadProductImages(editing.id);
        
        // If it's the first image, set it as default
        if (isFirst) {
          setFormData({ ...formData, image_path: publicUrl });
        }
      } else {
        // For new products, just set the form image
        setFormData({ ...formData, image_path: publicUrl });
      }

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
      quantity_per_10kg: 0,
      price_per_10kg: 0,
      price_per_piece: 0,
      age_range: '',
      display_order: 0,
      is_active: true
    });
  };

  const handleDeleteImage = async (imageId: number) => {
    if (!confirm('Delete this image?')) return;
    
    try {
      const { data: { session } } = await supabase.auth.getSession();
      const response = await supabase.functions.invoke('manage-product-images', {
        body: { action: 'delete', id: imageId },
        headers: { Authorization: `Bearer ${session?.access_token}` }
      });

      if (response.data?.success && editing) {
        toast({ title: "Success", description: "Image deleted" });
        await loadProductImages(editing.id);
      }
    } catch (error: any) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    }
  };

  const handleSetDefaultImage = async (image: ProductImage) => {
    if (!editing) return;

    try {
      const { data: { session } } = await supabase.auth.getSession();
      
      // Update product's default image_path
      const response = await supabase.functions.invoke('manage-products', {
        body: { 
          action: 'update',
          id: editing.id,
          ...formData,
          image_path: image.image_path
        },
        headers: { Authorization: `Bearer ${session?.access_token}` }
      });

      if (response.data?.success) {
        setFormData({ ...formData, image_path: image.image_path });
        toast({ title: "Success", description: "Default image updated" });
        await loadData();
      }
    } catch (error: any) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    }
  };

  const handleDragStart = (image: ProductImage) => {
    setDraggedImage(image);
  };

  const handleDragOver = (e: React.DragEvent, targetImage: ProductImage) => {
    e.preventDefault();
    if (draggedImage && draggedImage.id !== targetImage.id) {
      setDragOverImage(targetImage);
    }
  };

  const handleDragLeave = () => {
    setDragOverImage(null);
  };

  const handleDrop = async (e: React.DragEvent, targetImage: ProductImage) => {
    e.preventDefault();
    setDragOverImage(null);
    
    if (!draggedImage || !editing || draggedImage.id === targetImage.id) return;

    try {
      const { data: { session } } = await supabase.auth.getSession();
      
      // Swap display orders
      await Promise.all([
        supabase.functions.invoke('manage-product-images', {
          body: {
            action: 'update',
            id: draggedImage.id,
            display_order: targetImage.display_order
          },
          headers: { Authorization: `Bearer ${session?.access_token}` }
        }),
        supabase.functions.invoke('manage-product-images', {
          body: {
            action: 'update',
            id: targetImage.id,
            display_order: draggedImage.display_order
          },
          headers: { Authorization: `Bearer ${session?.access_token}` }
        })
      ]);

      await loadProductImages(editing.id);
      setDraggedImage(null);
      toast({ title: "Success", description: "Image order updated" });
    } catch (error: any) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    }
  };

  const handleDragEnd = () => {
    setDraggedImage(null);
    setDragOverImage(null);
  };

  const handleGenerateImages = async () => {
    if (!editing) return;
    
    if (!confirm(`Generate 5 new portrait images for "${editing.name}"? These will be added to your existing images.`)) {
      return;
    }

    setGenerating(true);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      const response = await supabase.functions.invoke('generate-product-images', {
        body: {
          product_id: editing.id,
          product_name: editing.name,
          product_description: editing.description
        },
        headers: { Authorization: `Bearer ${session?.access_token}` }
      });

      if (response.data?.success) {
        toast({ title: "Success", description: `Generated ${response.data.images.length} portrait images` });
        await loadProductImages(editing.id);
        await loadData();
      } else {
        throw new Error(response.data?.error || 'Failed to generate images');
      }
    } catch (error: any) {
      toast({ 
        title: "Error", 
        description: error.message || 'Failed to generate images',
        variant: "destructive" 
      });
    } finally {
      setGenerating(false);
    }
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
            <Label>Product Images</Label>
            
            {/* Upload new image or generate with AI */}
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
                disabled={uploading || generating}
              >
                <Upload className="h-4 w-4 mr-2" />
                {uploading ? 'Uploading...' : 'Upload Image'}
              </Button>
              {editing && (
                <Button
                  type="button"
                  variant="default"
                  onClick={handleGenerateImages}
                  disabled={uploading || generating}
                >
                  {generating ? 'Generating...' : 'Generate 5 AI Portrait Images'}
                </Button>
              )}
            </div>

            {/* Display all images for editing product */}
            {editing && productImages.length > 0 && (
              <div className="space-y-2">
                <Label className="text-sm text-muted-foreground">
                  Product Images (Drag to reorder)
                </Label>
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                  {productImages
                    .sort((a, b) => a.display_order - b.display_order)
                    .map((image) => {
                      const isDefault = image.image_path === formData.image_path;
                      const isDragging = draggedImage?.id === image.id;
                      const isDropTarget = dragOverImage?.id === image.id;
                      
                      return (
                        <div
                          key={image.id}
                          draggable
                          onDragStart={() => handleDragStart(image)}
                          onDragOver={(e) => handleDragOver(e, image)}
                          onDragLeave={handleDragLeave}
                          onDrop={(e) => handleDrop(e, image)}
                          onDragEnd={handleDragEnd}
                          className={`relative border rounded-lg p-2 cursor-move transition-all duration-200 ${
                            isDefault ? 'border-primary ring-2 ring-primary' : ''
                          } ${
                            isDragging ? 'opacity-40 scale-95' : ''
                          } ${
                            isDropTarget ? 'scale-105 border-primary shadow-lg ring-2 ring-primary bg-primary/5' : 'hover:border-primary'
                          }`}
                        >
                          <div className="absolute top-1 left-1 z-10">
                            <GripVertical className="h-4 w-4 text-muted-foreground" />
                          </div>
                          {isDefault && (
                            <div className="absolute top-1 right-1 z-10 bg-primary text-primary-foreground rounded-full p-1">
                              <Star className="h-4 w-4 fill-current" />
                            </div>
                          )}
                          {isDropTarget && (
                            <div className="absolute inset-0 border-2 border-dashed border-primary rounded-lg animate-pulse pointer-events-none" />
                          )}
                          <img
                            src={image.image_path}
                            alt="Product image"
                            className="w-full h-48 object-contain rounded mb-2 bg-gray-50"
                          />
                          <div className="flex gap-1">
                            {!isDefault && (
                              <Button
                                type="button"
                                size="sm"
                                variant="outline"
                                className="flex-1 text-xs"
                                onClick={() => handleSetDefaultImage(image)}
                              >
                                Set Default
                              </Button>
                            )}
                            <Button
                              type="button"
                              size="sm"
                              variant="destructive"
                              onClick={() => handleDeleteImage(image.id)}
                            >
                              <Trash2 className="h-3 w-3" />
                            </Button>
                          </div>
                        </div>
                      );
                    })}
                </div>
              </div>
            )}

            {/* Show preview for new products */}
            {!editing && formData.image_path && (
              <div className="border rounded-lg p-4 bg-gray-50">
                <img 
                  src={formData.image_path} 
                  alt="Product preview" 
                  className="w-48 mx-auto object-contain"
                />
              </div>
            )}
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
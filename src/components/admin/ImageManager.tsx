import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Trash2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface Product {
  id: number;
  name: string;
}

interface ProductImage {
  id: number;
  product_id: number;
  image_path: string;
  image_alt_text: string;
  is_primary: number;
  display_order: number;
}

export const ImageManager = () => {
  const [products, setProducts] = useState<Product[]>([]);
  const [selectedProduct, setSelectedProduct] = useState<number | null>(null);
  const [images, setImages] = useState<ProductImage[]>([]);
  const [formData, setFormData] = useState({
    image_alt_text: '',
    display_order: 0
  });
  const { toast } = useToast();

  const loadProducts = async () => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      const response = await supabase.functions.invoke('manage-products', {
        body: { action: 'list' },
        headers: { Authorization: `Bearer ${session?.access_token}` }
      });

      if (response.data?.success) {
        setProducts(response.data.products);
      }
    } catch (error: any) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    }
  };

  const loadImages = async (productId: number) => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      const response = await supabase.functions.invoke('manage-product-images', {
        body: { action: 'list', product_id: productId },
        headers: { Authorization: `Bearer ${session?.access_token}` }
      });

      if (response.data?.success) {
        setImages(response.data.images);
      }
    } catch (error: any) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    }
  };

  useEffect(() => {
    loadProducts();
  }, []);

  useEffect(() => {
    if (selectedProduct) {
      loadImages(selectedProduct);
    }
  }, [selectedProduct]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedProduct) return;

    try {
      const { data: { session } } = await supabase.auth.getSession();
      const response = await supabase.functions.invoke('manage-product-images', {
        body: { 
          action: 'create',
          product_id: selectedProduct,
          ...formData 
        },
        headers: { Authorization: `Bearer ${session?.access_token}` }
      });

      if (response.data?.success) {
        toast({ title: "Success", description: "Image added" });
        setFormData({ image_alt_text: '', display_order: 0 });
        loadImages(selectedProduct);
      }
    } catch (error: any) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    }
  };

  const handleDelete = async (id: number) => {
    if (!confirm('Delete this image?')) return;
    
    try {
      const { data: { session } } = await supabase.auth.getSession();
      const response = await supabase.functions.invoke('manage-product-images', {
        body: { action: 'delete', id },
        headers: { Authorization: `Bearer ${session?.access_token}` }
      });

      if (response.data?.success) {
        toast({ title: "Success", description: "Image deleted" });
        if (selectedProduct) loadImages(selectedProduct);
      }
    } catch (error: any) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    }
  };

  return (
    <div className="space-y-6">
      <Card className="p-6">
        <h3 className="text-lg font-semibold mb-4">Select Product</h3>
        <Select value={selectedProduct?.toString() || ''} onValueChange={(v) => setSelectedProduct(parseInt(v))}>
          <SelectTrigger>
            <SelectValue placeholder="Choose a product" />
          </SelectTrigger>
          <SelectContent>
            {products.map((product) => (
              <SelectItem key={product.id} value={product.id.toString()}>{product.name}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </Card>

      {selectedProduct && (
        <>
          <Card className="p-6">
            <h3 className="text-lg font-semibold mb-4">Add Image</h3>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <Label>Alt Text</Label>
                <Input
                  value={formData.image_alt_text}
                  onChange={(e) => setFormData({ ...formData, image_alt_text: e.target.value })}
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
              <Button type="submit">Add Image</Button>
            </form>
          </Card>

          <Card className="p-6">
            <h3 className="text-lg font-semibold mb-4">Product Images</h3>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
              {images.map((image) => (
                <div key={image.id} className="border rounded-lg p-4 space-y-2">
                  <img
                    src={`/${image.image_path}`}
                    alt={image.image_alt_text}
                    className="w-full h-40 object-cover rounded"
                  />
                  <p className="text-sm text-muted-foreground">{image.image_alt_text}</p>
                  <div className="flex justify-between items-center">
                    <span className="text-xs">{image.is_primary ? 'Primary' : `Order: ${image.display_order}`}</span>
                    <Button size="sm" variant="destructive" onClick={() => handleDelete(image.id)}>
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </Card>
        </>
      )}
    </div>
  );
};
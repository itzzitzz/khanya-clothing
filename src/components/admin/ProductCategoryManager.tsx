import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableRow, TableHeader } from "@/components/ui/table";
import { Pencil, Trash2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { Switch } from "@/components/ui/switch";

interface ProductCategory {
  id: number;
  name: string;
  description: string | null;
  display_order: number;
  active: boolean;
}

export const ProductCategoryManager = () => {
  const [categories, setCategories] = useState<ProductCategory[]>([]);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState<ProductCategory | null>(null);
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    display_order: 0,
    active: true
  });
  const { toast } = useToast();

  const loadCategories = async () => {
    try {
      const { data, error } = await supabase
        .from('product_categories')
        .select('*')
        .order('display_order');

      if (error) throw error;
      if (data) setCategories(data);
    } catch (error: any) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadCategories();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (editing) {
        const { error } = await supabase
          .from('product_categories')
          .update(formData)
          .eq('id', editing.id);
        
        if (error) throw error;
        toast({ title: "Success", description: "Product category updated" });
      } else {
        const { error } = await supabase
          .from('product_categories')
          .insert([formData]);
        
        if (error) throw error;
        toast({ title: "Success", description: "Product category created" });
      }
      resetForm();
      loadCategories();
    } catch (error: any) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    }
  };

  const handleDelete = async (id: number) => {
    if (!confirm('Delete this product category? This will affect all bales in this category.')) return;
    
    try {
      const { error } = await supabase
        .from('product_categories')
        .delete()
        .eq('id', id);
      
      if (error) throw error;
      toast({ title: "Success", description: "Product category deleted" });
      loadCategories();
    } catch (error: any) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    }
  };

  const handleEdit = (category: ProductCategory) => {
    setEditing(category);
    setFormData({
      name: category.name,
      description: category.description || '',
      display_order: category.display_order,
      active: category.active
    });
  };

  const resetForm = () => {
    setEditing(null);
    setFormData({
      name: '',
      description: '',
      display_order: 0,
      active: true
    });
  };

  if (loading) return <div>Loading...</div>;

  return (
    <div className="space-y-6">
      <Card className="p-6">
        <h3 className="text-lg font-semibold mb-4">{editing ? 'Edit' : 'Add'} Product Category</h3>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <Label>Name</Label>
            <Input 
              value={formData.name} 
              onChange={(e) => setFormData({ ...formData, name: e.target.value })} 
              required 
              placeholder="e.g., Adults, Kids, Babies"
            />
          </div>

          <div>
            <Label>Description</Label>
            <Textarea 
              value={formData.description} 
              onChange={(e) => setFormData({ ...formData, description: e.target.value })} 
              placeholder="Optional description"
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

            <div className="flex items-center space-x-2 pt-8">
              <Switch
                checked={formData.active}
                onCheckedChange={(checked) => setFormData({ ...formData, active: checked })}
              />
              <Label>Active</Label>
            </div>
          </div>

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
        <h3 className="text-lg font-semibold mb-4">Product Categories</h3>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Name</TableHead>
              <TableHead>Description</TableHead>
              <TableHead>Display Order</TableHead>
              <TableHead>Active</TableHead>
              <TableHead>Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {categories.map((category) => (
              <TableRow key={category.id}>
                <TableCell className="font-medium">{category.name}</TableCell>
                <TableCell className="max-w-xs truncate">{category.description || '-'}</TableCell>
                <TableCell>{category.display_order}</TableCell>
                <TableCell>{category.active ? '✓' : '✗'}</TableCell>
                <TableCell>
                  <div className="flex gap-2">
                    <Button size="sm" variant="outline" onClick={() => handleEdit(category)}>
                      <Pencil className="h-4 w-4" />
                    </Button>
                    <Button size="sm" variant="destructive" onClick={() => handleDelete(category.id)}>
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </Card>
    </div>
  );
};

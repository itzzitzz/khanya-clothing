import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Pencil, Trash2, ArrowUp, ArrowDown } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface StockCategory {
  id: number;
  name: string;
  icon_name: string;
  display_order: number;
}

export const CategoryManager = () => {
  const [categories, setCategories] = useState<StockCategory[]>([]);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState<StockCategory | null>(null);
  const [formData, setFormData] = useState({ name: '', icon_name: '' });
  const { toast } = useToast();

  const loadCategories = async () => {
    try {
      const { data, error } = await supabase
        .from('stock_categories')
        .select('*')
        .order('name');

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
          .from('stock_categories')
          .update(formData)
          .eq('id', editing.id);
        
        if (error) throw error;
        toast({ title: "Success", description: "Stock category updated" });
      } else {
        const { error } = await supabase
          .from('stock_categories')
          .insert([formData]);
        
        if (error) throw error;
        toast({ title: "Success", description: "Stock category created" });
      }
      
      setFormData({ name: '', icon_name: '' });
      setEditing(null);
      loadCategories();
    } catch (error: any) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    }
  };

  const handleDelete = async (id: number) => {
    if (!confirm('Delete this stock category?')) return;
    
    try {
      const { error } = await supabase
        .from('stock_categories')
        .delete()
        .eq('id', id);
      
      if (error) throw error;
      toast({ title: "Success", description: "Stock category deleted" });
      loadCategories();
    } catch (error: any) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    }
  };

  const handleEdit = (category: StockCategory) => {
    setEditing(category);
    setFormData({
      name: category.name,
      icon_name: category.icon_name
    });
  };

  const moveCategory = async (id: number, direction: 'up' | 'down') => {
    const index = categories.findIndex(c => c.id === id);
    if (index === -1) return;
    if (direction === 'up' && index === 0) return;
    if (direction === 'down' && index === categories.length - 1) return;

    const newIndex = direction === 'up' ? index - 1 : index + 1;
    const newCategories = [...categories];
    [newCategories[index], newCategories[newIndex]] = [newCategories[newIndex], newCategories[index]];

    try {
      await Promise.all(
        newCategories.map((cat, idx) => 
          supabase
            .from('stock_categories')
            .update({ display_order: idx })
            .eq('id', cat.id)
        )
      );
      setCategories(newCategories);
      toast({ title: "Success", description: "Category order updated" });
    } catch (error: any) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    }
  };

  if (loading) return <div>Loading...</div>;

  return (
    <div className="space-y-6">
      <Card className="p-6">
        <h3 className="text-lg font-semibold mb-4">{editing ? 'Edit' : 'Add'} Stock Category</h3>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <Label htmlFor="name">Name</Label>
            <Input
              id="name"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              required
            />
          </div>
          <div>
            <Label htmlFor="icon_name">Icon Name</Label>
            <Input
              id="icon_name"
              value={formData.icon_name}
              onChange={(e) => setFormData({ ...formData, icon_name: e.target.value })}
              required
            />
          </div>
          <div className="flex gap-2">
            <Button type="submit">
              {editing ? 'Update' : 'Create'}
            </Button>
            {editing && (
              <Button
                type="button"
                variant="outline"
                onClick={() => {
                  setEditing(null);
                  setFormData({ name: '', icon_name: '' });
                }}
              >
                Cancel
              </Button>
            )}
          </div>
        </form>
      </Card>

      <Card className="p-6">
        <h3 className="text-lg font-semibold mb-4">Stock Categories</h3>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Name</TableHead>
              <TableHead>Icon</TableHead>
              <TableHead>Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {categories.map((category, index) => (
              <TableRow key={category.id}>
                <TableCell>{category.name}</TableCell>
                <TableCell>{category.icon_name}</TableCell>
                <TableCell>
                  <div className="flex gap-2">
                    <Button 
                      size="sm" 
                      variant="outline" 
                      onClick={() => moveCategory(category.id, 'up')}
                      disabled={index === 0}
                    >
                      <ArrowUp className="h-4 w-4" />
                    </Button>
                    <Button 
                      size="sm" 
                      variant="outline" 
                      onClick={() => moveCategory(category.id, 'down')}
                      disabled={index === categories.length - 1}
                    >
                      <ArrowDown className="h-4 w-4" />
                    </Button>
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
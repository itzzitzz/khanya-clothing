import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Pencil, Trash2, Plus } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface Category {
  id: number;
  name: string;
  icon_name: string;
  display_order: number;
}

export const CategoryManager = () => {
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState<Category | null>(null);
  const [formData, setFormData] = useState({ name: '', icon_name: '', display_order: 0 });
  const { toast } = useToast();

  const loadCategories = async () => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      const response = await supabase.functions.invoke('manage-categories', {
        body: { action: 'list' },
        headers: { Authorization: `Bearer ${session?.access_token}` }
      });

      if (response.data?.success) {
        setCategories(response.data.categories);
      }
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
      const { data: { session } } = await supabase.auth.getSession();
      const action = editing ? 'update' : 'create';

      const response = await supabase.functions.invoke('manage-categories', {
        body: { 
          action, 
          id: editing?.id,
          ...formData 
        },
        headers: { Authorization: `Bearer ${session?.access_token}` }
      });

      if (response.data?.success) {
        toast({ title: "Success", description: response.data.message });
        setFormData({ name: '', icon_name: '', display_order: 0 });
        setEditing(null);
        loadCategories();
      }
    } catch (error: any) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    }
  };

  const handleDelete = async (id: number) => {
    if (!confirm('Delete this category?')) return;
    
    try {
      const { data: { session } } = await supabase.auth.getSession();
      const response = await supabase.functions.invoke('manage-categories', {
        body: { action: 'delete', id },
        headers: { Authorization: `Bearer ${session?.access_token}` }
      });

      if (response.data?.success) {
        toast({ title: "Success", description: "Category deleted" });
        loadCategories();
      }
    } catch (error: any) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    }
  };

  const handleEdit = (category: Category) => {
    setEditing(category);
    setFormData({
      name: category.name,
      icon_name: category.icon_name,
      display_order: category.display_order
    });
  };

  if (loading) return <div>Loading...</div>;

  return (
    <div className="space-y-6">
      <Card className="p-6">
        <h3 className="text-lg font-semibold mb-4">{editing ? 'Edit' : 'Add'} Category</h3>
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
          <div>
            <Label htmlFor="display_order">Display Order</Label>
            <Input
              id="display_order"
              type="number"
              value={formData.display_order}
              onChange={(e) => setFormData({ ...formData, display_order: parseInt(e.target.value) })}
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
                  setFormData({ name: '', icon_name: '', display_order: 0 });
                }}
              >
                Cancel
              </Button>
            )}
          </div>
        </form>
      </Card>

      <Card className="p-6">
        <h3 className="text-lg font-semibold mb-4">Categories</h3>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Name</TableHead>
              <TableHead>Icon</TableHead>
              <TableHead>Order</TableHead>
              <TableHead>Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {categories.map((category) => (
              <TableRow key={category.id}>
                <TableCell>{category.name}</TableCell>
                <TableCell>{category.icon_name}</TableCell>
                <TableCell>{category.display_order}</TableCell>
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
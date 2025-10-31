import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Loader2, RefreshCw, Printer, Trash2 } from 'lucide-react';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

const OrderManager = () => {
  const { toast } = useToast();
  const [orders, setOrders] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState<string | null>(null);
  const [selectedStatusFilter, setSelectedStatusFilter] = useState<string>('all');
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [orderToDelete, setOrderToDelete] = useState<any>(null);
  const [deletePassword, setDeletePassword] = useState('');
  const [isDeleting, setIsDeleting] = useState(false);

  const fetchOrders = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('orders')
        .select(`
          *,
          order_items (
            *
          )
        `)
        .order('created_at', { ascending: false });

      if (error) throw error;

      // Fetch bale details for each order item
      const ordersWithBaleDetails = await Promise.all(
        (data || []).map(async (order) => {
          const itemsWithBaleDetails = await Promise.all(
            (order.order_items || []).map(async (item: any) => {
              // Fetch bale with its stock items and bale number
              const { data: baleData } = await supabase
                .from('bales')
                .select(`
                  id,
                  bale_number,
                  bale_items (
                    id,
                    quantity,
                    stock_items (
                      id,
                      name,
                      description,
                      age_range,
                      selling_price,
                      stock_item_images (
                        image_url,
                        is_primary,
                        display_order
                      )
                    )
                  )
                `)
                .eq('id', item.product_id)
                .single();

              return {
                ...item,
                bale_details: baleData
              };
            })
          );

          return {
            ...order,
            order_items: itemsWithBaleDetails
          };
        })
      );

      setOrders(ordersWithBaleDetails);
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message,
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchOrders();
  }, []);

  const handleStatusUpdate = async (orderId: string, newStatus: string) => {
    setUpdating(orderId);
    try {
      const { error } = await supabase.functions.invoke('update-order-status', {
        body: {
          order_id: orderId,
          new_status: newStatus,
          payment_status: newStatus === 'packing' ? 'paid' : undefined,
        },
      });

      if (error) throw error;

      toast({
        title: 'Success',
        description: 'Order status updated and customer notified',
      });

      await fetchOrders();
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message,
        variant: 'destructive',
      });
    } finally {
      setUpdating(null);
    }
  };

  const getStatusColor = (status: string) => {
    const colors: Record<string, string> = {
      new_order: 'bg-yellow-100 text-yellow-800',
      packing: 'bg-blue-100 text-blue-800',
      shipped: 'bg-purple-100 text-purple-800',
      delivered: 'bg-green-100 text-green-800',
    };
    return colors[status] || 'bg-gray-100 text-gray-800';
  };

  const getPaymentColor = (status: string) => {
    const colors: Record<string, string> = {
      paid: 'bg-green-100 text-green-800',
      pending: 'bg-yellow-100 text-yellow-800',
      failed: 'bg-red-100 text-red-800',
    };
    return colors[status] || 'bg-gray-100 text-gray-800';
  };

  const handlePrintPackingList = (orderId: string) => {
    window.open(`/packing-list?orderId=${orderId}`, '_blank');
  };

  const handleDeleteClick = (order: any) => {
    setOrderToDelete(order);
    setDeletePassword('');
    setDeleteDialogOpen(true);
  };

  const handleDeleteConfirm = async () => {
    if (!orderToDelete || !deletePassword) {
      toast({
        title: 'Error',
        description: 'Please enter your password',
        variant: 'destructive',
      });
      return;
    }

    setIsDeleting(true);
    try {
      // Get current user's email
      const { data: { user }, error: userError } = await supabase.auth.getUser();
      
      if (userError || !user?.email) {
        throw new Error('Unable to verify user');
      }

      // Verify password by attempting to sign in
      const { error: signInError } = await supabase.auth.signInWithPassword({
        email: user.email,
        password: deletePassword,
      });

      if (signInError) {
        throw new Error('Incorrect password');
      }

      // Password verified, proceed with deletion
      // Delete order items first (cascade should handle this, but being explicit)
      const { error: itemsError } = await supabase
        .from('order_items')
        .delete()
        .eq('order_id', orderToDelete.id);

      if (itemsError) throw itemsError;

      // Delete order status history
      const { error: historyError } = await supabase
        .from('order_status_history')
        .delete()
        .eq('order_id', orderToDelete.id);

      if (historyError) throw historyError;

      // Delete the order
      const { error: orderError } = await supabase
        .from('orders')
        .delete()
        .eq('id', orderToDelete.id);

      if (orderError) throw orderError;

      toast({
        title: 'Success',
        description: `Order ${orderToDelete.order_number} has been deleted`,
      });

      setDeleteDialogOpen(false);
      setOrderToDelete(null);
      setDeletePassword('');
      await fetchOrders();
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message || 'Failed to delete order',
        variant: 'destructive',
      });
    } finally {
      setIsDeleting(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center p-12">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  const filteredOrders = selectedStatusFilter === 'all' 
    ? orders 
    : orders.filter(order => order.order_status === selectedStatusFilter);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold">Order Management</h2>
        <div className="flex items-center gap-2">
          <div className="w-64">
            <Select 
              value={selectedStatusFilter} 
              onValueChange={(v) => setSelectedStatusFilter(v)}
            >
              <SelectTrigger>
                <SelectValue placeholder="Filter by status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Statuses</SelectItem>
                <SelectItem value="new_order">New Order</SelectItem>
                <SelectItem value="packing">Packing</SelectItem>
                <SelectItem value="shipped">Shipped</SelectItem>
                <SelectItem value="delivered">Delivered</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <Button onClick={fetchOrders} variant="outline" size="sm">
            <RefreshCw className="h-4 w-4 mr-2" />
            Refresh
          </Button>
        </div>
      </div>

      {filteredOrders.length === 0 ? (
        <div className="text-center p-12 border rounded-lg">
          <p className="text-muted-foreground">
            {orders.length === 0 ? 'No orders yet' : 'No orders found with selected status'}
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {filteredOrders.map((order) => (
            <div key={order.id} className="border rounded-lg p-6 bg-card">
              <div className="grid md:grid-cols-2 gap-4 mb-4">
                <div>
                  <div className="flex items-center gap-2 mb-2">
                    <h3 className="text-xl font-bold">{order.order_number}</h3>
                    <Button
                      onClick={() => handlePrintPackingList(order.id)}
                      variant="outline"
                      size="sm"
                      title="Print Packing List"
                    >
                      <Printer className="h-4 w-4" />
                    </Button>
                    <Button
                      onClick={() => handleDeleteClick(order)}
                      variant="outline"
                      size="sm"
                      title="Delete Order"
                      className="text-destructive hover:text-destructive hover:bg-destructive/10"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                  <p className="text-sm text-muted-foreground">
                    {new Date(order.created_at).toLocaleString()}
                  </p>
                  <div className="mt-2 space-y-1">
                    <p className="text-sm">
                      <strong>Customer:</strong> {order.customer_name}
                    </p>
                    <p className="text-sm">
                      <strong>Email:</strong> {order.customer_email}
                    </p>
                    <p className="text-sm">
                      <strong>Phone:</strong> {order.customer_phone}
                    </p>
                    <p className="text-sm">
                      <strong>Payment:</strong> {order.payment_method.replace(/_/g, ' ').toUpperCase()}
                    </p>
                  </div>
                </div>
                <div>
                  <div className="flex items-center gap-2 mb-2">
                    <span className={`px-3 py-1 rounded text-sm font-medium ${getStatusColor(order.order_status)}`}>
                      {order.order_status.replace(/_/g, ' ').toUpperCase()}
                    </span>
                    <span className={`px-3 py-1 rounded text-sm font-medium ${getPaymentColor(order.payment_status)}`}>
                      {order.payment_status.toUpperCase()}
                    </span>
                  </div>
                  <p className="text-2xl font-bold mb-4">R{order.total_amount.toFixed(2)}</p>
                  
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Update Status:</label>
                    <Select
                      value={order.order_status}
                      onValueChange={(value) => handleStatusUpdate(order.id, value)}
                      disabled={updating === order.id}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="new_order">New Order</SelectItem>
                        <SelectItem value="packing">Packing</SelectItem>
                        <SelectItem value="shipped">Shipped</SelectItem>
                        <SelectItem value="delivered">Delivered</SelectItem>
                      </SelectContent>
                    </Select>
                    {updating === order.id && (
                      <p className="text-sm text-muted-foreground">Updating...</p>
                    )}
                  </div>
                </div>
              </div>

              <div className="border-t pt-4">
                <h4 className="font-semibold mb-2">Bales to Pack:</h4>
                <div className="space-y-4">
                  {order.order_items?.map((item: any) => (
                    <div key={item.id} className="border rounded-lg p-4 bg-muted/50">
                      <div className="flex gap-3 items-center mb-3">
                        <img
                          src={item.product_image}
                          alt={item.product_name}
                          className="w-16 h-20 object-contain rounded border"
                        />
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-1">
                            <p className="font-medium">{item.product_name}</p>
                            {item.bale_details?.bale_number && (
                              <span className="text-xs font-mono bg-primary/10 text-primary px-2 py-0.5 rounded">
                                {item.bale_details.bale_number}
                              </span>
                            )}
                          </div>
                          <p className="text-sm text-muted-foreground">
                            {item.quantity} bale{item.quantity > 1 ? 's' : ''} × R{item.price_per_unit.toFixed(2)} = R{item.subtotal.toFixed(2)}
                          </p>
                        </div>
                      </div>
                      
                      {item.bale_details?.bale_items && item.bale_details.bale_items.length > 0 && (
                        <div className="border-t pt-3 mt-3">
                          <p className="text-xs font-semibold mb-2 text-muted-foreground">Stock Items to Pack per Bale:</p>
                          <div className="grid grid-cols-1 gap-2">
                            {item.bale_details.bale_items.map((baleItem: any) => {
                              const stockItem = baleItem.stock_items;
                              const primaryImage = stockItem?.stock_item_images?.find((img: any) => img.is_primary) 
                                || stockItem?.stock_item_images?.[0];
                              
                              return (
                                <div key={baleItem.id} className="flex gap-2 items-center p-2 bg-background rounded text-sm">
                                  {primaryImage && (
                                    <img
                                      src={primaryImage.image_url}
                                      alt={stockItem?.name || ''}
                                      className="w-10 h-12 object-contain rounded"
                                    />
                                  )}
                                  <div className="flex-1 min-w-0">
                                    <p className="font-medium text-xs truncate">{stockItem?.name}</p>
                                    {stockItem?.age_range && (
                                      <p className="text-xs text-muted-foreground">{stockItem.age_range}</p>
                                    )}
                                  </div>
                                  <div className="text-right shrink-0">
                                    <p className="font-semibold text-xs">Qty: {baleItem.quantity}</p>
                                    <p className="text-xs text-muted-foreground">R{stockItem?.selling_price?.toFixed(2)}</p>
                                  </div>
                                </div>
                              );
                            })}
                          </div>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>

              <div className="border-t pt-4 mt-4">
                <h4 className="font-semibold mb-2">Delivery Address:</h4>
                <p className="text-sm">
                  {order.delivery_address}<br />
                  {order.delivery_city}, {order.delivery_province}<br />
                  {order.delivery_postal_code}
                </p>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Order</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete order <strong>{orderToDelete?.order_number}</strong>?
              This action cannot be undone and will permanently delete the order and all its items.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <div className="py-4">
            <Label htmlFor="delete-password">Enter your password to confirm</Label>
            <Input
              id="delete-password"
              type="password"
              value={deletePassword}
              onChange={(e) => setDeletePassword(e.target.value)}
              placeholder="Your account password"
              className="mt-2"
              disabled={isDeleting}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && !isDeleting) {
                  handleDeleteConfirm();
                }
              }}
            />
          </div>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isDeleting}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={(e) => {
                e.preventDefault();
                handleDeleteConfirm();
              }}
              disabled={isDeleting || !deletePassword}
              className="bg-destructive hover:bg-destructive/90"
            >
              {isDeleting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Deleting...
                </>
              ) : (
                'Delete Order'
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default OrderManager;

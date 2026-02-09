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
import { Loader2, RefreshCw, Printer, Trash2, Send, MessageSquare } from 'lucide-react';
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
import { OrderNoteModal } from './OrderNoteModal';
import { PrintSelectionModal } from './PrintSelectionModal';

const OrderManager = () => {
  const { toast } = useToast();
  const [orders, setOrders] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState<string | null>(null);
  const [selectedStatusFilter, setSelectedStatusFilter] = useState<string>('all');
  const [selectedPaymentFilter, setSelectedPaymentFilter] = useState<string>('all');
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [orderToDelete, setOrderToDelete] = useState<any>(null);
  const [deletePassword, setDeletePassword] = useState('');
  const [isDeleting, setIsDeleting] = useState(false);
  const [sendingReminder, setSendingReminder] = useState<string | null>(null);
  const [updatingPayment, setUpdatingPayment] = useState<string | null>(null);
  
  // Shipping note modal state
  const [noteModalOpen, setNoteModalOpen] = useState(false);
  const [noteModalOrder, setNoteModalOrder] = useState<any>(null);
  const [noteModalMode, setNoteModalMode] = useState<'shipped' | 'send'>('shipped');
  const [pendingStatusChange, setPendingStatusChange] = useState<{ orderId: string; newStatus: string } | null>(null);
  const [sendingNote, setSendingNote] = useState<string | null>(null);

  // Print selection modal state
  const [printModalOpen, setPrintModalOpen] = useState(false);
  const [printModalOrder, setPrintModalOrder] = useState<any>(null);

  // Calculate sales statistics
  const calculateStats = () => {
    const now = new Date();
    const currentYear = now.getFullYear();
    const currentMonth = now.getMonth();
    
    // Financial year starts March 1st
    const financialYearStart = currentMonth >= 2 
      ? new Date(currentYear, 2, 1) // March 1st this year
      : new Date(currentYear - 1, 2, 1); // March 1st last year
    
    const thisMonthStart = new Date(currentYear, currentMonth, 1);
    const lastMonthStart = new Date(currentYear, currentMonth - 1, 1);
    const lastMonthEnd = new Date(currentYear, currentMonth, 0, 23, 59, 59);

    let allTimeSales = 0;
    let financialYearSales = 0;
    let thisMonthSales = 0;
    let lastMonthSales = 0;
    let outstandingPayments = 0;

    orders.forEach(order => {
      const orderDate = new Date(order.created_at);
      const totalAmount = Number(order.total_amount);
      const amountPaid = Number(order.amount_paid || 0);

      allTimeSales += totalAmount;

      if (orderDate >= financialYearStart) {
        financialYearSales += totalAmount;
      }

      if (orderDate >= thisMonthStart) {
        thisMonthSales += totalAmount;
      }

      if (orderDate >= lastMonthStart && orderDate <= lastMonthEnd) {
        lastMonthSales += totalAmount;
      }

      if (order.payment_tracking_status !== 'Fully Paid') {
        outstandingPayments += (totalAmount - amountPaid);
      }
    });

    return {
      allTimeSales,
      financialYearSales,
      thisMonthSales,
      lastMonthSales,
      outstandingPayments,
    };
  };

  const stats = calculateStats();

  const fetchOrders = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('orders')
        .select(`
          *,
          order_items (
            *
          ),
          order_status_history (
            id,
            status,
            notes,
            changed_at
          )
        `)
        .order('created_at', { ascending: false });

      if (error) throw error;

      // Fetch bale details for each order item
      const ordersWithBaleDetails = await Promise.all(
        (data || []).map(async (order) => {
          const itemsWithBaleDetails = await Promise.all(
            (order.order_items || []).map(async (item: any) => {
              console.log(`Fetching bale details for product_id: ${item.product_id}, product_name: ${item.product_name}`);
              
              // Fetch bale with its stock items and bale number
              const { data: baleData, error: baleError } = await supabase
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
                .maybeSingle();

              if (baleError) {
                console.error(`Error fetching bale ${item.product_id}:`, baleError);
              }
              
              console.log(`Bale data for product_id ${item.product_id}:`, baleData ? 'Found' : 'NULL');

              return {
                ...item,
                bale_details: baleData
              };
            })
          );

          // Sort status history by date descending
          const sortedHistory = (order.order_status_history || []).sort(
            (a: any, b: any) => new Date(b.changed_at).getTime() - new Date(a.changed_at).getTime()
          );

          return {
            ...order,
            order_items: itemsWithBaleDetails,
            order_status_history: sortedHistory
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

  // Handle status change - show modal for shipped status
  const handleStatusChange = (orderId: string, newStatus: string) => {
    const order = orders.find(o => o.id === orderId);
    if (newStatus === 'shipped' && order) {
      setNoteModalOrder(order);
      setNoteModalMode('shipped');
      setPendingStatusChange({ orderId, newStatus });
      setNoteModalOpen(true);
    } else {
      handleStatusUpdate(orderId, newStatus);
    }
  };

  const handleStatusUpdate = async (orderId: string, newStatus: string, note?: string) => {
    setUpdating(orderId);
    try {
      const { error } = await supabase.functions.invoke('update-order-status', {
        body: {
          order_id: orderId,
          new_status: newStatus,
          payment_status: newStatus === 'packing' ? 'paid' : undefined,
          note: note || undefined,
        },
      });

      if (error) throw error;

      toast({
        title: 'Success',
        description: note 
          ? 'Order status updated with note and customer notified'
          : 'Order status updated and customer notified',
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

  // Handle shipping note modal submission
  const handleShippingNoteSubmit = async (note: string) => {
    if (pendingStatusChange) {
      await handleStatusUpdate(pendingStatusChange.orderId, pendingStatusChange.newStatus, note);
      setPendingStatusChange(null);
    }
  };

  // Handle sending a note via the note icon
  const handleSendNoteClick = (order: any) => {
    setNoteModalOrder(order);
    setNoteModalMode('send');
    setNoteModalOpen(true);
  };

  const handleSendNote = async (note: string) => {
    if (!noteModalOrder || !note) return;
    
    setSendingNote(noteModalOrder.id);
    try {
      const { data, error } = await supabase.functions.invoke('send-order-note', {
        body: {
          order_id: noteModalOrder.id,
          note: note,
        },
      });

      if (error) throw error;

      const notificationInfo = data?.emailSent && data?.smsSent 
        ? 'via email and SMS'
        : data?.emailSent 
        ? 'via email'
        : data?.smsSent 
        ? 'via SMS'
        : '';

      toast({
        title: 'Note Sent',
        description: notificationInfo 
          ? `Note sent to ${noteModalOrder.customer_name} ${notificationInfo}` 
          : 'Note recorded',
      });

      await fetchOrders();
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message || 'Failed to send note',
        variant: 'destructive',
      });
    } finally {
      setSendingNote(null);
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

  const getPaymentTrackingColor = (status: string) => {
    const colors: Record<string, string> = {
      'Awaiting payment': 'bg-yellow-100 text-yellow-800',
      'Partially Paid': 'bg-blue-100 text-blue-800',
      'Fully Paid': 'bg-green-100 text-green-800',
    };
    return colors[status] || 'bg-gray-100 text-gray-800';
  };

  const handlePaymentUpdate = async (orderId: string, paymentStatus: string, amountPaid?: number) => {
    setUpdatingPayment(orderId);
    try {
      // Call edge function to update payment status and send notifications
      const { data, error } = await supabase.functions.invoke('update-payment-status', {
        body: {
          order_id: orderId,
          new_payment_status: paymentStatus,
          amount_paid: amountPaid,
        },
      });

      if (error) throw error;

      const notificationInfo = data?.emailSent && data?.smsSent 
        ? 'Customer notified via email and SMS'
        : data?.emailSent 
        ? 'Customer notified via email'
        : data?.smsSent 
        ? 'Customer notified via SMS'
        : '';

      toast({
        title: 'Success',
        description: notificationInfo 
          ? `Payment status updated. ${notificationInfo}` 
          : 'Payment status updated',
      });

      await fetchOrders();
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message,
        variant: 'destructive',
      });
    } finally {
      setUpdatingPayment(null);
    }
  };

  const handlePrintClick = (order: any) => {
    setPrintModalOrder(order);
    setPrintModalOpen(true);
  };

  const handlePrintSelection = (option: 'packing-lists' | 'invoice' | 'both') => {
    if (!printModalOrder) return;
    
    setPrintModalOpen(false);
    
    if (option === 'packing-lists') {
      window.location.href = `/print-packing-lists?orderId=${printModalOrder.id}`;
    } else if (option === 'invoice') {
      window.location.href = `/invoice?orderId=${printModalOrder.id}`;
    } else if (option === 'both') {
      // Open packing lists first (A5), then invoice (A4) in new tab
      window.open(`/print-packing-lists?orderId=${printModalOrder.id}`, '_blank');
      setTimeout(() => {
        window.open(`/invoice?orderId=${printModalOrder.id}`, '_blank');
      }, 500);
    }
  };

  const handleSendPaymentReminder = async (order: any) => {
    setSendingReminder(order.id);
    try {
      const { data, error } = await supabase.functions.invoke('send-payment-reminder', {
        body: {
          order_id: order.id,
        },
      });

      if (error) throw error;

      toast({
        title: 'Success',
        description: `Payment reminder sent to ${order.customer_name} via email and SMS`,
      });
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message || 'Failed to send payment reminder',
        variant: 'destructive',
      });
    } finally {
      setSendingReminder(null);
    }
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

  const filteredOrders = orders
    .filter(order => selectedStatusFilter === 'all' || order.order_status === selectedStatusFilter)
    .filter(order => selectedPaymentFilter === 'all' || order.payment_tracking_status === selectedPaymentFilter);

  return (
    <div className="space-y-6">
      {/* Sales Statistics */}
      <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 gap-4">
        <div className="border rounded-lg p-4 bg-card">
          <p className="text-sm text-muted-foreground mb-1">All Time Sales</p>
          <p className="text-2xl font-bold">R{stats.allTimeSales.toFixed(2)}</p>
        </div>
        <div className="border rounded-lg p-4 bg-card">
          <p className="text-sm text-muted-foreground mb-1">Financial Year to Date</p>
          <p className="text-2xl font-bold">R{stats.financialYearSales.toFixed(2)}</p>
        </div>
        <div className="border rounded-lg p-4 bg-card">
          <p className="text-sm text-muted-foreground mb-1">Sales This Month</p>
          <p className="text-2xl font-bold">R{stats.thisMonthSales.toFixed(2)}</p>
        </div>
        <div className="border rounded-lg p-4 bg-card">
          <p className="text-sm text-muted-foreground mb-1">Sales Last Month</p>
          <p className="text-2xl font-bold">R{stats.lastMonthSales.toFixed(2)}</p>
        </div>
        <div className="border rounded-lg p-4 bg-card">
          <p className="text-sm text-muted-foreground mb-1">Outstanding Payments</p>
          <p className="text-2xl font-bold text-yellow-600">R{stats.outstandingPayments.toFixed(2)}</p>
        </div>
      </div>

      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold">Order Management</h2>
        <div className="flex items-center gap-2">
          <div className="w-52">
            <Select 
              value={selectedPaymentFilter} 
              onValueChange={(v) => setSelectedPaymentFilter(v)}
            >
              <SelectTrigger>
                <SelectValue placeholder="Filter by payment" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Payments</SelectItem>
                <SelectItem value="Awaiting payment">Awaiting Payment</SelectItem>
                <SelectItem value="Partially Paid">Partially Paid</SelectItem>
                <SelectItem value="Fully Paid">Fully Paid</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="w-52">
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
            {orders.length === 0 ? 'No orders yet' : 'No orders found with selected filters'}
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
                    {order.payment_tracking_status !== 'Fully Paid' && (
                      <Button
                        onClick={() => handleSendPaymentReminder(order)}
                        variant="outline"
                        size="sm"
                        title="Send Payment Reminder"
                        disabled={sendingReminder === order.id}
                        className="text-accent hover:text-accent hover:bg-accent/10"
                      >
                        {sendingReminder === order.id ? (
                          <Loader2 className="h-4 w-4 animate-spin" />
                        ) : (
                          <Send className="h-4 w-4" />
                        )}
                      </Button>
                    )}
                    <Button
                      onClick={() => handlePrintClick(order)}
                      variant="outline"
                      size="sm"
                      title="Print Packing Lists & Invoice"
                    >
                      <Printer className="h-4 w-4" />
                    </Button>
                    <Button
                      onClick={() => handleSendNoteClick(order)}
                      variant="outline"
                      size="sm"
                      title="Send Note to Customer"
                      disabled={sendingNote === order.id}
                      className="text-blue-600 hover:text-blue-600 hover:bg-blue-50"
                    >
                      {sendingNote === order.id ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : (
                        <MessageSquare className="h-4 w-4" />
                      )}
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
                    <div className="mt-3 pt-3 border-t">
                      <p className="text-sm font-semibold mb-1">Delivery Address:</p>
                      <p className="text-sm text-muted-foreground">
                        {order.delivery_complex && <>{order.delivery_complex}<br /></>}
                        {order.delivery_address}<br />
                        {order.delivery_city}, {order.delivery_province}<br />
                        {order.delivery_postal_code}
                      </p>
                    </div>
                    {order.customer_feedback && (
                      <div className="mt-3 pt-3 border-t">
                        <p className="text-sm font-semibold mb-1 text-primary">💬 Customer Feedback:</p>
                        <p className="text-sm text-muted-foreground italic bg-muted/50 p-2 rounded">
                          "{order.customer_feedback}"
                        </p>
                      </div>
                    )}
                  </div>
                </div>
                <div>
                  <div className="flex items-center gap-2 mb-2">
                    <span className={`px-3 py-1 rounded text-sm font-medium ${getStatusColor(order.order_status)}`}>
                      {order.order_status.replace(/_/g, ' ').toUpperCase()}
                    </span>
                  </div>
                  <p className="text-2xl font-bold mb-4">R{order.total_amount.toFixed(2)}</p>
                  
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Payment Tracking:</label>
                    <div className="flex items-center gap-2 mb-2">
                      <span className={`px-3 py-1 rounded text-sm font-medium ${getPaymentTrackingColor(order.payment_tracking_status)}`}>
                        {order.payment_tracking_status}
                      </span>
                      <span className="text-sm font-semibold">
                        R{Number(order.amount_paid || 0).toFixed(2)} / R{Number(order.total_amount).toFixed(2)}
                      </span>
                    </div>
                    <Select
                      value={order.payment_tracking_status}
                      onValueChange={(value) => {
                        if (value === 'Fully Paid') {
                          handlePaymentUpdate(order.id, value, order.total_amount);
                        } else if (value === 'Partially Paid') {
                          const amount = prompt(`Enter amount paid (Total: R${order.total_amount}):`, order.amount_paid || '0');
                          if (amount !== null) {
                            handlePaymentUpdate(order.id, value, parseFloat(amount));
                          }
                        } else {
                          handlePaymentUpdate(order.id, value, 0);
                        }
                      }}
                      disabled={updatingPayment === order.id}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Awaiting payment">Awaiting payment</SelectItem>
                        <SelectItem value="Partially Paid">Partially Paid</SelectItem>
                        <SelectItem value="Fully Paid">Fully Paid</SelectItem>
                      </SelectContent>
                    </Select>
                    {updatingPayment === order.id && (
                      <p className="text-sm text-muted-foreground">Updating payment...</p>
                    )}
                  </div>
                  
                  <div className="space-y-2 mt-4 pt-4 border-t">
                    <label className="text-sm font-medium">Update Status:</label>
                    <Select
                      value={order.order_status}
                      onValueChange={(value) => handleStatusChange(order.id, value)}
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

              {/* Order Notes/History Section */}
              {order.order_status_history && order.order_status_history.some((h: any) => h.notes) && (
                <div className="border-t pt-4 mt-4">
                  <h4 className="font-semibold mb-2 flex items-center gap-2">
                    <MessageSquare className="h-4 w-4" />
                    Order Notes
                  </h4>
                  <div className="space-y-2">
                    {order.order_status_history
                      .filter((h: any) => h.notes)
                      .map((history: any) => (
                        <div key={history.id} className="bg-blue-50 dark:bg-blue-950/30 border border-blue-200 dark:border-blue-800 rounded-lg p-3">
                          <div className="flex items-start justify-between gap-2">
                            <p className="text-sm flex-1">{history.notes}</p>
                            <div className="text-right shrink-0">
                              <span className="text-xs text-muted-foreground">
                                {new Date(history.changed_at).toLocaleDateString()}
                              </span>
                              <br />
                              <span className="text-xs font-medium capitalize text-blue-600 dark:text-blue-400">
                                {history.status === 'note' ? 'Note' : history.status.replace(/_/g, ' ')}
                              </span>
                            </div>
                          </div>
                        </div>
                      ))}
                  </div>
                </div>
              )}
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

      {/* Order Note Modal */}
      <OrderNoteModal
        open={noteModalOpen}
        onOpenChange={(open) => {
          setNoteModalOpen(open);
          if (!open) {
            setPendingStatusChange(null);
          }
        }}
        orderNumber={noteModalOrder?.order_number || ''}
        title={noteModalMode === 'shipped' 
          ? 'Add Shipping Note' 
          : 'Send Note to Customer'}
        description={noteModalMode === 'shipped'
          ? 'Add an optional note with tracking info, waybill number, or other shipping details. This will be included in the shipping notification email.'
          : 'Send a note to the customer via email and SMS. Great for updates, tracking links, or important information.'}
        submitLabel={noteModalMode === 'shipped' 
          ? 'Update to Shipped' 
          : 'Send Note'}
        onSubmit={noteModalMode === 'shipped' 
          ? handleShippingNoteSubmit 
          : handleSendNote}
        isLoading={updating === noteModalOrder?.id || sendingNote === noteModalOrder?.id}
      />

      {/* Print Selection Modal */}
      <PrintSelectionModal
        open={printModalOpen}
        onOpenChange={setPrintModalOpen}
        onSelect={handlePrintSelection}
        orderNumber={printModalOrder?.order_number || ''}
      />
    </div>
  );
};

export default OrderManager;

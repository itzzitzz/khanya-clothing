import { useState } from 'react';
import { Helmet } from 'react-helmet-async';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import Header from '@/components/Header';
import { Loader2, Package, Truck, CheckCircle, Clock } from 'lucide-react';

const TrackOrder = () => {
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [trackingMethod, setTrackingMethod] = useState<'email' | 'phone'>('email');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [orderNumber, setOrderNumber] = useState('');
  const [orders, setOrders] = useState<any[]>([]);

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();

    if (trackingMethod === 'email' && !email) {
      toast({
        title: 'Error',
        description: 'Please enter your email address',
        variant: 'destructive',
      });
      return;
    }

    if (trackingMethod === 'phone' && !phone) {
      toast({
        title: 'Error',
        description: 'Please enter your phone number',
        variant: 'destructive',
      });
      return;
    }

    setLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke('track-order', {
        body: { 
          email: trackingMethod === 'email' ? email : undefined,
          phone: trackingMethod === 'phone' ? phone : undefined,
          order_number: orderNumber || undefined 
        },
      });

      if (error) throw error;

      if (!data.orders || data.orders.length === 0) {
        toast({
          title: 'No Orders Found',
          description: 'No orders found with this ' + (trackingMethod === 'email' ? 'email' : 'phone number') + (orderNumber ? ' and order number' : ''),
          variant: 'destructive',
        });
        setOrders([]);
        return;
      }

      setOrders(data.orders);
      toast({
        title: 'Orders Found',
        description: `Found ${data.orders.length} order(s)`,
      });
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

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'new_order':
        return <Clock className="h-6 w-6 text-yellow-500" />;
      case 'packing':
        return <Package className="h-6 w-6 text-blue-500" />;
      case 'shipped':
        return <Truck className="h-6 w-6 text-purple-500" />;
      case 'delivered':
        return <CheckCircle className="h-6 w-6 text-green-500" />;
      default:
        return <Clock className="h-6 w-6" />;
    }
  };

  const getStatusLabel = (status: string) => {
    const labels: Record<string, string> = {
      new_order: 'New Order',
      packing: 'Packing',
      shipped: 'Shipped',
      delivered: 'Delivered',
    };
    return labels[status] || status;
  };

  const getPaymentStatusColor = (status: string) => {
    switch (status) {
      case 'paid':
        return 'text-green-600';
      case 'pending':
        return 'text-yellow-600';
      case 'failed':
        return 'text-red-600';
      default:
        return 'text-gray-600';
    }
  };

  return (
    <>
      <Helmet>
        <title>Track Your Order Status | Khanya Clothing Bales Delivery</title>
        <meta name="description" content="Track your Khanya clothing bales order. Enter your email or phone number and order number to view real-time shipping status and delivery updates." />
        <meta name="keywords" content="track order, order status, delivery tracking, shipping status, Khanya order tracking" />
        <meta name="robots" content="noindex, follow" />
        <link rel="canonical" href={typeof window !== "undefined" ? `${window.location.origin}/track-order` : "/track-order"} />
        <meta property="og:type" content="website" />
        <meta property="og:title" content="Track Your Order | Khanya" />
        <meta property="og:description" content="Check the status of your clothing bales order with real-time tracking." />
      </Helmet>
      <Header />
      <div className="min-h-screen bg-background py-12">
        <div className="container mx-auto px-4 max-w-4xl">
          <h1 className="text-3xl font-bold mb-8">Track Your Order</h1>

          <div className="border rounded-lg p-6 bg-card mb-8">
            <form onSubmit={handleSearch} className="space-y-4">
              <div>
                <Label>Track order using *</Label>
                <RadioGroup
                  value={trackingMethod}
                  onValueChange={(value: 'email' | 'phone') => setTrackingMethod(value)}
                  className="mt-2"
                >
                  <div className="flex items-center space-x-2 p-3 border rounded">
                    <RadioGroupItem value="email" id="track-email" />
                    <Label htmlFor="track-email" className="cursor-pointer">Email Address</Label>
                  </div>
                  <div className="flex items-center space-x-2 p-3 border rounded">
                    <RadioGroupItem value="phone" id="track-phone" />
                    <Label htmlFor="track-phone" className="cursor-pointer">Phone Number</Label>
                  </div>
                </RadioGroup>
              </div>

              {trackingMethod === 'email' && (
                <div>
                  <Label htmlFor="email">Email Address *</Label>
                  <Input
                    id="email"
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="your@email.com"
                    required
                  />
                </div>
              )}

              {trackingMethod === 'phone' && (
                <div>
                  <Label htmlFor="phone">Phone Number *</Label>
                  <Input
                    id="phone"
                    type="tel"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    placeholder="+27 XX XXX XXXX"
                    required
                  />
                  <p className="text-xs text-muted-foreground mt-1">
                    Enter the phone number you used when placing your order
                  </p>
                </div>
              )}

              <div>
                <Label htmlFor="orderNumber">Order Number (Optional)</Label>
                <Input
                  id="orderNumber"
                  value={orderNumber}
                  onChange={(e) => setOrderNumber(e.target.value)}
                  placeholder="ORD-123456"
                />
                <p className="text-sm text-muted-foreground mt-1">
                  Leave blank to see all your orders
                </p>
              </div>
              <Button type="submit" disabled={loading} className="w-full">
                {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Track Order
              </Button>
            </form>
          </div>

          {orders.length > 0 && (
            <div className="space-y-6">
              <h2 className="text-2xl font-bold">Your Orders</h2>
              {orders.map((order) => (
                <div key={order.id} className="border rounded-lg p-6 bg-card">
                  <div className="flex items-start justify-between mb-4">
                    <div>
                      <h3 className="text-xl font-bold">{order.order_number}</h3>
                      <p className="text-sm text-muted-foreground">
                        Placed on {new Date(order.created_at).toLocaleDateString()}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="text-2xl font-bold">R{order.total_amount.toFixed(2)}</p>
                      <p className={`text-sm font-semibold ${getPaymentStatusColor(order.payment_status)}`}>
                        {order.payment_status.toUpperCase()}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-3 mb-4 p-4 bg-muted rounded">
                    {getStatusIcon(order.order_status)}
                    <div>
                      <p className="font-semibold">{getStatusLabel(order.order_status)}</p>
                      <p className="text-sm text-muted-foreground">
                        Last updated: {new Date(order.updated_at).toLocaleString()}
                      </p>
                    </div>
                  </div>

                  <div className="space-y-2 mb-4">
                    <h4 className="font-semibold">Items:</h4>
                    {order.order_items?.map((item: any) => (
                      <div key={item.id} className="flex gap-3 p-2 border-l-2 pl-4">
                        <img
                          src={item.product_image}
                          alt={item.product_name}
                          className="w-16 h-20 object-contain rounded"
                        />
                        <div className="flex-1">
                          <p className="font-medium">{item.product_name}</p>
                          <p className="text-sm text-muted-foreground">
                            Quantity: {item.quantity} × R{item.price_per_unit.toFixed(2)}
                          </p>
                        </div>
                        <p className="font-bold">R{item.subtotal.toFixed(2)}</p>
                      </div>
                    ))}
                  </div>

                  <div className="border-t pt-4">
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
        </div>
      </div>
    </>
  );
};

export default TrackOrder;

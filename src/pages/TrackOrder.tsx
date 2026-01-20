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
  const [searched, setSearched] = useState(false);
  const [noOrdersFound, setNoOrdersFound] = useState(false);

  const handlePhoneChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    let value = e.target.value.replace(/\D/g, ''); // Remove non-digits
    
    // Ensure it starts with 27 (South Africa)
    if (value && !value.startsWith('27')) {
      if (value.startsWith('0')) {
        value = '27' + value.substring(1);
      } else {
        value = '27' + value;
      }
    }
    
    // Limit to 11 digits (27 + 9 digits)
    if (value.length > 11) {
      value = value.substring(0, 11);
    }
    
    // Format as +27 XX XXX XXXX
    let formatted = '';
    if (value.length > 0) {
      formatted = '+27';
      if (value.length > 2) {
        formatted += ' ' + value.substring(2, 4);
      }
      if (value.length > 4) {
        formatted += ' ' + value.substring(4, 7);
      }
      if (value.length > 7) {
        formatted += ' ' + value.substring(7, 11);
      }
    }
    
    setPhone(formatted);
  };

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

    if (trackingMethod === 'phone') {
      if (!phone) {
        toast({
          title: 'Error',
          description: 'Please enter your phone number',
          variant: 'destructive',
        });
        return;
      }
      
      // Strip formatting and validate complete phone number
      const digitsOnly = phone.replace(/\D/g, '');
      if (digitsOnly.length < 11) {
        toast({
          title: 'Incomplete Phone Number',
          description: 'Please enter a complete South African phone number (11 digits)',
          variant: 'destructive',
        });
        return;
      }
    }

    setLoading(true);
    setSearched(true);
    setNoOrdersFound(false);
    try {
      // Strip formatting from phone before sending
      const cleanPhone = phone ? phone.replace(/\D/g, '') : undefined;
      
      const { data, error } = await supabase.functions.invoke('track-order', {
        body: { 
          email: trackingMethod === 'email' ? email.trim().toLowerCase() : undefined,
          phone: trackingMethod === 'phone' ? cleanPhone : undefined,
          order_number: orderNumber.trim() || undefined 
        },
      });

      // Gracefully handle "no orders" 404 without error toast
      if (error) {
        const status = (error as any)?.context?.status;
        const ctxBody = (error as any)?.context?.body;
        const ctxBodyStr = typeof ctxBody === 'string' ? ctxBody : JSON.stringify(ctxBody || '');
        const msg = (error as any)?.message || '';
        const notFound = status === 404 || msg.includes('No orders found') || ctxBodyStr.includes('No orders found');
        if (notFound) {
          setOrders([]);
          setNoOrdersFound(true);
          return;
        }
        throw error;
      }

      if (!data.orders || data.orders.length === 0) {
        setOrders([]);
        setNoOrdersFound(true);
        return;
      }

      setOrders(data.orders);
      setNoOrdersFound(false);
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

  const formatDateTime = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-ZA', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getPaymentTrackingColor = (status: string) => {
    switch (status) {
      case 'Fully Paid':
        return 'text-green-600 bg-green-50 border-green-200';
      case 'Partially Paid':
        return 'text-yellow-600 bg-yellow-50 border-yellow-200';
      case 'Awaiting payment':
        return 'text-orange-600 bg-orange-50 border-orange-200';
      default:
        return 'text-gray-600 bg-gray-50 border-gray-200';
    }
  };

  return (
    <>
      <Helmet>
        <title>Track Your Order Status | Khanya Clothing Bales Delivery</title>
        <meta name="description" content="Track your Khanya clothing bales order. Enter your email or phone number and order number to view real-time shipping status and delivery updates." />
        <meta name="keywords" content="track order, order status, delivery tracking, shipping status, Khanya order tracking" />
        <meta name="robots" content="noindex, follow" />
        <link rel="canonical" href="https://khanya.store/track-order" />
        <meta property="og:type" content="website" />
        <meta property="og:title" content="Track Your Order | Khanya" />
        <meta property="og:description" content="Check the status of your clothing bales order with real-time tracking." />
        <meta property="og:url" content="https://khanya.store/track-order" />
      </Helmet>
      <Header active="track" />
      <div className="min-h-screen bg-gradient-to-br from-background via-primary/5 to-background py-12">
        <div className="container mx-auto px-4 max-w-4xl">
          <div className="text-center mb-8 animate-fade-in">
            <Package className="h-16 w-16 mx-auto mb-4 text-primary animate-bounce" />
            <h1 className="text-4xl font-bold mb-2 bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
              Track Your Order! 🎉
            </h1>
            <p className="text-lg text-muted-foreground">
              Your exciting clothing bales are on their way!
            </p>
          </div>

          <div className="border rounded-lg p-6 bg-card/80 backdrop-blur mb-8 shadow-lg">
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
                    onChange={handlePhoneChange}
                    placeholder="+27 XX XXX XXXX"
                    required
                  />
                  <p className="text-xs text-muted-foreground mt-1">
                    South African numbers only. Format: +27 XX XXX XXXX
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

          {noOrdersFound && (
            <div className="text-center py-12 animate-fade-in">
              <Package className="h-16 w-16 mx-auto mb-4 text-muted-foreground opacity-50" />
              <h3 className="text-2xl font-bold mb-2">No Orders Found</h3>
              <p className="text-muted-foreground mb-4">
                We couldn't find any orders with {trackingMethod === 'email' ? 'that email address' : 'that phone number'}
                {orderNumber && ' and order number'}.
              </p>
              <p className="text-sm text-muted-foreground">
                Double-check your information or try a different search method.
              </p>
            </div>
          )}

          {orders.length > 0 && (
            <div className="space-y-6 animate-fade-in">
              <div className="text-center mb-6">
                <CheckCircle className="h-12 w-12 mx-auto mb-3 text-green-500 animate-bounce" />
                <h2 className="text-3xl font-bold bg-gradient-to-r from-green-600 to-blue-600 bg-clip-text text-transparent">
                  Woohoo! Found Your Orders! 🎊
                </h2>
              </div>
              {orders.map((order) => (
                <div key={order.id} className="border rounded-lg p-6 bg-card/80 backdrop-blur shadow-lg hover:shadow-xl transition-shadow">
                  <div className="flex items-start justify-between mb-4">
                    <div>
                      <h3 className="text-xl font-bold">{order.order_number}</h3>
                      <p className="text-sm text-muted-foreground">
                        Placed on {new Date(order.created_at).toLocaleDateString()}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="text-2xl font-bold">R{order.total_amount.toFixed(2)}</p>
                    </div>
                  </div>

                  {/* Payment Status Section */}
                  <div className={`mb-4 p-4 rounded border ${getPaymentTrackingColor(order.payment_tracking_status)}`}>
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-medium opacity-70">Payment Status</p>
                        <p className="font-bold">{order.payment_tracking_status}</p>
                      </div>
                      <div className="text-right">
                        <p className="text-sm font-medium opacity-70">
                          {order.payment_tracking_status === 'Fully Paid' ? 'Total Paid' : 'Amount Paid'}
                        </p>
                        <p className="font-bold">
                          R{order.amount_paid?.toFixed(2) || '0.00'}
                          {order.payment_tracking_status !== 'Fully Paid' && (
                            <span className="text-sm font-normal opacity-70"> / R{order.total_amount.toFixed(2)}</span>
                          )}
                        </p>
                      </div>
                    </div>
                  </div>

                  <div className="mb-4 p-4 bg-muted rounded">
                    <div className="flex items-center gap-3 mb-3">
                      {getStatusIcon(order.order_status)}
                      <div>
                        <p className="font-semibold">{getStatusLabel(order.order_status)}</p>
                        <p className="text-sm text-muted-foreground">
                          Last updated: {new Date(order.updated_at).toLocaleString()}
                        </p>
                      </div>
                    </div>

                    {/* Status History Timeline */}
                    {order.order_status_history && order.order_status_history.length > 0 && (
                      <div className="mt-4 pt-4 border-t border-border">
                        <h4 className="text-sm font-semibold mb-3 text-muted-foreground">Status History</h4>
                        <div className="space-y-3 pl-4 border-l-2 border-primary/30">
                          {order.order_status_history.map((history: any) => (
                            <div key={history.id} className="flex items-start gap-3 relative">
                              <div className="absolute -left-[21px] top-1.5 w-3 h-3 rounded-full bg-primary border-2 border-background" />
                              <div className="flex-1">
                                <div className="flex items-center gap-2">
                                  <span className="font-medium text-sm">{getStatusLabel(history.status)}</span>
                                </div>
                                <div className="text-xs text-muted-foreground">{formatDateTime(history.changed_at)}</div>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Shipping Notice */}
                    {order.order_status === 'shipped' && (
                      <div className="mt-4 p-3 bg-background/50 rounded border border-border">
                        <p className="text-sm">
                          <strong className="text-foreground">Shipping Information:</strong>
                          <span className="text-muted-foreground"> Delivery times depend on the courier service. 
                          The courier will contact you to arrange delivery. Couriers typically take up to 3 business days, 
                          but deliveries are often sooner in major cities.</span>
                        </p>
                      </div>
                    )}
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
                      {order.delivery_complex && <>{order.delivery_complex}<br /></>}
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

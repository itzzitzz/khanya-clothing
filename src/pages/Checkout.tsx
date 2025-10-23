import { useState } from 'react';
import { Helmet } from 'react-helmet-async';
import { useNavigate } from 'react-router-dom';
import { useCart } from '@/contexts/CartContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import Header from '@/components/Header';
import { Loader2, Mail, MessageCircle } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';

const Checkout = () => {
  const navigate = useNavigate();
  const { cart, cartTotal, clearCart } = useCart();
  const { toast } = useToast();
  
  const [loading, setLoading] = useState(false);
  const [pinSent, setPinSent] = useState(false);
  const [pinVerified, setPinVerified] = useState(false);
  const [verifyingPin, setVerifyingPin] = useState(false);
  
  const [formData, setFormData] = useState({
    customer_name: '',
    customer_email: '',
    customer_phone: '',
    delivery_address: '',
    delivery_city: '',
    delivery_province: '',
    delivery_postal_code: '',
    payment_method: 'card',
  });
  
  const [pin, setPin] = useState('');
  const [orderDetails, setOrderDetails] = useState<any>(null);
  const [showPaymentDialog, setShowPaymentDialog] = useState(false);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSendPin = async () => {
    if (!formData.customer_email) {
      toast({
        title: 'Error',
        description: 'Please enter your email address',
        variant: 'destructive',
      });
      return;
    }

    setLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke('send-verification-pin', {
        body: { email: formData.customer_email },
      });

      if (error) throw error;

      setPinSent(true);
      toast({
        title: 'PIN Sent',
        description: 'Check your email for the verification PIN',
      });
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message || 'Failed to send PIN',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyPin = async () => {
    if (!pin || pin.length !== 6) {
      toast({
        title: 'Error',
        description: 'Please enter a valid 6-digit PIN',
        variant: 'destructive',
      });
      return;
    }

    setVerifyingPin(true);
    try {
      const { data, error } = await supabase.functions.invoke('verify-pin', {
        body: { 
          email: formData.customer_email,
          pin_code: pin 
        },
      });

      if (error) throw error;

      if (!data.valid) {
        throw new Error('Invalid PIN');
      }

      setPinVerified(true);
      toast({
        title: 'Email Verified',
        description: 'You can now complete your order',
      });
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message || 'Invalid or expired PIN',
        variant: 'destructive',
      });
    } finally {
      setVerifyingPin(false);
    }
  };

  const handleSubmitOrder = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!pinVerified) {
      toast({
        title: 'Email Not Verified',
        description: 'Please verify your email before placing order',
        variant: 'destructive',
      });
      return;
    }

    if (cart.length === 0) {
      toast({
        title: 'Empty Cart',
        description: 'Please add items to your cart',
        variant: 'destructive',
      });
      return;
    }

    setLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke('create-order', {
        body: {
          ...formData,
          items: cart.map((item) => ({
            product_id: item.product_id,
            product_name: item.product_name,
            product_image: item.product_image,
            quantity: item.quantity,
            price_per_unit: item.price_per_unit,
          })),
        },
      });

      if (error) throw error;

      setOrderDetails(data);
      setShowPaymentDialog(true);
      clearCart();
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

  const PaymentDetailsDialog = () => {
    if (!orderDetails) return null;

    return (
      <Dialog open={showPaymentDialog} onOpenChange={setShowPaymentDialog}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Order Placed Successfully!</DialogTitle>
            <DialogDescription>
              Order Number: <strong>{orderDetails.order_number}</strong>
            </DialogDescription>
          </DialogHeader>
          
          {formData.payment_method === 'eft' && (
            <div className="space-y-4">
              <h3 className="font-semibold">EFT Payment Details</h3>
              <p>Please transfer <strong>R{orderDetails.total_amount.toFixed(2)}</strong> to:</p>
              <div className="bg-muted p-4 rounded space-y-2">
                <p><strong>Bank:</strong> First National Bank</p>
                <p><strong>Account Name:</strong> Your Business Name</p>
                <p><strong>Account Number:</strong> 1234567890</p>
                <p><strong>Branch Code:</strong> 250655</p>
                <p><strong>Reference:</strong> {orderDetails.order_number}</p>
              </div>
              <p className="text-sm text-muted-foreground">
                You will receive an email once payment has been confirmed.
              </p>
            </div>
          )}

          {formData.payment_method === 'fnb_ewallet' && (
            <div className="space-y-4">
              <h3 className="font-semibold">FNB e-Wallet Payment Details</h3>
              <p>Please send <strong>R{orderDetails.total_amount.toFixed(2)}</strong> via FNB e-Wallet to:</p>
              <div className="bg-muted p-4 rounded space-y-2">
                <p><strong>Cell Number:</strong> 0821234567</p>
                <p><strong>Reference:</strong> {orderDetails.order_number}</p>
              </div>
              <p className="text-sm text-muted-foreground">
                You will receive an email once payment has been confirmed.
              </p>
            </div>
          )}

          {['card', 'apple_pay', 'google_pay'].includes(formData.payment_method) && (
            <div className="space-y-4">
              <p>Payment integration coming soon. For now, please contact us to complete your order.</p>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  className="flex-1"
                  onClick={() => window.open(`mailto:${formData.customer_email}`)}
                >
                  <Mail className="mr-2 h-4 w-4" />
                  Email Us
                </Button>
                <Button
                  variant="outline"
                  className="flex-1"
                  onClick={() => window.open('https://wa.me/27821234567')}
                >
                  <MessageCircle className="mr-2 h-4 w-4" />
                  WhatsApp
                </Button>
              </div>
            </div>
          )}

          <Button
            className="w-full"
            onClick={() => {
              setShowPaymentDialog(false);
              navigate('/');
            }}
          >
            Done
          </Button>
        </DialogContent>
      </Dialog>
    );
  };

  if (cart.length === 0) {
    return (
      <>
        <Helmet>
          <title>Checkout | Your Business Name</title>
        </Helmet>
        <Header />
        <div className="min-h-screen bg-background flex items-center justify-center">
          <div className="text-center">
            <h2 className="text-2xl font-bold mb-4">Your cart is empty</h2>
            <Button onClick={() => navigate('/view-order-bales')}>
              Browse Products
            </Button>
          </div>
        </div>
      </>
    );
  }

  return (
    <>
      <Helmet>
        <title>Checkout | Your Business Name</title>
      </Helmet>
      <Header />
      <div className="min-h-screen bg-background py-8">
        <div className="container mx-auto px-4 max-w-4xl">
          <h1 className="text-3xl font-bold mb-8">Checkout</h1>

          <form onSubmit={handleSubmitOrder} className="space-y-8">
            {/* Email Verification */}
            <div className="border rounded-lg p-6 bg-card">
              <h2 className="text-xl font-bold mb-4">Email Verification</h2>
              <div className="space-y-4">
                <div>
                  <Label htmlFor="customer_email">Email Address *</Label>
                  <Input
                    id="customer_email"
                    name="customer_email"
                    type="email"
                    value={formData.customer_email}
                    onChange={handleInputChange}
                    required
                    disabled={pinVerified}
                  />
                </div>
                {!pinSent && (
                  <Button
                    type="button"
                    onClick={handleSendPin}
                    disabled={loading || !formData.customer_email}
                  >
                    {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                    Send Verification PIN
                  </Button>
                )}
                {pinSent && !pinVerified && (
                  <div className="space-y-4">
                    <div>
                      <Label htmlFor="pin">Enter 6-Digit PIN</Label>
                      <Input
                        id="pin"
                        value={pin}
                        onChange={(e) => setPin(e.target.value)}
                        maxLength={6}
                        placeholder="000000"
                      />
                    </div>
                    <Button
                      type="button"
                      onClick={handleVerifyPin}
                      disabled={verifyingPin}
                    >
                      {verifyingPin && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                      Verify PIN
                    </Button>
                  </div>
                )}
                {pinVerified && (
                  <p className="text-green-600 font-semibold">✓ Email verified</p>
                )}
              </div>
            </div>

            {/* Customer Details */}
            {pinVerified && (
              <>
                <div className="border rounded-lg p-6 bg-card">
                  <h2 className="text-xl font-bold mb-4">Customer Details</h2>
                  <div className="grid md:grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="customer_name">Full Name *</Label>
                      <Input
                        id="customer_name"
                        name="customer_name"
                        value={formData.customer_name}
                        onChange={handleInputChange}
                        required
                      />
                    </div>
                    <div>
                      <Label htmlFor="customer_phone">Phone Number *</Label>
                      <Input
                        id="customer_phone"
                        name="customer_phone"
                        value={formData.customer_phone}
                        onChange={handleInputChange}
                        required
                      />
                    </div>
                  </div>
                </div>

                {/* Delivery Address */}
                <div className="border rounded-lg p-6 bg-card">
                  <h2 className="text-xl font-bold mb-4">Delivery Address</h2>
                  <p className="text-sm text-green-600 mb-4">FREE delivery to anywhere in South Africa</p>
                  <div className="space-y-4">
                    <div>
                      <Label htmlFor="delivery_address">Street Address *</Label>
                      <Input
                        id="delivery_address"
                        name="delivery_address"
                        value={formData.delivery_address}
                        onChange={handleInputChange}
                        required
                      />
                    </div>
                    <div className="grid md:grid-cols-3 gap-4">
                      <div>
                        <Label htmlFor="delivery_city">City *</Label>
                        <Input
                          id="delivery_city"
                          name="delivery_city"
                          value={formData.delivery_city}
                          onChange={handleInputChange}
                          required
                        />
                      </div>
                      <div>
                        <Label htmlFor="delivery_province">Province *</Label>
                        <Input
                          id="delivery_province"
                          name="delivery_province"
                          value={formData.delivery_province}
                          onChange={handleInputChange}
                          required
                        />
                      </div>
                      <div>
                        <Label htmlFor="delivery_postal_code">Postal Code *</Label>
                        <Input
                          id="delivery_postal_code"
                          name="delivery_postal_code"
                          value={formData.delivery_postal_code}
                          onChange={handleInputChange}
                          required
                        />
                      </div>
                    </div>
                  </div>
                </div>

                {/* Payment Method */}
                <div className="border rounded-lg p-6 bg-card">
                  <h2 className="text-xl font-bold mb-4">Payment Method</h2>
                  <RadioGroup
                    value={formData.payment_method}
                    onValueChange={(value) =>
                      setFormData({ ...formData, payment_method: value })
                    }
                  >
                    <div className="flex items-center space-x-2 p-3 border rounded">
                      <RadioGroupItem value="card" id="card" />
                      <Label htmlFor="card">Credit/Debit Card (Visa, Mastercard)</Label>
                    </div>
                    <div className="flex items-center space-x-2 p-3 border rounded">
                      <RadioGroupItem value="apple_pay" id="apple_pay" />
                      <Label htmlFor="apple_pay">Apple Pay</Label>
                    </div>
                    <div className="flex items-center space-x-2 p-3 border rounded">
                      <RadioGroupItem value="google_pay" id="google_pay" />
                      <Label htmlFor="google_pay">Google Pay</Label>
                    </div>
                    <div className="flex items-center space-x-2 p-3 border rounded">
                      <RadioGroupItem value="eft" id="eft" />
                      <Label htmlFor="eft">EFT (Electronic Funds Transfer)</Label>
                    </div>
                    <div className="flex items-center space-x-2 p-3 border rounded">
                      <RadioGroupItem value="fnb_ewallet" id="fnb_ewallet" />
                      <Label htmlFor="fnb_ewallet">FNB e-Wallet</Label>
                    </div>
                  </RadioGroup>
                </div>

                {/* Order Summary */}
                <div className="border rounded-lg p-6 bg-card">
                  <h2 className="text-xl font-bold mb-4">Order Summary</h2>
                  <div className="space-y-2">
                    <div className="flex justify-between">
                      <span>Subtotal</span>
                      <span>R{cartTotal.toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between text-green-600">
                      <span>Delivery</span>
                      <span>FREE</span>
                    </div>
                    <div className="border-t pt-2 flex justify-between text-xl font-bold">
                      <span>Total</span>
                      <span>R{cartTotal.toFixed(2)}</span>
                    </div>
                  </div>
                </div>

                <Button type="submit" size="lg" className="w-full" disabled={loading}>
                  {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  Place Order
                </Button>
              </>
            )}
          </form>
        </div>
      </div>

      <PaymentDetailsDialog />
    </>
  );
};

export default Checkout;

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
  const [verificationMethod, setVerificationMethod] = useState<'email' | 'sms'>('email');
  const [verificationPhone, setVerificationPhone] = useState('');
  
  const [formData, setFormData] = useState({
    customer_name: '',
    customer_email: '',
    customer_phone: '',
    delivery_address: '',
    delivery_city: '',
    delivery_province: '',
    delivery_postal_code: '',
    payment_method: 'eft',
  });
  
  const [pin, setPin] = useState('');
  const [orderDetails, setOrderDetails] = useState<any>(null);
  const [showPaymentDialog, setShowPaymentDialog] = useState(false);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

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
    
    setVerificationPhone(formatted);
  };

  const handleSendPin = async () => {
    if (verificationMethod === 'email' && !formData.customer_email) {
      toast({
        title: 'Error',
        description: 'Please enter your email address',
        variant: 'destructive',
      });
      return;
    }

    if (verificationMethod === 'sms' && !verificationPhone) {
      toast({
        title: 'Error',
        description: 'Please enter your phone number',
        variant: 'destructive',
      });
      return;
    }

    setLoading(true);
    try {
      const phoneNumber = verificationPhone.replace(/\s/g, ''); // Remove spaces
      const { data, error } = await supabase.functions.invoke('send-verification-pin', {
        body: { 
          email: verificationMethod === 'email' ? formData.customer_email : undefined,
          phone: verificationMethod === 'sms' ? phoneNumber : undefined,
          method: verificationMethod
        },
      });

      if (error) {
        throw new Error(error.message || 'Failed to send PIN');
      }
      
      if (data?.error) {
        throw new Error(data.error);
      }

      setPinSent(true);
      toast({
        title: 'PIN Sent',
        description: verificationMethod === 'email' 
          ? 'Check your email for the verification PIN'
          : 'Check your phone for the verification PIN',
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
      const phoneNumber = verificationPhone.replace(/\s/g, '');
      const { data, error } = await supabase.functions.invoke('verify-pin', {
        body: { 
          email: verificationMethod === 'email' ? formData.customer_email : undefined,
          phone: verificationMethod === 'sms' ? phoneNumber : undefined,
          pin: pin,
          method: verificationMethod
        },
      });

      if (error) {
        throw new Error(error.message || 'Failed to verify PIN');
      }
      
      if (data?.error) {
        throw new Error(data.error);
      }

      if (!data?.verified) {
        throw new Error('Invalid PIN');
      }

      setPinVerified(true);
      toast({
        title: verificationMethod === 'email' ? 'Email Verified' : 'Phone Verified',
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

      clearCart();
      // Navigate to order confirmation page
      navigate('/order-confirmation', { 
        state: { 
          orderDetails: data 
        } 
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
              <h3 className="font-semibold text-lg">Bank Transfer Details</h3>
              <p className="text-sm">Please deposit <strong>R{orderDetails.total_amount.toFixed(2)}</strong> into the following account and send proof of payment to <strong>sales@khanya.store</strong>:</p>
              <div className="bg-muted p-4 rounded space-y-2">
                <p><strong>Bank:</strong> First National Bank (FNB)</p>
                <p><strong>Branch Code:</strong> 250655</p>
                <p><strong>Account Number:</strong> 63173001256</p>
                <p className="mt-3 pt-3 border-t"><strong>Reference:</strong> {orderDetails.order_number}</p>
              </div>
              <p className="text-sm font-medium">
                Please use order number <strong>{orderDetails.order_number}</strong> as your payment reference.
              </p>
              <p className="text-sm text-muted-foreground">
                Your order will be packed and couriered as soon as payment has reflected.
              </p>
              <p className="text-sm text-muted-foreground">
                You will be kept up to date on the status of your order by email.
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
        <title>Secure Checkout | Khanya Clothing Bales</title>
        <meta name="description" content="Complete your order securely. Free delivery nationwide. EFT payment accepted for wholesale clothing bales." />
        <meta name="robots" content="noindex, nofollow" />
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
            {/* Verification */}
            <div className="border rounded-lg p-6 bg-card">
              <h2 className="text-xl font-bold mb-4">Verification</h2>
              <div className="space-y-4">
                <div>
                  <Label>How would you like to receive your verification code? *</Label>
                  <RadioGroup
                    value={verificationMethod}
                    onValueChange={(value: 'email' | 'sms') => {
                      setVerificationMethod(value);
                      setPinSent(false);
                      setPin('');
                    }}
                    disabled={pinVerified}
                  >
                    <div className="flex items-center space-x-2 p-3 border rounded">
                      <RadioGroupItem value="email" id="verify-email" />
                      <Label htmlFor="verify-email">Email</Label>
                    </div>
                    <div className="flex items-center space-x-2 p-3 border rounded">
                      <RadioGroupItem value="sms" id="verify-sms" />
                      <Label htmlFor="verify-sms">SMS (South Africa only)</Label>
                    </div>
                  </RadioGroup>
                </div>

                {verificationMethod === 'email' && (
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
                )}

                {verificationMethod === 'sms' && (
                  <div>
                    <Label htmlFor="verification_phone">Phone Number *</Label>
                    <Input
                      id="verification_phone"
                      value={verificationPhone}
                      onChange={handlePhoneChange}
                      placeholder="+27 XX XXX XXXX"
                      disabled={pinVerified}
                    />
                    <p className="text-xs text-muted-foreground mt-1">
                      South African numbers only. Format: +27 XX XXX XXXX
                    </p>
                  </div>
                )}

                {!pinSent && (
                  <Button
                    type="button"
                    onClick={handleSendPin}
                    disabled={loading || (verificationMethod === 'email' && !formData.customer_email) || (verificationMethod === 'sms' && !verificationPhone)}
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
                  <p className="text-green-600 font-semibold">
                    ✓ {verificationMethod === 'email' ? 'Email' : 'Phone'} verified
                  </p>
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
                      <RadioGroupItem value="eft" id="eft" />
                      <Label htmlFor="eft">EFT (Electronic Funds Transfer)</Label>
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

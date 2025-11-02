import { useState } from 'react';
import { Helmet } from 'react-helmet-async';
import { useNavigate } from 'react-router-dom';
import { useCart } from '@/contexts/CartContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import Header from '@/components/Header';
import { Loader2, Mail, MessageCircle, CheckCircle2, Package, Truck, ShieldCheck, MapPin, User } from 'lucide-react';
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
    business_name: '',
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

  const handleProvinceChange = (value: string) => {
    setFormData({ ...formData, delivery_province: value });
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
      
      // Auto-fill phone if SMS was used
      if (verificationMethod === 'sms' && verificationPhone) {
        setFormData(prev => ({ ...prev, customer_phone: phoneNumber }));
      }
      
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
              <h3 className="font-semibold text-lg">EFT Payment Details</h3>
              <p className="text-sm">Please deposit <strong>R{orderDetails.total_amount.toFixed(2)}</strong> via EFT (Electronic Funds Transfer) into the following account and send proof of payment to <strong>sales@khanya.store</strong> or WhatsApp it to <strong>083 305 4532</strong>:</p>
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
              <h3 className="font-semibold text-lg">FNB E-Wallet Payment Details</h3>
              <p className="text-sm">Please send <strong>R{orderDetails.total_amount.toFixed(2)}</strong> via FNB E-Wallet to:</p>
              <div className="bg-muted p-4 rounded space-y-2">
                <p><strong>Cell Number:</strong> 083 305 4532</p>
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
                  onClick={() => window.open('https://wa.me/27833054532')}
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
        <meta name="description" content="Complete your order securely. Free delivery nationwide. Pay by EFT or FNB E-Wallet. Wholesale clothing bales from R1,000." />
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
          {/* Hero Section */}
          <div className="text-center mb-12 animate-fade-in">
            <div className="flex justify-center mb-6">
              <div className="relative">
                <Package className="h-20 w-20 text-primary animate-scale-in" />
                <div className="absolute -top-2 -right-2 bg-primary text-primary-foreground rounded-full w-8 h-8 flex items-center justify-center font-bold text-sm animate-scale-in">
                  🎉
                </div>
              </div>
            </div>
            <h1 className="text-4xl md:text-5xl font-bold mb-4">
              You're Almost There!
            </h1>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              Just a few quick steps and your quality clothing bales will be on their way to you
            </p>
          </div>

          {/* Progress Steps */}
          <div className="mb-12">
            <div className="flex justify-center items-center gap-2 md:gap-4">
              <div className="flex flex-col items-center">
                <div className={`w-12 h-12 rounded-full flex items-center justify-center ${pinVerified ? 'bg-primary text-primary-foreground' : 'bg-primary/20 text-primary'} transition-colors`}>
                  {pinVerified ? <CheckCircle2 className="h-6 w-6" /> : <ShieldCheck className="h-6 w-6" />}
                </div>
                <p className="text-xs mt-2 text-center">Verify</p>
              </div>
              <div className={`h-1 w-12 md:w-24 ${pinVerified ? 'bg-primary' : 'bg-muted'} transition-colors`} />
              <div className="flex flex-col items-center">
                <div className={`w-12 h-12 rounded-full flex items-center justify-center ${pinVerified ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground'} transition-colors`}>
                  <User className="h-6 w-6" />
                </div>
                <p className="text-xs mt-2 text-center">Details</p>
              </div>
              <div className={`h-1 w-12 md:w-24 bg-muted transition-colors`} />
              <div className="flex flex-col items-center">
                <div className="w-12 h-12 rounded-full bg-muted text-muted-foreground flex items-center justify-center">
                  <Truck className="h-6 w-6" />
                </div>
                <p className="text-xs mt-2 text-center">Done</p>
              </div>
            </div>
          </div>

          <form onSubmit={handleSubmitOrder} className="space-y-8">
            {/* Verification */}
            <div className="border rounded-lg p-6 bg-card shadow-sm hover:shadow-md transition-shadow">
              <div className="flex items-start gap-4 mb-6">
                <div className="bg-primary/10 p-3 rounded-full">
                  <ShieldCheck className="h-6 w-6 text-primary" />
                </div>
                <div>
                  <h2 className="text-2xl font-bold mb-2">Let's Verify It's Really You! 🔐</h2>
                  <p className="text-muted-foreground">
                    We need to verify your identity so we can:
                  </p>
                  <ul className="mt-2 space-y-1 text-sm text-muted-foreground">
                    <li className="flex items-center gap-2">
                      <CheckCircle2 className="h-4 w-4 text-primary" />
                      Keep your order secure and protected
                    </li>
                    <li className="flex items-center gap-2">
                      <CheckCircle2 className="h-4 w-4 text-primary" />
                      Send you order tracking updates
                    </li>
                    <li className="flex items-center gap-2">
                      <CheckCircle2 className="h-4 w-4 text-primary" />
                      Make sure we send your goodies to the right place
                    </li>
                  </ul>
                </div>
              </div>
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

            {/* Success Message */}
            {pinVerified && (
              <div className="border rounded-lg p-6 bg-primary/5 border-primary/20 animate-fade-in">
                <div className="flex items-center gap-3">
                  <CheckCircle2 className="h-8 w-8 text-primary" />
                  <div>
                    <h3 className="font-bold text-lg">Awesome! You're Verified! ✨</h3>
                    <p className="text-sm text-muted-foreground">
                      Now let's get your details so we can deliver your quality bales
                    </p>
                  </div>
                </div>
              </div>
            )}

            {/* Customer Details */}
            {pinVerified && (
              <>
                <div className="border rounded-lg p-6 bg-card shadow-sm hover:shadow-md transition-shadow">
                  <div className="flex items-start gap-4 mb-6">
                    <div className="bg-primary/10 p-3 rounded-full">
                      <User className="h-6 w-6 text-primary" />
                    </div>
                    <div>
                      <h2 className="text-2xl font-bold mb-2">Tell Us About You 👋</h2>
                      <p className="text-muted-foreground text-sm">
                        Just the basics so we can keep in touch about your order
                      </p>
                    </div>
                  </div>
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
                    {verificationMethod === 'email' && (
                      <div>
                        <Label htmlFor="customer_phone">Phone Number *</Label>
                        <Input
                          id="customer_phone"
                          name="customer_phone"
                          type="tel"
                          value={formData.customer_phone}
                          onChange={handleInputChange}
                          placeholder="+27 XX XXX XXXX"
                          required
                        />
                      </div>
                    )}
                    {verificationMethod === 'sms' && (
                      <div>
                        <Label htmlFor="customer_phone">Phone Number *</Label>
                        <Input
                          id="customer_phone"
                          name="customer_phone"
                          value={formData.customer_phone}
                          disabled
                          className="bg-muted"
                        />
                        <p className="text-xs text-muted-foreground mt-1">
                          Using verified phone number
                        </p>
                      </div>
                    )}
                  </div>
                </div>

                {/* Delivery Address */}
                <div className="border rounded-lg p-6 bg-card shadow-sm hover:shadow-md transition-shadow">
                  <div className="flex items-start gap-4 mb-6">
                    <div className="bg-primary/10 p-3 rounded-full">
                      <MapPin className="h-6 w-6 text-primary" />
                    </div>
                    <div className="flex-1">
                      <h2 className="text-2xl font-bold mb-2">Where Should We Send Your Goodies? 📦</h2>
                      <div className="flex items-center gap-2 bg-green-100 dark:bg-green-900/20 text-green-700 dark:text-green-400 px-4 py-2 rounded-lg">
                        <Truck className="h-5 w-5" />
                        <span className="font-semibold">FREE delivery anywhere in South Africa!</span>
                      </div>
                    </div>
                  </div>
                  <div className="space-y-4">
                    <div>
                      <Label htmlFor="business_name">Business Name / Complex Number and Name</Label>
                      <Input
                        id="business_name"
                        name="business_name"
                        value={formData.business_name}
                        onChange={handleInputChange}
                        placeholder="e.g. Fashion Hub or Unit 5, Sunset Complex"
                      />
                      <p className="text-xs text-muted-foreground mt-1">
                        Optional - helps courier find you
                      </p>
                    </div>
                    <div>
                      <Label htmlFor="delivery_address">Street Address *</Label>
                      <Input
                        id="delivery_address"
                        name="delivery_address"
                        value={formData.delivery_address}
                        onChange={handleInputChange}
                        placeholder="e.g. 123 Main Street"
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
                          placeholder="e.g. Johannesburg"
                          required
                        />
                      </div>
                      <div>
                        <Label htmlFor="delivery_province">Province *</Label>
                        <Select
                          value={formData.delivery_province}
                          onValueChange={handleProvinceChange}
                          required
                        >
                          <SelectTrigger id="delivery_province" className="w-full">
                            <SelectValue placeholder="Select province" />
                          </SelectTrigger>
                          <SelectContent className="bg-background z-50">
                            <SelectItem value="Eastern Cape">Eastern Cape</SelectItem>
                            <SelectItem value="Free State">Free State</SelectItem>
                            <SelectItem value="Gauteng">Gauteng</SelectItem>
                            <SelectItem value="KwaZulu-Natal">KwaZulu-Natal</SelectItem>
                            <SelectItem value="Limpopo">Limpopo</SelectItem>
                            <SelectItem value="Mpumalanga">Mpumalanga</SelectItem>
                            <SelectItem value="Northern Cape">Northern Cape</SelectItem>
                            <SelectItem value="North West">North West</SelectItem>
                            <SelectItem value="Western Cape">Western Cape</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <div>
                        <Label htmlFor="delivery_postal_code">Postal Code *</Label>
                        <Input
                          id="delivery_postal_code"
                          name="delivery_postal_code"
                          value={formData.delivery_postal_code}
                          onChange={handleInputChange}
                          placeholder="e.g. 2000"
                          required
                        />
                      </div>
                    </div>
                  </div>
                </div>

                {/* Payment Method */}
                <div className="border rounded-lg p-6 bg-card shadow-sm hover:shadow-md transition-shadow">
                  <div className="flex items-start gap-4 mb-6">
                    <div className="bg-primary/10 p-3 rounded-full">
                      <Package className="h-6 w-6 text-primary" />
                    </div>
                    <div>
                      <h2 className="text-2xl font-bold mb-2">Payment Method</h2>
                      <p className="text-muted-foreground text-sm">
                        We accept payment via EFT (Electronic Funds Transfer) or by FNB E-Wallet to 083 305 4532
                      </p>
                    </div>
                  </div>
                  
                  <div className="bg-muted p-4 rounded-lg space-y-4">
                    <div>
                      <h3 className="font-semibold mb-2">Banking Details</h3>
                      <div className="space-y-1 text-sm">
                        <p><strong>Bank:</strong> First National Bank (FNB)</p>
                        <p><strong>Branch Code:</strong> 250655</p>
                        <p><strong>Account Number:</strong> 63173001256</p>
                        <p><strong>Account Name:</strong> Khanya</p>
                      </div>
                    </div>
                    
                    <div className="pt-3 border-t">
                      <p className="text-sm text-muted-foreground">
                        <strong>Important:</strong> Please use your order number as the payment reference. After payment, send proof of payment to <strong>sales@khanya.store</strong> or WhatsApp it to <strong>083 305 4532</strong>
                      </p>
                    </div>
                  </div>
                </div>

                {/* Order Summary */}
                <div className="border rounded-lg p-6 bg-gradient-to-br from-primary/5 to-primary/10 border-primary/20">
                  <h2 className="text-2xl font-bold mb-6 flex items-center gap-2">
                    <Package className="h-6 w-6 text-primary" />
                    Your Order Summary
                  </h2>
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

                <Button type="submit" size="lg" className="w-full text-lg h-14 hover-scale" disabled={loading}>
                  {loading ? (
                    <>
                      <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                      Processing Your Order...
                    </>
                  ) : (
                    <>
                      <Truck className="mr-2 h-5 w-5" />
                      Complete Order & Get Your Bales! 🎉
                    </>
                  )}
                </Button>
                
                <p className="text-center text-sm text-muted-foreground">
                  <ShieldCheck className="inline h-4 w-4 mr-1" />
                  Your information is secure and protected
                </p>
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

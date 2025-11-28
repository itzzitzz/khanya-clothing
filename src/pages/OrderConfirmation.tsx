import { useEffect, useState } from 'react';
import { Helmet } from 'react-helmet-async';
import { useNavigate, useLocation } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import Header from '@/components/Header';
import { CheckCircle2, Mail, MessageCircle, CreditCard, Package, Truck } from 'lucide-react';

const OrderConfirmation = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [orderDetails, setOrderDetails] = useState<any>(null);
  const [paymentSuccess, setPaymentSuccess] = useState(false);
  const [paymentCancelled, setPaymentCancelled] = useState(false);

  useEffect(() => {
    // Get order details from navigation state
    if (location.state?.orderDetails) {
      setOrderDetails(location.state.orderDetails);
      setPaymentSuccess(location.state?.paymentSuccess || false);
      setPaymentCancelled(location.state?.paymentCancelled || false);
    } else {
      // If no order details, redirect to home
      navigate('/');
    }
  }, [location, navigate]);

  if (!orderDetails) {
    return null;
  }

  // Payment was successful via card
  if (paymentSuccess) {
    return (
      <>
        <Helmet>
          <title>Payment Successful - {orderDetails.order_number} | Khanya</title>
          <meta name="description" content={`Your payment for order ${orderDetails.order_number} has been confirmed. Your bales are being prepared for dispatch.`} />
          <meta name="robots" content="noindex, nofollow" />
        </Helmet>
        
        <div className="min-h-screen bg-background">
          <Header />
          
          <div className="container mx-auto px-4 py-12 max-w-3xl">
            <div className="text-center mb-8">
              <div className="relative inline-block">
                <CheckCircle2 className="w-20 h-20 mx-auto text-green-600 mb-4" />
                <CreditCard className="w-8 h-8 absolute -bottom-1 -right-1 text-green-600 bg-background rounded-full p-1" />
              </div>
              <h1 className="text-3xl font-bold mb-2 text-green-600">Payment Successful!</h1>
              <p className="text-xl text-muted-foreground">
                Order Number: <span className="font-mono font-semibold text-foreground">{orderDetails.order_number}</span>
              </p>
            </div>

            <Card className="p-6 space-y-6 border-green-200 bg-green-50/50">
              <div className="text-center">
                <p className="text-lg mb-2">
                  Thank you for your payment of <strong className="text-green-600">R{orderDetails.total_amount?.toFixed(2)}</strong>
                </p>
                <p className="text-muted-foreground">
                  Your order has been confirmed and is being prepared for dispatch.
                </p>
              </div>

              <div className="space-y-4 pt-4 border-t border-green-200">
                <h3 className="font-semibold text-lg">What happens next?</h3>
                
                <div className="flex items-start gap-3">
                  <div className="w-10 h-10 rounded-full bg-green-100 flex items-center justify-center flex-shrink-0">
                    <Package className="w-5 h-5 text-green-600" />
                  </div>
                  <div>
                    <p className="font-medium">Your bales are being packed</p>
                    <p className="text-sm text-muted-foreground">
                      Our team is preparing your order for shipment
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <div className="w-10 h-10 rounded-full bg-green-100 flex items-center justify-center flex-shrink-0">
                    <Truck className="w-5 h-5 text-green-600" />
                  </div>
                  <div>
                    <p className="font-medium">We'll courier your order</p>
                    <p className="text-sm text-muted-foreground">
                      You'll receive tracking details via email and SMS
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <div className="w-10 h-10 rounded-full bg-green-100 flex items-center justify-center flex-shrink-0">
                    <Mail className="w-5 h-5 text-green-600" />
                  </div>
                  <div>
                    <p className="font-medium">Stay updated</p>
                    <p className="text-sm text-muted-foreground">
                      We'll keep you informed at every step of the way
                    </p>
                  </div>
                </div>
              </div>
            </Card>

            <div className="mt-8 text-center space-y-3">
              <p className="text-sm text-muted-foreground">
                A confirmation email has been sent to your email address.
              </p>
              <div className="flex gap-4 justify-center">
                <Button variant="outline" onClick={() => navigate('/')}>
                  Continue Shopping
                </Button>
                <Button onClick={() => navigate('/track-order')}>
                  Track Your Order
                </Button>
              </div>
            </div>
          </div>
        </div>
      </>
    );
  }

  // Payment was cancelled or needs EFT/E-Wallet payment
  return (
    <>
      <Helmet>
        <title>Order Confirmed - {orderDetails.order_number} | Khanya</title>
        <meta name="description" content={`Your order ${orderDetails.order_number} has been confirmed. Pay via EFT or FNB E-Wallet to 083 305 4532. Amount: R${orderDetails.total_amount?.toFixed(2)}. Send proof to sales@khanya.store`} />
        <meta name="robots" content="noindex, nofollow" />
      </Helmet>
      
      <div className="min-h-screen bg-background">
        <Header />
        
        <div className="container mx-auto px-4 py-12 max-w-3xl">
          <div className="text-center mb-8">
            <CheckCircle2 className="w-16 h-16 mx-auto text-green-600 mb-4" />
            <h1 className="text-3xl font-bold mb-2">Order Placed Successfully!</h1>
            <p className="text-xl text-muted-foreground">
              Order Number: <span className="font-mono font-semibold text-foreground">{orderDetails.order_number}</span>
            </p>
            {paymentCancelled && (
              <p className="mt-2 text-amber-600 text-sm">
                Card payment was cancelled. Please complete payment using one of the options below.
              </p>
            )}
          </div>

          <Card className="p-6 space-y-6">
            <div>
              <h2 className="text-2xl font-semibold mb-4">Payment Details</h2>
              <p className="mb-4">
                Please pay <strong className="text-primary">R{orderDetails.total_amount?.toFixed(2)}</strong> via EFT (Electronic Funds Transfer) or FNB E-Wallet and send proof of payment to <strong>sales@khanya.store</strong> or WhatsApp it to <strong>083 305 4532</strong>:
              </p>
              
              <div className="bg-muted p-6 rounded-lg space-y-4">
                <div>
                  <h3 className="font-semibold mb-2">Option 1: EFT (Electronic Funds Transfer)</h3>
                  <div className="grid grid-cols-2 gap-2">
                    <span className="font-semibold">Bank:</span>
                    <span>First National Bank (FNB)</span>
                    
                    <span className="font-semibold">Branch Code:</span>
                    <span>250655</span>
                    
                    <span className="font-semibold">Account Number:</span>
                    <span>63173001256</span>
                  </div>
                </div>
                
                <div className="pt-3 border-t">
                  <h3 className="font-semibold mb-2">Option 2: FNB E-Wallet</h3>
                  <div className="grid grid-cols-2 gap-2">
                    <span className="font-semibold">Cell Number:</span>
                    <span>083 305 4532</span>
                  </div>
                </div>
                
                <div className="pt-3 border-t">
                  <div className="grid grid-cols-2 gap-2">
                    <span className="font-semibold">Payment Reference:</span>
                    <span className="font-mono font-semibold">{orderDetails.order_number}</span>
                  </div>
                </div>
              </div>
            </div>

            <div className="space-y-3 pt-4 border-t">
              <div className="flex items-start gap-3">
                <div className="w-6 h-6 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0 mt-0.5">
                  <span className="text-primary font-semibold text-sm">1</span>
                </div>
                <div>
                  <p className="font-medium">Use Your Order Number as Reference</p>
                  <p className="text-sm text-muted-foreground">
                    Please use <strong>{orderDetails.order_number}</strong> as your payment reference when making the transfer.
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <div className="w-6 h-6 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0 mt-0.5">
                  <span className="text-primary font-semibold text-sm">2</span>
                </div>
                <div>
                  <p className="font-medium">Send Proof of Payment</p>
                  <p className="text-sm text-muted-foreground">
                    Email your proof of payment to <strong>sales@khanya.store</strong> or WhatsApp it to <strong>083 305 4532</strong>
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <div className="w-6 h-6 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0 mt-0.5">
                  <span className="text-primary font-semibold text-sm">3</span>
                </div>
                <div>
                  <p className="font-medium">We'll Process Your Order</p>
                  <p className="text-sm text-muted-foreground">
                    Your order will be packed and couriered as soon as payment has reflected.
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <div className="w-6 h-6 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0 mt-0.5">
                  <span className="text-primary font-semibold text-sm">4</span>
                </div>
                <div>
                  <p className="font-medium">Stay Updated</p>
                  <p className="text-sm text-muted-foreground">
                    You will be kept up to date on the status of your order by email.
                  </p>
                </div>
              </div>
            </div>

            <div className="pt-6 border-t">
              <div className="grid grid-cols-2 gap-4">
                <Button
                  variant="outline"
                  className="w-full"
                  onClick={() => window.open('mailto:sales@khanya.store')}
                >
                  <Mail className="mr-2 h-4 w-4" />
                  Email Proof
                </Button>
                <Button
                  className="w-full"
                  onClick={() => window.open('https://wa.me/27833054532')}
                >
                  <MessageCircle className="mr-2 h-4 w-4" />
                  WhatsApp Proof
                </Button>
              </div>
            </div>
          </Card>

          <div className="mt-8 text-center space-y-3">
            <p className="text-sm text-muted-foreground">
              A confirmation email with these details has been sent to your email address.
            </p>
            <div className="flex gap-4 justify-center">
              <Button variant="outline" onClick={() => navigate('/')}>
                Continue Shopping
              </Button>
              <Button onClick={() => navigate('/track-order')}>
                Track Your Order
              </Button>
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

export default OrderConfirmation;

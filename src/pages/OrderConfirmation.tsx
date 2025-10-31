import { useEffect, useState } from 'react';
import { Helmet } from 'react-helmet-async';
import { useNavigate, useLocation } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import Header from '@/components/Header';
import { CheckCircle2, Mail } from 'lucide-react';

const OrderConfirmation = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [orderDetails, setOrderDetails] = useState<any>(null);

  useEffect(() => {
    // Get order details from navigation state
    if (location.state?.orderDetails) {
      setOrderDetails(location.state.orderDetails);
    } else {
      // If no order details, redirect to home
      navigate('/');
    }
  }, [location, navigate]);

  if (!orderDetails) {
    return null;
  }

  return (
    <>
      <Helmet>
        <title>Order Confirmed - {orderDetails.order_number} | Khanya</title>
        <meta name="description" content={`Your order ${orderDetails.order_number} has been confirmed. Please complete EFT payment of R${orderDetails.total_amount?.toFixed(2)} and send proof to sales@khanya.store`} />
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
          </div>

          <Card className="p-6 space-y-6">
            <div>
              <h2 className="text-2xl font-semibold mb-4">Bank Transfer Details</h2>
              <p className="mb-4">
                Please deposit <strong className="text-primary">R{orderDetails.total_amount?.toFixed(2)}</strong> into 
                the following account and send proof of payment to <strong>sales@khanya.store</strong>:
              </p>
              
              <div className="bg-muted p-6 rounded-lg space-y-3">
                <div className="grid grid-cols-2 gap-2">
                  <span className="font-semibold">Bank:</span>
                  <span>First National Bank (FNB)</span>
                  
                  <span className="font-semibold">Branch Code:</span>
                  <span>250655</span>
                  
                  <span className="font-semibold">Account Number:</span>
                  <span>63173001256</span>
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
                    Email your proof of payment to <strong>sales@khanya.store</strong>
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
              <Button
                variant="outline"
                className="w-full"
                onClick={() => window.open('mailto:sales@khanya.store')}
              >
                <Mail className="mr-2 h-4 w-4" />
                Email Proof of Payment to sales@khanya.store
              </Button>
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
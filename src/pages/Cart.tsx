import { useState } from 'react';
import { Helmet } from 'react-helmet-async';
import { useNavigate } from 'react-router-dom';
import { useCart } from '@/contexts/CartContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import Header from '@/components/Header';
import { Trash2, Plus, Minus, ShoppingBag } from 'lucide-react';

const Cart = () => {
  const navigate = useNavigate();
  const { cart, removeFromCart, updateQuantity, cartTotal, cartCount } = useCart();

  const handleCheckout = () => {
    navigate('/checkout');
  };

  if (cart.length === 0) {
    return (
      <>
        <Helmet>
          <title>Shopping Cart | Your Business Name</title>
        </Helmet>
        <Header />
        <div className="min-h-screen bg-background py-12">
          <div className="container mx-auto px-4">
            <div className="text-center py-16">
              <ShoppingBag className="mx-auto h-24 w-24 text-muted-foreground mb-4" />
              <h2 className="text-2xl font-bold mb-4">Your cart is empty</h2>
              <p className="text-muted-foreground mb-8">
                Add some bales to your cart to get started!
              </p>
              <Button onClick={() => navigate('/view-order-bales')}>
                Browse Products
              </Button>
            </div>
          </div>
        </div>
      </>
    );
  }

  return (
    <>
      <Helmet>
        <title>{`Shopping Cart (${cartCount}) | Your Business Name`}</title>
      </Helmet>
      <Header />
      <div className="min-h-screen bg-background py-8">
        <div className="container mx-auto px-4 max-w-6xl">
          <h1 className="text-3xl font-bold mb-8">Shopping Cart</h1>

          <div className="grid lg:grid-cols-3 gap-8">
            <div className="lg:col-span-2 space-y-4">
              {cart.map((item) => (
                <div
                  key={item.product_id}
                  className="flex gap-4 p-4 border rounded-lg bg-card"
                >
                  <img
                    src={item.product_image}
                    alt={item.product_name}
                    className="w-24 h-32 object-contain rounded"
                  />
                  <div className="flex-1">
                    <h3 className="font-semibold mb-2">{item.product_name}</h3>
                    <p className="text-lg font-bold mb-2">
                      R{Number(item.price_per_unit).toFixed(2)} per 10kg
                    </p>
                    <div className="flex items-center gap-2">
                      <Button
                        size="icon"
                        variant="outline"
                        onClick={() =>
                          updateQuantity(item.product_id, item.quantity - 1)
                        }
                      >
                        <Minus className="h-4 w-4" />
                      </Button>
                      <Input
                        type="number"
                        min="1"
                        value={item.quantity}
                        onChange={(e) =>
                          updateQuantity(
                            item.product_id,
                            parseInt(e.target.value) || 1
                          )
                        }
                        className="w-20 text-center"
                      />
                      <Button
                        size="icon"
                        variant="outline"
                        onClick={() =>
                          updateQuantity(item.product_id, item.quantity + 1)
                        }
                      >
                        <Plus className="h-4 w-4" />
                      </Button>
                      <Button
                        size="icon"
                        variant="destructive"
                        onClick={() => removeFromCart(item.product_id)}
                        className="ml-auto"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-lg font-bold">
                      R{(Number(item.price_per_unit) * item.quantity).toFixed(2)}
                    </p>
                  </div>
                </div>
              ))}
            </div>

            <div className="lg:col-span-1">
              <div className="border rounded-lg p-6 bg-card sticky top-4">
                <h2 className="text-xl font-bold mb-4">Order Summary</h2>
                <div className="space-y-2 mb-4">
                  <div className="flex justify-between">
                    <span>Subtotal</span>
                    <span>R{cartTotal.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between text-green-600 font-semibold">
                    <span>Delivery</span>
                    <span>FREE</span>
                  </div>
                  <div className="border-t pt-2 flex justify-between text-lg font-bold">
                    <span>Total</span>
                    <span>R{cartTotal.toFixed(2)}</span>
                  </div>
                </div>
                <p className="text-sm text-muted-foreground mb-4">
                  Free delivery to anywhere in South Africa
                </p>
                <Button className="w-full" size="lg" onClick={handleCheckout}>
                  Proceed to Checkout
                </Button>
                <Button
                  variant="outline"
                  className="w-full mt-2"
                  onClick={() => navigate('/view-order-bales')}
                >
                  Continue Shopping
                </Button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

export default Cart;

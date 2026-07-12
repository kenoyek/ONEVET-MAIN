import { useState } from "react";
import { Navbar } from "@/components/layout/Navbar";
import { Footer } from "@/components/layout/Footer";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useCart } from "@/hooks/use-cart";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { useAuth } from "@/lib/auth-context";
import { usePaystack } from "@/hooks/use-paystack";
import { supabase } from "@/integrations/supabase/client";
import {
  CreditCard,
  Truck,
  ShieldCheck,
  CheckCircle2,
  ArrowLeft,
  Loader2
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";

const Checkout = () => {
  const { items, totalPrice, clearCart } = useCart();
  const { profile } = useAuth();
  const navigate = useNavigate();
  const { initializePayment } = usePaystack();
  const [isProcessing, setIsProcessing] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);

  const [formData, setFormData] = useState({
    fullName: profile ? `${profile.first_name} ${profile.last_name}` : "",
    email: profile?.email || "",
    phone: profile?.phone || "",
    address: profile?.business_address || "",
    city: "",
    state: "",
  });

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const saveOrderToDatabase = async (reference: string) => {
    try {
      if (!profile) return;

      // 1. Create the order
      const { data: order, error: orderError } = await supabase
        .from('orders')
        .insert({
          customer_id: profile.id,
          total_amount: totalPrice,
          status: 'processing',
          payment_status: 'paid',
          payment_reference: reference,
          shipping_address: `${formData.address}, ${formData.city}, ${formData.state}`,
          phone_number: formData.phone
        })
        .select()
        .single();

      if (orderError) throw orderError;

      // 2. Create order items
      const orderItems = items.map(item => ({
        order_id: order.id,
        product_id: item.id,
        quantity: item.quantity,
        unit_price: item.price,
        total_price: item.price * item.quantity,
        seller_id: item.seller_id
      }));

      const { error: itemsError } = await supabase
        .from('order_items')
        .insert(orderItems);

      if (itemsError) throw itemsError;

      return true;
    } catch (error) {
      console.error('Error saving order:', error);
      toast.error("Payment successful but failed to save order record. Please contact support.");
      return false;
    }
  };

  const handleCheckout = (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.address || !formData.phone || !formData.email) {
      toast.error("Please fill in all required fields");
      return;
    }

    setIsProcessing(true);

    initializePayment({
      email: formData.email,
      amount: totalPrice,
      metadata: {
        cart_items: items.map(i => i.id),
        shipping_address: formData.address
      },
      onSuccess: async (reference) => {
        const saved = await saveOrderToDatabase(reference);
        if (saved) {
          setIsProcessing(false);
          setIsSuccess(true);
          clearCart();
          toast.success("Order placed successfully!");
        } else {
          setIsProcessing(false);
        }
      },
      onClose: () => {
        setIsProcessing(false);
        toast.error("Payment cancelled");
      }
    });
  };

  if (isSuccess) {
    return (
      <div className="min-h-screen bg-background">
        <Navbar />
        <main className="pt-32 pb-16">
          <div className="container-tight text-center">
            <div className="w-20 h-20 bg-green-100 dark:bg-green-900/30 text-green-600 rounded-full flex items-center justify-center mx-auto mb-6">
              <CheckCircle2 className="w-12 h-12" />
            </div>
            <h1 className="text-3xl font-bold mb-4">Order Confirmed!</h1>
            <p className="text-muted-foreground mb-8 text-lg">
              Thank you for your purchase. Your order #OV-{Math.floor(Math.random() * 10000)} has been placed and is being processed.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Button size="lg" onClick={() => navigate('/dashboard')}>
                Go to Dashboard
              </Button>
              <Button size="lg" variant="outline" onClick={() => navigate('/marketplace')}>
                Continue Shopping
              </Button>
            </div>
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  if (items.length === 0) {
    navigate('/marketplace');
    return null;
  }

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <main className="pt-24 pb-16">
        <div className="container-wide">
          <div className="flex items-center gap-2 mb-8">
            <Button variant="ghost" size="sm" onClick={() => navigate('/cart')}>
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to Cart
            </Button>
          </div>

          <h1 className="text-3xl font-bold mb-8">Checkout</h1>

          <div className="grid lg:grid-cols-3 gap-8">
            {/* Checkout Form */}
            <form onSubmit={handleCheckout} className="lg:col-span-2 space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Truck className="w-5 h-5 text-primary" />
                    Shipping Information
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="fullName">Full Name</Label>
                      <Input
                        id="fullName"
                        name="fullName"
                        value={formData.fullName}
                        onChange={handleInputChange}
                        required
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="phone">Phone Number</Label>
                      <Input
                        id="phone"
                        name="phone"
                        type="tel"
                        value={formData.phone}
                        onChange={handleInputChange}
                        required
                      />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="address">Delivery Address</Label>
                    <Input
                      id="address"
                      name="address"
                      value={formData.address}
                      onChange={handleInputChange}
                      required
                    />
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="city">City</Label>
                      <Input
                        id="city"
                        name="city"
                        value={formData.city}
                        onChange={handleInputChange}
                        required
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="state">State</Label>
                      <Input
                        id="state"
                        name="state"
                        value={formData.state}
                        onChange={handleInputChange}
                        required
                      />
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <CreditCard className="w-5 h-5 text-primary" />
                    Payment Method
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="p-4 border-2 border-primary/20 bg-primary/5 rounded-xl flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-white rounded flex items-center justify-center border">
                        <CreditCard className="w-6 h-6 text-primary" />
                      </div>
                      <div>
                        <p className="font-semibold">Paystack (Debit/Credit Card)</p>
                        <p className="text-xs text-muted-foreground">Secure payment via Paystack</p>
                      </div>
                    </div>
                    <CheckCircle2 className="w-6 h-6 text-primary" />
                  </div>
                  <p className="mt-4 text-sm text-muted-foreground">
                    You will be redirected to Paystack to complete your payment securely.
                  </p>
                </CardContent>
              </Card>

              <Button
                type="submit"
                className="w-full h-14 text-lg font-bold"
                disabled={isProcessing}
              >
                {isProcessing ? (
                  <>
                    <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                    Processing Payment...
                  </>
                ) : (
                  `Pay ₦${totalPrice.toLocaleString()}`
                )}
              </Button>
            </form>

            {/* Order Review */}
            <div className="lg:col-span-1">
              <Card className="sticky top-24">
                <CardHeader>
                  <CardTitle>Order Review</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4 mb-6">
                    {items.map((item) => (
                      <div key={item.id} className="flex justify-between text-sm">
                        <div className="flex gap-2">
                          <span className="font-medium">{item.quantity}x</span>
                          <span className="text-muted-foreground line-clamp-1">{item.title}</span>
                        </div>
                        <span className="font-semibold">₦{(item.price * item.quantity).toLocaleString()}</span>
                      </div>
                    ))}
                  </div>
                  <Separator className="my-4" />
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Subtotal</span>
                      <span>₦{totalPrice.toLocaleString()}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Shipping</span>
                      <span className="text-green-600 font-medium">Free</span>
                    </div>
                    <Separator className="my-2" />
                    <div className="flex justify-between text-lg font-bold">
                      <span>Total</span>
                      <span className="text-primary">₦{totalPrice.toLocaleString()}</span>
                    </div>
                  </div>

                  <div className="mt-8 flex items-center gap-2 text-xs text-muted-foreground">
                    <ShieldCheck className="w-4 h-4 text-primary" />
                    Your payment is secured with industry-standard encryption.
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
};

export default Checkout;

import { PageHeading } from '@/components/layout/PageHeading';
import { motion } from 'framer-motion';
import { isFeatureEnabled } from '@/lib/feature-flags';
import { useState } from "react";
import { Navbar } from "@/components/layout/Navbar";
import { Footer } from "@/components/layout/Footer";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useCart } from "@/hooks/use-cart";
import { Navigate, useNavigate } from "react-router-dom";
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
  const { profile, user } = useAuth();
  const navigate = useNavigate();
  const { initializePayment } = usePaystack();
  const paymentsEnabled = isFeatureEnabled('payments_enabled');
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

  const [orderId, setOrderId] = useState<string | null>(null);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleCheckout = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.address || !formData.phone || !formData.email) {
      toast.error("Please fill in all required fields");
      return;
    }

    if (!paymentsEnabled) { toast.error('Online payments are currently unavailable.'); return; }
    setIsProcessing(true);

    try {
      if (!profile) throw new Error("User profile not found");

      // 1. Create the pending order first
      const { data: order, error: orderError } = await supabase
        .from('orders')
        .insert({
          customer_id: profile.id,
          total_amount: totalPrice,
          status: 'pending',
          payment_status: 'pending',
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

      // 3. Initialize Paystack
      initializePayment({
        email: user?.email || formData.email,
        amount: totalPrice,
        metadata: {
          order_id: order.id,
          user_id: user?.id,
          cart_items: items.map(i => i.id)
        },
        onSuccess: async (reference) => {
          try {
            // 4. Verify payment via edge function
            const { data, error } = await supabase.functions.invoke('verify-payment', {
              body: {
                reference,
                type: 'order',
                order_id: order.id
              }
            });

            if (error || data?.status !== 'success') throw error || new Error('Payment not verified');

            setIsProcessing(false);
            setOrderId(order.id);
            setIsSuccess(true);
            clearCart();
            toast.success("Order placed successfully!");
          } catch (err: unknown) {
            console.error('Payment verification error:', err);
            toast.error((err as Error).message || "Payment verified by Paystack but failed to update order. Please contact support.");
            setIsProcessing(false);
          }
        },
        onClose: () => {
          setIsProcessing(false);
          toast.error("Payment cancelled");
        }
      });
    } catch (error: unknown) {
      console.error('Checkout error:', error);
      toast.error((error as Error).message || "Failed to initialize checkout. Please try again.");
      setIsProcessing(false);
    }
  };

  if (isSuccess) {
    return (
      <div className="min-h-screen bg-background flex flex-col">
        <Navbar />
        <main id="main-content" tabIndex={-1} className="flex-1 flex items-center justify-center p-6 pt-32 pb-20">
          <div className="container-tight text-center">
            <motion.div
              initial={{ scale: 0.5, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              className="w-32 h-32 bg-success/10 text-success rounded-3xl flex items-center justify-center mx-auto mb-8 shadow-soft border-4 border-background"
            >
              <CheckCircle2 className="w-16 h-16" />
            </motion.div>
            <PageHeading size="workspace" className="mb-4" title={<> Order Confirmed! </>}/>
            <p className="text-muted-foreground mb-10 text-lg font-medium max-w-md mx-auto">
              Your high-priority order <span className="text-foreground font-bold">#{orderId?.slice(0, 8).toUpperCase()}</span> has been securely processed.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Button size="xl" className="rounded-full font-semibold px-10 shadow-sm" onClick={() => navigate('/dashboard')}>
                Go to Dashboard
              </Button>
              <Button size="xl" variant="outline" className="rounded-full font-semibold px-10 border-2" onClick={() => navigate('/marketplace')}>
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
    return <Navigate to="/marketplace" replace/>;
  }

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <main id="main-content" tabIndex={-1} className="pt-28 md:pt-32 pb-20">
        {!paymentsEnabled && <p role="status" className="container-wide text-sm text-muted-foreground py-4">Online payments are currently unavailable. Please contact support for assistance.</p>}
        <div className="container-wide">
          <div className="flex items-center gap-2 mb-10">
            <Button variant="ghost" size="sm" className="rounded-full font-bold hover:bg-primary/5 group" onClick={() => navigate('/cart')}>
              <ArrowLeft className="w-4 h-4 mr-2 transition-transform group-hover:-translate-x-1" />
              Back to Cart
            </Button>
          </div>

          <PageHeading size="workspace" className="mb-10" title={<> Secure Checkout </>}/>

          <div className="grid lg:grid-cols-3 gap-12">
            {/* Checkout Form */}
            <form onSubmit={handleCheckout} className="lg:col-span-2 space-y-8">
              <Card className="card-elevated rounded-3xl overflow-hidden">
                <CardHeader className="p-8 pb-0">
                  <CardTitle className="flex items-center gap-3 text-2xl font-semibold tracking-tight">
                    <div className="p-2 rounded-lg bg-primary/10 text-primary">
                      <Truck className="w-6 h-6" />
                    </div>
                    Shipping Intelligence
                  </CardTitle>
                </CardHeader>
                <CardContent className="p-8 space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-2">
                      <Label htmlFor="fullName" className="text-xs font-semibold uppercase tracking-widest text-muted-foreground ml-1">Recipient Name</Label>
                      <Input
                        id="fullName"
                        name="fullName"
                        value={formData.fullName}
                        onChange={handleInputChange}
                        required
                        className="rounded-xl bg-muted/30 border-border/50 focus:bg-background transition-all"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="phone" className="text-xs font-semibold uppercase tracking-widest text-muted-foreground ml-1">Contact Phone</Label>
                      <Input
                        id="phone"
                        name="phone"
                        type="tel"
                        value={formData.phone}
                        onChange={handleInputChange}
                        required
                        className="rounded-xl bg-muted/30 border-border/50 focus:bg-background transition-all"
                      />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="address" className="text-xs font-semibold uppercase tracking-widest text-muted-foreground ml-1">Complete Delivery Address</Label>
                    <Input
                      id="address"
                      name="address"
                      value={formData.address}
                      onChange={handleInputChange}
                      required
                      className="rounded-xl bg-muted/30 border-border/50 focus:bg-background transition-all"
                    />
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-2">
                      <Label htmlFor="city" className="text-xs font-semibold uppercase tracking-widest text-muted-foreground ml-1">City / Hub</Label>
                      <Input
                        id="city"
                        name="city"
                        value={formData.city}
                        onChange={handleInputChange}
                        required
                        className="rounded-xl bg-muted/30 border-border/50 focus:bg-background transition-all"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="state" className="text-xs font-semibold uppercase tracking-widest text-muted-foreground ml-1">State / Province</Label>
                      <Input
                        id="state"
                        name="state"
                        value={formData.state}
                        onChange={handleInputChange}
                        required
                        className="rounded-xl bg-muted/30 border-border/50 focus:bg-background transition-all"
                      />
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card className="card-elevated rounded-3xl overflow-hidden">
                <CardHeader className="p-8 pb-0">
                  <CardTitle className="flex items-center gap-3 text-2xl font-semibold tracking-tight">
                    <div className="p-2 rounded-lg bg-primary/10 text-primary">
                      <CreditCard className="w-6 h-6" />
                    </div>
                    Payment Infrastructure
                  </CardTitle>
                </CardHeader>
                <CardContent className="p-8">
                  <div className="p-6 border-2 border-primary/20 bg-primary/5 rounded-3xl flex items-center justify-between shadow-soft">
                    <div className="flex items-center gap-4">
                      <div className="w-14 h-14 bg-white rounded-2xl flex items-center justify-center border-2 border-border/50 shadow-soft">
                        <CreditCard className="w-7 h-7 text-primary" />
                      </div>
                      <div>
                        <p className="font-semibold text-lg tracking-tight">Paystack Secure</p>
                        <p className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Debit / Credit Cards & Transfer</p>
                      </div>
                    </div>
                    <CheckCircle2 className="w-7 h-7 text-primary" />
                  </div>
                  <p className="mt-6 text-sm font-medium text-muted-foreground leading-relaxed">
                    {paymentsEnabled?'Payments are handled through Paystack. Review your order details before continuing.':'Online payments are currently unavailable. You can review your items in the cart.'}
                  </p>
                </CardContent>
              </Card>

              <Button
                type="submit"
                size="xl"
                className="w-full h-18 text-xl font-semibold rounded-full shadow-sm hover:scale-[1.02] transition-all"
                disabled={isProcessing || !paymentsEnabled}
              >
                {isProcessing ? (
                  <>
                    <Loader2 className="mr-3 h-6 w-6 animate-spin" />
                    Preparing payment…
                  </>
                ) : (
                  paymentsEnabled?`Pay ₦${totalPrice.toLocaleString()}`:'Payments unavailable'
                )}
              </Button>
            </form>

            {/* Order Review */}
            <div className="lg:col-span-1">
              <Card className="sticky top-28 card-elevated rounded-3xl overflow-hidden bg-primary/[0.01]">
                <CardHeader className="p-8 pb-0">
                  <CardTitle className="text-2xl font-semibold tracking-tight">Final Review</CardTitle>
                </CardHeader>
                <CardContent className="p-8">
                  <div className="space-y-5 mb-8">
                    {items.map((item) => (
                      <div key={item.id} className="flex justify-between items-center group">
                        <div className="flex items-center gap-3 overflow-hidden">
                          <span className="font-semibold text-primary p-1 bg-primary/5 rounded-lg text-xs min-w-[24px] text-center">{item.quantity}x</span>
                          <span className="text-sm font-bold text-foreground/80 line-clamp-1 group-hover:text-foreground transition-colors">{item.title}</span>
                        </div>
                        <span className="font-semibold text-sm tracking-tight whitespace-nowrap ml-4">₦{(item.price * item.quantity).toLocaleString()}</span>
                      </div>
                    ))}
                  </div>
                  <Separator className="bg-border/60 mb-6" />
                  <div className="space-y-4 text-sm font-bold uppercase tracking-widest text-muted-foreground">
                    <div className="flex justify-between">
                      <span>Subtotal</span>
                      <span className="text-foreground">₦{totalPrice.toLocaleString()}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Shipping</span>
                      <span className="text-success">Complimentary</span>
                    </div>
                    <Separator className="bg-border/60 my-2" />
                    <div className="flex justify-between items-center text-foreground">
                      <span className="text-lg font-semibold tracking-tight">Total</span>
                      <span className="text-3xl font-semibold text-primary tracking-tight">₦{totalPrice.toLocaleString()}</span>
                    </div>
                  </div>

                  <div className="mt-12 flex items-start gap-3 p-5 rounded-2xl bg-background/50 border border-border/40 text-[10px] font-semibold uppercase tracking-widest text-muted-foreground leading-relaxed">
                    <ShieldCheck className="w-4 h-4 text-primary shrink-0" />
                    Enterprise-grade security. 1Vet does not store your card information.
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

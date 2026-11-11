import { useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { shopService } from '@/lib/services/shop-service';
import { cartQuantityLimit } from '@/lib/cart-rules';
import { useAuth } from '@/lib/auth-context';
import { PageHeading } from '@/components/layout/PageHeading';
import { Navbar } from "@/components/layout/Navbar";
import { Footer } from "@/components/layout/Footer";
import { Button } from "@/components/ui/button";
import { useCart } from "@/hooks/use-cart";
import { Link } from "react-router-dom";
import {
  Trash2,
  Minus,
  Plus,
  ArrowLeft,
  ShoppingCart,
  ArrowRight,
  ShieldCheck
} from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";

const Cart = () => {
  const { items, removeItem, updateQuantity, totalPrice, totalItems, refreshItems } = useCart();

  const { user } = useAuth();
  const ids = [...new Set(items.map(item => item.id))].sort().join(',');
  const catalogue = useQuery({ queryKey: ['cart-catalogue', user?.id, ids], queryFn: () => shopService.cart(ids.split(',')), enabled: !!ids, staleTime: 15_000 });
  useEffect(() => { if (catalogue.data) refreshItems(catalogue.data); }, [catalogue.data, refreshItems]);
  const unavailable = items.some(item => item.available === false);

  if (items.length === 0) {
    return (
      <div className="min-h-screen bg-background">
        <Navbar />
        <main id="main-content" tabIndex={-1} className="pt-40 pb-16">
          <div className="container-tight text-center">
            <div className="w-32 h-32 bg-primary/10 rounded-3xl flex items-center justify-center mx-auto mb-8 shadow-soft animate-float">
              <ShoppingCart className="w-12 h-12 text-primary" />
            </div>
            <PageHeading size="workspace" className="mb-4" title={<> Your cart is empty </>}/>
            <p className="text-muted-foreground mb-10 text-lg font-medium">
              Explore our marketplace for premium veterinary supplies and pet products.
            </p>
            <Button size="xl" className="rounded-full font-semibold px-10 shadow-sm" asChild>
              <Link to="/marketplace">
                <ArrowLeft className="mr-3 w-5 h-5" />
                Go to Marketplace
              </Link>
            </Button>
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <main id="main-content" tabIndex={-1} className="pt-28 md:pt-32 pb-20">
        <div className="container-wide">
          <div className="flex items-center gap-2 mb-10">
            <Button variant="ghost" size="sm" className="rounded-full font-bold hover:bg-primary/5 group" asChild>
              <Link to="/marketplace">
                <ArrowLeft className="w-4 h-4 mr-2 transition-transform group-hover:-translate-x-1" />
                Continue Shopping
              </Link>
            </Button>
          </div>

          <PageHeading size="workspace" className="mb-10" title={<> Shopping Cart <span className="text-primary/40 ml-2">({totalItems})</span> </>}/>

          <section className="mb-6 rounded-xl border bg-card p-4 text-sm text-muted-foreground">
            <p>Online checkout is currently unavailable. Your cart is kept in this browser for this account; items are not reserved.</p>
            <p className="mt-2">Current stock may reduce a quantity in your cart. Prices are refreshed from the shop.</p>
            {catalogue.isFetching && <p role="status" className="mt-2">Checking current prices and stock…</p>}
            {catalogue.isError && <div role="alert" className="mt-2"><p>We couldn’t check current prices and stock. Your items have been kept.</p><Button variant="link" onClick={() => catalogue.refetch()}>Try again</Button></div>}
          </section>
          <div className="grid lg:grid-cols-3 gap-12">
            {/* Cart Items */}
            <div className="lg:col-span-2 space-y-6">
              {items.map((item) => (
                <Card key={item.id} className="overflow-hidden card-elevated rounded-[2rem] group hover:shadow-elevated transition-all duration-500">
                  <CardContent className="p-6">
                    <div className="flex flex-col sm:flex-row gap-6">
                      <div className="w-full sm:w-32 h-32 rounded-2xl overflow-hidden bg-muted flex-shrink-0 shadow-soft">
                        <img
                          src={item.image}
                          alt={item.title}
                          className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
                        />
                      </div>
                      <div className="flex-grow flex flex-col justify-between">
                        <div className="flex justify-between items-start mb-4">
                          <div>
                            <h3 className="font-semibold text-xl tracking-tight mb-1"><Link className="hover:underline" to={`/marketplace/${item.id}`}>{item.title}</Link></h3>
                            <div className="flex items-center gap-2 text-xs font-bold text-muted-foreground uppercase tracking-widest">
                              <ShieldCheck className="w-3.5 h-3.5 text-success" />
                              {item.available === false ? 'Currently unavailable' : 'Marketplace item'}
                            </div>
                          </div>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="text-muted-foreground hover:text-destructive hover:bg-destructive/10 rounded-full h-10 w-10 transition-colors"
                            aria-label={`Remove ${item.title}`} onClick={() => removeItem(item.id)}
                          >
                            <Trash2 className="w-5 h-5" />
                          </Button>
                        </div>
                        <div className="flex flex-wrap justify-between items-end gap-4 pt-4 border-t border-border/40">
                          <div className="flex items-center bg-muted/50 rounded-full p-1 border border-border/40 shadow-inner">
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-9 w-9 rounded-full hover:bg-background shadow-soft transition-all"
                              aria-label={`Decrease quantity of ${item.title}`} onClick={() => updateQuantity(item.id, item.quantity - 1)}
                            >
                              <Minus className="w-3.5 h-3.5" />
                            </Button>
                            <span className="w-12 text-center text-sm font-semibold">
                              {item.quantity}
                            </span>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-9 w-9 rounded-full hover:bg-background shadow-soft transition-all"
                              aria-label={`Increase quantity of ${item.title}`} disabled={catalogue.isFetching || catalogue.isError || item.available === false || item.quantity >= cartQuantityLimit(item.stock_quantity)} onClick={() => updateQuantity(item.id, item.quantity + 1)}
                            >
                              <Plus className="w-3.5 h-3.5" />
                            </Button>
                          </div>
                          <div className="text-2xl font-semibold text-primary tracking-tight">
                            {item.available === false ? 'Unavailable' : `₦${(Math.round(item.price * 100) * item.quantity / 100).toLocaleString()}`}
                          </div>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>

            {/* Order Summary */}
            <div className="lg:col-span-1">
              <Card className="sticky top-28 card-elevated rounded-3xl p-4 sm:p-6 overflow-hidden border-primary/20 bg-primary/[0.02]">
                <div className="absolute top-0 right-0 w-32 h-32 bg-primary/5 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2" />
                <CardContent className="p-4 relative z-10">
                  <h2 className="text-2xl font-semibold mb-8 tracking-tight">Order Summary</h2>
                  <div className="space-y-4 mb-8">
                    <div className="flex justify-between items-center text-sm font-bold text-muted-foreground uppercase tracking-widest">
                      <span>Available items</span>
                      <span className="text-foreground">₦{totalPrice.toLocaleString()}</span>
                    </div>
                    <p className="text-sm text-muted-foreground">Delivery and any additional charges are not yet confirmed.</p>
                    <Separator className="bg-border/60" />
                    <div className="flex justify-between items-center pt-2">
                      <span className="text-lg font-semibold">Subtotal</span>
                      <span className="text-3xl font-semibold text-primary tracking-tight">₦{totalPrice.toLocaleString()}</span>
                    </div>
                  </div>

                  <Button className="w-full h-16 text-lg font-semibold gap-3 rounded-full shadow-sm hover:scale-[1.02] transition-all" asChild>
                    <Link to="/checkout">
                      Review checkout availability
                      <ArrowRight className="w-6 h-6" />
                    </Link>
                  </Button>

                  <div className="mt-8 space-y-4">
                    <div className="flex items-start gap-3 text-[10px] font-semibold uppercase tracking-widest text-muted-foreground leading-relaxed p-4 rounded-2xl bg-background/50 border border-border/40">
                      <ShieldCheck className="w-4 h-4 text-primary shrink-0" />
                      {unavailable ? 'Some items are unavailable. Remove them or check back for new stock.' : 'No order or payment is created by saving items in your cart.'}
                    </div>
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

export default Cart;

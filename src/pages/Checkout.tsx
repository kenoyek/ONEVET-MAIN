import {CartStorageNotice} from '@/components/marketplace/CartStorageNotice';
import { Link, Navigate } from 'react-router-dom';
import { ShoppingBag } from 'lucide-react';
import { PageHeading } from '@/components/layout/PageHeading';
import { Navbar } from '@/components/layout/Navbar';
import { Footer } from '@/components/layout/Footer';
import { Button } from '@/components/ui/button';
import { useCart } from '@/hooks/use-cart';

/** Checkout stays closed until server-priced orders and payments are enabled together. */
export default function Checkout() {
  const { items } = useCart();
  if (!items.length) return <Navigate to="/cart" replace />;
  return <div className="min-h-screen bg-background flex flex-col">
    <Navbar />
    <main id="main-content" tabIndex={-1} className="container-tight flex-1 pt-32 pb-24">
      <section className="max-w-2xl mx-auto rounded-3xl border bg-card p-6 sm:p-10">
        <ShoppingBag className="h-10 w-10 text-primary mb-6" aria-hidden="true" />
        <PageHeading title="Checkout is currently unavailable" /><CartStorageNotice/>
        <p role="status" className="my-6 leading-relaxed text-muted-foreground">Your items are still in your cart. No order has been placed and no payment has been taken. Prices and availability may change; items are not reserved.</p>
        <p className="mb-6 text-sm text-muted-foreground">Contact our team if you need help with a product. Delivery costs and arrangements must be confirmed before an order can proceed.</p>
        <div className="flex flex-wrap gap-3"><Button asChild><Link to="/cart">Return to cart</Link></Button><Button asChild variant="outline"><Link to="/contact">Contact support</Link></Button></div>
      </section>
    </main>
    <Footer />
  </div>;
}

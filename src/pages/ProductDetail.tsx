import { ProductImage } from '@/components/marketplace/ProductImage';
import { ProductCartAction } from '@/components/marketplace/ProductCartAction';
import { shopService } from '@/lib/services/shop-service';
import { Link } from 'react-router-dom';
import { PageHeading } from '@/components/layout/PageHeading';
import { useParams, useNavigate, useLocation } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { Navbar } from "@/components/layout/Navbar";
import { Footer } from "@/components/layout/Footer";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  ArrowLeft,
  Loader2,
  ShieldCheck,
  Truck,
  Store,
  Package,
} from "lucide-react";
import { useState, useEffect } from "react";
import { Separator } from "@/components/ui/separator";

const ProductDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const shopPath = `/marketplace${location.search}`;
  const [selectedImage, setSelectedImage] = useState(0);
  useEffect(() => { setSelectedImage(0); }, [id]);

  const { data: product, isLoading, isFetching, isError, refetch } = useQuery({
    queryKey: ['product', id],
    queryFn: () => shopService.product(id || ''),
    enabled: !!id,
    refetchInterval: 30_000,
    staleTime: 0
  });

  useEffect(() => {
    if (product) {
      document.title = `${product.title} | 1Vet Marketplace`;
      const metaDesc = document.querySelector('meta[name="description"]');
      if (metaDesc) {
        metaDesc.setAttribute('content', product.description || `Buy ${product.title} on 1Vet Marketplace.`);
      }
    }
  }, [product]);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background"><Navbar /><main id="main-content" className="container-tight pt-32 pb-20"><p role="status" className="flex items-center gap-3"><Loader2 aria-hidden="true" className="h-5 w-5 animate-spin text-primary" />Checking product details and stock…</p><Link className="mt-6 inline-block text-primary underline" to={shopPath}>Back to shop</Link></main><Footer /></div>
    );
  }

  if (isError) return <div className="min-h-screen bg-background"><Navbar /><main id="main-content" className="container-tight pt-32 pb-20" role="alert"><h1 className="text-2xl mb-4">We couldn’t load this product.</h1><Button onClick={() => refetch()}>Try again</Button><Button asChild variant="ghost"><Link to={shopPath}>Back to shop</Link></Button></main><Footer /></div>;

  if (!product) {
    return (
      <div className="min-h-screen bg-background"><Navbar /><main id="main-content" className="container-tight pt-32 pb-20"><section className="rounded-3xl border bg-card p-6 sm:p-10">
        <Package aria-hidden="true" className="mb-5 h-9 w-9 text-primary" />
        <PageHeading title="This product is no longer available" />
        <p className="my-5 leading-relaxed text-muted-foreground">The listing may have been removed or is no longer published. Browse current products or review the items already in your cart.</p>
        <div className="flex flex-wrap gap-3"><Button asChild><Link to={shopPath}>Back to shop</Link></Button><Button asChild variant="outline"><Link to="/cart">View cart</Link></Button><Button variant="ghost" disabled={isFetching} onClick={()=>void refetch()}>Check again</Button></div>
      </section></main><Footer /></div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <main id="main-content" tabIndex={-1} className="pt-28 md:pt-32 pb-16">
        <div className="container-wide">
          <Button
            variant="ghost"
            className="mb-8 font-bold rounded-full hover:bg-primary/5 group"
            onClick={() => navigate(shopPath)}
          >
            <ArrowLeft className="w-4 h-4 mr-2 transition-transform group-hover:-translate-x-1" />
            Back to Store
          </Button>

          <div className="grid lg:grid-cols-2 gap-16">
            {/* Image Gallery */}
            <div className="space-y-6">
              <div className="aspect-square rounded-3xl overflow-hidden bg-white shadow-elevated border-8 border-background">
                <ProductImage src={product.images?.[selectedImage]} title={product.title} category={product.category} className="w-full h-full object-cover" />
              </div>
              {product.images && product.images.length > 1 && (
                <div className="grid grid-cols-4 gap-4 px-2">
                  {product.images.map((img: string, idx: number) => (
                    <button
                      key={idx}
                      aria-label={`View product image ${idx + 1}`}
                      aria-pressed={selectedImage === idx}
                      className={`aspect-square rounded-2xl overflow-hidden border-4 transition-all duration-300 ${
                        selectedImage === idx ? 'border-primary shadow-sm' : 'border-background shadow-soft opacity-60 hover:opacity-100'
                      }`}
                      onClick={() => setSelectedImage(idx)}
                    >
                      <ProductImage src={img} title={`${product.title} image ${idx + 1}`} category={product.category} className="w-full h-full object-cover" />
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Product Info */}
            <div className="flex flex-col pt-4">
              <div className="mb-8">
                <Badge className="mb-4 bg-primary/10 text-primary border-none px-4 py-1 rounded-full text-xs font-bold uppercase tracking-widest">{product.category}</Badge>
                <PageHeading size="display" className="mb-4" title={<> {product.title} </>}/>
                <div className="flex items-center gap-4 mb-6">
                  <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-muted/50 border border-border/50">
                    <Store className="w-4 h-4 text-primary" />
                    <span className="text-xs font-bold text-muted-foreground uppercase tracking-wider">
                      Sold by <span className="text-foreground">{product.seller?.business_name || [product.seller?.first_name, product.seller?.last_name].filter(Boolean).join(' ') || 'Marketplace seller'}</span>
                    </span>
                  </div>

                </div>
                <div className="text-4xl font-semibold text-primary tracking-tight">
                  ₦{product.price.toLocaleString()}
                </div>
              </div>

              <Separator className="my-8 opacity-50" />

              <div className="space-y-8 flex-grow">
                <div>
                  <h3 className="font-bold text-sm uppercase tracking-widest text-muted-foreground mb-3">Description</h3>
                  <p className="text-foreground/80 leading-relaxed font-medium whitespace-pre-line">
                    {product.description || "The seller has not added a description yet."}
                  </p>
                </div>

                <div className="grid sm:grid-cols-2 gap-4">
                  <div className="flex items-center gap-4 p-5 rounded-[1.5rem] bg-card border border-border/40 shadow-soft">
                    <div className="p-2.5 rounded-xl bg-primary/10 text-primary shadow-sm">
                      <Truck className="w-5 h-5" />
                    </div>
                    <div>
                      <p className="font-bold text-xs uppercase tracking-wider">Delivery</p>
                      <p className="text-[10px] font-bold text-muted-foreground">To be confirmed</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-4 p-5 rounded-[1.5rem] bg-card border border-border/40 shadow-soft">
                    <div className="p-2.5 rounded-xl bg-success/10 text-success shadow-sm">
                      <Package className="w-5 h-5" />
                    </div>
                    <div>
                      <p className="font-bold text-xs uppercase tracking-wider">{(product.stock_quantity ?? 0) > 0 ? 'In Stock' : 'Out of Stock'}</p>
                      <p className="text-[10px] font-bold text-muted-foreground">
                        {(product.stock_quantity ?? 0) > 0 ? `${product.stock_quantity} units available` : 'Check back later'}
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              <div className="mt-12 space-y-4">
                <ProductCartAction product={product} checking={isFetching} />
                <div className="rounded-xl border bg-muted/20 p-4">
                  <p role="status" className="text-sm text-muted-foreground">{isFetching ? 'Checking the latest price and stock. Additions are paused until the check finishes.' : (product.stock_quantity ?? 0) > 0 ? 'Price and stock reflect the latest successful check. Items are not reserved.' : 'This product is out of stock. Refresh to check again or browse current products.'}</p>
                  <div className="mt-3 flex flex-wrap gap-3"><Button variant="outline" size="sm" disabled={isFetching} onClick={()=>void refetch()}>{isFetching ? 'Checking price and stock…' : 'Refresh price and stock'}</Button>{(product.stock_quantity ?? 0) <= 0 && <Button asChild variant="ghost" size="sm"><Link to={shopPath}>Browse other products</Link></Button>}</div>
                </div>
                <Button asChild variant="outline" className="w-full"><Link to="/cart">View cart</Link></Button>
                <p className="text-sm text-muted-foreground">Items in your cart are not reserved. Prices and availability are checked again in your cart.</p>
              </div>

              <div className="mt-8 flex items-center justify-center gap-3 text-xs font-bold text-muted-foreground uppercase tracking-widest">
                <ShieldCheck className="w-4 h-4 text-success" />
                Online checkout is currently unavailable.
              </div>
            </div>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
};

export default ProductDetail;

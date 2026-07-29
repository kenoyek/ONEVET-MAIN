import { useParams, useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Navbar } from "@/components/layout/Navbar";
import { Footer } from "@/components/layout/Footer";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useCart } from "@/hooks/use-cart";
import {
  ShoppingCart,
  ArrowLeft,
  Loader2,
  ShieldCheck,
  Truck,
  Store,
  Package,
  Heart,
  Star
} from "lucide-react";
import { useState, useEffect } from "react";
import { Separator } from "@/components/ui/separator";
import { ProductImageFallback } from "@/components/marketplace/ProductImageFallback";

const ProductDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { addItem } = useCart();
  const [selectedImage, setSelectedImage] = useState(0);

  const { data: product, isLoading } = useQuery({
    queryKey: ['product', id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('marketplace_listings')
        .select(`
          *,
          seller:profiles!marketplace_listings_seller_id_fkey(id, first_name, last_name, business_name)
        `)
        .eq('id', id)
        .single();

      if (error) throw error;
      return data;
    },
    enabled: !!id
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
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="w-10 h-10 animate-spin text-primary" />
      </div>
    );
  }

  if (!product) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center gap-4">
        <h1 className="text-2xl font-bold">Product not found</h1>
        <Button onClick={() => navigate('/marketplace')}>Back to Marketplace</Button>
      </div>
    );
  }

  const handleAddToCart = () => {
    addItem({
      id: product.id,
      title: product.title,
      price: product.price,
      image: product.images?.[0] || '/product-fallback.svg',
      quantity: 1,
      seller_id: product.seller_id
    });
  };

  return (
    <div className="min-h-screen bg-background bg-mesh-gradient">
      <Navbar />
      <main className="pt-28 md:pt-32 pb-16">
        <div className="container-wide">
          <Button
            variant="ghost"
            className="mb-8 font-bold rounded-full hover:bg-primary/5 group"
            onClick={() => navigate(-1)}
          >
            <ArrowLeft className="w-4 h-4 mr-2 transition-transform group-hover:-translate-x-1" />
            Back to Store
          </Button>

          <div className="grid lg:grid-cols-2 gap-16">
            {/* Image Gallery */}
            <div className="space-y-6">
              <div className="aspect-square rounded-[3rem] overflow-hidden bg-white shadow-elevated border-8 border-background">
                {product.images?.[selectedImage] ? (
                  <img
                    src={product.images[selectedImage]}
                    alt={product.title}
                    className="w-full h-full object-cover transition-all duration-700 hover:scale-105"
                  />
                ) : (
                  <ProductImageFallback category={product.category} title={product.title} />
                )}
              </div>
              {product.images && product.images.length > 1 && (
                <div className="grid grid-cols-4 gap-4 px-2">
                  {product.images.map((img: string, idx: number) => (
                    <button
                      key={idx}
                      className={`aspect-square rounded-2xl overflow-hidden border-4 transition-all duration-300 ${
                        selectedImage === idx ? 'border-primary shadow-glow' : 'border-background shadow-soft opacity-60 hover:opacity-100'
                      }`}
                      onClick={() => setSelectedImage(idx)}
                    >
                      <img src={img} alt="" className="w-full h-full object-cover" />
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Product Info */}
            <div className="flex flex-col pt-4">
              <div className="mb-8">
                <Badge className="mb-4 bg-primary/10 text-primary border-none px-4 py-1 rounded-full text-xs font-bold uppercase tracking-widest">{product.category}</Badge>
                <h1 className="text-4xl md:text-5xl font-black text-foreground mb-4 tracking-tighter heading-safe">{product.title}</h1>
                <div className="flex items-center gap-4 mb-6">
                  <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-muted/50 border border-border/50">
                    <Store className="w-4 h-4 text-primary" />
                    <span className="text-xs font-bold text-muted-foreground uppercase tracking-wider">
                      Sold by <span className="text-foreground">{product.seller?.business_name || `${product.seller?.first_name} ${product.seller?.last_name}`}</span>
                    </span>
                  </div>
                  <div className="flex items-center gap-1 text-amber-500 font-black text-sm">
                    <Star className="w-4 h-4 fill-current" /> 5.0
                  </div>
                </div>
                <div className="text-4xl font-black text-primary tracking-tighter">
                  ₦{product.price.toLocaleString()}
                </div>
              </div>

              <Separator className="my-8 opacity-50" />

              <div className="space-y-8 flex-grow">
                <div>
                  <h3 className="font-bold text-sm uppercase tracking-widest text-muted-foreground mb-3">Description</h3>
                  <p className="text-foreground/80 leading-relaxed font-medium">
                    {product.description || "No description provided for this product. Premium quality guaranteed for your animal health needs."}
                  </p>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="flex items-center gap-4 p-5 rounded-[1.5rem] bg-card border border-border/40 shadow-soft">
                    <div className="p-2.5 rounded-xl bg-primary/10 text-primary shadow-sm">
                      <Truck className="w-5 h-5" />
                    </div>
                    <div>
                      <p className="font-bold text-xs uppercase tracking-wider">Fast Delivery</p>
                      <p className="text-[10px] font-bold text-muted-foreground">Within 24-48 hours</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-4 p-5 rounded-[1.5rem] bg-card border border-border/40 shadow-soft">
                    <div className="p-2.5 rounded-xl bg-success/10 text-success shadow-sm">
                      <Package className="w-5 h-5" />
                    </div>
                    <div>
                      <p className="font-bold text-xs uppercase tracking-wider">{product.stock_quantity > 0 ? 'In Stock' : 'Out of Stock'}</p>
                      <p className="text-[10px] font-bold text-muted-foreground">
                        {product.stock_quantity > 0 ? `${product.stock_quantity} units available` : 'Check back later'}
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              <div className="mt-12 flex gap-4">
                <Button
                  size="xl"
                  className="flex-grow h-16 text-lg font-black gap-3 rounded-full shadow-glow hover:scale-[1.02] transition-all"
                  onClick={handleAddToCart}
                  disabled={product.stock_quantity <= 0}
                >
                  <ShoppingCart className="w-6 h-6" />
                  {product.stock_quantity > 0 ? 'Add to Cart' : 'Out of Stock'}
                </Button>
                <Button size="xl" variant="outline" className="h-16 w-16 p-0 rounded-full border-2 hover:bg-destructive/5 hover:text-destructive hover:border-destructive/20 transition-all">
                  <Heart className="w-6 h-6" />
                </Button>
              </div>

              <div className="mt-8 flex items-center justify-center gap-3 text-xs font-bold text-muted-foreground uppercase tracking-widest">
                <ShieldCheck className="w-4 h-4 text-success" />
                Secure Checkout with Paystack
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

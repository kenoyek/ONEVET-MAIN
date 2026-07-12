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
  Heart
} from "lucide-react";
import { useState, useEffect } from "react";
import { Separator } from "@/components/ui/separator";

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
      image: product.images?.[0] || '/placeholder.svg',
      quantity: 1,
      seller_id: product.seller_id
    });
  };

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <main className="pt-24 pb-16">
        <div className="container-wide">
          <Button
            variant="ghost"
            className="mb-6"
            onClick={() => navigate(-1)}
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back
          </Button>

          <div className="grid lg:grid-cols-2 gap-12">
            {/* Image Gallery */}
            <div className="space-y-4">
              <div className="aspect-square rounded-2xl overflow-hidden bg-muted border">
                <img
                  src={product.images?.[selectedImage] || '/placeholder.svg'}
                  alt={product.title}
                  className="w-full h-full object-cover transition-all duration-500 hover:scale-105"
                />
              </div>
              {product.images && product.images.length > 1 && (
                <div className="grid grid-cols-4 gap-4">
                  {product.images.map((img: string, idx: number) => (
                    <button
                      key={idx}
                      className={`aspect-square rounded-lg overflow-hidden border-2 transition-all ${
                        selectedImage === idx ? 'border-primary' : 'border-transparent'
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
            <div className="flex flex-col">
              <div className="mb-6">
                <Badge className="mb-2">{product.category}</Badge>
                <h1 className="text-3xl md:text-4xl font-bold mb-2">{product.title}</h1>
                <div className="flex items-center gap-2 text-muted-foreground mb-4">
                  <Store className="w-4 h-4" />
                  <span>Sold by <span className="font-medium text-foreground">{product.seller?.business_name || `${product.seller?.first_name} ${product.seller?.last_name}`}</span></span>
                </div>
                <div className="text-3xl font-bold text-primary">
                  ₦{product.price.toLocaleString()}
                </div>
              </div>

              <Separator className="my-6" />

              <div className="space-y-6 flex-grow">
                <div>
                  <h3 className="font-semibold text-lg mb-2">Description</h3>
                  <p className="text-muted-foreground leading-relaxed">
                    {product.description || "No description provided for this product."}
                  </p>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="flex items-center gap-3 p-3 rounded-xl bg-muted/50">
                    <Truck className="w-5 h-5 text-primary" />
                    <div className="text-xs">
                      <p className="font-bold">Fast Delivery</p>
                      <p className="text-muted-foreground">Within 24-48 hours</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3 p-3 rounded-xl bg-muted/50">
                    <Package className="w-5 h-5 text-primary" />
                    <div className="text-xs">
                      <p className="font-bold">In Stock</p>
                      <p className="text-muted-foreground">Ready to ship</p>
                    </div>
                  </div>
                </div>
              </div>

              <div className="mt-8 flex gap-4">
                <Button
                  size="lg"
                  className="flex-grow h-14 text-lg font-bold gap-2"
                  onClick={handleAddToCart}
                >
                  <ShoppingCart className="w-5 h-5" />
                  Add to Cart
                </Button>
                <Button size="lg" variant="outline" className="h-14 w-14 p-0">
                  <Heart className="w-5 h-5" />
                </Button>
              </div>

              <div className="mt-6 flex items-center justify-center gap-2 text-sm text-muted-foreground">
                <ShieldCheck className="w-4 h-4 text-green-500" />
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

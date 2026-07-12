import { Link } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { motion } from "framer-motion";
import { ShoppingCart, ArrowRight, Star } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useCart } from "@/hooks/use-cart";

export function FeaturedProducts() {
  const { addItem } = useCart();

  const { data: products, isLoading } = useQuery({
    queryKey: ['featured-products'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('marketplace_listings')
        .select('*')
        .eq('is_active', true)
        .eq('is_approved', true)
        .limit(4);

      if (error) throw error;
      return data;
    }
  });

  if (isLoading || !products || products.length === 0) {
    return null;
  }

  return (
    <section className="section-padding bg-muted/30 relative">
      <div className="container-wide">
        <div className="flex flex-col md:flex-row justify-between items-end mb-16 gap-6">
          <div className="max-w-2xl">
            <Badge variant="outline" className="mb-4 border-primary/30 text-primary px-4 py-1 rounded-full uppercase tracking-widest text-[10px] font-bold bg-background">
              Marketplace
            </Badge>
            <h2 className="text-3xl md:text-4xl lg:text-5xl font-extrabold tracking-tight mb-4">Shop Veterinary Supplies</h2>
            <p className="text-muted-foreground text-lg font-medium">
              Access top-quality medications, feed, and equipment for your pets and livestock from verified sellers.
            </p>
          </div>
          <Button variant="ghost" className="group font-bold rounded-full hover:bg-primary/5" asChild>
            <Link to="/marketplace">
              Explore Store
              <ArrowRight className="ml-2 w-4 h-4 transition-transform group-hover:translate-x-1" />
            </Link>
          </Button>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
          {products.map((product, index) => (
            <motion.div
              key={product.id}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: index * 0.1, duration: 0.5 }}
            >
              <Card className="h-full flex flex-col group rounded-[2rem] overflow-hidden border-border/50 hover:border-primary/30 transition-all duration-500 shadow-soft hover:shadow-elevated bg-card">
                <div className="relative aspect-square overflow-hidden bg-muted m-2 rounded-[1.5rem]">
                  <img
                    src={product.images?.[0] || '/placeholder.svg'}
                    alt={product.title}
                    className="object-cover w-full h-full transition-transform duration-700 group-hover:scale-110"
                  />
                  <div className="absolute top-3 left-3 flex flex-col gap-2">
                    <Badge className="bg-background/90 backdrop-blur-md text-foreground border-none px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider">
                      {product.category}
                    </Badge>
                  </div>
                </div>
                <CardHeader className="p-6 pb-2">
                  <Link to={`/marketplace/${product.id}`} className="hover:text-primary transition-colors">
                    <CardTitle className="text-lg font-bold line-clamp-1 mb-1 tracking-tight">{product.title}</CardTitle>
                  </Link>
                  <div className="flex items-center gap-1 text-amber-500">
                    <Star className="w-3.5 h-3.5 fill-current" />
                    <Star className="w-3.5 h-3.5 fill-current" />
                    <Star className="w-3.5 h-3.5 fill-current" />
                    <Star className="w-3.5 h-3.5 fill-current" />
                    <Star className="w-3.5 h-3.5 fill-current" />
                    <span className="text-[11px] font-bold text-muted-foreground ml-1">5.0</span>
                  </div>
                </CardHeader>
                <CardContent className="p-6 pt-0 flex-grow">
                  <div className="text-2xl font-black text-primary tracking-tighter">
                    ₦{product.price.toLocaleString()}
                  </div>
                </CardContent>
                <CardFooter className="p-6 pt-0">
                  <Button
                    className="w-full gap-2 rounded-full font-bold shadow-soft hover:shadow-glow transition-all"
                    onClick={() => addItem({
                      id: product.id,
                      title: product.title,
                      price: product.price,
                      image: product.images?.[0] || '/placeholder.svg',
                      quantity: 1,
                      seller_id: product.seller_id
                    })}
                  >
                    <ShoppingCart className="w-4 h-4" />
                    Add to Cart
                  </Button>
                </CardFooter>
              </Card>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}

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
    <section className="section-padding bg-muted/30">
      <div className="container-wide">
        <div className="flex flex-col md:flex-row justify-between items-end mb-12 gap-4">
          <div className="max-w-2xl">
            <h2 className="text-3xl md:text-4xl font-bold mb-4">Shop Veterinary Supplies</h2>
            <p className="text-muted-foreground text-lg">
              Get top-quality medications, feed, and equipment for your pets and livestock.
            </p>
          </div>
          <Button variant="ghost" className="group" asChild>
            <Link to="/marketplace">
              View All Products
              <ArrowRight className="ml-2 w-4 h-4 transition-transform group-hover:translate-x-1" />
            </Link>
          </Button>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {products.map((product, index) => (
            <motion.div
              key={product.id}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: index * 0.1 }}
            >
              <Card className="h-full flex flex-col group overflow-hidden border-border/50 hover:border-primary/30 transition-all shadow-sm hover:shadow-md">
                <div className="relative aspect-square overflow-hidden bg-muted">
                  <img
                    src={product.images?.[0] || '/placeholder.svg'}
                    alt={product.title}
                    className="object-cover w-full h-full transition-transform duration-500 group-hover:scale-110"
                  />
                  <Badge className="absolute top-2 left-2 bg-primary/90 text-white border-none">
                    {product.category}
                  </Badge>
                </div>
                <CardHeader className="p-4 pb-2">
                  <CardTitle className="text-lg line-clamp-1">{product.title}</CardTitle>
                  <div className="flex items-center gap-1 text-amber-500">
                    <Star className="w-4 h-4 fill-current" />
                    <Star className="w-4 h-4 fill-current" />
                    <Star className="w-4 h-4 fill-current" />
                    <Star className="w-4 h-4 fill-current" />
                    <Star className="w-4 h-4 fill-current" />
                    <span className="text-xs text-muted-foreground ml-1">(5.0)</span>
                  </div>
                </CardHeader>
                <CardContent className="p-4 pt-0 flex-grow">
                  <div className="text-xl font-bold text-primary">
                    ₦{product.price.toLocaleString()}
                  </div>
                </CardContent>
                <CardFooter className="p-4 pt-0">
                  <Button
                    variant="outline"
                    className="w-full gap-2 group-hover:bg-primary group-hover:text-primary-foreground transition-colors"
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

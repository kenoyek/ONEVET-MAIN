import { useState } from "react";
import { Navbar } from "@/components/layout/Navbar";
import { Footer } from "@/components/layout/Footer";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useCart } from "@/hooks/use-cart";
import { motion, AnimatePresence } from "framer-motion";
import { 
  ShoppingBag, 
  Search,
  Filter,
  Plus,
  ShoppingCart,
  ArrowRight,
  Loader2,
  Package,
  CheckCircle2
} from "lucide-react";

const CATEGORIES = [
  "All",
  "Pet Food",
  "Pet Health",
  "Pet Supplies",
  "Livestock",
  "Accessories"
];

const Marketplace = () => {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("All");
  const { addItem } = useCart();

  const { data: listings, isLoading } = useQuery({
    queryKey: ['marketplace-listings', selectedCategory],
    queryFn: async () => {
      let query = supabase
        .from('marketplace_listings')
        .select('*')
        .eq('is_active', true)
        .eq('is_approved', true);

      if (selectedCategory !== "All") {
        query = query.eq('category', selectedCategory);
      }

      const { data, error } = await query.order('created_at', { ascending: false });

      if (error) throw error;
      return data;
    }
  });

  const filteredListings = listings?.filter(item =>
    item.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
    item.description?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleAddToCart = (listing: any) => {
    addItem({
      id: listing.id,
      title: listing.title,
      price: listing.price,
      image: listing.images?.[0] || '/placeholder.svg',
      quantity: 1,
      seller_id: listing.seller_id
    });
  };

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <main className="pt-24 pb-16">
        <div className="container-wide">
          {/* Header */}
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-8">
            <div>
              <h1 className="text-3xl font-bold tracking-tight">1Vet Marketplace</h1>
              <p className="text-muted-foreground mt-1">
                Quality veterinary supplies and pet products from verified sellers.
              </p>
            </div>
            <div className="flex w-full md:w-auto gap-2">
              <div className="relative flex-1 md:w-80">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input
                  placeholder="Search products..."
                  className="pl-9"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
              </div>
              <Button variant="outline" size="icon">
                <Filter className="w-4 h-4" />
              </Button>
            </div>
          </div>

          {/* Categories */}
          <div className="flex gap-2 overflow-x-auto pb-4 mb-8 scrollbar-hide">
            {CATEGORIES.map((category) => (
              <Button
                key={category}
                variant={selectedCategory === category ? "default" : "outline"}
                className="rounded-full whitespace-nowrap"
                onClick={() => setSelectedCategory(category)}
              >
                {category}
              </Button>
            ))}
          </div>

          {/* Product Grid */}
          {isLoading ? (
            <div className="flex flex-col items-center justify-center py-20">
              <Loader2 className="w-10 h-10 animate-spin text-primary mb-4" />
              <p className="text-muted-foreground">Loading marketplace...</p>
            </div>
          ) : filteredListings && filteredListings.length > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {filteredListings.map((item) => (
                <motion.div
                  key={item.id}
                  layout
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ duration: 0.3 }}
                >
                  <Card className="h-full flex flex-col group overflow-hidden border-border/50 hover:border-primary/30 transition-colors shadow-sm hover:shadow-md">
                    <div className="relative aspect-square overflow-hidden bg-muted">
                      <img
                        src={item.images?.[0] || '/placeholder.svg'}
                        alt={item.title}
                        className="object-cover w-full h-full transition-transform duration-500 group-hover:scale-110"
                      />
                      <Badge className="absolute top-2 right-2 bg-background/80 backdrop-blur-sm text-foreground hover:bg-background/90">
                        {item.category}
                      </Badge>
                    </div>
                    <CardHeader className="p-4 pb-2">
                      <div className="flex justify-between items-start gap-2">
                        <CardTitle className="text-lg line-clamp-1">{item.title}</CardTitle>
                      </div>
                      <div className="text-2xl font-bold text-primary">
                        ₦{item.price.toLocaleString()}
                      </div>
                    </CardHeader>
                    <CardContent className="p-4 pt-0 flex-grow">
                      <CardDescription className="line-clamp-2 text-sm">
                        {item.description || "No description provided."}
                      </CardDescription>
                      {item.location && (
                        <div className="flex items-center gap-1 mt-2 text-xs text-muted-foreground">
                          <Package className="w-3 h-3" />
                          {item.location}
                        </div>
                      )}
                    </CardContent>
                    <CardFooter className="p-4 pt-0">
                      <Button
                        className="w-full gap-2"
                        onClick={() => handleAddToCart(item)}
                      >
                        <ShoppingCart className="w-4 h-4" />
                        Add to Cart
                      </Button>
                    </CardFooter>
                  </Card>
                </motion.div>
              ))}
            </div>
          ) : (
            <div className="text-center py-20 bg-muted/20 rounded-2xl border-2 border-dashed border-muted">
              <ShoppingBag className="w-12 h-12 text-muted-foreground mx-auto mb-4 opacity-20" />
              <h3 className="text-xl font-semibold">No products found</h3>
              <p className="text-muted-foreground mt-2">
                Try adjusting your search or category filter.
              </p>
              <Button
                variant="link"
                className="mt-4"
                onClick={() => {
                  setSearchQuery("");
                  setSelectedCategory("All");
                }}
              >
                Clear all filters
              </Button>
            </div>
          )}

          {/* Seller CTA */}
          <section className="mt-20">
            <div className="bg-primary rounded-3xl p-8 md:p-12 text-primary-foreground overflow-hidden relative">
              <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full -translate-y-1/2 translate-x-1/2 blur-3xl" />
              <div className="absolute bottom-0 left-0 w-48 h-48 bg-black/10 rounded-full translate-y-1/2 -translate-x-1/2 blur-2xl" />

              <div className="relative z-10 grid md:grid-cols-2 gap-12 items-center">
                <div>
                  <Badge className="mb-4 bg-secondary text-secondary-foreground hover:bg-secondary/90 border-none">
                    Merchant Program
                  </Badge>
                  <h2 className="text-3xl md:text-4xl font-bold mb-6">
                    Start Selling on 1Vet Today
                  </h2>
                  <p className="text-primary-foreground/80 text-lg mb-8">
                    Join Nigeria's fastest-growing veterinary marketplace. Reach pet owners and farmers across the country.
                  </p>

                  <div className="grid sm:grid-cols-2 gap-4 mb-8">
                    {[
                      "Low commission fees",
                      "Instant payments",
                      "Secure logistics",
                      "Seller dashboard"
                    ].map((feature, i) => (
                      <div key={i} className="flex items-center gap-2">
                        <CheckCircle2 className="w-5 h-5 text-secondary" />
                        <span className="font-medium">{feature}</span>
                      </div>
                    ))}
                  </div>

                  <Button size="lg" variant="secondary" className="font-bold" asChild>
                    <a href="/auth?mode=signup&role=service_provider">
                      Register as Merchant <ArrowRight className="ml-2 w-5 h-5" />
                    </a>
                  </Button>
                </div>
                <div className="hidden md:block">
                  <div className="relative">
                    <img
                      src="https://images.unsplash.com/photo-1578496479914-7ef3b0193be3?q=80&w=1000&auto=format&fit=crop"
                      alt="Veterinary supplies"
                      className="rounded-2xl shadow-2xl rotate-3 hover:rotate-0 transition-transform duration-500"
                    />
                    <div className="absolute -bottom-6 -left-6 bg-background p-4 rounded-xl shadow-lg text-foreground animate-bounce">
                      <div className="flex items-center gap-2">
                        <div className="w-3 h-3 bg-green-500 rounded-full" />
                        <span className="font-bold">Verified Seller</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </section>
        </div>
      </main>
      <Footer />
    </div>
  );
};

export default Marketplace;

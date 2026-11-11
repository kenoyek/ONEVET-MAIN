import { useAuth } from '@/lib/auth-context';
import { shopService } from '@/lib/services/shop-service';
import { PageHeading } from '@/components/layout/PageHeading';
import { useState } from "react";
import { Navbar } from "@/components/layout/Navbar";
import { Footer } from "@/components/layout/Footer";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useQuery } from "@tanstack/react-query";
import { useCart } from "@/hooks/use-cart";
import { motion } from "framer-motion";
import {
  ShoppingBag,
  Search,
  ShoppingCart,
  Loader2,
  MapPin
} from "lucide-react";
import { toast } from "sonner";
import { ProductImageFallback } from "@/components/marketplace/ProductImageFallback";

import { Link } from "react-router-dom";

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
  const { user } = useAuth();

  const { data: listings, isLoading, isError, refetch } = useQuery({
    queryKey: ['marketplace-listings', selectedCategory],
    queryFn: () => shopService.list(selectedCategory),

  });

  const filteredListings = listings?.filter(item =>
    item.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
    item.description?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleAddToCart = (e: React.MouseEvent, listing: { id: string; title: string; price: number; images?: string[] | null; stock_quantity: number | null; seller_id: string }) => {
    e.preventDefault();
    e.stopPropagation();

    if ((listing.stock_quantity ?? 0) <= 0) {
      toast.error("This item is out of stock");
      return;
    }

    addItem({
      id: listing.id,
      title: listing.title,
      price: listing.price,
      image: listing.images?.[0] || '/product-fallback.svg',
      quantity: 1,
      seller_id: listing.seller_id,
      stock_quantity: listing.stock_quantity ?? 0,
      available: true
    });
  };

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <main id="main-content" tabIndex={-1} className="pt-28 md:pt-32 pb-20">
        <div className="container-wide">
          {!user && <div className="mb-6 flex flex-wrap items-center justify-between gap-4 rounded-2xl border bg-card p-5"><p className="text-sm text-muted-foreground">Browse freely and build your cart. Create an account to keep shopping with 1Vet.</p><Button asChild variant="outline"><Link to="/auth?mode=signup" state={{from:{pathname:'/cart'}}}>Create account</Link></Button></div>}
          {/* Header */}
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 mb-12">
            <div>
              <Badge variant="outline" className="mb-4 border-primary/30 text-primary px-4 py-1 rounded-full uppercase tracking-widest text-[10px] font-bold bg-background">
                Storefront
              </Badge>
              <PageHeading size="display" className="" title={<> 1Vet Marketplace </>}/>
              <p className="text-muted-foreground mt-2 font-medium">
                Veterinary supplies and animal-care products listed on 1Vet.
              </p>
            </div>
            <div className="flex w-full md:w-auto gap-3">
              <div className="relative flex-1 md:w-80">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input
                  aria-label="Search products" placeholder="Search products..."
                  className="pl-11 rounded-full bg-card border-border/50 shadow-soft"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
              </div>
              <Button variant="outline" asChild><Link to="/cart">View cart</Link></Button>
            </div>
          </div>

          {/* Categories */}
          <div className="flex gap-3 overflow-x-auto pb-6 mb-10 scrollbar-hide">
            {CATEGORIES.map((category) => (
              <Button
                key={category}
                variant={selectedCategory === category ? "default" : "outline"}
                className={`rounded-full whitespace-nowrap px-6 font-bold transition-all ${
                  selectedCategory === category ? 'shadow-sm scale-105' : 'hover:bg-primary/5'
                }`}
                onClick={() => setSelectedCategory(category)}
              >
                {category}
              </Button>
            ))}
          </div>

          {/* Product Grid */}
          <p role="status" className="mb-6 rounded-xl border border-border bg-card p-4 text-sm text-muted-foreground">You can browse and keep items in your cart. Online checkout is currently unavailable.</p>
          {isError ? <section role="alert" className="care-path"><h2 className="text-xl">We couldn’t load the shop.</h2><p className="my-3">Please try again to check current products and stock.</p><Button variant="outline" onClick={() => refetch()}>Try again</Button></section> : isLoading ? (
            <div className="flex flex-col items-center justify-center py-24">
              <Loader2 className="w-12 h-12 animate-spin text-primary mb-4" />
              <p className="text-muted-foreground font-bold uppercase tracking-widest text-xs">Loading marketplace...</p>
            </div>
          ) : filteredListings && filteredListings.length > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-8">
              {filteredListings.map((item) => (
                <motion.div
                  key={item.id}
                  layout
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ duration: 0.4 }}
                >
                  <div>
                    <Card className="card-elevated h-full flex flex-col group rounded-[2rem] overflow-hidden hover:border-primary/30 transition-all duration-500 shadow-soft hover:shadow-elevated">
                      <Link to={`/marketplace/${item.id}`} className="relative block aspect-square overflow-hidden bg-muted m-2 rounded-[1.5rem]" aria-label={`View ${item.title}`}>
                        {item.images?.[0] ? (
                          <img
                            src={item.images[0]}
                            alt={item.title}
                            loading="lazy"
                            className="object-cover w-full h-full transition-transform duration-700 group-hover:scale-110"
                          />
                        ) : (
                          <ProductImageFallback category={item.category} title={item.title} />
                        )}
                        <Badge className="absolute top-3 right-3 bg-background/90 backdrop-blur-md text-foreground border-none px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider">
                          {item.category}
                        </Badge>
                      </Link>
                      <CardHeader className="p-6 pb-2">
                        <CardTitle className="text-lg font-semibold tracking-tight"><Link className="hover:underline" to={`/marketplace/${item.id}`}>{item.title}</Link></CardTitle>
                        <div className="text-2xl font-semibold text-primary tracking-tight mt-1">
                          ₦{item.price.toLocaleString()}
                        </div>
                      </CardHeader>
                      <CardContent className="p-6 pt-0 flex-grow">
                        <CardDescription className="line-clamp-2 text-sm font-medium leading-relaxed">
                          {item.description || "No description provided."}
                        </CardDescription>
                        <div className="flex items-center justify-between mt-4">
                          {item.location && (
                            <div className="flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
                              <MapPin className="w-3 h-3" />
                              {item.location}
                            </div>
                          )}
                          <span className={`text-[10px] font-semibold uppercase tracking-widest ${(item.stock_quantity ?? 0) > 0 ? 'text-success' : 'text-destructive'}`}>
                            {(item.stock_quantity ?? 0) > 0 ? `${item.stock_quantity} available` : 'Out of stock'}
                          </span>
                        </div>
                      </CardContent>
                      <CardFooter className="p-6 pt-0">
                        <Button
                          className="w-full gap-2 rounded-full font-bold shadow-soft hover:shadow-sm transition-all"
                          onClick={(e) => handleAddToCart(e, item)}
                          disabled={(item.stock_quantity ?? 0) <= 0}
                        >
                          <ShoppingCart className="w-4 h-4" />
                          {(item.stock_quantity ?? 0) > 0 ? 'Add to Cart' : 'Out of Stock'}
                        </Button>
                      </CardFooter>
                    </Card>
                  </div>
                </motion.div>
              ))}
            </div>
          ) : (
            <div className="text-center py-20 bg-muted/20 rounded-2xl border-2 border-dashed border-muted">
              <ShoppingBag className="w-12 h-12 text-muted-foreground mx-auto mb-4 opacity-20" />
              <h3 className="text-xl font-semibold">{searchQuery || selectedCategory !== 'All' ? 'No matching products' : 'Our shop is being prepared'}</h3>
              <p className="text-muted-foreground mt-2">
                {searchQuery || selectedCategory !== 'All' ? 'Try a different search or category.' : 'Products will appear here when stock has been added and approved.'}
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

          <section className="mt-12 rounded-2xl border bg-card p-6 md:p-8">
            <h2 className="text-2xl mb-3">Have a veterinary business?</h2>
            <p className="text-muted-foreground mb-5">Register your organization and submit its details for review. Registration does not automatically publish products or enable payments.</p>
            <Button asChild variant="outline"><Link to="/provider/register">Register your business</Link></Button>
          </section>
        </div>
      </main>
      <Footer />
    </div>
  );
};

export default Marketplace;

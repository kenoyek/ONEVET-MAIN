import { useState } from "react";
import { Navbar } from "@/components/layout/Navbar";
import { Footer } from "@/components/layout/Footer";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { toast } from "sonner";
import { 
  ShoppingBag, 
  Bone, 
  Pill, 
  Tractor,
  Bell,
  ArrowRight,
  Store,
  Truck,
  Shield,
  Clock
} from "lucide-react";

const categories = [
  {
    icon: Bone,
    title: "Pet Food & Treats",
    description: "Premium nutrition for dogs, cats, birds, and more",
    color: "bg-secondary/10 text-secondary",
  },
  {
    icon: ShoppingBag,
    title: "Pet Supplies",
    description: "Beds, toys, grooming tools, and accessories",
    color: "bg-primary/10 text-primary",
  },
  {
    icon: Pill,
    title: "Pet Health",
    description: "Vet-approved medications and supplements",
    color: "bg-accent/10 text-accent",
  },
  {
    icon: Tractor,
    title: "Livestock Equipment",
    description: "Farm supplies for cattle, poultry, and more",
    color: "bg-success/10 text-success",
  },
];

const features = [
  {
    icon: Shield,
    title: "Verified Sellers",
    description: "All sellers are vetted for quality and authenticity",
  },
  {
    icon: Truck,
    title: "Nationwide Delivery",
    description: "Fast delivery across Nigeria to your doorstep",
  },
  {
    icon: Clock,
    title: "Easy Returns",
    description: "Hassle-free returns within 7 days",
  },
];

const Marketplace = () => {
  const [email, setEmail] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleNotifyMe = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) return;
    
    setIsSubmitting(true);
    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 1000));
    toast.success("You're on the list! We'll notify you when we launch.");
    setEmail("");
    setIsSubmitting(false);
  };

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <main>
        {/* Hero Section */}
        <section className="relative py-20 lg:py-28 bg-gradient-hero overflow-hidden">
          <div className="absolute inset-0 bg-[url('/placeholder.svg')] opacity-5" />
          <div className="container-wide relative z-10">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6 }}
              className="text-center max-w-3xl mx-auto"
            >
              <div className="inline-flex items-center gap-2 bg-accent/20 text-accent-foreground px-4 py-2 rounded-full text-sm font-medium mb-6 border border-accent/30">
                <Clock className="w-4 h-4" />
                Coming Soon
              </div>
              <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold text-primary-foreground mb-6">
                Your One-Stop Pet Shop is Coming Soon
              </h1>
              <p className="text-lg md:text-xl text-primary-foreground/80 mb-8">
                We're building Nigeria's largest marketplace for pet supplies, livestock equipment, and more. Be the first to know when we launch.
              </p>
              <form onSubmit={handleNotifyMe} className="flex flex-col sm:flex-row gap-3 max-w-md mx-auto">
                <Input
                  type="email"
                  placeholder="Enter your email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="flex-1 h-12 bg-primary-foreground/10 border-primary-foreground/20 text-primary-foreground placeholder:text-primary-foreground/60"
                  required
                />
                <Button type="submit" size="lg" variant="hero" disabled={isSubmitting}>
                  {isSubmitting ? "Joining..." : "Notify Me"}
                  <Bell className="ml-2 w-4 h-4" />
                </Button>
              </form>
            </motion.div>
          </div>
        </section>

        {/* Categories Preview */}
        <section className="section-padding">
          <div className="container-wide">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              className="text-center mb-12"
            >
              <h2 className="text-3xl md:text-4xl font-bold mb-4">What's Coming</h2>
              <p className="text-muted-foreground text-lg max-w-2xl mx-auto">
                Shop from verified sellers across Nigeria. Quality products for pets and livestock.
              </p>
            </motion.div>
            <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
              {categories.map((category, index) => (
                <motion.div
                  key={index}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: index * 0.1 }}
                >
                  <Card className="h-full text-center hover:shadow-lg transition-shadow">
                    <CardHeader>
                      <div className={`w-16 h-16 rounded-xl ${category.color} flex items-center justify-center mx-auto mb-4`}>
                        <category.icon className="w-8 h-8" />
                      </div>
                      <CardTitle className="text-xl">{category.title}</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <CardDescription className="text-base">{category.description}</CardDescription>
                    </CardContent>
                  </Card>
                </motion.div>
              ))}
            </div>
          </div>
        </section>

        {/* Features */}
        <section className="section-padding bg-muted/30">
          <div className="container-wide">
            <div className="grid md:grid-cols-3 gap-8">
              {features.map((feature, index) => (
                <motion.div
                  key={index}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: index * 0.1 }}
                  className="text-center"
                >
                  <div className="w-14 h-14 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-4">
                    <feature.icon className="w-7 h-7 text-primary" />
                  </div>
                  <h3 className="text-xl font-semibold mb-2">{feature.title}</h3>
                  <p className="text-muted-foreground">{feature.description}</p>
                </motion.div>
              ))}
            </div>
          </div>
        </section>

        {/* Become a Seller */}
        <section className="section-padding">
          <div className="container-wide">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              className="bg-primary rounded-2xl p-8 md:p-12 text-primary-foreground"
            >
              <div className="grid md:grid-cols-2 gap-8 items-center">
                <div>
                  <div className="w-16 h-16 rounded-xl bg-primary-foreground/10 flex items-center justify-center mb-6">
                    <Store className="w-8 h-8" />
                  </div>
                  <h2 className="text-3xl md:text-4xl font-bold mb-4">
                    Want to Sell on 1vet?
                  </h2>
                  <p className="text-primary-foreground/80 text-lg mb-6">
                    Join Nigeria's growing pet and livestock marketplace. Reach thousands of customers and grow your business with us.
                  </p>
                  <ul className="space-y-3 mb-8">
                    {[
                      "Easy seller onboarding",
                      "Competitive commission rates",
                      "Built-in payment processing",
                      "Marketing support",
                    ].map((item, i) => (
                      <li key={i} className="flex items-center gap-3">
                        <div className="w-2 h-2 rounded-full bg-secondary" />
                        <span>{item}</span>
                      </li>
                    ))}
                  </ul>
                  <Button size="lg" variant="hero" asChild>
                    <Link to="/auth">
                      Register as Seller <ArrowRight className="ml-2" />
                    </Link>
                  </Button>
                </div>
                <div className="hidden md:block">
                  <img 
                    src="/placeholder.svg" 
                    alt="Become a seller" 
                    className="rounded-xl w-full h-80 object-cover opacity-90"
                  />
                </div>
              </div>
            </motion.div>
          </div>
        </section>

        {/* CTA */}
        <section className="section-padding bg-muted/30">
          <div className="container-tight text-center">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
            >
              <h2 className="text-3xl md:text-4xl font-bold mb-4">
                Can't Wait? Get Started Today
              </h2>
              <p className="text-muted-foreground text-lg mb-8 max-w-2xl mx-auto">
                While our marketplace is under construction, you can already access our 24/7 veterinary consultation service.
              </p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <Button size="lg" asChild>
                  <Link to="/consultations/new">
                    Start Vet Consultation <ArrowRight className="ml-2" />
                  </Link>
                </Button>
                <Button size="lg" variant="outline" asChild>
                  <Link to="/services">View All Services</Link>
                </Button>
              </div>
            </motion.div>
          </div>
        </section>
      </main>
      <Footer />
    </div>
  );
};

export default Marketplace;

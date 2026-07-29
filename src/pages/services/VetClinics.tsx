import { useState } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { MapPin, Search, ArrowRight, Users } from 'lucide-react';
import { Navbar } from '@/components/layout/Navbar';
import { Footer } from '@/components/layout/Footer';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Skeleton } from '@/components/ui/skeleton';
import { VetClinicCard } from '@/components/services/VetClinicCard';
import { useVetClinics } from '@/hooks/useVetClinics';

const VetClinics = () => {
  const [locationFilter, setLocationFilter] = useState('');
  const [sortBy, setSortBy] = useState<'price_asc' | 'price_desc' | 'rating' | undefined>();

  const { data: clinics, isLoading } = useVetClinics({ locationFilter, sortBy });

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <main>
        {/* Hero */}
        <section className="relative py-20 lg:py-28 bg-gradient-hero overflow-hidden">
          <div className="container-wide relative z-10">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6 }}
              className="text-center max-w-3xl mx-auto"
            >
              <div className="inline-flex p-3 rounded-xl bg-success text-success-foreground mb-6">
                <MapPin className="w-8 h-8" />
              </div>
              <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold text-primary-foreground mb-6">
                Find a Vet Clinic Near You
              </h1>
              <p className="text-lg md:text-xl text-primary-foreground/80 mb-8">
                Discover verified veterinary clinics. Read reviews, check availability, and book appointments.
              </p>
              <Button size="lg" variant="hero" asChild>
                <Link to="/auth">
                  List Your Clinic <ArrowRight className="ml-2" />
                </Link>
              </Button>
            </motion.div>
          </div>
        </section>

        {/* Filters */}
        <section className="py-8 border-b border-border bg-card">
          <div className="container-wide">
            <div className="flex flex-col sm:flex-row gap-4">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input
                  placeholder="Filter by location..."
                  value={locationFilter}
                  onChange={e => setLocationFilter(e.target.value)}
                  className="pl-10"
                />
              </div>
              <Select value={sortBy || ''} onValueChange={v => setSortBy((v as 'price_asc' | 'price_desc' | 'rating') || undefined)}>
                <SelectTrigger className="w-full sm:w-[200px]">
                  <SelectValue placeholder="Sort by" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="rating">Highest Rated</SelectItem>
                  <SelectItem value="price_asc">Price: Low to High</SelectItem>
                  <SelectItem value="price_desc">Price: High to Low</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </section>

        {/* Listings */}
        <section className="section-padding">
          <div className="container-wide">
            {isLoading ? (
              <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
                {Array.from({ length: 6 }).map((_, i) => (
                  <div key={i} className="space-y-4">
                    <Skeleton className="h-48 w-full rounded-xl" />
                    <Skeleton className="h-4 w-3/4" />
                    <Skeleton className="h-4 w-1/2" />
                  </div>
                ))}
              </div>
            ) : clinics && clinics.length > 0 ? (
              <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
                {clinics.map((clinic, index) => (
                  <motion.div
                    key={clinic.id}
                    initial={{ opacity: 0, y: 20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    transition={{ duration: 0.4, delay: index * 0.08 }}
                  >
                    <VetClinicCard clinic={clinic} />
                  </motion.div>
                ))}
              </div>
            ) : (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="text-center py-16 max-w-md mx-auto"
              >
                <div className="inline-flex p-4 rounded-full bg-success/10 mb-6">
                  <MapPin className="w-10 h-10 text-success" />
                </div>
                <h3 className="text-2xl font-bold text-foreground mb-3">No Vet Clinics Listed Yet</h3>
                <p className="text-muted-foreground mb-6">
                  We're building our directory of verified vet clinics. Be the first to list your clinic!
                </p>
                <Button asChild>
                  <Link to="/auth">List Your Clinic <ArrowRight className="ml-2 w-4 h-4" /></Link>
                </Button>
              </motion.div>
            )}
          </div>
        </section>

        {/* CTA */}
        <section className="section-padding bg-primary text-primary-foreground">
          <div className="container-wide">
            <div className="text-center max-w-2xl mx-auto">
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
              >
                <Users className="w-12 h-12 mx-auto mb-6" />
                <h2 className="text-3xl md:text-4xl font-bold mb-4">
                  Are You a Vet Clinic?
                </h2>
                <p className="text-primary-foreground/80 text-lg mb-8">
                  Join 1vet and let thousands of pet owners find your clinic. Manage appointments and grow your practice.
                </p>
                <Button size="lg" variant="hero" asChild>
                  <Link to="/auth">
                    Join as Provider <ArrowRight className="ml-2" />
                  </Link>
                </Button>
              </motion.div>
            </div>
          </div>
        </section>
      </main>
      <Footer />
    </div>
  );
};

export default VetClinics;

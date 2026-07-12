import { Navbar } from '@/components/layout/Navbar';
import { Footer } from '@/components/layout/Footer';
import { Hero } from '@/components/landing/Hero';
import { Services } from '@/components/landing/Services';
import { FeaturedProducts } from '@/components/marketplace/FeaturedProducts';
import { HowItWorks } from '@/components/landing/HowItWorks';
import { Testimonials } from '@/components/landing/Testimonials';
import { CTA } from '@/components/landing/CTA';
import { SEO } from '@/components/shared/SEO';

const Index = () => {
  return (
    <div className="min-h-screen bg-background">
      <SEO />
      <Navbar />
      <main>
        <Hero />
        <Services />
        <FeaturedProducts />
        <HowItWorks />
        <Testimonials />
        <CTA />
      </main>
      <Footer />
    </div>
  );
};

export default Index;

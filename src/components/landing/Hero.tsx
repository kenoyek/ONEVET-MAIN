import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import { MessageCircle, Shield, Clock, ArrowRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import heroImage from '@/assets/hero-vet.jpg';

const stats = [
  { value: '24/7', label: 'Vet Availability' },
  { value: '500+', label: 'Licensed Vets' },
  { value: '50k+', label: 'Happy Pet Owners' },
];

export function Hero() {
  return (
    <section className="relative min-h-screen flex items-center pt-20 overflow-hidden">
      {/* Background */}
      <div className="absolute inset-0 bg-gradient-hero">
        <div 
          className="absolute inset-0 opacity-20"
          style={{
            backgroundImage: `url(${heroImage})`,
            backgroundSize: 'cover',
            backgroundPosition: 'center',
            mixBlendMode: 'overlay',
          }}
        />
        <div className="absolute inset-0 bg-gradient-to-b from-transparent via-primary/50 to-primary" />
      </div>

      {/* Content */}
      <div className="container-wide relative z-10 py-16 md:py-24">
        <div className="grid lg:grid-cols-2 gap-12 items-center">
          {/* Text Content */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="text-center lg:text-left"
          >
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary-foreground/10 border border-primary-foreground/20 text-primary-foreground text-sm font-medium mb-6">
              <Shield className="w-4 h-4" />
              Trusted by thousands of pet owners in Nigeria
            </div>

            <h1 className="font-display text-4xl sm:text-5xl lg:text-6xl xl:text-7xl font-bold text-primary-foreground leading-tight mb-6">
              Talk to a Vet{' '}
              <span className="text-secondary">Anytime,</span>{' '}
              Anywhere.
            </h1>

            <p className="text-lg sm:text-xl text-primary-foreground/80 mb-8 max-w-xl mx-auto lg:mx-0">
              Connect with licensed veterinarians instantly. Get professional advice for your pets and livestock from the comfort of your home.
            </p>

            <div className="flex flex-col sm:flex-row gap-4 justify-center lg:justify-start mb-12">
              <Button variant="hero" size="xl" asChild>
                <Link to="/auth?mode=signup">
                  <MessageCircle className="w-5 h-5 mr-2" />
                  Talk to a Vet
                </Link>
              </Button>
              <Button variant="outline-light" size="xl" asChild>
                <Link to="/auth?mode=signup">
                  Create Free Account
                  <ArrowRight className="w-5 h-5 ml-2" />
                </Link>
              </Button>
            </div>

            {/* Stats */}
            <div className="flex flex-wrap justify-center lg:justify-start gap-8">
              {stats.map((stat, index) => (
                <motion.div
                  key={stat.label}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.6, delay: 0.2 + index * 0.1 }}
                  className="text-center"
                >
                  <div className="font-display text-3xl font-bold text-primary-foreground">
                    {stat.value}
                  </div>
                  <div className="text-sm text-primary-foreground/70">
                    {stat.label}
                  </div>
                </motion.div>
              ))}
            </div>
          </motion.div>

          {/* Image/Visual */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.8, delay: 0.2 }}
            className="relative hidden lg:block"
          >
            <div className="relative rounded-3xl overflow-hidden shadow-2xl">
              <img
                src={heroImage}
                alt="Veterinarian with a happy dog"
                className="w-full h-auto object-cover aspect-[4/3]"
              />
              {/* Floating Card */}
              <motion.div
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.6, delay: 0.6 }}
                className="absolute bottom-6 left-6 right-6 p-4 rounded-2xl glass-strong"
              >
                <div className="flex items-center gap-4">
                  <div className="p-3 rounded-xl bg-success text-success-foreground">
                    <Clock className="w-6 h-6" />
                  </div>
                  <div>
                    <div className="font-semibold text-foreground">Available Now</div>
                    <div className="text-sm text-muted-foreground">12 vets online ready to help</div>
                  </div>
                </div>
              </motion.div>
            </div>
          </motion.div>
        </div>
      </div>

      {/* Wave Divider */}
      <div className="absolute bottom-0 left-0 right-0">
        <svg viewBox="0 0 1440 120" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-full">
          <path
            d="M0 120L60 110C120 100 240 80 360 70C480 60 600 60 720 65C840 70 960 80 1080 85C1200 90 1320 90 1380 90L1440 90V120H1380C1320 120 1200 120 1080 120C960 120 840 120 720 120C600 120 480 120 360 120C240 120 120 120 60 120H0Z"
            className="fill-background"
          />
        </svg>
      </div>
    </section>
  );
}
